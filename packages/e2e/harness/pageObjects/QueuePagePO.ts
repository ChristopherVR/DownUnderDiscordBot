/**
 * Page object for the Queue page - inspect tracks, remove a track,
 * shuffle and clear the queue.
 */
import type { Page, Locator } from '@playwright/test';

export class QueuePagePO {
  constructor(private readonly page: Page) {}

  readonly root = () => this.page.locator('[data-testid="queue-page"]').first();

  readonly queueItems = (): Locator => this.page.locator('[data-testid="queue-item"], [data-testid^="queue-item-"]');

  readonly shuffleButton = () =>
    this.page.locator('[data-testid="queue-shuffle"]').or(this.page.getByRole('button', { name: /shuffle/i }));

  readonly clearButton = () =>
    this.page.locator('[data-testid="queue-clear"]').or(this.page.getByRole('button', { name: /^clear( queue)?$/i }));

  async count(): Promise<number> {
    return this.queueItems().count();
  }

  async getTitles(): Promise<string[]> {
    const items = this.queueItems();
    const n = await items.count();
    const out: string[] = [];
    for (let i = 0; i < n; i++) {
      const t = (await items.nth(i).textContent())?.trim();
      if (t) out.push(t);
    }
    return out;
  }

  itemByTitle(title: string): Locator {
    return this.queueItems().filter({ hasText: title }).first();
  }

  async removeItem(title: string): Promise<void> {
    const item = this.itemByTitle(title);
    const removeBtn = item
      .locator('[data-testid="queue-remove"]')
      .or(item.getByRole('button', { name: /remove|delete/i }));
    await removeBtn.click();
  }

  async shuffle(): Promise<void> {
    await this.shuffleButton().click();
  }

  async clear(): Promise<void> {
    await this.clearButton().click();
  }
}
