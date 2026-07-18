/**
 * Page object for the voice-channel picker modal. Shown when the user
 * triggers playback while in Discord (remote) playback mode.
 */
import type { Page, Locator } from '@playwright/test';

export class VoiceChannelModalPO {
  constructor(private readonly page: Page) {}

  readonly dialog = () =>
    this.page
      .locator('[data-testid="voice-channel-modal"]')
      .or(this.page.getByRole('dialog', { name: /voice channel/i }))
      .first();

  readonly channelItems = (): Locator =>
    this.page.locator('[data-testid="voice-channel-item"], [data-testid^="voice-channel-"]');

  readonly closeButton = () =>
    this.page
      .locator('[data-testid="voice-channel-modal-close"]')
      .or(this.dialog().getByRole('button', { name: /close|cancel/i }));

  async waitForVisible(): Promise<void> {
    await this.dialog().waitFor({ state: 'visible' });
  }

  async getChannelNames(): Promise<string[]> {
    await this.waitForVisible();
    const items = this.channelItems();
    const n = await items.count();
    const out: string[] = [];
    for (let i = 0; i < n; i++) {
      const t = (await items.nth(i).textContent())?.trim();
      if (t) out.push(t);
    }
    return out;
  }

  channelByName(name: string): Locator {
    return this.channelItems().filter({ hasText: name }).first();
  }

  async selectChannel(name: string): Promise<void> {
    await this.channelByName(name).click();
  }

  async close(): Promise<void> {
    await this.closeButton().click();
  }
}
