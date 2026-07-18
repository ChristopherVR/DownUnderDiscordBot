/**
 * Re-exports the canonical fixture catalog from the bot package under a
 * stable path for E2E test authors.
 *
 * We `export *` from the bot's `testMode/fixtures.ts` so UI assertions and
 * stubbed data stay in perfect sync: there is exactly one source of truth.
 *
 * The relative path reaches across workspace packages. This is safe because
 * `fixtures.ts` is pure data — no Discord.js / Prisma runtime imports — so
 * TypeScript resolves it without pulling in the bot's dependencies.
 */
export * from '../../bot/src/testMode/fixtures';
