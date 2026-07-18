/**
 * Playback controls E2E — drives the player bar through pause / resume / seek /
 * volume / loop / skip / previous / stop against a silent 30s local fixture
 * track. See `packages/e2e/README.md` for harness details.
 *
 * State is seeded once per file by the auto `resetState` worker fixture; tests
 * inside the describe run sequentially and share the same authed page + audio
 * element (Playwright fullyParallel=false, workers=1 in this project).
 */
import { test, expect, type Page } from '../harness/testFixtures';
import { PlayerBarPO, SearchPagePO, SidebarPO } from '../harness/pageObjects';
import { FIXTURE_TRACKS } from '../fixtures';

const SONG_1 = FIXTURE_TRACKS[0];
const SONG_2 = FIXTURE_TRACKS[1];

/**
 * Search results render a row with a hidden Play button that becomes visible
 * on hover. The shared `SearchPagePO.clickResult` clicks the title text which
 * does not trigger playback, so we drive the hover+click ourselves.
 */
async function playSearchResult(page: Page, title: string): Promise<void> {
  const row = page
    .locator('div')
    .filter({ hasText: title })
    .filter({
      has: page.getByRole('button', { name: /^play$/i }),
    })
    .last();
  await row.scrollIntoViewIfNeeded();
  await row.hover();
  await row.getByRole('button', { name: /^play$/i }).click();
}

/**
 * Queue a search result (the add-to-queue button has title="Add to queue").
 */
async function queueSearchResult(page: Page, title: string): Promise<void> {
  const row = page
    .locator('div')
    .filter({ hasText: title })
    .filter({
      has: page.getByRole('button', { name: /add to queue/i }),
    })
    .last();
  await row.scrollIntoViewIfNeeded();
  await row.hover();
  await row.getByRole('button', { name: /add to queue/i }).click();
}

/**
 * The volume UI is a div-based progress bar with an absolutely-positioned
 * invisible `<input type="range">` layered on top. Grab the range input
 * directly rather than relying on the accessible name (there is none).
 */
function volumeInput(page: Page) {
  return page.locator('input[type="range"]').first();
}

async function readVolume(page: Page): Promise<number> {
  const val = await volumeInput(page).inputValue();
  return Number(val);
}

/**
 * The seek bar is a custom div with mouse handlers, not an <input>. Click at
 * a fractional offset along its width to seek. Returns the approximate target
 * position in seconds assuming the active track duration.
 */
async function clickSeekBarAt(page: Page, fraction: number): Promise<void> {
  // Locate the seek bar: it sits inside the PlayerBar, has `flex-1` width and
  // a `cursor-pointer` class. The surrounding container holds the time spans.
  const bar = page.locator('div.cursor-pointer.rounded-full.bg-white\\/\\[0\\.08\\]').first();
  await bar.waitFor({ state: 'visible' });
  const box = await bar.boundingBox();
  if (!box) throw new Error('Seek bar not visible');
  const x = box.x + box.width * fraction;
  const y = box.y + box.height / 2;
  // PlayerBar uses mousedown+mouseup handlers to set the position — dispatch
  // both so `seek()` fires on mouseup.
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.up();
}

/** Read the left-hand time counter, e.g. "0:07" → 7 seconds. */
async function readPlayerPositionSeconds(page: Page): Promise<number> {
  // The current-position span sits immediately before the seek bar. It uses
  // tabular-nums; grab the first tabular-num span inside the player footer.
  const text = (await page.locator('span.tabular-nums').first().textContent())?.trim() ?? '0:00';
  const [m, s] = text.split(':').map((p) => Number(p));
  if (Number.isNaN(m) || Number.isNaN(s)) return 0;
  return m * 60 + s;
}

