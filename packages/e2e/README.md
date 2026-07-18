# discord-bot-e2e

Playwright end-to-end suite for the Down Under Discord Bot desktop app (web
UI) against a real bot backend running in test mode.

Tauri-specific flows (deep-link auth) live in a separate WebdriverIO package
to be added later — this package covers the web-surface flows, which is
~90% of the user-facing behaviour.

## Quick start

```bash
# One-time: download the Chromium browser Playwright drives
pnpm --filter discord-bot-e2e install-browsers

# Run the full suite (headless)
pnpm --filter discord-bot-e2e test

# Interactive UI mode — great for iterating on a single flow
pnpm --filter discord-bot-e2e test:ui

# Show the last HTML report
pnpm --filter discord-bot-e2e report
```

The first invocation starts two long-lived processes:

1. The bot (`packages/bot`) with `E2E=true` so the test-mode stubs activate,
   on port **3001**.
2. The Vite dev server for the desktop app (`packages/desktop`) on port
   **15173**.

Both are reused between test runs locally (`reuseExistingServer: true` when
`CI` is unset), and torn down once Playwright exits on CI.

## Test state discipline

Each `.spec.ts` file owns its state:

- A worker-scoped, auto-triggered `resetState` fixture hits
  `POST /test/reset` and `POST /test/seed` once before the file starts, then
  once per worker if the worker is reused across files.
- Tests within a single file may share state intentionally — Playwright runs
  them sequentially inside a file, and `fullyParallel: false` / `workers: 1`
  keeps file-level ordering stable.
- If a single test needs a clean slate mid-file, call
  `apiClient.resetTestState()` explicitly in its `beforeEach`.

## Writing a new test

```ts
import { test, expect } from '../harness/testFixtures';
import { SidebarPO, PlayerBarPO, SearchPagePO, ToastPO } from '../harness/pageObjects';
import { FIXTURE_TRACKS } from '../fixtures';

test('user searches and plays a fixture track', async ({ authedPage }) => {
  const sidebar = new SidebarPO(authedPage);
  const search = new SearchPagePO(authedPage);
  const player = new PlayerBarPO(authedPage);

  await sidebar.navigateTo('search');
  await search.search('test:song-1');
  await search.clickResult(FIXTURE_TRACKS[0].title);

  await expect.poll(() => player.isPlaying()).toBe(true);
  expect(await player.getTrackTitle()).toContain(FIXTURE_TRACKS[0].title);
});
```

Key conventions:

- Always import `test` / `expect` from `../harness/testFixtures` (not
  `@playwright/test` directly) so you get the `authedPage` and `resetState`
  fixtures for free.
- Prefer page objects over raw selectors. If you find yourself reaching for a
  locator not covered by the existing POs, add it there, not in the test.
- Fixture data lives in `packages/e2e/fixtures/` — import track IDs / titles
  from there instead of hard-coding strings.

## Test catalog

Other agents will add these specs to `packages/e2e/playwright/`. Each gets
its own file so failures land in one scope:

| File                         | Flow covered                                               |
| ---------------------------- | ---------------------------------------------------------- |
| `auth-and-guilds.spec.ts`    | Quick-connect login → guild list loads                     |
| `search-and-play.spec.ts`    | Search by `test:song-1` → play result → player updates     |
| `queue-management.spec.ts`   | Enqueue 3 tracks → skip → remove → shuffle → clear         |
| `playlists.spec.ts`          | Seed playlist visible → create playlist → add/remove       |
| `voice-channel.spec.ts`      | Switch to remote mode → pick voice channel → play succeeds |
| `settings.spec.ts`           | Change theme → persists across reload                      |
| `logs-and-dashboard.spec.ts` | Dashboard shows bot as online; logs page streams events    |
| `toasts-and-errors.spec.ts`  | 4xx response from API surfaces a toast                     |

## How test mode works (bot side)

When the bot boots with `E2E=true`:

- `client.login()` is skipped.
- `seedDiscordCache()` populates `client.guilds.cache` with fixture guilds
  and emits `ClientReady`.
- The fixture extractor replaces every real extractor; search/play goes
  through a 30-second silent WAV.
- `queue.connect()` is monkey-patched to resolve with a synthetic Ready voice
  connection — no Discord UDP handshake.
- State service uses `STATE_BACKEND=memory` (in-process Maps).
- `POST /test/reset` clears every Prisma table and in-memory player state.
- `POST /test/seed` re-inserts the canonical guild + seed playlist.

Everything else — Express routes, WebSocket, JWT auth, Prisma queries,
playlist CRUD — runs for real.

## Files you may want to edit

- `harness/pageObjects/` — add / update locators as the UI evolves.
- `harness/testFixtures.ts` — add new shared Playwright fixtures.
- `harness/apiClient.ts` — wrap more of the bot API as convenience methods.
- `fixtures/index.ts` — re-exports from the bot's canonical fixture file.
  Edit `packages/bot/src/testMode/fixtures.ts` to add data.
