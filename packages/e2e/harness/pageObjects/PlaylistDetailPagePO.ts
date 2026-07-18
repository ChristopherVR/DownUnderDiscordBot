/**
 * Page object for the Playlist detail page - track list, add / remove tracks,
 * and play-playlist action.
 */
import type { Page, Locator } from '@playwright/test';

export class PlaylistDetailPagePO {
  constructor(private readonly page: Page) {}

  readonly root = () => this.page.locator('[data-testid="playlist-detail-page"]').first();

  readonly title = () => this.page.locator('[data-testid="playlist-title"]').or(this.page.getByRole('heading')).first();

  readonly trackRows = (): Locator =>
    this.page.locator('[data-testid="playlist-track"], [data-testid^="playlist-track-"]');

  readonly playButton = () =>
    this.page
      .locator('[data-testid="playlist-play"]')
      .or(this.page.getByRole('button', { name: /play playlist|^play$/i }).first());

  readonly addTrackButton = () =>
    this.page.locator('[data-testid="playlist-add-track"]').or(this.page.getByRole('button', { name: /add track/i }));

  trackByTitle(title: string): Locator {
    return this.trackRows().filter({ hasText: title }).first();
  }

  async playAll(): Promise<void> {
    await this.playButton().click();
  }

  async removeTrack(title: string): Promise<void> {
    const row = this.trackByTitle(title);
    const btn = row.locator('[data-testid="playlist-track-remove"]').or(row.getByRole('button', { name: /remove/i }));
    await btn.click();
  }

  async addTrack(query: string): Promise<void> {
    await this.addTrackButton().click();
    // Assume the add-track dialog reuses the search-input testid pattern.
    const input = this.page
      .locator('[data-testid="playlist-add-track-input"]')
      .or(this.page.getByPlaceholder(/search.*add|add.*track/i));
    await input.fill(query);
    await input.press('Enter');
    // Submitting the query only searches - it doesn't add anything. The
    // first matching result still needs its own "add to playlist" button
    // clicked to actually add the track.
    const firstResultAddButton = this.page.locator('[data-testid="playlist-add-track-result"]').first();
    await firstResultAddButton.waitFor({ state: 'visible' });
    await firstResultAddButton.click();
  }

  async getTrackTitles(): Promise<string[]> {
    const rows = this.trackRows();
    const n = await rows.count();
    const out: string[] = [];
    for (let i = 0; i < n; i++) {
      const t = (await rows.nth(i).textContent())?.trim();
      if (t) out.push(t);
    }
    return out;
  }
}
