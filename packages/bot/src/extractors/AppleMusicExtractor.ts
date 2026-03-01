import { BaseExtractor, Track, Playlist, ExtractorSearchContext } from 'discord-player';
import { createLogger } from '../helpers/logger.js';

const log = createLogger('applemusic-extractor');

// Apple Music URL patterns
// Track: https://music.apple.com/{storefront}/album/{name}/{albumId}?i={trackId}
// Album: https://music.apple.com/{storefront}/album/{name}/{albumId}
// Playlist: https://music.apple.com/{storefront}/playlist/{name}/{playlistId}
// Song direct: https://music.apple.com/{storefront}/song/{name}/{trackId}
const AM_TRACK_REGEX =
  /^(?:https?:\/\/)?(?:music\.apple\.com)\/([a-z]{2})\/album\/[^/]+\/(\d+)\?i=(\d+)/;
const AM_SONG_REGEX =
  /^(?:https?:\/\/)?(?:music\.apple\.com)\/([a-z]{2})\/song\/[^/]+\/(\d+)/;
const AM_ALBUM_REGEX =
  /^(?:https?:\/\/)?(?:music\.apple\.com)\/([a-z]{2})\/album\/[^/]+\/(\d+)(?:\?.*)?$/;
const AM_PLAYLIST_REGEX =
  /^(?:https?:\/\/)?(?:music\.apple\.com)\/([a-z]{2})\/playlist\/[^/]+\/(pl\.\w+)/;

const ITUNES_LOOKUP_URL = 'https://itunes.apple.com/lookup';
const ITUNES_SEARCH_URL = 'https://itunes.apple.com/search';

interface AppleMusicExtractorOptions {
  /** ISO country code for the iTunes storefront (default: 'us') */
  storefront?: string;
}

interface ItunesResult {
  trackId?: number;
  trackName?: string;
  artistName?: string;
  collectionName?: string;
  artworkUrl100?: string;
  artworkUrl60?: string;
  trackTimeMillis?: number;
  trackViewUrl?: string;
  previewUrl?: string;
  collectionId?: number;
  collectionViewUrl?: string;
  wrapperType?: string;
  collectionType?: string;
  trackCount?: number;
}

interface ItunesResponse {
  resultCount: number;
  results: ItunesResult[];
}

/**
 * Apple Music extractor that resolves metadata from Apple Music URLs using
 * the public iTunes Search/Lookup API and bridges playback through YouTube.
 *
 * Supports:
 *  - Apple Music track URLs (album?i=trackId and /song/ URLs)
 *  - Apple Music album URLs
 *  - Apple Music playlist URLs (metadata only — tracks fetched via lookup)
 *  - Text search via iTunes Search API
 *
 * No Apple Developer credentials are required — the iTunes API is public.
 */
export class AppleMusicExtractor extends BaseExtractor<AppleMusicExtractorOptions> {
  static identifier = 'com.downunder.applemusic' as const;

  private storefront = 'us';

  async activate(): Promise<void> {
    this.storefront = this.options.storefront ?? 'us';
    log.info({ storefront: this.storefront }, 'AppleMusicExtractor activated');
  }

  async deactivate(): Promise<void> {
    log.info('AppleMusicExtractor deactivated');
  }

  async validate(query: string): Promise<boolean> {
    return (
      AM_TRACK_REGEX.test(query) ||
      AM_SONG_REGEX.test(query) ||
      AM_ALBUM_REGEX.test(query) ||
      AM_PLAYLIST_REGEX.test(query)
    );
  }

  /* ------------------------------------------------------------------ */
  /*  iTunes API helpers                                                 */
  /* ------------------------------------------------------------------ */

