import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mock variables (must use vi.hoisted for vi.mock factories) ──────
const { mockTracksGet, mockTracksSearch, mockPlaylistsGet, mockUtilStreamLink, mockCreateResponse } = vi.hoisted(
  () => ({
    mockTracksGet: vi.fn(),
    mockTracksSearch: vi.fn(),
    mockPlaylistsGet: vi.fn(),
    mockUtilStreamLink: vi.fn(),
    mockCreateResponse: vi.fn((_playlist: unknown, tracks: unknown[]) => ({
      playlist: _playlist,
      tracks,
    })),
  }),
);

// ── Mock soundcloud.ts ──────────────────────────────────────────────────────
vi.mock('soundcloud.ts', () => ({
  Soundcloud: class MockSoundCloud {
    tracks = {
      get: mockTracksGet,
      search: mockTracksSearch,
    };
    playlists = {
      get: mockPlaylistsGet,
    };
    util = {
      streamLink: mockUtilStreamLink,
    };
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
    context = { player: {} };
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

// ── Import under test ───────────────────────────────────────────────────────
import { SoundCloudExtractor } from '../../../src/extractors/SoundCloudExtractor';

describe('SoundCloudExtractor', () => {
  let extractor: SoundCloudExtractor;

  beforeEach(async () => {
    vi.clearAllMocks();
    extractor = new SoundCloudExtractor({} as never);
    await extractor.activate();
  });

  /* ------------------------------------------------------------------ */
  /*  validate()                                                         */
  /* ------------------------------------------------------------------ */
  describe('validate', () => {
    it('should accept SoundCloud track URLs', async () => {
      expect(await extractor.validate('https://soundcloud.com/artist-name/track-name')).toBe(true);
    });

    it('should accept SoundCloud playlist/set URLs', async () => {
      expect(await extractor.validate('https://soundcloud.com/artist-name/sets/playlist-name')).toBe(true);
    });

    it('should accept SoundCloud user/profile URLs', async () => {
      expect(await extractor.validate('https://soundcloud.com/artist-name')).toBe(true);
    });

    it('should accept mobile SoundCloud URLs', async () => {
      expect(await extractor.validate('https://m.soundcloud.com/artist-name/track-name')).toBe(true);
    });

    it('should accept www SoundCloud URLs', async () => {
      expect(await extractor.validate('https://www.soundcloud.com/artist-name/track-name')).toBe(true);
    });

    it('should reject non-SoundCloud URLs', async () => {
      expect(await extractor.validate('https://www.youtube.com/watch?v=abc')).toBe(false);
      expect(await extractor.validate('https://open.spotify.com/track/123')).toBe(false);
    });

    it('should reject plain text queries', async () => {
      expect(await extractor.validate('some song name')).toBe(false);
    });
  });

  /* ------------------------------------------------------------------ */
  /*  handle() — track URL                                               */
  /* ------------------------------------------------------------------ */
  describe('handle — track URL', () => {
    it('should fetch a SoundCloud track and return it', async () => {
      mockTracksGet.mockResolvedValue({
        title: 'Test Track',
        user: { username: 'TestArtist' },
        permalink_url: 'https://soundcloud.com/testartist/test-track',
        artwork_url: 'https://artwork.jpg',
        duration: 210000,
      });

      await extractor.handle('https://soundcloud.com/testartist/test-track', { requestedBy: null } as never);

      expect(mockTracksGet).toHaveBeenCalledWith('https://soundcloud.com/testartist/test-track');
      const tracks = mockCreateResponse.mock.calls[0][1];
      expect(tracks).toHaveLength(1);
      expect(tracks[0].title).toBe('Test Track');
      expect(tracks[0].author).toBe('TestArtist');
      expect(tracks[0].source).toBe('soundcloud');
    });

    it('should return empty tracks on API failure', async () => {
      mockTracksGet.mockRejectedValue(new Error('Not found'));

      await extractor.handle('https://soundcloud.com/artist/broken-track', { requestedBy: null } as never);

      const tracks = mockCreateResponse.mock.calls[0][1];
      expect(tracks).toHaveLength(0);
    });
  });

  /* ------------------------------------------------------------------ */
  /*  handle() — playlist URL                                            */
  /* ------------------------------------------------------------------ */
  describe('handle — playlist URL', () => {
    it('should fetch a SoundCloud playlist and return tracks', async () => {
      mockPlaylistsGet.mockResolvedValue({
        title: 'Test Playlist',
        artwork_url: 'https://playlist-art.jpg',
        description: 'A test playlist',
        id: 'pl-123',
        permalink_url: 'https://soundcloud.com/user/sets/test-playlist',
        user: {
          username: 'PlaylistOwner',
          permalink_url: 'https://soundcloud.com/playlistowner',
        },
        tracks: [
          {
            title: 'Playlist Track 1',
            user: { username: 'Artist 1' },
            permalink_url: 'https://soundcloud.com/artist1/track1',
            artwork_url: 'https://art1.jpg',
            duration: 180000,
          },
          {
            title: 'Playlist Track 2',
            user: { username: 'Artist 2' },
            permalink_url: 'https://soundcloud.com/artist2/track2',
            artwork_url: 'https://art2.jpg',
            duration: 240000,
          },
        ],
      });

      await extractor.handle('https://soundcloud.com/user/sets/test-playlist', { requestedBy: null } as never);

      expect(mockPlaylistsGet).toHaveBeenCalledWith('https://soundcloud.com/user/sets/test-playlist');
      // First arg is the playlist, second is tracks array
      const tracks = mockCreateResponse.mock.calls[0][1];
      expect(tracks).toHaveLength(2);
      expect(tracks[0].title).toBe('Playlist Track 1');
      expect(tracks[1].title).toBe('Playlist Track 2');
    });

    it('should return empty tracks on playlist fetch failure', async () => {
      mockPlaylistsGet.mockRejectedValue(new Error('Playlist not found'));

      await extractor.handle('https://soundcloud.com/user/sets/broken-playlist', { requestedBy: null } as never);

      const tracks = mockCreateResponse.mock.calls[0][1];
      expect(tracks).toHaveLength(0);
    });
  });

  /* ------------------------------------------------------------------ */
  /*  handle() — text search                                             */
  /* ------------------------------------------------------------------ */
  describe('handle — text search', () => {
    it('should search SoundCloud and return matching tracks', async () => {
      mockTracksSearch.mockResolvedValue({
        collection: [
          {
            title: 'Search Result 1',
            user: { username: 'Artist A' },
            permalink_url: 'https://soundcloud.com/a/result1',
            artwork_url: 'https://sr1.jpg',
            duration: 200000,
          },
          {
            title: 'Search Result 2',
            user: { username: 'Artist B' },
            permalink_url: 'https://soundcloud.com/b/result2',
            artwork_url: null,
            duration: 150000,
          },
        ],
      });

      // A text query that doesn't match any URL regex goes to handleSearch
      await extractor.handle('electronic music', { requestedBy: null } as never);

      expect(mockTracksSearch).toHaveBeenCalledWith({ q: 'electronic music', limit: 10 });
      const tracks = mockCreateResponse.mock.calls[0][1];
      expect(tracks).toHaveLength(2);
      expect(tracks[0].title).toBe('Search Result 1');
    });

    it('should return empty tracks on search failure', async () => {
      mockTracksSearch.mockRejectedValue(new Error('Search error'));

      await extractor.handle('broken search', { requestedBy: null } as never);

      const tracks = mockCreateResponse.mock.calls[0][1];
      expect(tracks).toHaveLength(0);
    });
  });

  /* ------------------------------------------------------------------ */
  /*  stream()                                                           */
  /* ------------------------------------------------------------------ */
  describe('stream', () => {
    it('should resolve a stream URL via SoundCloud utility', async () => {
      const expectedStreamUrl = 'https://cf-media.sndcdn.com/stream/abc123';
      mockUtilStreamLink.mockResolvedValue(expectedStreamUrl);

      const result = await extractor.stream({
        url: 'https://soundcloud.com/artist/track',
        title: 'Test Track',
      } as never);

      expect(mockUtilStreamLink).toHaveBeenCalledWith('https://soundcloud.com/artist/track');
      expect(result).toBe(expectedStreamUrl);
    });

    it('should throw when stream resolution fails', async () => {
      mockUtilStreamLink.mockRejectedValue(new Error('Stream unavailable'));

      await expect(
        extractor.stream({
          url: 'https://soundcloud.com/artist/broken',
          title: 'Broken',
        } as never),
      ).rejects.toThrow('Stream unavailable');
    });

    it('should throw when SoundCloud client is not initialized', async () => {
      await extractor.deactivate();

      await expect(
        extractor.stream({
          url: 'https://soundcloud.com/artist/track',
          title: 'Test',
        } as never),
      ).rejects.toThrow('SoundCloud client not initialized');
    });
  });

  /* ------------------------------------------------------------------ */
  /*  handle() — no client                                               */
  /* ------------------------------------------------------------------ */
  describe('handle — no client', () => {
    it('should return empty response when SoundCloud client is not initialized', async () => {
      await extractor.deactivate();

      await extractor.handle('https://soundcloud.com/artist/track', { requestedBy: null } as never);

      const tracks = mockCreateResponse.mock.calls[0][1];
      expect(tracks).toHaveLength(0);
    });
  });

  /* ------------------------------------------------------------------ */
  /*  formatDuration                                                     */
  /* ------------------------------------------------------------------ */
  describe('formatDuration (via handle)', () => {
    it('should format milliseconds as M:SS', async () => {
      mockTracksGet.mockResolvedValue({
        title: 'Duration Test',
        user: { username: 'Artist' },
        permalink_url: 'https://soundcloud.com/a/dur',
        artwork_url: '',
        duration: 185000, // 3:05
      });

      await extractor.handle('https://soundcloud.com/a/dur', { requestedBy: null } as never);

      const tracks = mockCreateResponse.mock.calls[0][1];
      expect(tracks[0].duration).toBe('3:05');
    });

    it('should handle zero duration', async () => {
      mockTracksGet.mockResolvedValue({
        title: 'No Duration',
        user: { username: 'Artist' },
        permalink_url: 'https://soundcloud.com/a/nodur',
        artwork_url: '',
        duration: 0,
      });

      await extractor.handle('https://soundcloud.com/a/nodur', { requestedBy: null } as never);

      const tracks = mockCreateResponse.mock.calls[0][1];
      expect(tracks[0].duration).toBe('0:00');
    });
  });

  /* ------------------------------------------------------------------ */
  /*  lifecycle                                                          */
  /* ------------------------------------------------------------------ */
  describe('lifecycle', () => {
    it('should initialize SoundCloud client on activate', async () => {
      // Verify the client is working by calling a method — if activate
      // failed to create the client, handle() would return empty.
      mockTracksGet.mockResolvedValue({
        title: 'Init Test',
        user: { username: 'A' },
        permalink_url: 'https://soundcloud.com/a/init',
        artwork_url: '',
        duration: 1000,
      });

      await extractor.handle('https://soundcloud.com/a/init', { requestedBy: null } as never);

      // If the client was initialized, the tracks.get mock was called
      expect(mockTracksGet).toHaveBeenCalled();
    });

    it('should nullify client on deactivate', async () => {
      await extractor.deactivate();

      // After deactivation, handle should return empty
      await extractor.handle('https://soundcloud.com/artist/track', { requestedBy: null } as never);

      const tracks = mockCreateResponse.mock.calls[0][1];
      expect(tracks).toHaveLength(0);
    });
  });
});
