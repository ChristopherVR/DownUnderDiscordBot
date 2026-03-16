import { BaseExtractor, Track, Playlist, ExtractorSearchContext } from 'discord-player';
import { Soundcloud as SoundCloud } from 'soundcloud.ts';
import { createLogger } from '../helpers/logger.js';

const log = createLogger('soundcloud-extractor');

// SoundCloud URL patterns
const SC_TRACK_REGEX = /^(?:https?:\/\/)?(?:www\.|m\.)?soundcloud\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)(?:\?.*)?$/;
const SC_PLAYLIST_REGEX = /^(?:https?:\/\/)?(?:www\.|m\.)?soundcloud\.com\/([a-zA-Z0-9_-]+)\/sets\/([a-zA-Z0-9_-]+)/;
const SC_USER_REGEX = /^(?:https?:\/\/)?(?:www\.|m\.)?soundcloud\.com\/([a-zA-Z0-9_-]+)\/?$/;

interface SoundCloudExtractorOptions {
  clientId?: string;
}

/**
 * SoundCloud extractor using soundcloud.ts for search, metadata, and streaming.
 */
export class SoundCloudExtractor extends BaseExtractor<SoundCloudExtractorOptions> {
  static identifier = 'com.downunder.soundcloud' as const;

  private sc: SoundCloud | null = null;

  async activate(): Promise<void> {
    try {
      this.sc = new SoundCloud();
      log.info('SoundCloudExtractor activated');
    } catch (err) {
      log.error({ err }, 'Failed to initialize SoundCloud client');
    }
  }

  async deactivate(): Promise<void> {
    this.sc = null;
    log.info('SoundCloudExtractor deactivated');
  }

  async validate(query: string): Promise<boolean> {
    return SC_TRACK_REGEX.test(query) || SC_PLAYLIST_REGEX.test(query) || SC_USER_REGEX.test(query);
  }

  private formatDuration(ms: number): string {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  private scTrackToTrack(scTrack: Record<string, unknown>, context: ExtractorSearchContext): Track {
    const user = scTrack.user as Record<string, unknown> | undefined;

    const track = new Track(this.context.player, {
      title: String(scTrack.title ?? 'Unknown'),
      author: String(user?.username ?? 'Unknown Artist'),
      url: String(scTrack.permalink_url ?? ''),
      thumbnail: String(scTrack.artwork_url ?? user?.avatar_url ?? ''),
      duration: this.formatDuration(Number(scTrack.duration ?? 0)),
      requestedBy: context.requestedBy,
      source: 'soundcloud',
      queryType: 'soundcloudTrack',
    });

    track.extractor = this;
    return track;
  }

  async handle(query: string, context: ExtractorSearchContext) {
    if (!this.sc) {
      log.warn('SoundCloud client not initialized');
      return this.createResponse(null, []);
    }

    // Playlist URL
    if (SC_PLAYLIST_REGEX.test(query)) {
      return this.handlePlaylist(query, context);
    }

    // Track URL (must check after playlist since playlist URLs contain two path segments too)
    if (SC_TRACK_REGEX.test(query) && !SC_USER_REGEX.test(query)) {
      return this.handleTrackUrl(query, context);
    }

    // Fallback: search
    return this.handleSearch(query, context);
  }

  private async handleTrackUrl(url: string, context: ExtractorSearchContext) {
    try {
      const scTrack = await this.sc!.tracks.get(url);
      const raw = scTrack as unknown as Record<string, unknown>;
      const track = this.scTrackToTrack(raw, context);
      return this.createResponse(null, [track]);
    } catch (err) {
      log.error({ err, url }, 'Failed to fetch SoundCloud track');
      return this.createResponse(null, []);
    }
  }

  private async handlePlaylist(url: string, context: ExtractorSearchContext) {
    try {
      const scPlaylist = await this.sc!.playlists.get(url);
      const raw = scPlaylist as unknown as Record<string, unknown>;
      const rawTracks = (raw.tracks as Array<Record<string, unknown>>) ?? [];
      const tracks = rawTracks.map((t) => this.scTrackToTrack(t, context));

      const playlist = new Playlist(this.context.player, {
        title: String(raw.title ?? 'SoundCloud Playlist'),
        thumbnail: String(raw.artwork_url ?? ''),
        description: String(raw.description ?? ''),
        type: 'playlist',
        source: 'soundcloud',
        author: {
          name: String((raw.user as Record<string, unknown>)?.username ?? 'SoundCloud'),
          url: String((raw.user as Record<string, unknown>)?.permalink_url ?? ''),
        },
        id: String(raw.id ?? ''),
        url: String(raw.permalink_url ?? url),
        tracks,
      });

      return this.createResponse(playlist, tracks);
    } catch (err) {
      log.error({ err, url }, 'Failed to fetch SoundCloud playlist');
      return this.createResponse(null, []);
    }
  }

  async handleSearch(query: string, context: ExtractorSearchContext) {
    try {
      const results = await this.sc!.tracks.search({ q: query, limit: 10 });
      const collection = (results as unknown as { collection?: Array<Record<string, unknown>> })?.collection ?? [];

      const tracks = collection.map((t) => this.scTrackToTrack(t, context));
      return this.createResponse(null, tracks);
    } catch (err) {
      log.error({ err, query }, 'SoundCloud search failed');
      return this.createResponse(null, []);
    }
  }

  async stream(track: Track) {
    if (!this.sc) throw new Error('SoundCloud client not initialized');

    try {
      const streamUrl = await this.sc.util.streamLink(track.url);
      log.debug({ title: track.title }, 'SoundCloud stream URL resolved');
      return streamUrl;
    } catch (err) {
      log.error({ err, url: track.url }, 'Failed to get SoundCloud stream');
      throw err;
    }
  }
}
