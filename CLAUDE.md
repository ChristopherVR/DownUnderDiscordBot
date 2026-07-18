# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A multi-platform Discord music bot with a Tauri desktop dashboard. pnpm monorepo with four workspace packages:

- **`packages/bot`** - Node.js/TypeScript Discord bot (discord.js + discord-player) + Express REST/WebSocket API server. Runs standalone; SQLite via Prisma.
- **`packages/desktop`** - Tauri v2 app (Rust shell + React 19 frontend). Connects to a bot over HTTP/WebSocket; can optionally run its own bundled copy as a background sidecar too (Settings > "Run Bot Locally", Tauri only - see `docs/desktop.md` § Bundled Local Bot). The frontend also runs standalone in a plain browser (see "Dual-target desktop UI" below).
- **`packages/shared`** (`discord-dashboard-shared`) - Shared TypeScript types and i18next localization, built to `dist/` and consumed by both bot and desktop.
- **`packages/e2e`** (`discord-bot-e2e`) - Playwright end-to-end suite driving the desktop web UI against a real bot running in test mode.

The bot exposes a REST + WebSocket API on port 3001; the desktop app is purely a client of that API, so the bot can run on a server while the dashboard runs anywhere.

Full reference docs: [docs/bot.md](docs/bot.md) (commands, REST API, WebSocket protocol, DB schema, extractors), [docs/desktop.md](docs/desktop.md) (Tauri/React architecture, stores, pages), [docs/infrastructure.md](docs/infrastructure.md) (Docker, Azure Bicep, CI/CD).

## Commands

Run from the repo root unless noted. Package manager is **pnpm** (workspaces via `pnpm-workspace.yaml`); `packages/shared` must be built before the bot or desktop will type-check against it (`postinstall` does this automatically).

```bash
pnpm install              # install deps; builds packages/shared via postinstall
pnpm db:push              # push Prisma schema to SQLite (packages/bot/prisma/schema.prisma)

pnpm dev                  # bot in watch mode (tsx) + shared in watch mode
pnpm dev:desktop          # Tauri dev window + Vite dev server (proxies /api, /ws to :3001)
pnpm build                # build shared + bot
pnpm build:all            # build shared + bot + desktop
pnpm start                # run bot in production mode

pnpm lint                 # oxlint across bot + shared
pnpm lint:fix
pnpm format                # oxfmt --write
pnpm format:check

pnpm test                 # shared + bot + desktop test suites (vitest)
pnpm test:coverage
pnpm test:e2e              # Playwright suite in packages/e2e (see below)
```

Per-package (from a package directory, or `pnpm --filter <name> <script>`; package names are `discord-bot`, `discord-bot-desktop`, `discord-dashboard-shared`, `discord-bot-e2e`):

```bash
pnpm --filter discord-bot type-check                 # tsc --noEmit
pnpm --filter discord-bot test -- path/to.test.ts     # single vitest file
pnpm --filter discord-bot db:generate                 # regenerate Prisma client after schema.prisma changes
pnpm --filter discord-bot db:studio                   # Prisma Studio GUI

pnpm --filter discord-bot-desktop dev:web              # frontend only, no Rust/Tauri required
pnpm --filter discord-bot-desktop build:web            # Vite web build (what Tauri bundles)

pnpm --filter discord-bot-e2e install-browsers         # one-time Chromium download
pnpm --filter discord-bot-e2e test                     # full e2e suite
pnpm --filter discord-bot-e2e test -- playback-controls.spec.ts   # single spec
pnpm --filter discord-bot-e2e test:ui                  # interactive Playwright UI mode
```

`pnpm precommit` (lint + format:check + test) runs via husky's `pre-commit` hook through `lint-staged` - don't bypass with `--no-verify`.

## Architecture notes

### Command abstraction

Slash commands (`packages/bot/src/commands/`, 26 total) are driven through a `CommandContext` abstraction (`packages/bot/src/helpers/commands/`) that works identically whether invoked from a real Discord interaction or from the dashboard's `/api/commands/execute` endpoint. New commands should use `context.getString()`/`context.reply()`/etc. rather than reaching for the raw Discord interaction, so they stay usable from both surfaces.

### Music extractors

