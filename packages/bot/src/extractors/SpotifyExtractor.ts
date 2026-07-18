import { BaseExtractor, Track, Playlist, ExtractorSearchContext } from 'discord-player';
import SpotifyWebApi from 'spotify-web-api-node';
import { createLogger } from '../helpers/logger.js';
import { TrackCacheRepository } from '../database/repositories/TrackCacheRepository.js';

const log = createLogger('spotify-extractor');

const CACHE_PLATFORM_SPOTIFY = 'spotify';

// Spotify URL patterns
const SPOTIFY_TRACK_REGEX = /^(?:https?:\/\/)?(?:open\.)?spotify\.com\/(?:intl-[a-z]+\/)?track\/([a-zA-Z0-9]+)/;
const SPOTIFY_PLAYLIST_REGEX = /^(?:https?:\/\/)?(?:open\.)?spotify\.com\/(?:intl-[a-z]+\/)?playlist\/([a-zA-Z0-9]+)/;
const SPOTIFY_ALBUM_REGEX = /^(?:https?:\/\/)?(?:open\.)?spotify\.com\/(?:intl-[a-z]+\/)?album\/([a-zA-Z0-9]+)/;
const SPOTIFY_ARTIST_REGEX = /^(?:https?:\/\/)?(?:open\.)?spotify\.com\/(?:intl-[a-z]+\/)?artist\/([a-zA-Z0-9]+)/;

interface SpotifyExtractorOptions {
  clientId?: string;
  clientSecret?: string;
  bridgeProvider?: BaseExtractor;
}

/**
 * Spotify extractor that resolves Spotify metadata and bridges playback
 * through a YouTube extractor for actual audio streaming.
 */
export class SpotifyExtractor extends BaseExtractor<SpotifyExtractorOptions> {
  static identifier = 'com.downunder.spotify' as const;

  private spotifyApi: SpotifyWebApi | null = null;
  private tokenExpiry = 0;
  private trackCache = new TrackCacheRepository();

  async activate(): Promise<void> {
    const clientId = this.options.clientId ?? process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = this.options.clientSecret ?? process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      log.warn('Spotify credentials not provided — Spotify URL resolution disabled');
      return;
    }

