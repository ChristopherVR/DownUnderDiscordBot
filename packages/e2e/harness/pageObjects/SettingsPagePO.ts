/**
 * Page object for the Settings page — theme selector and music-folder config
 * are the two areas E2E tests touch.
 */
import type { Page } from '@playwright/test';

export type ThemeOption = 'light' | 'dark' | 'system';

export class SettingsPagePO {
  constructor(private readonly page: Page) {}

  readonly root = () => this.page.locator('[data-testid="settings-page"]').first();

  readonly themeSelect = () =>
    this.page.locator('[data-testid="settings-theme"]').or(this.page.getByLabel(/theme/i)).first();

  readonly musicFolderInput = () =>
    this.page
      .locator('[data-testid="settings-music-folder"]')
      .or(this.page.getByLabel(/music folder|folder path/i))
      .first();

  readonly saveButton = () =>
    this.page.locator('[data-testid="settings-save"]').or(this.page.getByRole('button', { name: /^save|apply$/i }));

  async setTheme(theme: ThemeOption): Promise<void> {
    const container = this.themeSelect();
    // Try <select>-style first (in case a future implementation uses one),
    // then fall back to the real ThemeSelector.tsx UI: a button grid with no
    // select/listbox semantics — click the button labelled "Light"/"Dark"/"System".
    const tag = await container.evaluate((el) => el.tagName.toLowerCase()).catch(() => 'unknown');
    if (tag === 'select') {
      await container.selectOption(theme);
    } else {
      await container.getByRole('button', { name: new RegExp(`^${theme}$`, 'i') }).click();
    }
  }

  async getTheme(): Promise<string> {
    const container = this.themeSelect();
    const value = await container.inputValue().catch(() => null);
    if (value) return value;
    // Button-grid UI: the active mode button has no ARIA "selected" state,
    // so match ThemeSelector.tsx's own convention for the active button.
    for (const theme of ['light', 'dark', 'system'] as const) {
      const button = container.getByRole('button', { name: new RegExp(`^${theme}$`, 'i') });
      const className = await button.getAttribute('class').catch(() => null);
      if (className?.includes('border-[var(--accent)]/40')) return theme;
    }
    return '';
  }

  async setMusicFolder(path: string): Promise<void> {
    await this.musicFolderInput().fill(path);
  }

  async save(): Promise<void> {
    const btn = this.saveButton();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click();
    }
  }
}
