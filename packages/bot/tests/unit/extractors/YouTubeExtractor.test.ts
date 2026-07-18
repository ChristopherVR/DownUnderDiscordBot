import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PassThrough } from 'stream';

// ── Hoisted mock variables (must use vi.hoisted for vi.mock factories) ──────
const { mockGetBasicInfo, mockGetPlaylist, mockSearch, mockDownload, mockCreateResponse, mockYtDlpStreamAudio } =
  vi.hoisted(() => ({
    mockGetBasicInfo: vi.fn(),
    mockGetPlaylist: vi.fn(),
    mockSearch: vi.fn(),
    mockDownload: vi.fn(),
    mockYtDlpStreamAudio: vi.fn(),
    mockCreateResponse: vi.fn((_playlist: unknown, tracks: unknown[]) => ({
      playlist: _playlist,
      tracks,
    })),
  }));

// ── Mock youtubei.js ────────────────────────────────────────────────────────
vi.mock('youtubei.js', () => ({
  Innertube: {
    create: vi.fn().mockResolvedValue({
      getBasicInfo: mockGetBasicInfo,
      getPlaylist: mockGetPlaylist,
      search: mockSearch,
      download: mockDownload,
    }),
  },
  UniversalCache: vi.fn(),
  ClientType: {
    WEB: 'WEB',
    ANDROID: 'ANDROID',
  },
}));

// ── Mock discord-player ─────────────────────────────────────────────────────
vi.mock('discord-player', () => {
  class MockTrack {
    player: unknown;
    data: Record<string, unknown>;
    extractor: unknown = null;
    title: string;
    author: string;
    url: string;
    thumbnail: string;
    duration: string;
    source: string;

    constructor(player: unknown, data: Record<string, unknown>) {
      this.player = player;
      this.data = data;
      this.title = String(data.title ?? '');
      this.author = String(data.author ?? '');
      this.url = String(data.url ?? '');
      this.thumbnail = String(data.thumbnail ?? '');
      this.duration = String(data.duration ?? '');
      this.source = String(data.source ?? '');
    }
  }

  class MockPlaylist {
    player: unknown;
    data: Record<string, unknown>;

    constructor(player: unknown, data: Record<string, unknown>) {
      this.player = player;
      this.data = data;
    }
  }

  class MockBaseExtractor {
    context = { player: { search: vi.fn() } };
    options: Record<string, unknown> = {};
    createResponse = mockCreateResponse;

    constructor(_ctx: unknown, opts?: Record<string, unknown>) {
      this.options = opts ?? {};
    }
  }

  return {
    BaseExtractor: MockBaseExtractor,
    Track: MockTrack,
    Playlist: MockPlaylist,
  };
});

