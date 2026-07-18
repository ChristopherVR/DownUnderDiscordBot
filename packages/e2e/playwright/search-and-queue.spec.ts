/**
 * End-to-end scenario covering the search → play → queue flow.
 *
 * The tests within this file are ordered and share state intentionally.
 * The `resetState` auto worker-fixture runs once per file, so each test
 * below builds on the UI state left behind by the previous one.
 *
 * Default playback mode is `local` (see `useBotStore` defaults), so no
 * voice channel is required and playback uses an `HTMLAudioElement`
 * backed by the bot's silent-WAV fixture stream.
 */
import { test, expect, type Page } from '../harness/testFixtures';
import { FIXTURE_TRACKS } from '../fixtures';
import { SidebarPO, SearchPagePO, QueuePagePO } from '../harness/pageObjects';

const [SONG_1, SONG_2] = FIXTURE_TRACKS;

/**
 * A result row in the Search UI is rendered as a div without a
 * `data-testid`. Locate it via the track title text - each fixture track
 * has a unique title ("Test Song 1", "Test Song 2", ...).
 */
function searchResultRow(page: Page, title: string) {
  return page
    .locator('div')
    .filter({ hasText: title })
    .filter({
      has: page.locator('button[title="Play"]'),
    })
    .first();
}

/** The PlayerBar track-title paragraph sits within the left track-info area. */
function playerBarTitle(page: Page) {
  // The PlayerBar lives in a fixed bottom div; the first `<p>` that
  // shows track title is the 13px font-semibold one.
  return page.locator('.fixed.bottom-0 p.text-\\[13px\\]').first();
}

