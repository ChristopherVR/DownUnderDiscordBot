/**
 * Public entry point for the bot's test-mode runtime. Everything in this
 * directory is inert when `E2E !== 'true'`.
 */
import type { Client } from 'discord.js';
import type { Player } from 'discord-player';
import { createLogger } from '../helpers/logger.js';
import { seedDiscordCache, patchVoiceConnect } from './discordStub.js';
import { FIXTURES } from './fixtures.js';
import { FixtureExtractor } from './fixtureExtractor.js';

const log = createLogger('test-mode');

export const isE2EMode = (): boolean => process.env.E2E === 'true';

export { registerTestRoutes } from './testRoutes.js';
export type { TestRouteDeps } from './testRoutes.js';
export { FIXTURES, FIXTURE_TRACKS, FIXTURE_GUILDS, FIXTURE_PLAYLIST, FIXTURE_VOICE_CHANNELS } from './fixtures.js';
export { FixtureExtractor } from './fixtureExtractor.js';

/**
 * Register the fixture extractor with the player. Called from
 * `initializePlayer` instead of `registerExtractors()` when in E2E mode.
 */
export async function registerE2EExtractors(player: Player): Promise<void> {
  await player.extractors.register(FixtureExtractor, {});
  log.info('FixtureExtractor registered (E2E mode)');
}

/**
 * Apply E2E runtime stubs: seed Discord cache, patch voice connect, emit
 * ClientReady. Call this AFTER `initializePlayer` resolves.
 */
export async function applyE2EStubs(ctx: { client: Client; player: Player }): Promise<void> {
  if (!isE2EMode()) return;
  log.info('Applying E2E runtime stubs');
  seedDiscordCache(ctx.client, FIXTURES);
  patchVoiceConnect(ctx.player);
}