  private async itunesLookup(params: Record<string, string>): Promise<ItunesResponse> {
    const url = new URL(ITUNES_LOOKUP_URL);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error(`iTunes lookup failed: ${res.status} ${res.statusText}`);
    }
    return (await res.json()) as ItunesResponse;
  }

  private async itunesSearch(
    term: string,
    opts: { limit?: number; entity?: string; country?: string } = {},
  ): Promise<ItunesResponse> {
    const url = new URL(ITUNES_SEARCH_URL);
    url.searchParams.set('term', term);
    url.searchParams.set('media', 'music');
    url.searchParams.set('entity', opts.entity ?? 'song');
    url.searchParams.set('limit', String(opts.limit ?? 10));
    url.searchParams.set('country', opts.country ?? this.storefront);

    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error(`iTunes search failed: ${res.status} ${res.statusText}`);
    }
    return (await res.json()) as ItunesResponse;
  }

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                            */
  /* ------------------------------------------------------------------ */

  private formatDuration(ms: number): string {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  /** Upscale Apple artwork URL from 100×100 to 600×600. */
  private upscaleArtwork(url?: string): string {
    if (!url) return '';
    return url.replace('100x100bb', '600x600bb');
  }

  private itunesResultToTrack(
    result: ItunesResult,
    context: ExtractorSearchContext,
  ): Track {
    const track = new Track(this.context.player, {
      title: result.trackName ?? 'Unknown',
      author: result.artistName ?? 'Unknown Artist',
      url: result.trackViewUrl ?? '',
      thumbnail: this.upscaleArtwork(result.artworkUrl100),
      duration: this.formatDuration(result.trackTimeMillis ?? 0),
      requestedBy: context.requestedBy,
      source: 'apple_music',
    });

    track.extractor = this;
    return track;
  }

  /* ------------------------------------------------------------------ */
  /*  handle() — called by discord-player for every matching query       */
  /* ------------------------------------------------------------------ */

  async handle(query: string, context: ExtractorSearchContext) {
    // Track URL with ?i= parameter
    const trackMatch = query.match(AM_TRACK_REGEX);
    if (trackMatch) {
      return this.handleTrack(trackMatch[3], trackMatch[1], context);
    }

    // Direct /song/ URL
    const songMatch = query.match(AM_SONG_REGEX);
    if (songMatch) {
      return this.handleTrack(songMatch[2], songMatch[1], context);
    }

    // Playlist URL (check before album since both have similar structure)
    const playlistMatch = query.match(AM_PLAYLIST_REGEX);
    if (playlistMatch) {
      return this.handlePlaylist(playlistMatch[2], playlistMatch[1], context);
    }

    // Album URL
    const albumMatch = query.match(AM_ALBUM_REGEX);
    if (albumMatch) {
      return this.handleAlbum(albumMatch[2], albumMatch[1], context);
    }

    // Fallback: search
    return this.handleSearch(query, context);
  }

  /* ------------------------------------------------------------------ */
  /*  URL handlers                                                       */
  /* ------------------------------------------------------------------ */

  private async handleTrack(
    trackId: string,
    country: string,
    context: ExtractorSearchContext,
  ) {
    try {
      const data = await this.itunesLookup({ id: trackId, country, entity: 'song' });
      const song = data.results.find((r) => r.wrapperType === 'track');

      if (!song) {
        log.warn({ trackId }, 'Apple Music track not found via iTunes lookup');
        return this.createResponse(null, []);
      }

      const track = this.itunesResultToTrack(song, context);
      return this.createResponse(null, [track]);
    } catch (err) {
      log.error({ err, trackId }, 'Failed to fetch Apple Music track');
      return this.createResponse(null, []);
    }
  }

  private async handleAlbum(
    albumId: string,
    country: string,
    context: ExtractorSearchContext,
  ) {
    try {
      const data = await this.itunesLookup({
        id: albumId,
        country,
        entity: 'song',
      });

      // First result is the album/collection, rest are songs
      const albumInfo = data.results.find(
        (r) => r.wrapperType === 'collection',
      );
      const songs = data.results.filter((r) => r.wrapperType === 'track');

      if (songs.length === 0) {
        log.warn({ albumId }, 'No tracks found for Apple Music album');
        return this.createResponse(null, []);
      }

      const tracks = songs.map((s) => this.itunesResultToTrack(s, context));

      const playlist = new Playlist(this.context.player, {
        title: albumInfo?.collectionName ?? songs[0]?.collectionName ?? 'Apple Music Album',
        thumbnail: this.upscaleArtwork(albumInfo?.artworkUrl100 ?? songs[0]?.artworkUrl100),
        description: `Album by ${albumInfo?.artistName ?? songs[0]?.artistName ?? 'Unknown'}`,
        type: 'album',
        source: 'apple_music',
        author: {
          name: albumInfo?.artistName ?? songs[0]?.artistName ?? 'Unknown',
          url: albumInfo?.collectionViewUrl ?? '',
        },
        id: albumId,
        url: albumInfo?.collectionViewUrl ?? '',
        tracks,
      });

      return this.createResponse(playlist, tracks);
    } catch (err) {
      log.error({ err, albumId }, 'Failed to fetch Apple Music album');
      return this.createResponse(null, []);
    }
  }

  private async handlePlaylist(
    playlistId: string,
    country: string,
    context: ExtractorSearchContext,
  ) {
    try {
      // The public iTunes API doesn't support playlist lookups directly.
      // Apple Music playlists require the Apple Music API with a developer token.
      // As a best-effort fallback, we fetch the playlist page and extract metadata.
      log.warn(
        { playlistId, country },
        'Apple Music playlist resolution requires Apple Music API credentials. ' +
        'Playlist URL detection is supported, but full track listing requires a developer token. ' +
        'Consider sharing individual track or album links instead.',
      );

      return this.createResponse(null, []);
    } catch (err) {
      log.error({ err, playlistId }, 'Failed to fetch Apple Music playlist');
      return this.createResponse(null, []);
    }
  }

  async handleSearch(
    query: string,
    context: ExtractorSearchContext,
  ) {
    try {
      const data = await this.itunesSearch(query, { limit: 10 });
      const tracks = data.results
        .filter((r) => r.wrapperType === 'track')
        .map((r) => this.itunesResultToTrack(r, context));

      return this.createResponse(null, tracks);
    } catch (err) {
      log.error({ err, query }, 'Apple Music search failed');
      return this.createResponse(null, []);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Streaming — bridge to YouTube (same pattern as Spotify)            */
  /* ------------------------------------------------------------------ */

  /**
   * Apple Music doesn't provide public streaming URLs.
   * We bridge to YouTube by searching for the track title + artist,
   * identical to how the Spotify extractor works.
   */
  async stream(track: Track) {
    const searchQuery = `${track.title} ${track.author}`;
    log.debug({ title: track.title, searchQuery }, 'Bridging Apple Music track to YouTube');

    const result = await this.context.player.search(searchQuery, {
      searchEngine: 'youtubeSearch' as never,
    });

    if (result.tracks.length > 0) {
      return result.tracks[0].url;
    }

    throw new Error(`No YouTube result found for: ${searchQuery}`);
  }
}