test.describe('search and queue', () => {
  test('1. Search returns a fixture result for "test:song-1"', async ({ authedPage }) => {
    const sidebar = new SidebarPO(authedPage);
    const searchPage = new SearchPagePO(authedPage);

    await sidebar.navigateTo('search');
    await expect(authedPage).toHaveURL(/\/search/);

    await searchPage.enterQuery(`test:${SONG_1.id}`);
    await searchPage.submit();

    // The row for Test Song 1 should become visible.
    const row = searchResultRow(authedPage, SONG_1.title);
    await expect(row).toBeVisible({ timeout: 10_000 });
    await expect(row).toContainText(SONG_1.title);
  });

  test('2. Free-text search surfaces a fixture track', async ({ authedPage }) => {
    const sidebar = new SidebarPO(authedPage);
    const searchPage = new SearchPagePO(authedPage);

    // The `authedPage` fixture navigates fresh to the dashboard for every
    // test, so despite this file's shared-state design, each test still
    // needs its own navigation to the page it actually exercises.
    await sidebar.navigateTo('search');
    await searchPage.enterQuery('Test Song');
    await searchPage.submit();

    // The FixtureExtractor returns one track per query (first fuzzy-match).
    // Require at least one fixture title to be visible.
    const anyResult = authedPage.getByText(/Test Song \d/).first();
    await expect(anyResult).toBeVisible({ timeout: 10_000 });
  });

  // Tests 3+4 and 5+6 are each a single test rather than split across the
  // file's usual one-test-per-scenario style: `player.currentTrack` and the
  // local queue are ephemeral client-side (zustand) state for `local`
  // playback mode - the bot server has no independent record of them. The
  // `authedPage` fixture does a fresh `page.goto()` for every test, which
  // wipes that state, so a later test can never observe an earlier test's
  // local-mode playback/queue side effects. Splitting these would just
  // reintroduce that same false assumption.
  test('3+4. Clicking Play on a result starts playback, and the queue page reflects it', async ({ authedPage }) => {
    const sidebar = new SidebarPO(authedPage);
    const searchPage = new SearchPagePO(authedPage);

    await sidebar.navigateTo('search');
    await searchPage.enterQuery(`test:${SONG_1.id}`);
    await searchPage.submit();
    const row = searchResultRow(authedPage, SONG_1.title);
    await expect(row).toBeVisible({ timeout: 10_000 });

    // Hover to reveal the per-row action buttons, then click Play.
    await row.hover();
    await row.locator('button[title="Play"]').click();

    // PlayerBar should show the title within a couple of seconds.
    const title = playerBarTitle(authedPage);
    await expect(title).toHaveText(SONG_1.title, { timeout: 5_000 });

    // Poll Zustand state via React - fall back to audio element state.
    // In local mode clicking Play sets `player.isPlaying=true` synchronously
    // (after mediaEl.play() resolves). Assert that the on-screen pause icon
    // is rendered: the main transport button swaps Play→Pause when playing.
    await expect
      .poll(
        async () => {
          // The big round transport button contains either a Play or Pause
          // svg. The Pause icon from lucide has `<rect>` children, Play uses
          // a triangular `<polygon>`. Check for the `Pause` lucide class on
          // any svg in the player bar transport.
          return await authedPage.evaluate(() => {
            const playerBar = document.querySelector('.fixed.bottom-0') as HTMLElement | null;
            if (!playerBar) return 'no-playerbar';
            // The transport (center) play/pause button is the round 9x9 one.
            const transportBtn = playerBar.querySelector('button.h-9.w-9') as HTMLButtonElement | null;
            const svg = transportBtn?.querySelector('svg');
            if (!svg) return 'no-svg';
            const cls = svg.getAttribute('class') ?? '';
            return cls.includes('lucide-pause') ? 'playing' : 'paused';
          });
        },
        { timeout: 5_000, message: 'Player bar did not reflect an `isPlaying` state' },
      )
      .toBe('playing');

    // Same page instance, so the client-side state survives this navigation
    // (unlike a fresh `authedPage` in a separate test).
    await sidebar.navigateTo('queue');
    await expect(authedPage).toHaveURL(/\/queue/);

    // In local mode, the currently playing track renders inside the
    // "Now Playing" card above the queue list. Assert the title is visible.
    await expect(authedPage.getByText(SONG_1.title).first()).toBeVisible({
      timeout: 5_000,
    });
  });

  test('5+6. Adding a second track shows up in the queue, then removing it shrinks the queue', async ({
    authedPage,
  }) => {
    const sidebar = new SidebarPO(authedPage);
    const searchPage = new SearchPagePO(authedPage);
    const queuePage = new QueuePagePO(authedPage);

    await sidebar.navigateTo('search');
    await searchPage.enterQuery(`test:${SONG_2.id}`);
    await searchPage.submit();

    const row = searchResultRow(authedPage, SONG_2.title);
    await expect(row).toBeVisible({ timeout: 10_000 });

    // The per-row "Add to queue" action button has `title="Add to queue"`.
    await row.hover();
    await row.locator('button[title="Add to queue"]').click();

    // Navigate to the queue page and confirm song-2 is listed. song-1 may
    // still be the currently playing track (shown in "Now Playing"); song-2
    // should appear in the queue list proper.
    await sidebar.navigateTo('queue');
    await expect(authedPage).toHaveURL(/\/queue/);

    await expect(authedPage.getByText(SONG_2.title).first()).toBeVisible({
      timeout: 5_000,
    });

    // And that the queue now has at least one item. Poll rather than a bare
    // synchronous count(): the queue-item testid can commit a moment after
    // the title text becomes visible (which itself retries), so an immediate
    // count() right after can still race and read 0.
    await expect.poll(async () => queuePage.count(), { timeout: 5_000 }).toBeGreaterThan(0);
    const before = await queuePage.count();

    // Hover the row so the remove button becomes visible, then click.
    const firstItem = queuePage.queueItems().first();
    // Fall back: if `queueItems()` testid-based locator matches nothing,
    // use a generic filter by Test Song text.
    const maybeTestItem = authedPage.getByText(/Test Song \d/).last();
    const target = (await firstItem.count()) > 0 ? firstItem : maybeTestItem;

    await target.scrollIntoViewIfNeeded();
    await target.hover();
    // The remove button is a trash icon inside the row.
    const removeBtn = target
      .locator('button')
      .filter({
        has: authedPage.locator('svg.lucide-trash-2, svg.lucide-trash, [data-testid="queue-remove"]'),
      })
      .first();
    await removeBtn.click();

    await expect.poll(async () => queuePage.count(), { timeout: 5_000 }).toBeLessThan(before);
  });

  test('7. Clear queue empties the list', async ({ authedPage }) => {
    const sidebar = new SidebarPO(authedPage);
    const queuePage = new QueuePagePO(authedPage);

    // Fresh page load per test (see test 2) - navigate back to the queue first.
    await sidebar.navigateTo('queue');

    // Ensure there is at least something to clear - add a track back.
    const beforeClear = await queuePage.count();
    if (beforeClear === 0) {
      const searchPage = new SearchPagePO(authedPage);
      await sidebar.navigateTo('search');
      await searchPage.enterQuery(`test:${SONG_2.id}`);
      await searchPage.submit();
      const row = searchResultRow(authedPage, SONG_2.title);
      await expect(row).toBeVisible({ timeout: 10_000 });
      await row.hover();
      await row.locator('button[title="Add to queue"]').click();
      await sidebar.navigateTo('queue');
    }

    // The Clear button is always present on the queue page header; it is
    // only disabled when the queue is empty.
    await queuePage.clear();

    await expect.poll(async () => queuePage.count(), { timeout: 5_000 }).toBe(0);
  });

  test('8. Empty / non-matching search shows a no-results state', async ({ authedPage }) => {
    const sidebar = new SidebarPO(authedPage);
    const searchPage = new SearchPagePO(authedPage);

    await sidebar.navigateTo('search');
    await searchPage.enterQuery('xxxxxxxxxnomatch');
    await searchPage.submit();

    // The SearchPage renders "No results found" when `results.length === 0`
    // and a query is present. Allow either the explicit text or the absence
    // of any fixture-track title.
    const noResults = authedPage.getByText(/no results/i).first();
    await expect(noResults).toBeVisible({ timeout: 10_000 });

    // Sanity: none of the fixture tracks should be in the DOM as results.
    for (const t of FIXTURE_TRACKS) {
      await expect(searchResultRow(authedPage, t.title)).toHaveCount(0);
    }
  });
});