// ── Mock logger ─────────────────────────────────────────────────────────────
vi.mock('../../../src/helpers/logger.js', () => ({
  createLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// ── Mock yt-dlp helper (tertiary streaming fallback) ────────────────────────
vi.mock('../../../src/helpers/ytdlp.js', () => ({
  streamAudio: mockYtDlpStreamAudio,
  getAudioStreamUrl: vi.fn(),
  checkYtDlp: vi.fn(),
}));

// ── Import under test (after mocks) ────────────────────────────────────────
import { CustomYouTubeExtractor } from '../../../src/extractors/YouTubeExtractor';

describe('CustomYouTubeExtractor', () => {
  let extractor: CustomYouTubeExtractor;

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: yt-dlp fallback is unavailable in unit tests. Individual
    // tests override this when exercising the tertiary path.
    mockYtDlpStreamAudio.mockRejectedValue(new Error('yt-dlp unavailable in tests'));
    extractor = new CustomYouTubeExtractor({} as never);
  });

  /* ------------------------------------------------------------------ */
  /*  validate()                                                         */
  /* ------------------------------------------------------------------ */
  describe('validate', () => {
    it('should accept standard YouTube video URLs', async () => {
      expect(await extractor.validate('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
    });

    it('should accept youtu.be short URLs', async () => {
      expect(await extractor.validate('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
    });

    it('should accept YouTube embed URLs', async () => {
      expect(await extractor.validate('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(true);
    });

    it('should accept YouTube shorts URLs', async () => {
      expect(await extractor.validate('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe(true);
    });

    it('should accept YouTube playlist URLs', async () => {
      expect(await extractor.validate('https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf')).toBe(
        true,
      );
    });

    it('should accept YouTube channel URLs', async () => {
      expect(await extractor.validate('https://www.youtube.com/@ChannelName')).toBe(true);
      expect(await extractor.validate('https://www.youtube.com/channel/UCxxxxxx')).toBe(true);
    });

    it('should reject non-YouTube URLs', async () => {
      expect(await extractor.validate('https://www.spotify.com/track/123')).toBe(false);
      expect(await extractor.validate('https://soundcloud.com/artist/track')).toBe(false);
    });

    it('should reject plain text queries', async () => {
      expect(await extractor.validate('never gonna give you up')).toBe(false);
    });

    it('should accept mobile YouTube URLs', async () => {
      expect(await extractor.validate('https://m.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
    });
  });

  /* ------------------------------------------------------------------ */
  /*  handle() - video                                                   */
  /* ------------------------------------------------------------------ */
  describe('handle - video URL', () => {
    it('should fetch video info and return a track', async () => {
      mockGetBasicInfo.mockResolvedValue({
        basic_info: {
          title: 'Test Video',
          author: 'Test Author',
          duration: 210,
          thumbnail: [{ url: 'https://i.ytimg.com/vi/abc/hqdefault.jpg' }],
        },
      });

      await extractor.activate();
      await extractor.handle('https://www.youtube.com/watch?v=dQw4w9WgXcQ', { requestedBy: null } as never);

      expect(mockGetBasicInfo).toHaveBeenCalledWith('dQw4w9WgXcQ');
      expect(mockCreateResponse).toHaveBeenCalled();
      const tracks = mockCreateResponse.mock.calls[0][1];
      expect(tracks).toHaveLength(1);
      expect(tracks[0].title).toBe('Test Video');
      expect(tracks[0].author).toBe('Test Author');
      expect(tracks[0].url).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    });

    it('should return empty tracks on API failure', async () => {
      mockGetBasicInfo.mockRejectedValue(new Error('Network error'));

      await extractor.activate();
      await extractor.handle('https://www.youtube.com/watch?v=dQw4w9WgXcQ', { requestedBy: null } as never);

      const tracks = mockCreateResponse.mock.calls[0][1];
      expect(tracks).toHaveLength(0);
    });
  });

  /* ------------------------------------------------------------------ */
  /*  handle() - playlist                                                */
  /* ------------------------------------------------------------------ */
  describe('handle - playlist URL', () => {
    it('should fetch playlist and return multiple tracks', async () => {
      mockGetPlaylist.mockResolvedValue({
        videos: [
          {
            title: { text: 'Track 1' },
            author: { name: 'Artist 1' },
            id: 'vid1',
            duration: { seconds: 180 },
            thumbnails: [{ url: 'https://thumb1.jpg' }],
          },
          {
            title: { text: 'Track 2' },
            author: { name: 'Artist 2' },
            id: 'vid2',
            duration: { seconds: 240 },
            thumbnails: [{ url: 'https://thumb2.jpg' }],
          },
        ],
        info: {
          title: 'Test Playlist',
          thumbnails: [{ url: 'https://playlist-thumb.jpg' }],
        },
      });

      await extractor.activate();
      await extractor.handle('https://www.youtube.com/playlist?list=PLtest123', { requestedBy: null } as never);

      expect(mockGetPlaylist).toHaveBeenCalledWith('PLtest123');
      const tracks = mockCreateResponse.mock.calls[0][1];
      expect(tracks).toHaveLength(2);
      expect(tracks[0].title).toBe('Track 1');
      expect(tracks[1].title).toBe('Track 2');
    });
  });

  /* ------------------------------------------------------------------ */
  /*  handle() - search                                                  */
  /* ------------------------------------------------------------------ */
  describe('handle - text search', () => {
    it('should search YouTube and return matching tracks', async () => {
      mockSearch.mockResolvedValue({
        results: [
          {
            type: 'Video',
            title: { text: 'Search Result 1' },
            author: { name: 'Artist A' },
            video_id: 'sr1',
            length_text: { text: '3:45' },
            thumbnails: [{ url: 'https://sr-thumb1.jpg' }],
          },
          {
            type: 'Video',
            title: { text: 'Search Result 2' },
            author: { name: 'Artist B' },
            video_id: 'sr2',
            length_text: { text: '4:20' },
            thumbnails: [{ url: 'https://sr-thumb2.jpg' }],
          },
          {
            type: 'Channel',
            title: { text: 'Some Channel' },
          },
        ],
      });

      await extractor.activate();
      await extractor.handle('never gonna give you up', { requestedBy: null } as never);

      expect(mockSearch).toHaveBeenCalledWith('never gonna give you up', { type: 'video' });
      const tracks = mockCreateResponse.mock.calls[0][1];
      // Should skip the Channel result
      expect(tracks).toHaveLength(2);
      expect(tracks[0].title).toBe('Search Result 1');
      expect(tracks[0].duration).toBe('3:45');
    });

    it('should limit search results to 10', async () => {
      const manyResults = Array.from({ length: 15 }, (_, i) => ({
        type: 'Video',
        title: { text: `Video ${i}` },
        author: { name: `Author ${i}` },
        video_id: `v${i}`,
        length_text: { text: '3:00' },
        thumbnails: [{ url: `https://thumb${i}.jpg` }],
      }));
      mockSearch.mockResolvedValue({ results: manyResults });

      await extractor.activate();
      await extractor.handle('lots of results', { requestedBy: null } as never);

      const tracks = mockCreateResponse.mock.calls[0][1];
      expect(tracks).toHaveLength(10);
    });

    it('should return empty tracks on search failure', async () => {
      mockSearch.mockRejectedValue(new Error('Search error'));

      await extractor.activate();
      await extractor.handle('broken search', { requestedBy: null } as never);

      const tracks = mockCreateResponse.mock.calls[0][1];
      expect(tracks).toHaveLength(0);
    });
  });

  /* ------------------------------------------------------------------ */
  /*  stream()                                                           */
  /* ------------------------------------------------------------------ */
  describe('stream', () => {
    it('should return a PassThrough stream from ANDROID client', async () => {
      const fakeChunk = Buffer.from('fake-audio-data');

      mockDownload.mockResolvedValue(
        (async function* () {
          yield fakeChunk;
        })(),
      );

      await extractor.activate();
      const stream = await extractor.stream({
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: 'Test',
      } as never);

      expect(stream).toBeInstanceOf(PassThrough);
    });

    it('should throw when video ID cannot be extracted', async () => {
      await extractor.activate();
      await expect(extractor.stream({ url: 'not-a-url', title: 'Test' } as never)).rejects.toThrow(
        'Cannot extract video ID',
      );
    });

    it('should fall back to WEB client when ANDROID fails', async () => {
      const fakeChunk = Buffer.from('web-audio-data');

      // First call (ANDROID) rejects, second call (WEB) resolves
      let callCount = 0;
      mockDownload.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          throw new Error('ANDROID client failed');
        }
        return (async function* () {
          yield fakeChunk;
        })();
      });

      await extractor.activate();
      const stream = await extractor.stream({
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: 'Test',
      } as never);

      expect(stream).toBeInstanceOf(PassThrough);
      expect(callCount).toBe(2);
    });

    it('should throw when all clients fail', async () => {
      mockDownload.mockRejectedValue(new Error('All clients failed'));

      await extractor.activate();
      await expect(
        extractor.stream({
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          title: 'Test',
        } as never),
      ).rejects.toThrow();
    });
  });

  /* ------------------------------------------------------------------ */
  /*  lifecycle                                                          */
  /* ------------------------------------------------------------------ */
  describe('lifecycle', () => {
    it('should initialize Innertube instances on activate', async () => {
      const { Innertube } = await import('youtubei.js');
      await extractor.activate();
      // WEB and ANDROID clients created
      expect(Innertube.create).toHaveBeenCalledTimes(2);
    });

    it('should clean up on deactivate', async () => {
      await extractor.activate();
      await extractor.deactivate();
      // No error thrown - internals nulled out
    });
  });

  /* ------------------------------------------------------------------ */
  /*  formatDuration (tested indirectly through handle)                   */
  /* ------------------------------------------------------------------ */
  describe('formatDuration (via handle)', () => {
    it('should format duration with hours', async () => {
      mockGetBasicInfo.mockResolvedValue({
        basic_info: {
          title: 'Long Video',
          author: 'Author',
          duration: 3661, // 1:01:01
          thumbnail: [{ url: 'https://thumb.jpg' }],
        },
      });

      await extractor.activate();
      await extractor.handle('https://www.youtube.com/watch?v=dQw4w9WgXcQ', { requestedBy: null } as never);

      const tracks = mockCreateResponse.mock.calls[0][1];
      expect(tracks[0].duration).toBe('1:01:01');
    });

    it('should format duration without hours', async () => {
      mockGetBasicInfo.mockResolvedValue({
        basic_info: {
          title: 'Short Video',
          author: 'Author',
          duration: 125, // 2:05
          thumbnail: [{ url: 'https://thumb.jpg' }],
        },
      });

      await extractor.activate();
      await extractor.handle('https://www.youtube.com/watch?v=dQw4w9WgXcQ', { requestedBy: null } as never);

      const tracks = mockCreateResponse.mock.calls[0][1];
      expect(tracks[0].duration).toBe('2:05');
    });

    it('should handle zero/missing duration', async () => {
      mockGetBasicInfo.mockResolvedValue({
        basic_info: {
          title: 'Live Stream',
          author: 'Author',
          duration: undefined,
          thumbnail: [],
        },
      });

      await extractor.activate();
      await extractor.handle('https://www.youtube.com/watch?v=dQw4w9WgXcQ', { requestedBy: null } as never);

      const tracks = mockCreateResponse.mock.calls[0][1];
      expect(tracks[0].duration).toBe('0:00');
    });
  });
});
