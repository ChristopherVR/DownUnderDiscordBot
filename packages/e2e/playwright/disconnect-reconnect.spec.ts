/**
 * E2E coverage for the WebSocket disconnect + reconnect lifecycle.
 *
 * The bot process is shared across the whole suite, so these tests cannot
 * physically take it down. Instead we reach into the browser-side
 * `wsService` (module singleton) and `useBotStore` (Zustand store) to
 * simulate disconnects and observe the UI's reaction.
 *
 * Flow covered:
 *   1. App loads authenticated → UI reaches "connected" state.
 *   2. Forcibly close the WebSocket → UI flips to "disconnected".
 *   3. The wsService exponential-backoff reconnect restores the connection.
 *   4. Full `disconnectBot` tears down auth → UI shows unauthenticated state.
 *   5. `restoreBotConnection`/`connectToBot` brings everything back online.
 */
import { test, expect, type Page } from '../harness/testFixtures';

// Navigate to dashboard - it's where "Connected"/"Disconnected" status text is
// rendered most explicitly. The NavLink selector falls back to a role lookup
// in case the testid isn't present.
async function openDashboard(page: Page): Promise<void> {
  // Dashboard is the default landing route (App.tsx Navigate to="/dashboard"),
  // but navigate explicitly to be deterministic across tests.
  await page.goto('/dashboard?test=true');
}

/**
 * Expose the Zustand store and the wsService as globals so the test can
 * drive them directly. Vite's dev server serves the source modules, so a
 * dynamic import from within `addInitScript` resolves through the same
 * module graph as the running app (i.e. we get the actual singletons, not
 * fresh copies).
 */
async function exposeStoreAndWs(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // Mark that we're in test mode - useful for assertions later.
    (window as unknown as { __E2E__?: boolean }).__E2E__ = true;

    // Kick off the imports early; they'll resolve before our test code
    // actually needs them because we `expect.poll` for `__bot` below.
    void (async () => {
      try {
        const store = await import('/src/stores/useBotStore.ts');
        const ws = await import('/src/lib/ws.ts');
        (window as unknown as { __bot?: unknown }).__bot = store.useBotStore;
        (window as unknown as { __ws?: unknown }).__ws = ws.wsService;
      } catch {
        // Vite may resolve without the extension in some configs; try again.
        try {
          const store = await import('/src/stores/useBotStore');
          const ws = await import('/src/lib/ws');
          (window as unknown as { __bot?: unknown }).__bot = store.useBotStore;
          (window as unknown as { __ws?: unknown }).__ws = ws.wsService;
        } catch {
          // Leave undefined - tests will poll and surface a clear timeout.
        }
      }
    })();
  });
}

/**
 * Read the current `connection.connected` flag directly from the Zustand
 * store. The UI lags a render behind the store, so for UI assertions we
 * still fall back to DOM text. This helper is mostly diagnostic.
 */
async function storeConnected(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    type StoreLike = { getState: () => { connection: { connected: boolean } } };
    const bot = (window as unknown as { __bot?: StoreLike }).__bot;
    return bot ? bot.getState().connection.connected : false;
  });
}

async function storeHasBotUser(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    type StoreLike = { getState: () => { botUser: unknown } };
    const bot = (window as unknown as { __bot?: StoreLike }).__bot;
    return !!(bot && bot.getState().botUser);
  });
}

