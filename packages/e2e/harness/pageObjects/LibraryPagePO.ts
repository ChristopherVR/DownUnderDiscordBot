/**
 * Page object for the Library page - list of playlists, create-playlist
 * action, and open-playlist navigation.
 */
import type { Page, Locator } from '@playwright/test';

export class LibraryPagePO {
  constructor(private readonly page: Page) {}

  readonly root = () => this.page.locator('[data-testid="library-page"]').first();

  readonly playlistCards = (): Locator =>
    this.page.locator('[data-testid="playlist-card"], [data-testid^="playlist-card-"]');

  readonly newPlaylistButton = () =>
    this.page
      .locator('[data-testid="library-new-playlist"]')
      .or(this.page.getByRole('button', { name: /(new|create) playlist/i }));

  readonly nameInput = () =>
    this.page
      .locator('[data-testid="playlist-name-input"]')
      .or(this.page.getByPlaceholder(/playlist name/i))
      .or(this.page.getByLabel(/name/i).first());

  readonly confirmCreate = () =>
    this.page
      .locator('[data-testid="playlist-create-confirm"]')
      .or(this.page.getByRole('button', { name: /^create$/i }));

  cardByName(name: string): Locator {
    return this.playlistCards().filter({ hasText: name }).first();
  }

  async openPlaylist(name: string): Promise<void> {
    await this.cardByName(name).click();
  }

  async createPlaylist(name: string): Promise<void> {
    await this.newPlaylistButton().click();
    await this.nameInput().fill(name);
    await this.confirmCreate().click();
  }

  async getPlaylistNames(): Promise<string[]> {
    const cards = this.playlistCards();
    const n = await cards.count();
    const out: string[] = [];
    for (let i = 0; i < n; i++) {
      const t = (await cards.nth(i).textContent())?.trim();
      if (t) out.push(t);
    }
    return out;
  }
}
