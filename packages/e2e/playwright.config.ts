import { defineConfig } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const BOT_PORT = Number(process.env.E2E_BOT_PORT ?? 3001);
const VITE_PORT = Number(process.env.E2E_VITE_PORT ?? 15173);

/**
 * Playwright configuration for the Down Under Discord Bot E2E suite.
 *
 * Two web servers are started before tests run:
 *   1. The bot (packages/bot) with E2E=true so test-mode stubs activate.
 *   2. The desktop Vite dev server (packages/desktop, `dev:web` script).
 *
 * Tests within a single spec file share state intentionally; each file is
 * responsible for calling the `resetState` fixture from `harness/testFixtures`
 * at the start of its suite (`beforeAll`).
 */
export default defineConfig({
  testDir: './playwright',
  outputDir: './test-results',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${VITE_PORT}`,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'pnpm --filter discord-bot dev',
      cwd: REPO_ROOT,
      url: `http://localhost:${BOT_PORT}/api/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        E2E: 'true',
        NODE_ENV: 'test',
        JWT_SECRET: 'test-jwt-secret-at-least-32-chars-long-for-e2e',
        DATABASE_URL: 'file:./prisma/e2e.db',
        STATE_BACKEND: 'memory',
        CLIENT_TOKEN: 'not-used-in-e2e-mode',
        PORT: String(BOT_PORT),
      },
    },
    {
      command: 'pnpm --filter discord-bot-desktop dev:web',
      cwd: REPO_ROOT,
      url: `http://localhost:${VITE_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        // vite.config.ts's dev proxy for /api and /ws reads this — not
        // VITE_BOT_PORT, which nothing in the desktop app actually consumes.
        VITE_DEV_PROXY_TARGET: `http://localhost:${BOT_PORT}`,
        VITE_DEV_PORT: String(VITE_PORT),
      },
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
});