    this.spotifyApi = new SpotifyWebApi({ clientId, clientSecret });
    await this.refreshToken();
    log.info('SpotifyExtractor activated');
  }

  async deactivate(): Promise<void> {
    this.spotifyApi = null;
    log.info('SpotifyExtractor deactivated');
  }

  async validate(query: string): Promise<boolean> {
    return (
      SPOTIFY_TRACK_REGEX.test(query) ||
      SPOTIFY_PLAYLIST_REGEX.test(query) ||
      SPOTIFY_ALBUM_REGEX.test(query) ||
      SPOTIFY_ARTIST_REGEX.test(query)
    );
  }

  private async refreshToken(): Promise<void> {
    if (!this.spotifyApi) return;
    if (Date.now() < this.tokenExpiry - 60_000) return; // refresh 1 min early

    try {
      const data = await this.spotifyApi.clientCredentialsGrant();
      this.spotifyApi.setAccessToken(data.body.access_token);
      this.tokenExpiry = Date.now() + data.body.expires_in * 1000;
      log.debug('Spotify token refreshed');
    } catch (err) {
      log.error({ err }, 'Failed to refresh Spotify token');
    }
  }

  private formatDuration(ms: number): string {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  private spotifyTrackToTrack(spotifyTrack: Record<string, unknown>, context: ExtractorSearchContext): Track {
    const album = spotifyTrack.album as Record<string, unknown> | undefined;
    const images = album?.images as Array<{ url: string }> | undefined;
    const thumbnail = images?.[0]?.url ?? '';
    const artists = spotifyTrack.artists as Array<{ name: string }> | undefined;
    const externalUrls = spotifyTrack.external_urls as Record<string, string> | undefined;

    const track = new Track(this.context.player, {
      title: String(spotifyTrack.name ?? 'Unknown'),
      author: artists?.map((a: { name: string }) => a.name).join(', ') ?? 'Unknown Artist',
      url: externalUrls?.spotify ?? '',
      thumbnail,
      duration: this.formatDuration(Number(spotifyTrack.duration_ms ?? 0)),
      requestedBy: context.requestedBy,
      source: 'spotify',
    });

    track.extractor = this;
    return track;
  }

  async handle(query: string, context: ExtractorSearchContext) {
    if (!this.spotifyApi) {
      log.warn('Spotify API not initialized');
      return this.createResponse(null, []);
    }

    await this.refreshToken();

    // Track URL
    const trackMatch = query.match(SPOTIFY_TRACK_REGEX);
    if (trackMatch) {
      return this.handleTrack(trackMatch[1], context);
    }

    // Playlist URL
    const playlistMatch = query.match(SPOTIFY_PLAYLIST_REGEX);
    if (playlistMatch) {
      return this.handlePlaylist(playlistMatch[1], context);
    }

    // Album URL
    const albumMatch = query.match(SPOTIFY_ALBUM_REGEX);
    if (albumMatch) {
      return this.handleAlbum(albumMatch[1], context);
    }

    // Artist URL — get top tracks
    const artistMatch = query.match(SPOTIFY_ARTIST_REGEX);
    if (artistMatch) {
      return this.handleArtist(artistMatch[1], context);
    }

    // Fallback: text search
    return this.handleSearch(query, context);
  }

  private async handleSearch(query: string, context: ExtractorSearchContext) {
    if (!this.spotifyApi) {
      log.warn('Spotify API not initialized — cannot perform search');
      return this.createResponse(null, []);
    }

    try {
      await this.refreshToken();
      const data = await this.spotifyApi.searchTracks(query, { limit: 10 });
      const items = data.body?.tracks?.items ?? [];

      const tracks = items.map((item) => {
        const track = new Track(this.context.player, {
          title: item.name ?? 'Unknown',
          author: item.artists?.map((a) => a.name).join(', ') ?? 'Unknown Artist',
          url: item.external_urls?.spotify ?? '',
          thumbnail: item.album?.images?.[0]?.url ?? '',
          duration: this.formatDuration(item.duration_ms ?? 0),
          requestedBy: context.requestedBy,
          source: 'spotify',
        });
        track.extractor = this;
        return track;
      });

      return this.createResponse(null, tracks);
    } catch (err) {
      log.error({ err, query }, 'Spotify text search failed');
      return this.createResponse(null, []);
    }
  }

  private async handleTrack(trackId: string, context: ExtractorSearchContext) {
    // Cache lookup — skip the API if we've seen this trackId before.
    const cached = await this.readCache(trackId);
    if (cached) {
      const track = new Track(this.context.player, {
        title: cached.title,
        author: cached.artist ?? 'Unknown Artist',
        url: cached.url,
        thumbnail: cached.thumbnail ?? '',
        duration: this.formatDuration(cached.duration),
        requestedBy: context.requestedBy,
        source: 'spotify',
      });
      track.extractor = this;
      log.debug({ trackId }, 'Spotify track served from cache');
      return this.createResponse(null, [track]);
    }

    try {
      const data = await this.spotifyApi!.getTrack(trackId);
      const body = data.body as unknown as Record<string, unknown>;
      const track = this.spotifyTrackToTrack(body, context);

      // Fire-and-forget cache write (non-fatal).
      void this.writeCache(trackId, body);

      return this.createResponse(null, [track]);
    } catch (err) {
      log.error({ err, trackId }, 'Failed to fetch Spotify track');
      return this.createResponse(null, []);
    }
  }

  /**
   * Look up a Spotify track by ID in the TrackCache. Any DB error is swallowed
   * so the extractor always falls through to the API.
   */
  private async readCache(trackId: string): Promise<{
    title: string;
    artist: string | null;
    url: string;
    thumbnail: string | null;
    duration: number;
  } | null> {
    try {
      const row = await this.trackCache.get(CACHE_PLATFORM_SPOTIFY, trackId);
      if (!row) return null;
      return {
        title: row.title,
        artist: row.artist,
        url: row.url,
        thumbnail: row.thumbnail,
        duration: row.duration,
      };
    } catch (err) {
      log.warn({ err, trackId }, 'TrackCache lookup failed — falling back to Spotify API');
      return null;
    }
  }

  /**
   * Persist a Spotify track's metadata in the TrackCache. Any DB error is
   * swallowed — the extractor still succeeds with the API response.
   */
  private async writeCache(trackId: string, body: Record<string, unknown>): Promise<void> {
    try {
      const album = body.album as Record<string, unknown> | undefined;
      const images = album?.images as Array<{ url: string }> | undefined;
      const artists = body.artists as Array<{ name: string }> | undefined;
      const externalUrls = body.external_urls as Record<string, string> | undefined;

      await this.trackCache.set({
        platform: CACHE_PLATFORM_SPOTIFY,
        platformId: trackId,
        title: String(body.name ?? 'Unknown'),
        artist: artists?.map((a) => a.name).join(', '),
        duration: Number(body.duration_ms ?? 0),
        url: externalUrls?.spotify ?? `https://open.spotify.com/track/${trackId}`,
        thumbnail: images?.[0]?.url,
      });
    } catch (err) {
      log.warn({ err, trackId }, 'TrackCache write failed — continuing without caching');
    }
  }

  private async handlePlaylist(playlistId: string, context: ExtractorSearchContext) {
    try {
      const data = await this.spotifyApi!.getPlaylist(playlistId);
      const tracks: Track[] = [];

      for (const item of data.body.tracks.items) {
        if (!item.track) continue;
        tracks.push(this.spotifyTrackToTrack(item.track as unknown as Record<string, unknown>, context));
      }

      // Fetch remaining pages if playlist is large
      let next = data.body.tracks.next;
      while (next && tracks.length < 200) {
        const offset = tracks.length;
        const page = await this.spotifyApi!.getPlaylistTracks(playlistId, {
          offset,
          limit: 100,
        });
        for (const item of page.body.items) {
          if (!item.track) continue;
          tracks.push(this.spotifyTrackToTrack(item.track as unknown as Record<string, unknown>, context));
        }
        next = page.body.next;
      }

      const playlist = new Playlist(this.context.player, {
        title: data.body.name,
        thumbnail: data.body.images?.[0]?.url ?? '',
        description: data.body.description ?? '',
        type: 'playlist',
        source: 'spotify',
        author: {
          name: data.body.owner.display_name ?? 'Spotify',
          url: data.body.owner.external_urls?.spotify ?? '',
        },
        id: playlistId,
        url: data.body.external_urls?.spotify ?? '',
        tracks,
      });

      return this.createResponse(playlist, tracks);
    } catch (err) {
      log.error({ err, playlistId }, 'Failed to fetch Spotify playlist');
      return this.createResponse(null, []);
    }
  }

  private async handleAlbum(albumId: string, context: ExtractorSearchContext) {
    try {
      const data = await this.spotifyApi!.getAlbum(albumId);
      const albumThumbnail = data.body.images?.[0]?.url ?? '';
      const tracks: Track[] = data.body.tracks.items.map((item: SpotifyApi.TrackObjectSimplified) => {
        const track = new Track(this.context.player, {
          title: item.name,
          author: item.artists?.map((a: SpotifyApi.ArtistObjectSimplified) => a.name).join(', ') ?? 'Unknown Artist',
          url: item.external_urls?.spotify ?? '',
          thumbnail: albumThumbnail,
          duration: this.formatDuration(item.duration_ms),
          requestedBy: context.requestedBy,
          source: 'spotify',
        });
        track.extractor = this;
        return track;
      });

      const playlist = new Playlist(this.context.player, {
        title: data.body.name,
        thumbnail: albumThumbnail,
        description: `Album by ${data.body.artists?.map((a: SpotifyApi.ArtistObjectSimplified) => a.name).join(', ')}`,
        type: 'album',
        source: 'spotify',
        author: {
          name: data.body.artists?.[0]?.name ?? 'Unknown',
          url: data.body.artists?.[0]?.external_urls?.spotify ?? '',
        },
        id: albumId,
        url: data.body.external_urls?.spotify ?? '',
        tracks,
      });

      return this.createResponse(playlist, tracks);
    } catch (err) {
      log.error({ err, albumId }, 'Failed to fetch Spotify album');
      return this.createResponse(null, []);
    }
  }

  private async handleArtist(artistId: string, context: ExtractorSearchContext) {
    try {
      const data = await this.spotifyApi!.getArtistTopTracks(artistId, 'US');
      const tracks: Track[] = data.body.tracks.map((t: SpotifyApi.TrackObjectFull) =>
        this.spotifyTrackToTrack(t as unknown as Record<string, unknown>, context),
      );
      return this.createResponse(null, tracks);
    } catch (err) {
      log.error({ err, artistId }, 'Failed to fetch Spotify artist top tracks');
      return this.createResponse(null, []);
    }
  }

  /**
   * Spotify tracks can't stream directly — bridge to YouTube search.
   * The discord-player framework will automatically try the next extractor
   * in the chain when this returns a search query string.
   */
  async stream(track: Track) {
    // Return a YouTube search query that discord-player will resolve via the YouTube extractor
    const searchQuery = `${track.title} ${track.author}`;
    log.debug({ title: track.title, searchQuery }, 'Bridging Spotify track to YouTube');

    // Search YouTube for this track and return the URL
    const result = await this.context.player.search(searchQuery, {
      searchEngine: 'youtubeSearch' as never,
    });

    if (result.tracks.length > 0) {
      return result.tracks[0].url;
    }

    throw new Error(`No YouTube result found for: ${searchQuery}`);
  }
}
