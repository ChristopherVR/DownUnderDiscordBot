/**
 * Page object for the Settings page — theme selector and music-folder config
 * are the two areas E2E tests touch.
 */
import type { Page } from '@playwright/test';

export type ThemeOption = 'light' | 'dark' | 'system' | 'amoled';

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
    const select = this.themeSelect();
    // Try <select>-style first, then fall back to clicking a labelled option.
    const tag = await select.evaluate((el) => el.tagName.toLowerCase()).catch(() => 'unknown');
    if (tag === 'select') {
      await select.selectOption(theme);
    } else {
      await select.click();
      await this.page.getByRole('option', { name: new RegExp(theme, 'i') }).click();
    }
  }

  async getTheme(): Promise<string> {
    const select = this.themeSelect();
    return (await select.inputValue().catch(() => null)) ?? (await select.textContent()) ?? '';
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
