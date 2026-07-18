# README / Pages assets

The screenshots and GIF in the root README and on the GitHub Pages site are
captured from the **real dashboard UI** driving the bot's E2E test harness —
no mockups. They are checked in so the README and Pages site work without a
build step; regenerate them when the UI changes meaningfully.

## Regenerating

1. Start the same two processes the Playwright suite uses:

   ```bash
   # Terminal 1 — bot in E2E mode on port 3001
   E2E=true NODE_ENV=test JWT_SECRET=test-jwt-secret-at-least-32-chars-long-for-e2e \
   DATABASE_URL=file:./prisma/e2e.db STATE_BACKEND=memory \
   CLIENT_TOKEN=not-used-in-e2e-mode PORT=3001 pnpm --filter discord-bot dev

   # Terminal 2 — desktop web UI on port 15173
   VITE_DEV_PROXY_TARGET=http://localhost:3001 VITE_DEV_PORT=15173 \
   pnpm --filter discord-bot-desktop dev:web
   ```

2. (Recommended) Temporarily prettify the fixture data so captures don't show
   "Test Song 1 / Test Guild". Edit — **without committing** —
   `packages/bot/src/testMode/fixtures.ts` (track titles/artists/durations,
   guild name, playlist name, SVG data-URI thumbnails) and
   `packages/bot/src/testMode/discordStub.ts` (bot username). Optionally let
   `fixtureExtractor.ts`'s `handle()` return all fuzzy matches so the search
   page shows a full result list. Revert with
   `git checkout -- packages/bot/src/testMode` when done.

3. Capture:

   ```bash
   cd packages/e2e
   node scripts/capture-assets.mjs probe   # sanity-check the landing state
   node scripts/capture-assets.mjs shots   # screenshots -> docs/assets/*.png
   node scripts/capture-assets.mjs dash    # cleaner dashboard.png (no toasts)
   node scripts/capture-assets.mjs gif     # records docs/assets/*.webm
   ```

4. Convert the recorded video to a GIF:

   ```bash
   cd docs/assets
   ffmpeg -y -i <recording>.webm \
     -vf "setpts=PTS/1.3,fps=10,scale=960:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5" \
     search-and-play.gif
   rm <recording>.webm
   ```

## Files

| File                  | Used by                    | What it shows                                  |
| --------------------- | -------------------------- | ---------------------------------------------- |
| `dashboard.png`       | README hero, Pages tour    | Bot status, stats, now playing                 |
| `queue.png`           | README gallery, Pages tour | Now playing + populated queue                  |
| `search.png`          | README gallery             | Multi-result search page                       |
| `library.png`         | README gallery, Pages tour | Playlists tab with seeded playlist             |
| `settings.png`        | README gallery, Pages tour | Theme/accent settings + bot integration        |
| `logs.png`            | (spare)                    | Live log viewer with filters                   |
| `search-and-play.gif` | README + Pages tour        | Queue two tracks, search "Down Under", play it |

The GitHub Pages workflow (`.github/workflows/deploy-pages.yml`) copies this
directory to `/assets/` on the published site.
