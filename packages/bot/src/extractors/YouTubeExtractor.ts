import { BaseExtractor, Track, Playlist, ExtractorSearchContext, GuildQueueHistory } from 'discord-player';
import { Innertube, UniversalCache, ClientType } from 'youtubei.js';
import { PassThrough } from 'stream';
import { createLogger } from '../helpers/logger.js';
import { streamAudio } from '../helpers/ytdlp.js';

const log = createLogger('youtube-extractor');

// Regex patterns for YouTube URL detection
const YT_VIDEO_REGEX =
  /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
const YT_PLAYLIST_REGEX =
  /^(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/(?:playlist\?list=|watch\?.*&list=)([a-zA-Z0-9_-]+)/;
const YT_CHANNEL_REGEX =
  /^(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/(?:@|channel\/|c\/)([a-zA-Z0-9_-]+)/;

interface YouTubeExtractorOptions {
  cachePath?: string;
  highWaterMark?: number;
}

/**
 * Custom YouTube extractor using youtubei.js v16 with ANDROID client for
 * reliable streaming (bypasses WEB signature decipher issues).
 *
 * Architecture:
 *  - WEB client → search, metadata, playlist fetching (best data quality)
 *  - ANDROID client → audio streaming (no signature decipher needed)
 */
export class CustomYouTubeExtractor extends BaseExtractor<YouTubeExtractorOptions> {
  static identifier = 'com.downunder.youtube' as const;

  /** WEB client — used for search / metadata / playlists */
  private webYt: Innertube | null = null;
  private webInitPromise: Promise<Innertube> | null = null;

  /** ANDROID client — used exclusively for streaming */
  private androidYt: Innertube | null = null;
  private androidInitPromise: Promise<Innertube> | null = null;

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
    log.info('Deactivated CustomYouTubeExtractor');
  }

  async validate(query: string): Promise<boolean> {
    return (
      YT_VIDEO_REGEX.test(query) ||
      YT_PLAYLIST_REGEX.test(query) ||
      YT_CHANNEL_REGEX.test(query)
    );
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

      for (const video of playlist.videos) {
        const vid = video as unknown as Record<string, unknown>;
        const title = (vid.title as { text?: string })?.text ?? String(vid.title ?? 'Unknown');
        const author =
          (vid.author as { name?: string })?.name ?? String(vid.author ?? 'Unknown Artist');
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
        thumbnail:
          ((info?.thumbnails as Array<{ url: string }>)?.[0]?.url) ?? '',
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
        const author =
          (vid.author as { name?: string })?.name ?? String(vid.author ?? 'Unknown Artist');
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
  /*  Tries youtubei.js download() first, then falls back to yt-dlp     */
  /*  which reliably resolves YouTube stream URLs.                       */
  /* ------------------------------------------------------------------ */

  async stream(track: Track) {
    const videoId = this.extractVideoId(track.url);
    if (!videoId) throw new Error(`Cannot extract video ID from: ${track.url}`);

    // Primary: ANDROID client download — handles range requests, auth headers,
    // and throttle avoidance internally via youtubei.js.
    try {
      const yt = await this.getAndroidYt();
      const stream = await this.pipeDownload(yt, videoId, 'ANDROID');
      log.debug({ videoId, title: track.title }, 'Stream piped via ANDROID client download');
      return stream;
    } catch (err) {
      log.warn({ err, videoId }, 'ANDROID client download failed, trying WEB fallback');
    }

    // Fallback: WEB client download.
    try {
      const yt = await this.getWebYt();
      const stream = await this.pipeDownload(yt, videoId, 'WEB');
      log.debug({ videoId, title: track.title }, 'Stream piped via WEB client download');
      return stream;
    } catch (err) {
      log.warn({ err, videoId }, 'WEB client download failed, trying yt-dlp fallback');
    }

    // Final fallback: yt-dlp — most reliable, handles all YouTube protection.
    try {
      const stream = streamAudio(track.url);
      log.debug({ videoId, title: track.title }, 'Stream piped via yt-dlp');
      return stream;
    } catch (err) {
      log.error({ err, videoId }, 'All stream methods failed (including yt-dlp)');
      throw err;
    }
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

    const settleOk = () => { if (!firstChunkSettled) { firstChunkSettled = true; resolveFirstChunk(); } };
    const settleErr = (e: Error) => { if (!firstChunkSettled) { firstChunkSettled = true; rejectFirstChunk(e); } };

    (async () => {
      try {
        for await (const chunk of iter) {
          bytesWritten += chunk.length;
          if (!passthrough.write(chunk)) {
            await new Promise<void>((resolve) => passthrough.once('drain', resolve));
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
        const author =
          (vid.author as { name?: string })?.name ?? String(vid.author ?? 'Unknown');
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