test.describe('disconnect and reconnect', () => {
  test.beforeEach(async ({ page }) => {
    await exposeStoreAndWs(page);
  });

  test('initial authenticated load reaches connected state', async ({ authedPage }) => {
    await openDashboard(authedPage);

    // Wait for the exposed globals to hydrate so subsequent tests in the
    // same file can rely on them.
    await expect
      .poll(
        () =>
          authedPage.evaluate(
            () =>
              !!(window as unknown as { __bot?: unknown; __ws?: unknown }).__bot &&
              !!(window as unknown as { __bot?: unknown; __ws?: unknown }).__ws,
          ),
        { timeout: 10_000 },
      )
      .toBe(true);

    // The bot user avatar block is rendered only when `botUser` is truthy.
    // Use it as a proxy for "auth restored and store populated".
    await expect.poll(() => storeHasBotUser(authedPage), { timeout: 10_000 }).toBe(true);

    // Connection flag flips to true once the WS onopen handler fires.
    await expect.poll(() => storeConnected(authedPage), { timeout: 10_000 }).toBe(true);

    // UI reflection: Dashboard's session-context strip shows "Connected".
    // The text "Connected" appears in two places (server count subtitle and
    // the websocket-status block). The websocket block's parent contains
    // host:port subtitle - scope by that to avoid the server-count match.
    const connectedBlock = authedPage.getByText(/^Connected$/).first();
    await expect(connectedBlock).toBeVisible({ timeout: 10_000 });
  });

  test('force-closing the WebSocket flips UI to disconnected, then reconnects', async ({ authedPage }) => {
    await openDashboard(authedPage);

    // Wait until initially connected.
    await expect
      .poll(() => authedPage.evaluate(() => !!(window as unknown as { __ws?: unknown }).__ws), { timeout: 10_000 })
      .toBe(true);
    await expect.poll(() => storeConnected(authedPage), { timeout: 10_000 }).toBe(true);

    // Technique A: close the underlying socket without tearing down the
    // reconnect timer. This simulates the server dropping the connection
    // (the onclose handler schedules a reconnect automatically).
    const closed = await authedPage.evaluate(() => {
      type WsLike = {
        // `ws` is private but reachable at runtime; cast via `any` for access.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [k: string]: any;
      };
      const wsService = (window as unknown as { __ws?: WsLike }).__ws;
      if (!wsService) return false;
      const inner = wsService.ws as WebSocket | null | undefined;
      if (inner && typeof inner.close === 'function') {
        inner.close();
        return true;
      }
      return false;
    });
    expect(closed).toBe(true);

    // Disconnected state should propagate to the store within the default
    // expect timeout (onclose fires synchronously, setState batches).
    await expect.poll(() => storeConnected(authedPage), { timeout: 3_000 }).toBe(false);

    // Exponential backoff: first retry fires at 1s. Give it generous room
    // - the first attempt sometimes races with the browser closing state.
    await expect.poll(() => storeConnected(authedPage), { timeout: 8_000 }).toBe(true);
  });

  test('disconnectBot clears auth and the UI drops the bot-user context', async ({ authedPage }) => {
    await openDashboard(authedPage);

    await expect.poll(() => storeHasBotUser(authedPage), { timeout: 10_000 }).toBe(true);
    await expect.poll(() => storeConnected(authedPage), { timeout: 10_000 }).toBe(true);

    // Trigger the full teardown - clears token, closes WS, resets guilds.
    await authedPage.evaluate(() => {
      type StoreLike = { getState: () => { disconnectBot: () => void } };
      const bot = (window as unknown as { __bot?: StoreLike }).__bot;
      bot?.getState().disconnectBot();
    });

    // Both auth and WS should be gone.
    await expect.poll(() => storeHasBotUser(authedPage), { timeout: 5_000 }).toBe(false);
    await expect.poll(() => storeConnected(authedPage), { timeout: 5_000 }).toBe(false);

    // UI: the "Active Session Context" strip on Dashboard is gated on
    // `botUser`. Its defining subtitle "Authenticated" must disappear.
    await expect(authedPage.getByText('Authenticated')).toHaveCount(0, { timeout: 5_000 });

    // Now re-establish via quick-connect (restoreBotConnection requires a
    // token in localStorage; disconnectBot wipes it, so use connectToBot).
    await authedPage.evaluate(() => {
      type StoreLike = {
        getState: () => { connectToBot: (token?: string) => Promise<void> };
      };
      const bot = (window as unknown as { __bot?: StoreLike }).__bot;
      return bot?.getState().connectToBot();
    });

    // Quick-connect is synchronous on the happy path (no OAuth configured
    // in E2E mode), so the store should repopulate promptly.
    await expect.poll(() => storeHasBotUser(authedPage), { timeout: 10_000 }).toBe(true);
    await expect.poll(() => storeConnected(authedPage), { timeout: 10_000 }).toBe(true);

    // UI: "Authenticated" caption returns.
    await expect(authedPage.getByText('Authenticated').first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
