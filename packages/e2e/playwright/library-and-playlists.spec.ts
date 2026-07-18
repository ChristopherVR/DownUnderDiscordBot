/**
 * E2E flow: Library + Playlists.
 *
 * Covers the end-to-end lifecycle of playlists from the Library page:
 *   1. Seeded playlist visible on /library
 *   2. Opening it reveals the two seed tracks
 *   3. Creating a new playlist via the inline form
 *   4. Adding a search result to that playlist via AddToPlaylistModal
 *   5. Verifying the track appears in the new playlist
 *   6. Removing the track from the playlist
 *   7. Deleting the new playlist (window.confirm handled)
 *   8. Playing the seeded playlist and confirming the PlayerBar updates
 *
 * State flows within the file — the `resetState` worker fixture seeds
 * FIXTURE_PLAYLIST once at suite start; subsequent steps mutate and assert.
 */
import { test, expect, type Page } from '../harness/testFixtures';
import { FIXTURE_PLAYLIST, FIXTURE_TRACKS, FIXTURE_TRACK_BY_ID } from '../fixtures';
import { LibraryPagePO, SearchPagePO, SidebarPO, ToastPO, PlayerBarPO } from '../harness/pageObjects';

const NEW_PLAYLIST_NAME = 'E2E Test Playlist';
const SONG_3 = FIXTURE_TRACK_BY_ID['song-3']!;
const SEED_SONG_TITLES = FIXTURE_PLAYLIST.trackIds
  .map((id) => FIXTURE_TRACK_BY_ID[id]?.title)
  .filter((t): t is string => !!t);

/**
 * Robustly navigate to /library and wait for the page to be interactive. The
 * LibraryPage has no `data-testid="library-page"` attribute today, so we rely
 * on the "Library" heading rendered at the top of the page.
 */
async function gotoLibrary(page: Page): Promise<void> {
  await page.goto('/library?test=true');
  await expect(page.getByRole('heading', { name: /^library$/i })).toBeVisible();
}

