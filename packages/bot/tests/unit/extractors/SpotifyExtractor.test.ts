import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mock variables (must use vi.hoisted for vi.mock factories) ──────
const {
  mockClientCredentialsGrant,
  mockSetAccessToken,
  mockGetTrack,
  mockGetPlaylist,
  mockGetPlaylistTracks,
  mockGetAlbum,
  mockGetArtistTopTracks,
  mockSearchTracks,
  mockCreateResponse,
  mockPlayerSearch,
} = vi.hoisted(() => ({
  mockClientCredentialsGrant: vi.fn(),
  mockSetAccessToken: vi.fn(),
  mockGetTrack: vi.fn(),
  mockGetPlaylist: vi.fn(),
  mockGetPlaylistTracks: vi.fn(),
  mockGetAlbum: vi.fn(),
  mockGetArtistTopTracks: vi.fn(),
  mockSearchTracks: vi.fn(),
  mockCreateResponse: vi.fn((_playlist: unknown, tracks: unknown[]) => ({
    playlist: _playlist,
    tracks,
  })),
  mockPlayerSearch: vi.fn(),
}));

// ── Mock spotify-web-api-node ───────────────────────────────────────────────
vi.mock('spotify-web-api-node', () => {
  return {
    default: class MockSpotifyWebApi {
      clientCredentialsGrant = mockClientCredentialsGrant;
      setAccessToken = mockSetAccessToken;
      getTrack = mockGetTrack;
      getPlaylist = mockGetPlaylist;
      getPlaylistTracks = mockGetPlaylistTracks;
      getAlbum = mockGetAlbum;
      getArtistTopTracks = mockGetArtistTopTracks;
      searchTracks = mockSearchTracks;
    },
  };
});

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
    context = { player: { search: mockPlayerSearch } };
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
import { SpotifyExtractor } from '../../../src/extractors/SpotifyExtractor';

