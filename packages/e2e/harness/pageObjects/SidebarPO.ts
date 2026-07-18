/**
 * Page object for the primary app sidebar — navigation + collapse toggle.
 *
 * Locators prefer `data-testid` (once the desktop package adopts them) then
 * fall back to accessible role + name, which are stable against visual
 * tweaks. Text-fallback assumes the default English locale.
 */
import type { Page, Locator } from '@playwright/test';

export type SidebarNavItem = 'dashboard' | 'queue' | 'search' | 'library' | 'settings' | 'logs';

const NAV_LABELS: Record<SidebarNavItem, string> = {
  dashboard: 'Dashboard',
  queue: 'Queue',
  search: 'Search',
  library: 'Library',
  settings: 'Settings',
  logs: 'Logs',
};

export class SidebarPO {
  constructor(private readonly page: Page) {}

  readonly root = () => this.page.locator('[data-testid="app-sidebar"], aside, nav').first();
  readonly collapseToggle = () => this.page.getByRole('button', { name: /toggle sidebar|collapse sidebar/i });

  navItem(item: SidebarNavItem): Locator {
    const byTestId = this.page.locator(`[data-testid="sidebar-nav-${item}"]`);
    return byTestId.or(this.page.getByRole('link', { name: NAV_LABELS[item] }));
  }

  async navigateTo(item: SidebarNavItem): Promise<void> {
    await this.navItem(item).first().click();
  }

  async toggleCollapse(): Promise<void> {
    await this.collapseToggle().click();
  }

  async isCollapsed(): Promise<boolean> {
    const attr = await this.root().getAttribute('data-collapsed');
    if (attr !== null) return attr === 'true';
    // Heuristic fallback — check a CSS width.
    const box = await this.root().boundingBox();
    return !!box && box.width < 120;
  }
}