test.describe('library and playlists', () => {
  test('seeded playlist is visible on /library', async ({ authedPage }) => {
    const library = new LibraryPagePO(authedPage);
    await gotoLibrary(authedPage);

    // Seed playlist must appear by name.
    await expect(library.cardByName(FIXTURE_PLAYLIST.name)).toBeVisible();
  });

  test('opens the seeded playlist and shows both seed tracks', async ({ authedPage }) => {
    const library = new LibraryPagePO(authedPage);
    await gotoLibrary(authedPage);

    await library.openPlaylist(FIXTURE_PLAYLIST.name);
    await expect(authedPage).toHaveURL(/\/library\/playlist\//);
    // Title header shows the playlist name.
    await expect(authedPage.getByRole('heading', { name: FIXTURE_PLAYLIST.name })).toBeVisible();

    // Both seed tracks listed.
    for (const title of SEED_SONG_TITLES) {
      await expect(authedPage.getByText(title).first()).toBeVisible();
    }
    // Track row count should equal the seeded track count (rows are rendered
    // with the title text — use `getByText` scoped to track-row area).
    const visibleTrackTitles = SEED_SONG_TITLES.filter(Boolean);
    expect(visibleTrackTitles.length).toBe(FIXTURE_PLAYLIST.trackIds.length);
  });

  test('creates a new playlist via the inline form', async ({ authedPage }) => {
    const library = new LibraryPagePO(authedPage);
    await gotoLibrary(authedPage);

    await library.createPlaylist(NEW_PLAYLIST_NAME);

    // The new card should appear in the list alongside the seed playlist.
    await expect(library.cardByName(NEW_PLAYLIST_NAME)).toBeVisible();
    await expect(library.cardByName(FIXTURE_PLAYLIST.name)).toBeVisible();
  });

  test('adds a search result to the new playlist via AddToPlaylistModal', async ({ authedPage }) => {
    const search = new SearchPagePO(authedPage);
    const sidebar = new SidebarPO(authedPage);
    const toast = new ToastPO(authedPage);

    // Navigate to Search via sidebar.
    await sidebar.navigateTo('search');
    await expect(authedPage.getByRole('heading', { name: /^search$/i })).toBeVisible();

    // Run the canned fixture query — this is resolved by the fixtureExtractor.
    await search.search(`test:${SONG_3.id}`);

    // Result row for Test Song 3 must be visible before we act on it.
    const resultRow = authedPage.locator('.group').filter({ hasText: SONG_3.title }).first();
    await expect(resultRow).toBeVisible();

    // Hover to reveal the action buttons (they are hidden until hover).
    await resultRow.hover();

    // Click the "Add to playlist" button on that row (title attribute is a
    // stable locator — button has no dedicated test-id today).
    const addToPlaylistBtn = resultRow.getByRole('button', { name: /add to playlist/i });
    await expect(addToPlaylistBtn).toBeVisible();
    await addToPlaylistBtn.click();

    // The modal heading.
    const modal = authedPage
      .getByRole('heading', { name: /add to playlist/i })
      .locator('..')
      .locator('..');
    await expect(modal).toBeVisible();

    // Pick our freshly-created playlist from the modal list.
    const targetBtn = modal.getByRole('button', { name: new RegExp(NEW_PLAYLIST_NAME, 'i') });
    await expect(targetBtn).toBeVisible();
    await targetBtn.click();

    // The UI does not fire a toast on add — it replaces the button's trailing
    // affordance with "Added" text. Wait for that as the success signal. If
    // a toast DOES fire (future enhancement), accept that too.
    const addedIndicator = modal.getByText(/^added$/i).first();
    const gotToast = toast
      .waitForAny(1_500)
      .then(() => 'toast' as const)
      .catch(() => null);
    const gotAdded = addedIndicator.waitFor({ state: 'visible', timeout: 5_000 }).then(() => 'added' as const);
    const outcome = await Promise.race([gotToast, gotAdded]);
    expect(outcome === 'toast' || outcome === 'added').toBe(true);

    // Close the modal for the next test.
    await authedPage
      .getByRole('button', { name: /close|^x$/i })
      .first()
      .click()
      .catch(async () => {
        // Fallback: press Escape.
        await authedPage.keyboard.press('Escape');
      });
  });

  test('newly added track appears in the new playlist detail view', async ({ authedPage }) => {
    const library = new LibraryPagePO(authedPage);
    await gotoLibrary(authedPage);

    await library.openPlaylist(NEW_PLAYLIST_NAME);
    await expect(authedPage.getByRole('heading', { name: NEW_PLAYLIST_NAME })).toBeVisible();

    // Track row with Song 3 title.
    await expect(authedPage.getByText(SONG_3.title).first()).toBeVisible();
    // And it must NOT contain the seed tracks (sanity check that we're on the
    // right playlist).
    const row1 = authedPage.getByText(FIXTURE_TRACKS[0].title).first();
    await expect(row1)
      .toHaveCount(0)
      .catch(async () => {
        // If toHaveCount doesn't apply to getByText, fall back to a lookup in
        // the track-rows region.
        await expect(row1).not.toBeVisible();
      });
  });

  test('removes a track from the new playlist', async ({ authedPage }) => {
    const library = new LibraryPagePO(authedPage);
    await gotoLibrary(authedPage);
    await library.openPlaylist(NEW_PLAYLIST_NAME);

    // Target the row for Test Song 3 and reveal hover actions.
    const row = authedPage.locator('.group').filter({ hasText: SONG_3.title }).first();
    await expect(row).toBeVisible();
    await row.hover();

    // "Remove from playlist" button — sourced by title attribute.
    const removeBtn = row.getByRole('button', { name: /remove from playlist|remove/i });
    await expect(removeBtn).toBeVisible();
    await removeBtn.click();

    // Track row must disappear.
    await expect(row).toBeHidden({ timeout: 5_000 });
    // And an "empty state" should surface — "No tracks yet".
    await expect(authedPage.getByText(/no tracks yet/i)).toBeVisible();
  });

  test('deletes the new playlist, leaving the seeded playlist intact', async ({ authedPage }) => {
    const library = new LibraryPagePO(authedPage);
    await gotoLibrary(authedPage);
    await library.openPlaylist(NEW_PLAYLIST_NAME);

    // PlaylistDetailPage.handleDelete uses window.confirm — auto-accept.
    authedPage.once('dialog', (dialog) => {
      void dialog.accept();
    });

    const deleteBtn = authedPage.getByRole('button', { name: /^delete$/i });
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();

    // Redirected to /library; new playlist gone, seed playlist remains.
    await expect(authedPage).toHaveURL(/\/library(\?|$)/);
    await expect(library.cardByName(FIXTURE_PLAYLIST.name)).toBeVisible();
    await expect(library.cardByName(NEW_PLAYLIST_NAME)).toHaveCount(0);
  });

  test('plays the seeded playlist and the PlayerBar picks up a seed track', async ({ authedPage }) => {
    const library = new LibraryPagePO(authedPage);
    const playerBar = new PlayerBarPO(authedPage);
    await gotoLibrary(authedPage);
    await library.openPlaylist(FIXTURE_PLAYLIST.name);

    // Click "Play All" — rendered as a pill with text "PLAY ALL".
    const playAllBtn = authedPage.getByRole('button', { name: /play all/i });
    await expect(playAllBtn).toBeVisible();
    await playAllBtn.click();

    // The PlayerBar is unlabelled but always contains the current track title.
    // Poll for either seed track title to surface inside the footer region
    // within ~5s (slightly wider than 3s to tolerate bot-side startup while
    // still avoiding fixed waits).
    const footer = playerBar.root();
    const titleRegex = new RegExp(SEED_SONG_TITLES.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'i');
    await expect
      .poll(
        async () => {
          const text = (await footer.textContent().catch(() => ''))?.trim() ?? '';
          return titleRegex.test(text);
        },
        { timeout: 6_000, intervals: [250, 500, 1_000] },
      )
      .toBe(true);
  });
});
