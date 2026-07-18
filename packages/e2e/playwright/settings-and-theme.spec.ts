/**
 * E2E tests for the "settings and theme" flow.
 *
 * Covers:
 *   - Navigation to /settings via the sidebar.
 *   - Theme selection (light/dark/system) and its effect on <html data-mode>.
 *   - Theme persistence across reload (localStorage key `du-theme`).
 *   - Sidebar collapse/expand toggle, observable via <main> marginLeft.
 *   - Sidebar collapse persistence across reload (layout-store).
 *   - Chat panel open/close via the floating toggle button and its own close.
 *   - Music folder add is not exposed in the current SettingsPage UI; see fixme.
 *
 * References:
 *   - useThemeStore.ts         → document.documentElement[data-mode|data-accent]
 *   - useLayoutStore.ts        → persist key `layout-store`, partializes
 *                                sidebarCollapsed + chatOpen
 *   - App.tsx                  → <main> style.marginLeft = collapsed ? 60 : 220,
 *                                marginRight = chatOpen ? 360 : 0
 *   - Sidebar.tsx              → collapse toggle button with dynamic title
 *                                "Collapse sidebar" | "Expand sidebar"
 *   - ChatPanel.tsx            → close button with title "Close chat"
 *   - App.tsx                  → floating <MessageSquare> button with
 *                                title "Open chat"
 */
import { test, expect } from '../harness/testFixtures';
import { SettingsPagePO, SidebarPO } from '../harness/pageObjects';

// Force a predictable prefers-color-scheme so the `system` assertion is stable.
test.use({ colorScheme: 'light' });

test.describe('settings and theme', () => {
  test('navigates to /settings via the sidebar', async ({ authedPage }) => {
    const sidebar = new SidebarPO(authedPage);
    await sidebar.navigateTo('settings');

    await expect(authedPage).toHaveURL(/\/settings$/);
    await expect(authedPage.getByRole('heading', { name: /^settings$/i })).toBeVisible();
  });

  test('applies the dark theme to the <html> element', async ({ authedPage }) => {
    const sidebar = new SidebarPO(authedPage);
    await sidebar.navigateTo('settings');

    // The Appearance selector renders three buttons: Light / Dark / System.
    await authedPage.getByRole('button', { name: /^dark$/i }).click();

    await expect(authedPage.locator('html')).toHaveAttribute('data-mode', 'dark');
  });

  test('applies the light theme to the <html> element', async ({ authedPage }) => {
    const sidebar = new SidebarPO(authedPage);
    await sidebar.navigateTo('settings');

    await authedPage.getByRole('button', { name: /^light$/i }).click();

    await expect(authedPage.locator('html')).toHaveAttribute('data-mode', 'light');
  });

  test('applies the system theme and resolves to the OS preference', async ({ authedPage }) => {
    const sidebar = new SidebarPO(authedPage);
    await sidebar.navigateTo('settings');

    await authedPage.getByRole('button', { name: /^system$/i }).click();

    // `test.use({ colorScheme: 'light' })` above pins the system preference.
    // useThemeStore.getSystemPreference() returns 'light' when
    // matchMedia('(prefers-color-scheme: light)') matches, else 'dark'.
    await expect(authedPage.locator('html')).toHaveAttribute('data-mode', 'light');
  });

  test('persists the theme selection across reload', async ({ authedPage }) => {
    const sidebar = new SidebarPO(authedPage);
    await sidebar.navigateTo('settings');

    await authedPage.getByRole('button', { name: /^dark$/i }).click();
    await expect(authedPage.locator('html')).toHaveAttribute('data-mode', 'dark');

    // Sanity-check the store wrote the expected localStorage key before reload.
    const stored = await authedPage.evaluate(() => localStorage.getItem('du-theme'));
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored!)).toMatchObject({ mode: 'dark' });

    await authedPage.reload();

    // `addInitScript` only sets the auth token; it should not touch `du-theme`.
    await expect(authedPage.locator('html')).toHaveAttribute('data-mode', 'dark');
  });

  test('collapses and expands the sidebar', async ({ authedPage }) => {
    const main = authedPage.locator('main').first();

    // Default state: expanded → main has marginLeft of 220px.
    await expect(main).toHaveCSS('margin-left', '220px');

    // The collapse/expand button has a dynamic title. Match either.
    const toggle = authedPage.getByRole('button', { name: /collapse sidebar|expand sidebar/i });

    await toggle.click();
    await expect(main).toHaveCSS('margin-left', '60px');

    await toggle.click();
    await expect(main).toHaveCSS('margin-left', '220px');
  });

  test('opens and dismisses the chat panel', async ({ authedPage }) => {
    const main = authedPage.locator('main').first();

    // Closed state: marginRight is 0, and the floating open-chat button exists.
    await expect(main).toHaveCSS('margin-right', '0px');

    const openButton = authedPage.getByRole('button', { name: /open chat/i });
    await openButton.click();

    await expect(main).toHaveCSS('margin-right', '360px');
    // The floating open button disappears when the panel is open.
    await expect(openButton).toHaveCount(0);

    // Close via the chat panel's own close button.
    await authedPage.getByRole('button', { name: /close chat/i }).click();

    await expect(main).toHaveCSS('margin-right', '0px');
    await expect(authedPage.getByRole('button', { name: /open chat/i })).toBeVisible();
  });

  test('persists sidebar collapsed state across reload', async ({ authedPage }) => {
    const main = authedPage.locator('main').first();
    await expect(main).toHaveCSS('margin-left', '220px');

    const toggle = authedPage.getByRole('button', { name: /collapse sidebar|expand sidebar/i });
    await toggle.click();
    await expect(main).toHaveCSS('margin-left', '60px');

    // The layout-store uses zustand's persist middleware under key `layout-store`.
    const stored = await authedPage.evaluate(() => localStorage.getItem('layout-store'));
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!) as { state?: { sidebarCollapsed?: boolean } };
    expect(parsed.state?.sidebarCollapsed).toBe(true);

    await authedPage.reload();

    // If the store rehydrated correctly, <main> stays at 60px.
    await expect(authedPage.locator('main').first()).toHaveCSS('margin-left', '60px');

    // Restore default for any subsequent tests.
    await authedPage.getByRole('button', { name: /collapse sidebar|expand sidebar/i }).click();
    await expect(authedPage.locator('main').first()).toHaveCSS('margin-left', '220px');
  });

  test('music folder add is not exposed in the current settings UI', async ({ authedPage }) => {
    test.fixme(
      true,
      'SettingsPage.tsx does not currently render a music-folder input. ' +
        'Adding local music via Tauri also requires the native folder picker, ' +
        'which does not work in a browser-mode Playwright run.',
    );

    const sidebar = new SidebarPO(authedPage);
    await sidebar.navigateTo('settings');

    const settings = new SettingsPagePO(authedPage);
    await settings.setMusicFolder('C:/Music/Test');
    await settings.save();
  });
});
