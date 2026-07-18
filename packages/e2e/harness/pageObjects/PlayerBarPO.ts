/**
 * Page object for the persistent player bar at the bottom of the app.
 *
 * Surfaces the transport controls (play/pause/skip/prev), seek slider, volume
 * slider, loop toggle and the currently-playing track metadata.
 */
import type { Page, Locator } from '@playwright/test';

export class PlayerBarPO {
  constructor(private readonly page: Page) {}

  readonly root = () => this.page.locator('[data-testid="player-bar"]').or(this.page.locator('footer')).first();

  // Play/pause is a single combined toggle button (data-testid="player-play"
  // in both states) — its aria-label flips between "Play"/"Pause" rather
  // than there being two separate elements.
  readonly playButton = () =>
    this.page.locator('[data-testid="player-play"]').or(this.page.getByRole('button', { name: /^play$/i }));

  readonly pauseButton = () =>
    this.page.locator('[data-testid="player-play"]').or(this.page.getByRole('button', { name: /^pause$/i }));

  readonly skipButton = () =>
    this.page.locator('[data-testid="player-skip"]').or(this.page.getByRole('button', { name: /next|skip/i }));

  readonly prevButton = () =>
    this.page.locator('[data-testid="player-prev"]').or(this.page.getByRole('button', { name: /previous|prev/i }));

  readonly loopButton = () =>
    this.page.locator('[data-testid="player-loop"]').or(this.page.getByRole('button', { name: /loop|repeat/i }));

  readonly shuffleButton = () =>
    this.page.locator('[data-testid="player-shuffle"]').or(this.page.getByRole('button', { name: /shuffle/i }));

  readonly seekSlider = (): Locator =>
    this.page
      .locator('[data-testid="player-seek"]')
      .or(this.page.getByRole('slider', { name: /seek|progress/i }))
      .first();

  readonly volumeSlider = (): Locator =>
    this.page
      .locator('[data-testid="player-volume"]')
      .or(this.page.getByRole('slider', { name: /volume/i }))
      .first();

  readonly trackTitle = () => this.page.locator('[data-testid="player-track-title"]').first();

  readonly trackArtist = () => this.page.locator('[data-testid="player-track-artist"]').first();

  async play(): Promise<void> {
    await this.playButton().click();
  }

  async pause(): Promise<void> {
    await this.pauseButton().click();
  }

  async skip(): Promise<void> {
    await this.skipButton().click();
  }

  async prev(): Promise<void> {
    await this.prevButton().click();
  }

  async toggleLoop(): Promise<void> {
    await this.loopButton().click();
  }

  async setVolume(percent: number): Promise<void> {
    const slider = this.volumeSlider();
    await slider.focus();
    // Numeric keyboard step: set via keyboard arrow navigation is UI-specific,
    // so fall back to `.fill()` if available or `evaluate`.
    const value = Math.max(0, Math.min(100, Math.round(percent)));
    await slider.evaluate((el, v) => {
      const input = el as HTMLInputElement;
      if ('value' in input) {
        input.value = String(v);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, value);
  }

  async getTrackTitle(): Promise<string> {
    return (await this.trackTitle().textContent())?.trim() ?? '';
  }

  async isPlaying(): Promise<boolean> {
    // The play/pause control is one combined toggle button whose aria-label
    // flips between "Play" and "Pause" — it's always visible, so visibility
    // can't distinguish state; the label can.
    const label = await this.playButton()
      .getAttribute('aria-label')
      .catch(() => null);
    if (label) return /pause/i.test(label);
    // Fallback for a two-element implementation, if this ever changes back.
    return this.pauseButton()
      .isVisible()
      .catch(() => false);
  }
}
