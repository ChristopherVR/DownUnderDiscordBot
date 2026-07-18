/**
 * Page object for the Search page - query input, result list, and result-row
 * interactions (play / add to queue / add to playlist).
 */
import type { Page, Locator } from '@playwright/test';

export class SearchPagePO {
  constructor(private readonly page: Page) {}

  readonly queryInput = () =>
    this.page
      .locator('[data-testid="search-input"]')
      .or(this.page.getByRole('searchbox'))
      .or(this.page.getByPlaceholder(/search/i))
      .first();

  readonly submitButton = () =>
    this.page.locator('[data-testid="search-submit"]').or(this.page.getByRole('button', { name: /^search$/i }));

  readonly resultList = () => this.page.locator('[data-testid="search-results"]').first();

  readonly resultRows = (): Locator =>
    this.page.locator('[data-testid="search-result-row"], [data-testid^="search-result-"]');

  async enterQuery(query: string): Promise<void> {
    const input = this.queryInput();
    await input.fill(query);
  }

  async submit(): Promise<void> {
    const btn = this.submitButton();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click();
    } else {
      await this.queryInput().press('Enter');
    }
  }

  async search(query: string): Promise<void> {
    await this.enterQuery(query);
    await this.submit();
  }

  resultByTitle(title: string): Locator {
    return this.page.getByText(title, { exact: false }).first();
  }

  async clickResult(title: string): Promise<void> {
    await this.resultByTitle(title).click();
  }

  async getResultTitles(): Promise<string[]> {
    const rows = this.resultRows();
    const count = await rows.count();
    const titles: string[] = [];
    for (let i = 0; i < count; i++) {
      const t = (await rows.nth(i).textContent())?.trim();
      if (t) titles.push(t);
    }
    return titles;
  }
}
