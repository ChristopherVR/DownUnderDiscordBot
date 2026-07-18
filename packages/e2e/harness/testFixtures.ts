/**
 * Playwright fixtures for the Down Under Bot E2E suite.
 *
 * Exposes:
 *   - `page` (vanilla Playwright page, ?test=true query string appended)
 *   - `authedPage` - a `Page` that has already exchanged a JWT via
 *     `/api/auth/quick-connect` and written it to `localStorage` under the
 *     canonical `downunder_auth_token` key before navigating to `/`.
 *   - `apiClient` - a shared `ApiClient` instance pointed at the bot.
 *   - `resetState` - an auto-fixture. File-level: runs once per spec file in
 *     `beforeAll`, calls `/test/reset` then `/test/seed`.
 *
 * Test authors `import { test, expect } from '../harness/testFixtures'` and
 * then opt into `authedPage` / `apiClient` as needed.
 */
import { test as base, expect, type Page } from '@playwright/test';
import { ApiClient } from './apiClient';

const AUTH_TOKEN_KEY = 'downunder_auth_token';
const BOT_PORT = process.env.E2E_BOT_PORT ?? '3001';
const BOT_URL = `http://localhost:${BOT_PORT}`;

export interface E2EFixtures {
  apiClient: ApiClient;
  authedPage: Page;
}

export interface E2EWorkerFixtures {
  /** Auto-fixture: reset + re-seed the bot state once per spec file. */
  resetState: void;
}

export const test = base.extend<E2EFixtures, E2EWorkerFixtures>({
  // Playwright inspects this function's source text for a destructuring
  // pattern to resolve fixture dependencies - `{}` is required here even
  // though nothing is destructured; renaming it breaks fixture resolution.
  // oxlint-disable-next-line no-empty-pattern
  apiClient: async ({}, use) => {
    const client = new ApiClient({ baseUrl: BOT_URL });
    await use(client);
  },

  authedPage: async ({ page, apiClient }, use) => {
    // 1. Obtain a JWT from the bot.
    const { token, guilds } = await apiClient.quickConnect();
    apiClient.setToken(token);
    if (guilds.length > 0) apiClient.setGuildId(guilds[0].id);

    // 2. Prime localStorage before the app boots. Playwright evaluates the
    //    init script on the next navigation.
    await page.addInitScript(
      ({ key, value }) => {
        try {
          window.localStorage.setItem(key, value);
        } catch {
          // ignore - some environments block access
        }
      },
      { key: AUTH_TOKEN_KEY, value: token },
    );

    // 3. Navigate to the app root. ?test=true lets the UI opt into test mode
    //    (e.g. skip animations, force local playback mode, etc.).
    await page.goto('/?test=true');

    await use(page);
  },

  resetState: [
    // oxlint-disable-next-line no-empty-pattern
    async ({}, use) => {
      const client = new ApiClient({ baseUrl: BOT_URL });
      await client.resetTestState();
      await client.seedTestState();
      await use();
    },
    { scope: 'worker', auto: true },
  ],
});

export { expect };
export type { Page } from '@playwright/test';
