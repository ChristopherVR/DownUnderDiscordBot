import { BaseExtractor, Track, Playlist, ExtractorSearchContext, GuildQueueHistory } from 'discord-player';
import { Innertube, UniversalCache, ClientType } from 'youtubei.js';
import { PassThrough } from 'stream';
import { EventEmitter } from 'events';
import { createLogger } from '../helpers/logger.js';
import { streamAudio as ytDlpStreamAudio } from '../helpers/ytdlp.js';

const log = createLogger('youtube-extractor');

export type StreamClient = 'ANDROID' | 'WEB' | 'yt-dlp';

export interface StreamStatusEvent {
  videoId: string;
  status: 'resolving' | 'fallback' | 'streaming' | 'error';
  client: StreamClient;
  message?: string;
}

// Regex patterns for YouTube URL detection
const YT_VIDEO_REGEX =
  /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
const YT_PLAYLIST_REGEX =
  /^(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/(?:playlist\?list=|watch\?.*&list=)([a-zA-Z0-9_-]+)/;
const YT_CHANNEL_REGEX = /^(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/(?:@|channel\/|c\/)([a-zA-Z0-9_-]+)/;

interface YouTubeExtractorOptions {
  cachePath?: string;
  highWaterMark?: number;
}

/**
 * Custom YouTube extractor using youtubei.js v16, with yt-dlp as a final
 * fallback when both Innertube streaming paths fail.
 *
 * Architecture:
 *  - WEB client      → search, metadata, playlist fetching (best data quality)
 *  - ANDROID client  → primary streaming (least rate-limited)
 *  - WEB client      → secondary streaming fallback
 *  - yt-dlp          → tertiary fallback (robust against signature regressions)
 *
 * When any streaming backend fails it is placed on a 5-minute cooldown so
 * subsequent tracks skip it instead of timing out repeatedly.
 */
export class CustomYouTubeExtractor extends BaseExtractor<YouTubeExtractorOptions> {
  static identifier = 'com.downunder.youtube' as const;

  /** WEB client — used for search / metadata / playlists */
  private webYt: Innertube | null = null;
  private webInitPromise: Promise<Innertube> | null = null;

  /** ANDROID client — used exclusively for streaming */
  private androidYt: Innertube | null = null;
  private androidInitPromise: Promise<Innertube> | null = null;

  /**
   * Streaming backends that have failed during this session. Each failed
   * backend is skipped until its cooldown expires, to avoid repeated
   * timeouts on every subsequent track.
   */
  private disabledClients = new Map<StreamClient, number>();

  /** Cooldown period before retrying a failed client (5 minutes). */
  private static CLIENT_COOLDOWN_MS = 5 * 60 * 1000;

  /** Maximum number of tracks pulled from a single playlist. */
  private static MAX_PLAYLIST_TRACKS = 100;

  private isClientDisabled(client: StreamClient): boolean {
    const disabledAt = this.disabledClients.get(client);
    if (disabledAt == null) return false;
    if (Date.now() - disabledAt >= CustomYouTubeExtractor.CLIENT_COOLDOWN_MS) {
      this.disabledClients.delete(client);
      return false;
    }
    return true;
  }

  private disableClient(client: StreamClient): void {
    this.disabledClients.set(client, Date.now());
  }

  /** Event emitter for stream status updates (consumed by WebSocket layer). */
  public readonly events = new EventEmitter();

  async activate(): Promise<void> {
    log.info('Activating CustomYouTubeExtractor');
    // Pre-warm both Innertube instances in parallel
    await Promise.all([this.getWebYt(), this.getAndroidYt()]);
  }

  async deactivate(): Promise<void> {
    this.webYt = null;
    this.webInitPromise = null;
    this.androidYt = null;
    this.androidInitPromise = null;
    this.disabledClients.clear();
    this.events.removeAllListeners();
    log.info('Deactivated CustomYouTubeExtractor');
  }

  async validate(query: string): Promise<boolean> {
    return YT_VIDEO_REGEX.test(query) || YT_PLAYLIST_REGEX.test(query) || YT_CHANNEL_REGEX.test(query);
  }

  /* ------------------------------------------------------------------ */
  /*  Innertube lifecycle                                                */
  /* ------------------------------------------------------------------ */

  private async getWebYt(): Promise<Innertube> {
    if (this.webYt) return this.webYt;
    if (!this.webInitPromise) {
      this.webInitPromise = Innertube.create({
        client_type: ClientType.WEB,
        cache: new UniversalCache(true, this.options.cachePath),
        generate_session_locally: true,
      }).then((yt) => {
        this.webYt = yt;
        log.info('WEB Innertube instance created');
        return yt;
      });
    }
    return this.webInitPromise;
  }

  private async getAndroidYt(): Promise<Innertube> {
    if (this.androidYt) return this.androidYt;
    if (!this.androidInitPromise) {
      this.androidInitPromise = Innertube.create({
        client_type: ClientType.ANDROID,
        generate_session_locally: true,
      }).then((yt) => {
        this.androidYt = yt;
        log.info('ANDROID Innertube instance created (streaming)');
        return yt;
      });
    }
    return this.androidInitPromise;
  }

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                            */
  /* ------------------------------------------------------------------ */

  private extractVideoId(url: string): string | null {
    const match = url.match(YT_VIDEO_REGEX);
    return match ? match[1] : null;
  }

  private extractPlaylistId(url: string): string | null {
    const match = url.match(YT_PLAYLIST_REGEX);
    return match ? match[1] : null;
  }

  private formatDuration(seconds?: number): string {
    if (!seconds || seconds <= 0) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  /* ------------------------------------------------------------------ */
  /*  handle() — called by discord-player for every query                */
  /* ------------------------------------------------------------------ */

  async handle(query: string, context: ExtractorSearchContext) {
    const yt = await this.getWebYt();

    // Playlist URL?
    const playlistId = this.extractPlaylistId(query);
    if (playlistId) return this.handlePlaylist(yt, playlistId, context);

    // Video URL?
    const videoId = this.extractVideoId(query);
    if (videoId) return this.handleVideo(yt, videoId, context);

    // Fallback: text search
    return this.handleSearch(yt, query, context);
  }

  /* ------------------------------------------------------------------ */
  /*  handle helpers                                                     */
  /* ------------------------------------------------------------------ */

  private async handleVideo(yt: Innertube, videoId: string, context: ExtractorSearchContext) {
    try {
      const info = await yt.getBasicInfo(videoId);
      const basic = info.basic_info;

      const track = new Track(this.context.player, {
        title: basic.title ?? 'Unknown Title',
        author: basic.author ?? 'Unknown Artist',
        url: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnail: basic.thumbnail?.[0]?.url ?? '',
        duration: this.formatDuration(basic.duration),
        requestedBy: context.requestedBy,
        source: 'youtube',
        queryType: 'youtubeVideo',
      });
      track.extractor = this;

      return this.createResponse(null, [track]);
    } catch (err) {
      log.error({ err, videoId }, 'Failed to fetch video info');
      return this.createResponse(null, []);
    }
  }

  private async handlePlaylist(yt: Innertube, playlistId: string, context: ExtractorSearchContext) {
    try {
      const playlist = await yt.getPlaylist(playlistId);
      const tracks: Track[] = [];
      const maxTracks = CustomYouTubeExtractor.MAX_PLAYLIST_TRACKS;

      for (const video of playlist.videos) {
        if (tracks.length >= maxTracks) {
          log.warn({ playlistId, totalVideos: playlist.videos.length, maxTracks }, 'Playlist truncated at max size');
          break;
        }
        const vid = video as unknown as Record<string, unknown>;
        const title = (vid.title as { text?: string })?.text ?? String(vid.title ?? 'Unknown');
        const author = (vid.author as { name?: string })?.name ?? String(vid.author ?? 'Unknown Artist');
        const vidId = String(vid.id ?? vid.video_id ?? '');
        const dur = vid.duration as { seconds?: number };
        const thumbList = vid.thumbnails as Array<{ url: string }> | undefined;

        const t = new Track(this.context.player, {
          title,
          author,
          url: `https://www.youtube.com/watch?v=${vidId}`,
          thumbnail: thumbList?.[0]?.url ?? '',
          duration: this.formatDuration(dur?.seconds),
          requestedBy: context.requestedBy,
          source: 'youtube',
          queryType: 'youtubePlaylist',
        });
        t.extractor = this;
        tracks.push(t);
      }

      const info = playlist.info as Record<string, unknown>;
      const playlistData = new Playlist(this.context.player, {
        title: (info?.title as string) ?? 'YouTube Playlist',
        thumbnail: (info?.thumbnails as Array<{ url: string }>)?.[0]?.url ?? '',
        description: '',
        type: 'playlist',
        source: 'youtube',
        author: {
          name: 'YouTube',
          url: `https://www.youtube.com/playlist?list=${playlistId}`,
        },
        id: playlistId,
        url: `https://www.youtube.com/playlist?list=${playlistId}`,
        tracks,
      });

      return this.createResponse(playlistData, tracks);
    } catch (err) {
      log.error({ err, playlistId }, 'Failed to fetch playlist');
      return this.createResponse(null, []);
    }
  }

  private async handleSearch(yt: Innertube, query: string, context: ExtractorSearchContext) {
    try {
      const results = await yt.search(query, { type: 'video' });
      const tracks: Track[] = [];

      for (const item of results.results ?? []) {
        const vid = item as unknown as Record<string, unknown>;
        if (vid.type !== 'Video') continue;

        const title = (vid.title as { text?: string })?.text ?? String(vid.title ?? 'Unknown');
        const author = (vid.author as { name?: string })?.name ?? String(vid.author ?? 'Unknown Artist');
        const vidId = String(vid.video_id ?? vid.id ?? '');
        const dur = vid.length_text as { text?: string } | undefined;
        const thumbList = vid.thumbnails as Array<{ url: string }> | undefined;

        // Parse "M:SS" or "H:MM:SS" duration text
        const durationStr = dur?.text ?? '0:00';

        const t = new Track(this.context.player, {
          title,
          author,
          url: `https://www.youtube.com/watch?v=${vidId}`,
          thumbnail: thumbList?.[0]?.url ?? '',
          duration: durationStr,
          requestedBy: context.requestedBy,
          source: 'youtube',
          queryType: 'youtubeSearch',
        });
        t.extractor = this;
        tracks.push(t);

        if (tracks.length >= 10) break;
      }

      return this.createResponse(null, tracks);
    } catch (err) {
      log.error({ err, query }, 'YouTube search failed');
      return this.createResponse(null, []);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  stream() — returns a Readable for audio playback                   */
  /*  Tries ANDROID → WEB → yt-dlp, placing failures on cooldown.        */
  /* ------------------------------------------------------------------ */

  async stream(track: Track) {
    const videoId = this.extractVideoId(track.url);
    if (!videoId) throw new Error(`Cannot extract video ID from: ${track.url}`);

    const emitStatus = (status: StreamStatusEvent) => this.events.emit('streamStatus', status);

    // Primary: ANDROID client download.
    if (!this.isClientDisabled('ANDROID')) {
      try {
        emitStatus({ videoId, status: 'resolving', client: 'ANDROID' });
        const yt = await this.getAndroidYt();
        const stream = await this.pipeDownload(yt, videoId, 'ANDROID');
        log.debug({ videoId, title: track.title }, 'Stream piped via ANDROID client download');
        emitStatus({ videoId, status: 'streaming', client: 'ANDROID' });
        return stream;
      } catch (err) {
        this.disableClient('ANDROID');
        log.warn({ err, videoId }, 'ANDROID client download failed — placed on cooldown, trying WEB fallback');
        emitStatus({
          videoId,
          status: 'fallback',
          client: 'ANDROID',
          message: 'ANDROID client placed on cooldown',
        });
      }
    } else {
      log.debug({ videoId }, 'Skipping ANDROID client (on cooldown)');
    }

    // Secondary: WEB client download.
    if (!this.isClientDisabled('WEB')) {
      try {
        emitStatus({ videoId, status: 'resolving', client: 'WEB' });
        const yt = await this.getWebYt();
        const stream = await this.pipeDownload(yt, videoId, 'WEB');
        log.debug({ videoId, title: track.title }, 'Stream piped via WEB client download');
        emitStatus({ videoId, status: 'streaming', client: 'WEB' });
        return stream;
      } catch (err) {
        this.disableClient('WEB');
        log.warn({ err, videoId }, 'WEB client download failed — placed on cooldown, trying yt-dlp fallback');
        emitStatus({
          videoId,
          status: 'fallback',
          client: 'WEB',
          message: 'WEB client placed on cooldown',
        });
      }
    } else {
      log.debug({ videoId }, 'Skipping WEB client (on cooldown)');
    }

    // Tertiary: yt-dlp subprocess — robust against Innertube signature regressions.
    if (!this.isClientDisabled('yt-dlp')) {
      try {
        emitStatus({ videoId, status: 'resolving', client: 'yt-dlp' });
        const stream = await ytDlpStreamAudio(track.url);
        log.debug({ videoId, title: track.title }, 'Stream piped via yt-dlp');
        emitStatus({ videoId, status: 'streaming', client: 'yt-dlp' });
        return stream;
      } catch (err) {
        this.disableClient('yt-dlp');
        log.error({ err, videoId }, 'All stream methods failed');
        emitStatus({
          videoId,
          status: 'error',
          client: 'yt-dlp',
          message: 'All stream methods failed',
        });
        throw err;
      }
    }

    // All backends exhausted (on cooldown)
    const msg = 'All stream methods disabled or on cooldown';
    log.error({ videoId }, msg);
    emitStatus({ videoId, status: 'error', client: 'yt-dlp', message: msg });
    throw new Error(msg);
  }

  /**
   * Downloads audio via youtubei.js and pipes the async iterable through a
   * PassThrough stream that FFmpeg can consume. This avoids returning a raw
   * URL (which fails because FFmpeg lacks YouTube-specific HTTP headers).
   *
   * Waits until at least one chunk has been written before returning, so the
   * caller can tell immediately if the download is broken and try a fallback.
   */
  private async pipeDownload(yt: Innertube, videoId: string, clientLabel: string): Promise<PassThrough> {
    const iter = await yt.download(videoId, { type: 'audio', quality: 'best' });
    const passthrough = new PassThrough({ highWaterMark: 1 << 20 }); // 1 MB buffer

    let bytesWritten = 0;
    let firstChunkSettled = false;

    // Deferred promise for first-chunk verification
    let resolveFirstChunk!: () => void;
    let rejectFirstChunk!: (err: Error) => void;
    const firstChunkPromise = new Promise<void>((res, rej) => {
      resolveFirstChunk = res;
      rejectFirstChunk = rej;
    });

    const settleOk = () => {
      if (!firstChunkSettled) {
        firstChunkSettled = true;
        resolveFirstChunk();
      }
    };
    const settleErr = (e: Error) => {
      if (!firstChunkSettled) {
        firstChunkSettled = true;
        rejectFirstChunk(e);
      }
    };

    (async () => {
      try {
        for await (const chunk of iter) {
          if (passthrough.destroyed) return;
          bytesWritten += chunk.length;
          if (!passthrough.write(chunk)) {
            // Race drain against close so a destroyed passthrough doesn't
            // leave this promise pending forever (stops the iterator too).
            await new Promise<void>((resolve) => {
              const done = () => resolve();
              passthrough.once('drain', done);
              passthrough.once('close', done);
            });
            if (passthrough.destroyed) return;
          }
          settleOk();
        }
        if (bytesWritten === 0) {
          settleErr(new Error(`${clientLabel} download returned no data`));
        }
        log.debug({ videoId, clientLabel, bytesWritten }, 'Download stream completed');
        passthrough.end();
      } catch (e) {
        log.error({ err: e, videoId, clientLabel, bytesWritten }, 'Download stream error');
        settleErr(e as Error);
        if (!passthrough.destroyed) {
          passthrough.destroy(e as Error);
        }
      }
    })();

    // Wait up to 10 seconds for the first chunk to confirm the stream is alive.
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`No data from ${clientLabel} client within 10s`)), 10_000),
    );

    await Promise.race([firstChunkPromise, timeout]);
    log.debug({ videoId, clientLabel, bytesWritten }, 'First chunk received, stream is alive');

    return passthrough;
  }

  /* ------------------------------------------------------------------ */
  /*  getRelatedTracks() — autoplay / radio mode                         */
  /*  Uses search-based approach since watch_next_feed is unreliable.    */
  /* ------------------------------------------------------------------ */

  async getRelatedTracks(track: Track, _history: GuildQueueHistory) {
    try {
      const yt = await this.getWebYt();
      const query = `${track.title} ${track.author}`;
      const results = await yt.search(query, { type: 'video' });
      const tracks: Track[] = [];

      for (const item of results.results ?? []) {
        const vid = item as unknown as Record<string, unknown>;
        if (vid.type !== 'Video') continue;

        const vidId = String(vid.video_id ?? vid.id ?? '');
        // Skip the same video
        if (vidId === this.extractVideoId(track.url)) continue;

        const title = (vid.title as { text?: string })?.text ?? String(vid.title ?? 'Unknown');
        const author = (vid.author as { name?: string })?.name ?? String(vid.author ?? 'Unknown');
        const dur = vid.length_text as { text?: string } | undefined;
        const thumbList = vid.thumbnails as Array<{ url: string }> | undefined;

        const relatedTrack = new Track(this.context.player, {
          title,
          author,
          url: `https://www.youtube.com/watch?v=${vidId}`,
          thumbnail: thumbList?.[0]?.url ?? '',
          duration: dur?.text ?? '0:00',
          source: 'youtube',
          queryType: 'youtubeVideo',
        });
        relatedTrack.extractor = this;
        tracks.push(relatedTrack);

        if (tracks.length >= 5) break;
      }

      return this.createResponse(null, tracks);
    } catch (err) {
      log.warn({ err }, 'Failed to get related tracks');
      return this.createResponse(null, []);
    }
  }
}