test.describe('playback controls', () => {
  let player: PlayerBarPO;
  let search: SearchPagePO;
  let sidebar: SidebarPO;

  test.beforeEach(async ({ authedPage }) => {
    player = new PlayerBarPO(authedPage);
    search = new SearchPagePO(authedPage);
    sidebar = new SidebarPO(authedPage);
  });

  test('can start playback of song-1', async ({ authedPage }) => {
    await sidebar.navigateTo('search');
    await expect(authedPage).toHaveURL(/\/search/);
    await search.search('test:song-1');

    // Fixture extractor returns song-1 immediately — wait for it to render.
    await expect(authedPage.getByText(SONG_1.title).first()).toBeVisible({
      timeout: 5_000,
    });

    await playSearchResult(authedPage, SONG_1.title);

    await expect.poll(() => player.isPlaying(), { timeout: 5_000, intervals: [200, 400, 800] }).toBe(true);
    await expect(player.trackTitle()).toHaveText(SONG_1.title);
  });

  test('pause halts playback', async () => {
    await player.pause();
    await expect.poll(() => player.isPlaying(), { timeout: 3_000 }).toBe(false);
  });

  test('resume continues playback', async () => {
    await player.play();
    await expect.poll(() => player.isPlaying(), { timeout: 3_000 }).toBe(true);
  });

  test('seek jumps to target position', async ({ authedPage }) => {
    // Song is 30s; aim for roughly 50% (~15s). Tolerance ±3s to absorb the
    // 1-Hz localPos ticker + silent-audio drift.
    await clickSeekBarAt(authedPage, 0.5);
    await expect
      .poll(() => readPlayerPositionSeconds(authedPage), {
        timeout: 4_000,
        intervals: [200, 400, 800],
      })
      .toBeGreaterThanOrEqual(12);
    const pos = await readPlayerPositionSeconds(authedPage);
    expect(pos).toBeLessThanOrEqual(20);
  });

  test('volume slider updates store value', async ({ authedPage }) => {
    // Use the PO helper which dispatches input/change on the range element.
    await player.setVolume(25);
    await expect.poll(() => readVolume(authedPage), { timeout: 3_000 }).toBe(25);

    await player.setVolume(75);
    await expect.poll(() => readVolume(authedPage), { timeout: 3_000 }).toBe(75);
  });

  test('loop toggle cycles off → track → queue → off', async () => {
    const loopBtn = player.loopButton();
    const readLoopState = async (): Promise<'off' | 'track' | 'queue'> => {
      // When loop !== 'off', the button gets inline `color: var(--accent)`.
      // We additionally distinguish track vs queue via the SVG icon: Repeat1
      // has an inner "1" path while Repeat does not.
      const style = (await loopBtn.getAttribute('style')) ?? '';
      const active = /var\(--accent\)/.test(style);
      if (!active) return 'off';
      // Lucide's Repeat1 icon includes a <path d="M11 10h1v4"> segment that
      // the plain Repeat icon does not.
      const hasOne = await loopBtn.locator('path[d*="M11 10h1v4"], path[d*="M11 10"]').count();
      return hasOne > 0 ? 'track' : 'queue';
    };

    // Ensure we begin at 'off'. If a previous test left loop on, reset by
    // cycling up to 3 times.
    for (let i = 0; i < 3 && (await readLoopState()) !== 'off'; i++) {
      await loopBtn.click();
    }
    expect(await readLoopState()).toBe('off');

    await loopBtn.click();
    await expect.poll(() => readLoopState(), { timeout: 2_000 }).toBe('track');

    await loopBtn.click();
    await expect.poll(() => readLoopState(), { timeout: 2_000 }).toBe('queue');

    await loopBtn.click();
    await expect.poll(() => readLoopState(), { timeout: 2_000 }).toBe('off');
  });

  test('skip advances to the queued song-2', async ({ authedPage }) => {
    // Queue song-2 first. Navigate back to search and use the Add-to-queue
    // button.
    await sidebar.navigateTo('search');
    await search.search('test:song-2');
    await expect(authedPage.getByText(SONG_2.title).first()).toBeVisible({
      timeout: 5_000,
    });
    await queueSearchResult(authedPage, SONG_2.title);

    await player.skip();

    await expect(player.trackTitle()).toHaveText(SONG_2.title, { timeout: 5_000 });
    await expect.poll(() => player.isPlaying(), { timeout: 5_000 }).toBe(true);
  });

  test('previous returns to song-1', async () => {
    await player.prev();
    await expect(player.trackTitle()).toHaveText(SONG_1.title, { timeout: 5_000 });
    await expect.poll(() => player.isPlaying(), { timeout: 5_000 }).toBe(true);
  });

  test.fixme('stop clears the current track', async () => {
    // PlayerBar.tsx does not render a dedicated stop button — the UI only
    // exposes pause / play / skip / prev / loop / shuffle. The `stop()`
    // action exists on the store but is not wired to a control in the
    // player bar, so this behavior cannot be exercised from the UI.
  });
});