Custom `discord-player` extractors live in `packages/bot/src/extractors/` and are registered in `extractors/index.ts`. YouTube streams directly via `youtubei.js`; Spotify and Apple Music resolve metadata then bridge to a matching YouTube stream (no premium accounts needed); SoundCloud and local files have their own extractors. See [docs/bot.md § Music Extractors](docs/bot.md#music-extractors) and `[[discord-player gotchas]]` below before touching playback code.

### State coordination

`packages/bot/src/state/` (`StateCoordinator` + pluggable `IStateService` backends) lets multiple bot instances share presence/active-instance info over a Discord channel (`STATE_BACKEND=channel`) or in-memory (`STATE_BACKEND=memory`, used by E2E test mode). `/set-active` picks which instance actually handles playback for a guild.

### Dual-target desktop UI (in progress)

The desktop React app is being made to run both inside Tauri and as a plain browser tab, gated behind a `packages/desktop/src/platform/` abstraction:

- `platform.isTauri` / `detect.ts` - runtime check for Tauri vs browser.
- `platform/window.ts`, `shell.ts`, `dragDrop.ts`, `filePicker.ts`, `authFlow.ts`, `library.ts` - capability modules that branch on `isTauri()` internally (native window controls, external links, OS drag-drop, native folder picker, deep-link vs redirect OAuth, folder scanning) so page/component code calls one API regardless of target.
- Feature flags (`platform.canMinimizeToTray`, `canDragOsFiles`, `canPickClientFolder`, `showCustomTitlebar`) let components conditionally render Tauri-only UI (e.g. the custom titlebar) without importing `@tauri-apps/api` directly.

When adding a feature that touches native capabilities (files, windowing, OAuth redirect), add/extend a `platform/*` module rather than calling Tauri APIs from components/pages directly, so the browser build keeps working.

### E2E test mode (bot side)

The bot has an inert-by-default test-mode runtime in `packages/bot/src/testMode/`, activated only with `E2E=true`:

- Skips real Discord login; `discordStub.ts` seeds `client.guilds.cache` with fixture guilds and emits `ClientReady`.
- `FixtureExtractor` replaces all real music extractors - search/play resolves to a 30s silent WAV instead of hitting real platforms.
- `queue.connect()` is monkey-patched to resolve with a synthetic ready voice connection (no real Discord voice/UDP handshake).
- `POST /test/reset` and `POST /test/seed` (registered via `registerTestRoutes`) clear/reseed Prisma tables and in-process player state.
- Everything else (Express routes, WebSocket, JWT auth, real Prisma queries, playlist CRUD) runs unmodified.

`packages/e2e` drives this via Playwright against the Vite dev server + bot in E2E mode; see [packages/e2e/README.md](packages/e2e/README.md) for fixture/page-object conventions before adding specs. Tauri-only flows (deep-link auth) are intentionally out of scope for this package.

## discord-player v7 + discord-voip gotchas

- Local file extractors **must** return `createReadStream(path)`, not the path string - a string return makes discord-player use `FFMPEG_ARGS_STRING`, which adds `-reconnect` flags that are only valid for HTTP(S) and fail silently on local files.
- `queue.connect()` resolves before voice is actually `Ready`. Always `waitForVoiceReady(queue)` (via `entersState()` from `discord-voip`) before `queue.node.play()`, or FFmpeg can finish before the AudioPlayer starts reading.
- `maxMissedFrames` defaults to 5 in discord-voip - pass `createAudioPlayer({ behaviors: { maxMissedFrames: 500 } })` via `queue.connect(channel, { audioPlayer })` for startup tolerance.
- `discord-voip` isn't fully re-exported by `discord-player`; depend on it directly for `entersState`/`VoiceConnectionStatus`.
- `skipFFmpeg: true` is the default Player option in v7, but it only takes effect when the stream format is `$fmt` in `{Opus, OggOpus, WebmOpus}` - plain strings and Readables still go through FFmpeg.
- `BaseExtractor.handle()` returns `ExtractorInfo`, not `SearchResult` - let TypeScript infer the type from `createResponse()` rather than annotating it.
- `ExtractorStreamable = Readable | string | { stream: Readable }` - don't over-annotate `stream()`'s return type explicitly.

## Other conventions

- Shared `Track` type uses `thumbnail` (not `cover`).
- `useRef<T>()` under React 19 strict mode needs an explicit argument: `useRef<T>(undefined)`.
- `packages/bot/src/database/generated/` is generated Prisma client output, don't hand-edit; run `pnpm --filter discord-bot db:generate` after schema changes. It's also excluded from oxlint.
- Desktop path alias `@/*` maps to `packages/desktop/src/*` (see `tsconfig.json`).
- Windows shells: quote paths containing backslashes.
- No em dashes anywhere in this repo: code, comments, docs, commit messages. Use a comma, period, parentheses, or a hyphen instead.
