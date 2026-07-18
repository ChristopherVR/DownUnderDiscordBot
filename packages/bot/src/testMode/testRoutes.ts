/**
 * Registers the `/test/reset` and `/test/seed` routes used by the E2E harness
 * to guarantee a clean state before each test file.
 *
 * Both routes respond with 404 when `E2E !== 'true'` so they cannot be hit
 * accidentally in production.
 */
import type { Express, Request, Response } from 'express';
import type { Client } from 'discord.js';
import type { Player } from 'discord-player';
import { createLogger } from '../helpers/logger.js';
import type { PlayerStateManager } from '../helpers/status/playerStateManager';
import type { WebSocketManager } from '../helpers/websocket';
import { isE2EMode } from './index.js';
import { FIXTURES, FIXTURE_PLAYLIST, FIXTURE_TRACKS, FIXTURE_TRACK_BY_ID, FIXTURE_GUILDS } from './fixtures.js';
import { seedDiscordCache } from './discordStub.js';

const log = createLogger('test-routes');

export interface TestRouteDeps {
  prisma: {
    playlistTrack: { deleteMany: (args?: unknown) => Promise<unknown> };
    playlist: { deleteMany: (args?: unknown) => Promise<unknown>; create: (args: unknown) => Promise<unknown> };
    playHistory: { deleteMany: (args?: unknown) => Promise<unknown> };
    queueSnapshot: { deleteMany: (args?: unknown) => Promise<unknown> };
    userPreferences: { deleteMany: (args?: unknown) => Promise<unknown> };
    trackCache: { deleteMany: (args?: unknown) => Promise<unknown> };
    guild: {
      deleteMany: (args?: unknown) => Promise<unknown>;
      upsert: (args: unknown) => Promise<unknown>;
    };
  };
  player: Player;
  client: Client;
  wsManager: WebSocketManager;
  playerStateManager: PlayerStateManager;
}

async function truncateAll(prisma: TestRouteDeps['prisma']): Promise<void> {
  // FK-safe deletion order: children before parents.
  await prisma.playlistTrack.deleteMany({});
  await prisma.playlist.deleteMany({});
  await prisma.playHistory.deleteMany({});
  await prisma.queueSnapshot.deleteMany({});
  await prisma.userPreferences.deleteMany({});
  await prisma.trackCache.deleteMany({});
  await prisma.guild.deleteMany({});
}

async function seedDatabase(prisma: TestRouteDeps['prisma']): Promise<void> {
  // Seed the canonical test guild
  for (const guild of FIXTURE_GUILDS) {
    await prisma.guild.upsert({
      where: { id: guild.id },
      create: { id: guild.id, name: guild.name },
      update: { name: guild.name },
    });
  }

  // Seed one playlist with 2 tracks
  await prisma.playlist.create({
    data: {
      id: FIXTURE_PLAYLIST.id,
      guildId: FIXTURE_GUILDS[0]?.id,
      userId: 'local',
      name: FIXTURE_PLAYLIST.name,
      description: FIXTURE_PLAYLIST.description,
      isPublic: false,
      tracks: {
        create: FIXTURE_PLAYLIST.trackIds.map((trackId, index) => {
          const t = FIXTURE_TRACK_BY_ID[trackId] ?? FIXTURE_TRACKS[0];
          return {
            position: index,
            title: t.title,
            artist: t.artist,
            duration: t.duration,
            url: t.url,
            thumbnail: t.thumbnail,
            platform: t.platform,
            platformId: t.id,
          };
        }),
      },
    },
  });
}

export function registerTestRoutes(app: Express, deps: TestRouteDeps): void {
  const guard = (_req: Request, res: Response, next: () => void) => {
    if (!isE2EMode()) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    next();
  };

  app.post('/test/reset', guard, async (_req: Request, res: Response) => {
    try {
      // 1. Stop & destroy every active queue
      for (const queue of deps.player.nodes.cache.values()) {
        try {
          deps.player.nodes.delete(queue.guild.id);
        } catch (err) {
          log.warn({ err, guildId: queue.guild.id }, 'Failed to delete queue during reset');
        }
      }
      // 2. Reset in-memory player state
      deps.playerStateManager.cleanup();

      // 3. Truncate Prisma tables
      await truncateAll(deps.prisma);

      // 4. Re-seed Discord cache (cheap — pure in-memory) so the canonical
      //    fixture guilds remain visible to subsequent tests.
      seedDiscordCache(deps.client, FIXTURES);

      // 5. Re-seed the database to the canonical fixture state.
      await seedDatabase(deps.prisma);

      log.info('E2E /test/reset completed');
      res.json({ ok: true });
    } catch (err) {
      log.error({ err }, 'E2E /test/reset failed');
      res.status(500).json({ error: err instanceof Error ? err.message : 'reset failed' });
    }
  });

  app.post('/test/seed', guard, async (_req: Request, res: Response) => {
    try {
      // Idempotent seed: truncate anything left over from a previous reset,
      // then re-seed.
      await truncateAll(deps.prisma);
      seedDiscordCache(deps.client, FIXTURES);
      await seedDatabase(deps.prisma);

      log.info('E2E /test/seed completed');
      res.json({ ok: true, fixtures: { guilds: FIXTURE_GUILDS.length, tracks: FIXTURE_TRACKS.length } });
    } catch (err) {
      log.error({ err }, 'E2E /test/seed failed');
      res.status(500).json({ error: err instanceof Error ? err.message : 'seed failed' });
    }
  });

  log.info('E2E /test/reset and /test/seed routes mounted');
}