describe('SpotifyExtractor', () => {
  let extractor: SpotifyExtractor;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Default: token grant succeeds
    mockClientCredentialsGrant.mockResolvedValue({
      body: { access_token: 'test-token', expires_in: 3600 },
    });

    extractor = new SpotifyExtractor({} as never, {
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
    });
    await extractor.activate();
  });

  /* ------------------------------------------------------------------ */
  /*  validate()                                                         */
  /* ------------------------------------------------------------------ */
  describe('validate', () => {
    it('should accept Spotify track URLs', async () => {
      expect(await extractor.validate('https://open.spotify.com/track/6rqhFgbbKwnb9MLmUQDhG6')).toBe(true);
    });

    it('should accept Spotify playlist URLs', async () => {
      expect(await extractor.validate('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M')).toBe(true);
    });

    it('should accept Spotify album URLs', async () => {
      expect(await extractor.validate('https://open.spotify.com/album/1DFixLWuPkv3KT3TnV35m3')).toBe(true);
    });

    it('should accept Spotify artist URLs', async () => {
      expect(await extractor.validate('https://open.spotify.com/artist/4Z8W4fKeB5YxbusRsdQVPb')).toBe(true);
    });

    it('should accept Spotify URLs with intl prefix', async () => {
      expect(await extractor.validate('https://open.spotify.com/intl-au/track/6rqhFgbbKwnb9MLmUQDhG6')).toBe(true);
    });

    it('should reject non-Spotify URLs', async () => {
      expect(await extractor.validate('https://www.youtube.com/watch?v=abc')).toBe(false);
      expect(await extractor.validate('https://soundcloud.com/artist/track')).toBe(false);
    });

    it('should reject plain text queries', async () => {
      expect(await extractor.validate('some song name')).toBe(false);
    });
  });

  /* ------------------------------------------------------------------ */
  /*  handle() - single track                                            */
  /* ------------------------------------------------------------------ */
  describe('handle - track URL', () => {
    it('should fetch Spotify track metadata and return a track', async () => {
      mockGetTrack.mockResolvedValue({
        body: {
          name: 'Test Song',
          artists: [{ name: 'Test Artist' }],
          album: {
            images: [{ url: 'https://album-art.jpg' }],
          },
          duration_ms: 210000,
          external_urls: { spotify: 'https://open.spotify.com/track/abc123' },
        },
      });

      await extractor.handle('https://open.spotify.com/track/abc123', { requestedBy: null } as never);

      expect(mockGetTrack).toHaveBeenCalledWith('abc123');
      const tracks = mockCreateResponse.mock.calls[0][1];
      expect(tracks).toHaveLength(1);
      expect(tracks[0].title).toBe('Test Song');
      expect(tracks[0].author).toBe('Test Artist');
      expect(tracks[0].source).toBe('spotify');
    });

    it('should return empty tracks on API failure', async () => {
      mockGetTrack.mockRejectedValue(new Error('API error'));

      await extractor.handle('https://open.spotify.com/track/abc123', { requestedBy: null } as never);

      const tracks = mockCreateResponse.mock.calls[0][1];
      expect(tracks).toHaveLength(0);
    });
  });

  /* ------------------------------------------------------------------ */
  /*  handle() - playlist                                                */
  /* ------------------------------------------------------------------ */
  describe('handle - playlist URL', () => {
    it('should fetch Spotify playlist and return tracks', async () => {
      mockGetPlaylist.mockResolvedValue({
        body: {
          name: 'My Playlist',
          description: 'A test playlist',
          images: [{ url: 'https://playlist-art.jpg' }],
          owner: {
            display_name: 'TestUser',
            external_urls: { spotify: 'https://open.spotify.com/user/testuser' },
          },
          external_urls: { spotify: 'https://open.spotify.com/playlist/pl123' },
          tracks: {
            items: [
              {
                track: {
                  name: 'Playlist Track 1',
                  artists: [{ name: 'Artist 1' }],
                  album: { images: [{ url: 'https://art1.jpg' }] },
                  duration_ms: 180000,
                  external_urls: { spotify: 'https://open.spotify.com/track/pt1' },
                },
              },
              {
                track: {
                  name: 'Playlist Track 2',
                  artists: [{ name: 'Artist 2' }],
                  album: { images: [{ url: 'https://art2.jpg' }] },
                  duration_ms: 240000,
                  external_urls: { spotify: 'https://open.spotify.com/track/pt2' },
                },
              },
            ],
            next: null,
          },
        },
      });

      await extractor.handle('https://open.spotify.com/playlist/pl123', { requestedBy: null } as never);

      const tracks = mockCreateResponse.mock.calls[0][1];
      expect(tracks).toHaveLength(2);
      expect(tracks[0].title).toBe('Playlist Track 1');
      expect(tracks[1].title).toBe('Playlist Track 2');
    });

    it('should skip null tracks in playlist', async () => {
      mockGetPlaylist.mockResolvedValue({
        body: {
          name: 'Sparse Playlist',
          description: '',
          images: [],
          owner: { display_name: 'User', external_urls: {} },
          external_urls: { spotify: '' },
          tracks: {
            items: [
              { track: null },
              {
                track: {
                  name: 'Valid Track',
                  artists: [{ name: 'Artist' }],
                  album: { images: [] },
                  duration_ms: 200000,
                  external_urls: { spotify: '' },
                },
              },
            ],
            next: null,
          },
        },
      });

      await extractor.handle('https://open.spotify.com/playlist/sparse123', { requestedBy: null } as never);

      const tracks = mockCreateResponse.mock.calls[0][1];
      expect(tracks).toHaveLength(1);
      expect(tracks[0].title).toBe('Valid Track');
    });
  });

  /* ------------------------------------------------------------------ */
  /*  handle() - album                                                   */
  /* ------------------------------------------------------------------ */
  describe('handle - album URL', () => {
    it('should fetch Spotify album and return tracks', async () => {
      mockGetAlbum.mockResolvedValue({
        body: {
          name: 'Test Album',
          images: [{ url: 'https://album-cover.jpg' }],
          artists: [{ name: 'Album Artist', external_urls: { spotify: 'https://open.spotify.com/artist/aa1' } }],
          external_urls: { spotify: 'https://open.spotify.com/album/alb123' },
          tracks: {
            items: [
              {
                name: 'Album Track 1',
                artists: [{ name: 'Album Artist' }],
                external_urls: { spotify: 'https://open.spotify.com/track/at1' },
                duration_ms: 190000,
              },
              {
                name: 'Album Track 2',
                artists: [{ name: 'Album Artist' }],
                external_urls: { spotify: 'https://open.spotify.com/track/at2' },
                duration_ms: 220000,
              },
            ],
          },
        },
      });

      await extractor.handle('https://open.spotify.com/album/alb123', { requestedBy: null } as never);

      expect(mockGetAlbum).toHaveBeenCalledWith('alb123');
      const tracks = mockCreateResponse.mock.calls[0][1];
      expect(tracks).toHaveLength(2);
    });
  });

  /* ------------------------------------------------------------------ */
  /*  handle() - artist                                                  */
  /* ------------------------------------------------------------------ */
  describe('handle - artist URL', () => {
    it('should fetch artist top tracks', async () => {
      mockGetArtistTopTracks.mockResolvedValue({
        body: {
          tracks: [
            {
              name: 'Top Hit',
              artists: [{ name: 'Famous Artist' }],
              album: { images: [{ url: 'https://art.jpg' }] },
              duration_ms: 200000,
              external_urls: { spotify: 'https://open.spotify.com/track/th1' },
            },
          ],
        },
      });

      await extractor.handle('https://open.spotify.com/artist/art123', { requestedBy: null } as never);

      expect(mockGetArtistTopTracks).toHaveBeenCalledWith('art123', 'US');
      const tracks = mockCreateResponse.mock.calls[0][1];
      expect(tracks).toHaveLength(1);
      expect(tracks[0].title).toBe('Top Hit');
    });
  });

  /* ------------------------------------------------------------------ */
  /*  handle() - text search                                             */
  /* ------------------------------------------------------------------ */
  describe('handle - text search', () => {
    it('should search Spotify and return tracks', async () => {
      mockSearchTracks.mockResolvedValue({
        body: {
          tracks: {
            items: [
              {
                name: 'Found Song',
                artists: [{ name: 'Found Artist' }],
                album: { images: [{ url: 'https://found-art.jpg' }] },
                duration_ms: 195000,
                external_urls: { spotify: 'https://open.spotify.com/track/fs1' },
              },
            ],
          },
        },
      });

      // A text query that doesn't match any URL pattern falls through to handleSearch
      await extractor.handle('never gonna give you up', { requestedBy: null } as never);

      expect(mockSearchTracks).toHaveBeenCalledWith('never gonna give you up', { limit: 10 });
      const tracks = mockCreateResponse.mock.calls[0][1];
      expect(tracks).toHaveLength(1);
      expect(tracks[0].title).toBe('Found Song');
    });
  });

  /* ------------------------------------------------------------------ */
  /*  stream() - Spotify-to-YouTube bridge                               */
  /* ------------------------------------------------------------------ */
  describe('stream', () => {
    it('should bridge to YouTube by searching for track title + author', async () => {
      mockPlayerSearch.mockResolvedValue({
        tracks: [{ url: 'https://www.youtube.com/watch?v=bridged123', title: 'Bridged Track' }],
      });

      const result = await extractor.stream({
        title: 'Test Song',
        author: 'Test Artist',
        url: 'https://open.spotify.com/track/abc',
      } as never);

      expect(mockPlayerSearch).toHaveBeenCalledWith('Test Song Test Artist', {
        searchEngine: 'youtubeSearch',
      });
      expect(result).toBe('https://www.youtube.com/watch?v=bridged123');
    });

    it('should throw when no YouTube result is found', async () => {
      mockPlayerSearch.mockResolvedValue({ tracks: [] });

      await expect(
        extractor.stream({
          title: 'Obscure Song',
          author: 'Unknown',
          url: 'https://open.spotify.com/track/xyz',
        } as never),
      ).rejects.toThrow('No YouTube result found');
    });
  });

  /* ------------------------------------------------------------------ */
  /*  handle() without credentials                                       */
  /* ------------------------------------------------------------------ */
  describe('handle - no credentials', () => {
    it('should return empty response when Spotify API is not initialized', async () => {
      const noCredExtractor = new SpotifyExtractor({} as never, {});
      // activate without env vars or options
      delete (process.env as Record<string, string | undefined>).SPOTIFY_CLIENT_ID;
      delete (process.env as Record<string, string | undefined>).SPOTIFY_CLIENT_SECRET;
      await noCredExtractor.activate();

      await noCredExtractor.handle('https://open.spotify.com/track/abc', { requestedBy: null } as never);

      const tracks = mockCreateResponse.mock.calls[0][1];
      expect(tracks).toHaveLength(0);
    });
  });

  /* ------------------------------------------------------------------ */
  /*  formatDuration                                                     */
  /* ------------------------------------------------------------------ */
  describe('formatDuration (via handle)', () => {
    it('should format milliseconds as M:SS', async () => {
      mockGetTrack.mockResolvedValue({
        body: {
          name: 'Duration Test',
          artists: [{ name: 'Artist' }],
          album: { images: [] },
          duration_ms: 185000, // 3:05
          external_urls: { spotify: '' },
        },
      });

      await extractor.handle('https://open.spotify.com/track/dur1', { requestedBy: null } as never);

      const tracks = mockCreateResponse.mock.calls[0][1];
      expect(tracks[0].duration).toBe('3:05');
    });
  });

  /* ------------------------------------------------------------------ */
  /*  lifecycle                                                          */
  /* ------------------------------------------------------------------ */
  describe('lifecycle', () => {
    it('should clean up on deactivate', async () => {
      await extractor.deactivate();
      // After deactivation, handle should return empty
      await extractor.handle('https://open.spotify.com/track/abc', { requestedBy: null } as never);
      const tracks = mockCreateResponse.mock.calls[0][1];
      expect(tracks).toHaveLength(0);
    });
  });
});
