import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Readable } from 'stream';

// ── Hoisted mock variables (must use vi.hoisted for vi.mock factories) ──────
const { mockAccess, mockReaddir, mockCreateReadStream, mockParseFile, mockCreateResponse } = vi.hoisted(() => ({
  mockAccess: vi.fn(),
  mockReaddir: vi.fn(),
  mockCreateReadStream: vi.fn(),
  mockParseFile: vi.fn(),
  mockCreateResponse: vi.fn((_playlist: unknown, tracks: unknown[]) => ({
    playlist: _playlist,
    tracks,
  })),
}));

// ── Mock fs (both promises and createReadStream) ────────────────────────────
vi.mock('fs', () => {
  return {
    promises: {
      access: mockAccess,
      readdir: mockReaddir,
    },
    createReadStream: mockCreateReadStream,
  };
});

// ── Mock music-metadata ─────────────────────────────────────────────────────
vi.mock('music-metadata', () => ({
  parseFile: mockParseFile,
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
import { LocalExtractor } from '../../../src/extractors/LocalExtractor';

describe('LocalExtractor', () => {
  let extractor: LocalExtractor;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Default: file access checks succeed, EXCEPT for the uploads/audio
    // directory that activate() probes - reject that so it doesn't add
    // an extra folder to musicFolders.
    mockAccess.mockImplementation(async (p: string) => {
      if (typeof p === 'string' && p.includes('uploads')) {
        throw new Error('ENOENT');
      }
    });

    // Default: createReadStream returns a Readable
    mockCreateReadStream.mockReturnValue(
      new Readable({
        read() {
          this.push(null);
        },
      }),
    );

    // Default: music-metadata returns basic info
    mockParseFile.mockResolvedValue({
      common: {
        title: 'Test Song',
        artist: 'Test Artist',
        album: 'Test Album',
        picture: null,
      },
      format: {
        duration: 185.5,
      },
    });

    extractor = new LocalExtractor({} as never, {
      musicFolders: ['/music/library'],
    });

    await extractor.activate();

    // Reset mockAccess after activate so tests get a clean default (resolves)
    mockAccess.mockResolvedValue(undefined);
  });

  /* ------------------------------------------------------------------ */
  /*  validate()                                                         */
  /* ------------------------------------------------------------------ */
  describe('validate', () => {
    it('should accept file:// protocol URLs', async () => {
      expect(await extractor.validate('file:///music/song.mp3')).toBe(true);
    });

    it('should accept absolute paths to audio files', async () => {
      mockAccess.mockResolvedValue(undefined);
      expect(await extractor.validate('/music/library/song.mp3')).toBe(true);
    });

    it('should accept various audio extensions', async () => {
      const extensions = ['.mp3', '.flac', '.wav', '.ogg', '.m4a', '.aac', '.wma', '.opus', '.webm'];
      for (const ext of extensions) {
        mockAccess.mockResolvedValue(undefined);
        expect(await extractor.validate(`/music/song${ext}`)).toBe(true);
      }
    });

    it('should accept video extensions', async () => {
      const extensions = ['.mp4', '.mkv', '.avi', '.mov'];
      for (const ext of extensions) {
        mockAccess.mockResolvedValue(undefined);
        expect(await extractor.validate(`/music/video${ext}`)).toBe(true);
      }
    });

    it('should reject non-media file extensions', async () => {
      expect(await extractor.validate('/documents/readme.txt')).toBe(false);
      expect(await extractor.validate('/images/photo.png')).toBe(false);
    });

    it('should reject URLs that are not local files', async () => {
      expect(await extractor.validate('https://www.youtube.com/watch?v=abc')).toBe(false);
      expect(await extractor.validate('https://open.spotify.com/track/123')).toBe(false);
    });

    it('should reject paths to files that do not exist', async () => {
      mockAccess.mockRejectedValue(new Error('ENOENT'));
      expect(await extractor.validate('/nonexistent/song.mp3')).toBe(false);
    });

    it('should reject plain text queries', async () => {
      expect(await extractor.validate('some random search')).toBe(false);
    });
  });

  /* ------------------------------------------------------------------ */
  /*  handle()                                                           */
  /* ------------------------------------------------------------------ */
  describe('handle', () => {
    it('should create a track from a local file path', async () => {
      await extractor.handle('/music/library/song.mp3', { requestedBy: null } as never);

      expect(mockAccess).toHaveBeenCalledWith('/music/library/song.mp3');
      const tracks = mockCreateResponse.mock.calls[0][1];
      expect(tracks).toHaveLength(1);
      expect(tracks[0].title).toBe('Test Song');
      expect(tracks[0].author).toBe('Test Artist');
      expect(tracks[0].url).toBe('/music/library/song.mp3');
      expect(tracks[0].source).toBe('arbitrary');
    });

    it('should use filename as title when metadata has no title', async () => {
      mockParseFile.mockResolvedValue({
        common: { title: undefined, artist: undefined, picture: null },
        format: { duration: undefined },
      });

      await extractor.handle('/music/my-cool-song.flac', { requestedBy: null } as never);

      const tracks = mockCreateResponse.mock.calls[0][1];
      expect(tracks[0].title).toBe('my-cool-song');
    });

    it('should return empty tracks when file does not exist', async () => {
      mockAccess.mockRejectedValue(new Error('ENOENT'));

      await extractor.handle('/nonexistent/song.mp3', { requestedBy: null } as never);

      const tracks = mockCreateResponse.mock.calls[0][1];
      expect(tracks).toHaveLength(0);
    });

    it('should handle file:// URLs', async () => {
      // On Windows, file URLs must include a drive letter: file:///C:/...
      const fileUrl =
        process.platform === 'win32' ? 'file:///C:/music/library/song.mp3' : 'file:///music/library/song.mp3';

      await extractor.handle(fileUrl, { requestedBy: null } as never);

      const tracks = mockCreateResponse.mock.calls[0][1];
      expect(tracks).toHaveLength(1);
    });

    it('should extract embedded album art as base64 data URI', async () => {
      mockParseFile.mockResolvedValue({
        common: {
          title: 'Art Song',
          artist: 'Art Artist',
          picture: [{ format: 'image/jpeg', data: Buffer.from('fake-image-data') }],
        },
        format: { duration: 200 },
      });

      await extractor.handle('/music/art-song.mp3', { requestedBy: null } as never);

      const tracks = mockCreateResponse.mock.calls[0][1];
      expect(tracks[0].thumbnail).toContain('data:image/jpeg;base64,');
    });

    it('should format duration correctly', async () => {
      mockParseFile.mockResolvedValue({
        common: { title: 'Dur Test', artist: 'A', picture: null },
        format: { duration: 125.7 },
      });

      await extractor.handle('/music/dur-test.mp3', { requestedBy: null } as never);

      const tracks = mockCreateResponse.mock.calls[0][1];
      // 126 seconds -> 2:06
      expect(tracks[0].duration).toBe('2:06');
    });
  });

  /* ------------------------------------------------------------------ */
  /*  stream() - CRITICAL: must return ReadStream, NOT a string path     */
  /* ------------------------------------------------------------------ */
  describe('stream', () => {
    it('should return a Readable stream, NOT a string path', async () => {
      const fakeReadStream = new Readable({
        read() {
          this.push(null);
        },
      });
      mockCreateReadStream.mockReturnValue(fakeReadStream);

      const result = await extractor.stream({
        url: '/music/library/song.mp3',
        title: 'Test',
      } as never);

      // CRITICAL: Returning a string causes discord-player to use FFMPEG_ARGS_STRING
      // which adds -reconnect flags only valid for HTTP(S), breaking local playback.
      expect(typeof result).not.toBe('string');
      expect(result).toBeInstanceOf(Readable);
      expect(mockCreateReadStream).toHaveBeenCalledWith('/music/library/song.mp3');
    });

    it('should pass the track URL to createReadStream', async () => {
      const fakeReadStream = new Readable({
        read() {
          this.push(null);
        },
      });
      mockCreateReadStream.mockReturnValue(fakeReadStream);

      const filePath = '/home/user/music/my-song.flac';
      await extractor.stream({ url: filePath, title: 'My Song' } as never);

      expect(mockCreateReadStream).toHaveBeenCalledWith(filePath);
    });

    it('should return a new stream for each call', async () => {
      const stream1 = new Readable({
        read() {
          this.push(null);
        },
      });
      const stream2 = new Readable({
        read() {
          this.push(null);
        },
      });
      mockCreateReadStream.mockReturnValueOnce(stream1).mockReturnValueOnce(stream2);

      const result1 = await extractor.stream({ url: '/music/a.mp3', title: 'A' } as never);
      const result2 = await extractor.stream({ url: '/music/b.mp3', title: 'B' } as never);

      expect(result1).not.toBe(result2);
      expect(result1).toBe(stream1);
      expect(result2).toBe(stream2);
    });
  });

  /* ------------------------------------------------------------------ */
  /*  searchLocal()                                                      */
  /* ------------------------------------------------------------------ */
  describe('searchLocal', () => {
    it('should find matching files in music folders', async () => {
      mockReaddir.mockResolvedValue([
        { name: 'test-song.mp3', isDirectory: () => false, isFile: () => true },
        { name: 'other-track.flac', isDirectory: () => false, isFile: () => true },
        { name: 'readme.txt', isDirectory: () => false, isFile: () => true },
      ]);

      const results = await extractor.searchLocal('test');

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Test Song');
    });

    it('should search recursively in subdirectories', async () => {
      // First call: root directory
      mockReaddir
        .mockResolvedValueOnce([{ name: 'subdir', isDirectory: () => true, isFile: () => false }])
        // Second call: subdirectory
        .mockResolvedValueOnce([{ name: 'nested-song.mp3', isDirectory: () => false, isFile: () => true }]);

      const results = await extractor.searchLocal('nested');

      expect(results).toHaveLength(1);
    });

    it('should respect the limit parameter', async () => {
      const manyFiles = Array.from({ length: 30 }, (_, i) => ({
        name: `match-${i}.mp3`,
        isDirectory: () => false,
        isFile: () => true,
      }));
      mockReaddir.mockResolvedValue(manyFiles);

      const results = await extractor.searchLocal('match', 5);

      expect(results).toHaveLength(5);
    });

    it('should return empty array when no matches found', async () => {
      mockReaddir.mockResolvedValue([{ name: 'unrelated.mp3', isDirectory: () => false, isFile: () => true }]);

      const results = await extractor.searchLocal('nonexistent');

      expect(results).toHaveLength(0);
    });
  });

  /* ------------------------------------------------------------------ */
  /*  lifecycle                                                          */
  /* ------------------------------------------------------------------ */
  describe('lifecycle', () => {
    it('should set up music folders from options', async () => {
      // Reject uploads dir access so it doesn't add an extra folder
      mockAccess.mockImplementation(async (p: string) => {
        if (typeof p === 'string' && p.includes('uploads')) throw new Error('ENOENT');
      });

      const ext = new LocalExtractor({} as never, {
        musicFolders: ['/my/music', '/other/music'],
      });
      await ext.activate();

      // Reset for search
      mockAccess.mockResolvedValue(undefined);
      mockReaddir.mockResolvedValue([]);
      await ext.searchLocal('anything');

      // readdir called for each folder
      expect(mockReaddir).toHaveBeenCalledTimes(2);
    });

    it('should include MUSIC_FOLDER_PATH env var', async () => {
      // Reject uploads dir access so it doesn't add an extra folder
      mockAccess.mockImplementation(async (p: string) => {
        if (typeof p === 'string' && p.includes('uploads')) throw new Error('ENOENT');
      });

      (process.env as Record<string, string>).MUSIC_FOLDER_PATH = '/env/music';
      const ext = new LocalExtractor({} as never, {
        musicFolders: ['/opt/music'],
      });
      await ext.activate();

      // Reset for search
      mockAccess.mockResolvedValue(undefined);
      mockReaddir.mockResolvedValue([]);
      await ext.searchLocal('anything');

      // One from options + one from env
      expect(mockReaddir).toHaveBeenCalledTimes(2);

      delete (process.env as Record<string, string | undefined>).MUSIC_FOLDER_PATH;
    });

    it('should clear music folders on deactivate', async () => {
      await extractor.deactivate();

      mockReaddir.mockResolvedValue([]);
      const results = await extractor.searchLocal('anything');

      expect(results).toHaveLength(0);
      expect(mockReaddir).not.toHaveBeenCalled();
    });
  });
});
