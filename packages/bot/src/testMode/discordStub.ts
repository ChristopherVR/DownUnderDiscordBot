/**
 * discordStub.ts — seed the discord.js client cache with fixture guilds /
 * channels and intercept voice-connect calls so the bot can run end-to-end
 * without ever touching the Discord gateway or UDP voice stack.
 */
import { Collection, Events } from 'discord.js';
import type { Client, Guild, GuildChannel } from 'discord.js';
import type { Player, GuildQueue } from 'discord-player';
import { VoiceConnectionStatus } from 'discord-voip';
import { EventEmitter } from 'events';
import { createLogger } from '../helpers/logger.js';
import { FIXTURES, type FixtureData } from './fixtures.js';

const log = createLogger('discord-stub');

type AnyRecord = Record<string, unknown>;

/**
 * Build a Discord.js `Collection`-shaped map of fake voice channels for a
 * guild. Each channel reports `type: 2` (GuildVoice) so the
 * `/api/guild/:guildId/voice-channels` route returns it.
 */
function buildVoiceChannelCollection(guildId: string, fixtures: FixtureData): Collection<string, GuildChannel> {
  const collection = new Collection<string, GuildChannel>();
  const channels = fixtures.voiceChannels[guildId] ?? [];
  for (const channel of channels) {
    const fake = {
      id: channel.id,
      name: channel.name,
      type: 2,
      guildId,
      members: new Collection<string, unknown>(),
    } as unknown as GuildChannel;
    collection.set(channel.id, fake);
  }
  return collection;
}

function buildFakeGuild(
  client: Client,
  fixtures: FixtureData,
  guildId: string,
  name: string,
  memberCount: number,
): Guild {
  const channelsCache = buildVoiceChannelCollection(guildId, fixtures);
  const fake: AnyRecord = {
    id: guildId,
    name,
    memberCount,
    available: true,
    client,
    iconURL: () => null,
    channels: {
      cache: channelsCache,
      fetch: async (id?: string) => (id ? (channelsCache.get(id) ?? null) : channelsCache),
    },
  };
  return fake as unknown as Guild;
}

/**
 * Replace `client.guilds.cache` with a `Collection` containing fixture guilds
 * and emit `ClientReady` on the next tick so downstream code that awaits
 * `client.once(Events.ClientReady)` unblocks.
 *
 * Safe to call multiple times — idempotent per fixture id.
 */
export function seedDiscordCache(client: Client, fixtures: FixtureData = FIXTURES): void {
  // discord.js's GuildManager exposes `cache` as a getter-only property, so we
  // can't reassign it. Instead we clear the existing Collection (via its
  // underlying Map) and repopulate it in place.
  const guildsMgr = client.guilds as unknown as { cache: Collection<string, Guild> };
  const cache = guildsMgr.cache;
  cache.clear();
  for (const g of fixtures.guilds) {
    cache.set(g.id, buildFakeGuild(client, fixtures, g.id, g.name, g.memberCount));
  }

  // Mark the client as "ready" so handlers that check `client.isReady()` work.
  // Several Client fields are getter-only in discord.js v14, so we must use
  // `Object.defineProperty` with `configurable: true` to shadow them.
  const defineOverride = (obj: object, key: string, value: unknown) => {
    try {
      Object.defineProperty(obj, key, { value, writable: true, configurable: true });
    } catch {
      // ignore — non-configurable, caller can live without it
    }
  };

  const clientAsObj = client as unknown as object;
  defineOverride(clientAsObj, 'readyAt', new Date());
  defineOverride(clientAsObj, 'uptime', 0);
  defineOverride(clientAsObj, 'isReady', () => true);
  const existingUser = (clientAsObj as AnyRecord).user;
  if (!existingUser) {
    defineOverride(clientAsObj, 'user', {
      id: 'test-bot-user',
      username: 'TestBot',
      displayAvatarURL: () => null,
    });
  }
  const existingWs = (clientAsObj as AnyRecord).ws as AnyRecord | undefined;
  if (!existingWs || typeof existingWs.ping !== 'number') {
    defineOverride(clientAsObj, 'ws', { ping: 0 });
  }

  // Defer the Ready emit so callers can subscribe first.
  setImmediate(() => {
    try {
      (client as unknown as { emit: (event: string, ...args: unknown[]) => boolean }).emit(Events.ClientReady, client);
    } catch (err) {
      log.warn({ err }, 'Failed to emit ClientReady');
    }
  });

  log.info({ guilds: cache.size }, 'Seeded Discord client cache with fixtures');
}

/**
 * Patch `queue.connect()` on every queue discord-player creates so calls
 * resolve immediately with a synthetic Ready voice connection. Real voice /
 * UDP handshake never runs.
 *
 * discord-player accesses `queue.connection.state.status` and `queue.channel`.
 * We shim both.
 */
export function patchVoiceConnect(player: Player): void {
  const attach = (queue: GuildQueue) => {
    const originalConnect = queue.connect.bind(queue);
    (queue as unknown as AnyRecord).connect = async (channel: unknown) => {
      try {
        // A channel argument can be a string id or a channel-like object.
        let channelId: string | null = null;
        let channelName: string | null = null;
        if (typeof channel === 'string') {
          channelId = channel;
        } else if (channel && typeof channel === 'object') {
          const c = channel as AnyRecord;
          channelId = (c.id as string) ?? null;
          channelName = (c.name as string) ?? null;
        }

        // Look up the channel in the (seeded) guild cache if possible.
        const guildId = queue.guild?.id;
        if (guildId && channelId) {
          const guild = queue.guild as unknown as {
            channels?: { cache?: Collection<string, GuildChannel> };
          };
          const cached = guild.channels?.cache?.get(channelId);
          if (cached) {
            channelName = (cached as unknown as AnyRecord).name as string;
          }
        }

        const emitter = new EventEmitter() as EventEmitter & AnyRecord;
        (emitter as AnyRecord).state = { status: VoiceConnectionStatus.Ready };
        (emitter as AnyRecord).joinConfig = {
          guildId,
          channelId,
          selfDeaf: false,
          selfMute: false,
          group: 'default',
        };
        (emitter as AnyRecord).destroy = () => {
          (emitter as AnyRecord).state = { status: VoiceConnectionStatus.Destroyed };
        };
        (emitter as AnyRecord).disconnect = () => true;
        (emitter as AnyRecord).subscribe = () => ({ unsubscribe: () => true });

        const fakeChannel = {
          id: channelId,
          name: channelName ?? 'Test Voice',
          type: 2,
          guild: queue.guild,
          members: new Collection<string, unknown>(),
        };

        const qRec = queue as unknown as AnyRecord;
        qRec.connection = emitter;
        qRec.channel = fakeChannel;
        // discord-player uses `queue.dispatcher` internally; expose a minimal shim.
        qRec.dispatcher = {
          voiceConnection: emitter,
          channel: fakeChannel,
          audioPlayer: null,
        };

        log.debug({ guildId, channelId }, 'Synthesised voice connection (E2E stub)');
        return queue;
      } catch (err) {
        log.warn({ err }, 'Voice-connect stub failed — falling back to original');
        return originalConnect(channel as Parameters<typeof originalConnect>[0]);
      }
    };
  };

  // discord-player exposes player events on `player.events`, not `player.nodes`.
  (
    player.events as unknown as {
      on: (event: string, handler: (queue: GuildQueue) => void) => void;
    }
  ).on('queueCreate', (queue: GuildQueue) => attach(queue));
  // Attach to any queues that already exist at patch time.
  for (const queue of player.nodes.cache.values()) {
    attach(queue);
  }
  log.info('Voice-connect patch installed on Player');
}
