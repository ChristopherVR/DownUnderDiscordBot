/**
 * Page object for the transient toast notifications surfaced by the app.
 * Covers reading the latest toast's text and waiting for one to appear.
 */
import type { Page, Locator } from '@playwright/test';

export class ToastPO {
  constructor(private readonly page: Page) {}

  readonly container = () => this.page.locator('[data-testid="toast-container"]').or(this.page.getByRole('status'));

  readonly toasts = (): Locator => this.page.locator('[data-testid="toast"], [data-testid^="toast-"], [role="alert"]');

  async latestText(): Promise<string> {
    const toasts = this.toasts();
    const n = await toasts.count();
    if (n === 0) return '';
    return (await toasts.nth(n - 1).textContent())?.trim() ?? '';
  }

  async waitForText(pattern: string | RegExp, timeout = 5_000): Promise<void> {
    await this.toasts()
      .filter({ hasText: typeof pattern === 'string' ? pattern : pattern })
      .first()
      .waitFor({ state: 'visible', timeout });
  }

  async waitForAny(timeout = 5_000): Promise<void> {
    await this.toasts().first().waitFor({ state: 'visible', timeout });
  }
}
