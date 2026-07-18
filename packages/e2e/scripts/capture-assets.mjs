/**
 * Captures README / GitHub Pages marketing assets (screenshots + GIF source
 * videos) from the desktop web UI running against the bot in E2E mode.
 *
 * Prereqs (same processes the Playwright suite starts):
 *   1. Bot with E2E=true on port 3001
 *   2. Desktop web UI (`pnpm --filter discord-bot-desktop dev:web`) on 15173
 *
 * Usage:
 *   node scripts/capture-assets.mjs probe   # one screenshot of the landing state
 *   node scripts/capture-assets.mjs shots   # full screenshot set -> ../../docs/assets
 *   node scripts/capture-assets.mjs gif     # record interaction videos -> ../../docs/assets
 *
 * Convert videos to GIFs afterwards with ffmpeg (see docs/assets/README.md).
 */
import { chromium } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.resolve(__dirname, '..', '..', '..', 'docs', 'assets');
const BOT_URL = 'http://localhost:3001';
const APP_URL = 'http://localhost:15173';
const AUTH_TOKEN_KEY = 'downunder_auth_token';

const mode = process.argv[2] ?? 'probe';
fs.mkdirSync(ASSETS_DIR, { recursive: true });

async function api(method, p, body, token, guildId) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (guildId) headers['x-guild-id'] = guildId;
  const res = await fetch(`${BOT_URL}${p}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${p} -> ${res.status}: ${text}`);
  return text ? JSON.parse(text) : undefined;
}

async function login() {
  const { token, guilds } = await api('GET', '/api/auth/quick-connect');
  return { token, guildId: guilds[0]?.id };
}

async function newPage(browser, token, opts = {}) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    ...opts,
  });
  const page = await context.newPage();
  await page.addInitScript(
    ({ key, value }) => window.localStorage.setItem(key, value),
    { key: AUTH_TOKEN_KEY, value: token },
  );
  return { context, page };
}

const nav = (page, item) => page.locator(`[data-testid="sidebar-nav-${item}"]`).first();
const settle = (page, ms = 1200) => page.waitForTimeout(ms);

/** A search result row: a div containing the track title and a Play button. */
const resultRow = (page, title) =>
  page
    .locator('div')
    .filter({ hasText: title })
    .filter({ has: page.locator('button[title="Play"]') })
    .first();

async function search(page, query, { delay = 0 } = {}) {
  const input = page.locator('[data-testid="search-input"]').first();
  await input.click();
  await input.fill('');
  if (delay > 0) {
    await input.pressSequentially(query, { delay });
  } else {
    await input.fill(query);
  }
  await input.press('Enter');
  await settle(page, 1600);
}

async function playViaSearch(page, trackId, title, action = 'Play') {
  await search(page, `test:${trackId}`);
  const row = resultRow(page, title);
  await row.hover();
  await settle(page, 300);
  await row.locator(`button[title="${action}"]`).click();
  await settle(page, 900);
}

async function resetAndSeed() {
  await api('POST', '/test/reset');
  await api('POST', '/test/seed');
}

const QUEUE_TRACKS = [
  ['song-2', 'Beds Are Burning'],
  ['song-3', 'Never Tear Us Apart'],
  ['song-4', 'Great Southern Land'],
  ['song-5', 'The Horses'],
  ['song-6', 'Somebody That I Used to Know'],
];

/** Play song-1 and queue five more, all through the real UI (local mode). */
async function arrangeViaUi(page) {
  await nav(page, 'search').click();
  await settle(page, 800);
  await playViaSearch(page, 'song-1', 'Down Under', 'Play');
  for (const [id, title] of QUEUE_TRACKS) {
    await playViaSearch(page, id, title, 'Add to queue');
  }
}

async function probe() {
  const { token } = await login();
  const browser = await chromium.launch();
  const { page } = await newPage(browser, token);
  await page.goto(`${APP_URL}/?test=true`);
  await settle(page, 2500);
  await page.screenshot({ path: path.join(ASSETS_DIR, '_probe.png'), fullPage: false });
  console.log('probe saved to', path.join(ASSETS_DIR, '_probe.png'));
  await browser.close();
}

async function shots() {
  const { token } = await login();
  await resetAndSeed();

  const browser = await chromium.launch();
  const { page } = await newPage(browser, token);
  await page.goto(`${APP_URL}/?test=true`);
  await settle(page, 2500);

  await arrangeViaUi(page);

  // Discover every sidebar destination present in the DOM. (Playwright's
  // $$eval runs this fixed callback in the page - it is not JS eval().)
  const items = await page.$$eval('[data-testid^="sidebar-nav-"]', (els) =>
    els.map((el) => el.getAttribute('data-testid').replace('sidebar-nav-', '')),
  );
  console.log('sidebar items:', items);

  for (const item of items) {
    await nav(page, item).click();
    await settle(page, 1800);
    if (item === 'search') {
      await search(page, 'Aussie classics');
    }
    await page.screenshot({ path: path.join(ASSETS_DIR, `${item}.png`) });
    console.log(`captured ${item}.png`);
  }
  await browser.close();
}

/** Re-capture only the dashboard: ping the instance, let toasts dismiss. */
async function dash() {
  const { token } = await login();
  await resetAndSeed();

  const browser = await chromium.launch();
  const { page } = await newPage(browser, token);
  await page.goto(`${APP_URL}/?test=true`);
  await settle(page, 2500);

  await arrangeViaUi(page);
  await nav(page, 'dashboard').click();
  await settle(page, 1000);
  const ping = page.getByRole('button', { name: /ping/i }).first();
  if (await ping.isVisible().catch(() => false)) await ping.click();
  await settle(page, 6500); // let toasts auto-dismiss
  await page.screenshot({ path: path.join(ASSETS_DIR, 'dashboard.png') });
  console.log('captured dashboard.png');
  await browser.close();
}

async function gif() {
  const { token } = await login();
  await resetAndSeed();

  const browser = await chromium.launch();
  const { context, page } = await newPage(browser, token, {
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    recordVideo: { dir: ASSETS_DIR, size: { width: 1280, height: 800 } },
  });

  await page.goto(`${APP_URL}/?test=true`);
  await settle(page, 2500);

  // Flow: queue two tracks -> type & play "Down Under" -> land on the queue
  // page while it is still playing (local-mode playback is short-lived, so
  // the play step goes last to keep the final frames alive).
  await nav(page, 'search').click();
  await settle(page, 1000);
  for (const [id, title] of QUEUE_TRACKS.slice(0, 2)) {
    await playViaSearch(page, id, title, 'Add to queue');
  }
  await search(page, 'Down Under', { delay: 85 });
  const row = resultRow(page, 'Down Under');
  await row.hover();
  await settle(page, 500);
  await row.locator('button[title="Play"]').click();
  await settle(page, 2000);
  await nav(page, 'queue').click();
  await settle(page, 3000);

  await context.close(); // flushes the video
  const video = fs
    .readdirSync(ASSETS_DIR)
    .filter((f) => f.endsWith('.webm'))
    .at(-1);
  console.log('video saved:', video);
  await browser.close();
}

const run = { probe, shots, gif, dash }[mode];
if (!run) {
  console.error(`unknown mode: ${mode}`);
  process.exit(1);
}
await run();
