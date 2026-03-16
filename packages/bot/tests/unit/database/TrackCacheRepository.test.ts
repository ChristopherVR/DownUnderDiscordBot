import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockTrackCache = {
  findUnique: vi.fn(),
  update: vi.fn(),
  upsert: vi.fn(),
  deleteMany: vi.fn(),
};

const mockDb = {
  trackCache: mockTrackCache,
};

vi.mock('../../../src/database/client.js', () => ({
  getDatabase: () => mockDb,
}));

import { TrackCacheRepository } from '../../../src/database/repositories/TrackCacheRepository';

describe('TrackCacheRepository', () => {
  let repo: TrackCacheRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new TrackCacheRepository();
  });

  describe('get', () => {
    it('should return cached track and update lastUsed when found', async () => {
      const cached = {
        id: 'tc-1',
        platform: 'youtube',
        platformId: 'abc123',
        title: 'Test Song',
        artist: 'Test Artist',
        duration: 240,
        url: 'https://youtube.com/watch?v=abc123',
        thumbnail: 'https://img.com/abc.jpg',
        metadata: null,
        createdAt: new Date(),
        lastUsed: new Date('2026-01-01'),
      };

      mockTrackCache.findUnique.mockResolvedValue(cached);
      mockTrackCache.update.mockResolvedValue({ ...cached, lastUsed: new Date() });

      const result = await repo.get('youtube', 'abc123');

      expect(mockTrackCache.findUnique).toHaveBeenCalledWith({
        where: { platform_platformId: { platform: 'youtube', platformId: 'abc123' } },
      });
      expect(mockTrackCache.update).toHaveBeenCalledWith({
        where: { id: 'tc-1' },
        data: { lastUsed: expect.any(Date) },
      });
      expect(result).toEqual(cached);
    });

    it('should return null and not update lastUsed when not found', async () => {
      mockTrackCache.findUnique.mockResolvedValue(null);

      const result = await repo.get('youtube', 'nonexistent');

      expect(mockTrackCache.findUnique).toHaveBeenCalledWith({
        where: { platform_platformId: { platform: 'youtube', platformId: 'nonexistent' } },
      });
      expect(mockTrackCache.update).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should upsert a track cache entry without metadata', async () => {
      const input = {
        platform: 'youtube',
        platformId: 'abc123',
        title: 'Test Song',
        artist: 'Test Artist',
        duration: 240,
        url: 'https://youtube.com/watch?v=abc123',
        thumbnail: 'https://img.com/abc.jpg',
      };

      const expected = { id: 'tc-1', ...input, metadata: null, createdAt: new Date(), lastUsed: new Date() };
      mockTrackCache.upsert.mockResolvedValue(expected);

      const result = await repo.set(input);

      expect(mockTrackCache.upsert).toHaveBeenCalledWith({
        where: {
          platform_platformId: { platform: 'youtube', platformId: 'abc123' },
        },
        create: {
          ...input,
          metadata: null,
        },
        update: {
          title: 'Test Song',
          artist: 'Test Artist',
          duration: 240,
          url: 'https://youtube.com/watch?v=abc123',
          thumbnail: 'https://img.com/abc.jpg',
          metadata: null,
          lastUsed: expect.any(Date),
        },
      });
      expect(result).toEqual(expected);
    });

    it('should upsert a track cache entry with metadata as JSON', async () => {
      const input = {
        platform: 'spotify',
        platformId: 'sp-456',
        title: 'Spotify Song',
        duration: 180,
        url: 'https://open.spotify.com/track/sp-456',
        metadata: { albumName: 'Test Album', trackNumber: 3 },
      };

      const expectedMetadata = JSON.stringify({ albumName: 'Test Album', trackNumber: 3 });
      const expected = {
        id: 'tc-2',
        ...input,
        metadata: expectedMetadata,
        createdAt: new Date(),
        lastUsed: new Date(),
      };
      mockTrackCache.upsert.mockResolvedValue(expected);

      const result = await repo.set(input);

      expect(mockTrackCache.upsert).toHaveBeenCalledWith({
        where: {
          platform_platformId: { platform: 'spotify', platformId: 'sp-456' },
        },
        create: {
          ...input,
          metadata: expectedMetadata,
        },
        update: {
          title: 'Spotify Song',
          artist: undefined,
          duration: 180,
          url: 'https://open.spotify.com/track/sp-456',
          thumbnail: undefined,
          metadata: expectedMetadata,
          lastUsed: expect.any(Date),
        },
      });
      expect(result).toEqual(expected);
    });

    it('should handle input without optional fields', async () => {
      const input = {
        platform: 'soundcloud',
        platformId: 'sc-789',
        title: 'SC Song',
        duration: 300,
        url: 'https://soundcloud.com/artist/sc-song',
      };

      mockTrackCache.upsert.mockResolvedValue({ id: 'tc-3', ...input });

      await repo.set(input);

      expect(mockTrackCache.upsert).toHaveBeenCalledWith({
        where: {
          platform_platformId: { platform: 'soundcloud', platformId: 'sc-789' },
        },
        create: {
          ...input,
          metadata: null,
        },
        update: {
          title: 'SC Song',
          artist: undefined,
          duration: 300,
          url: 'https://soundcloud.com/artist/sc-song',
          thumbnail: undefined,
          metadata: null,
          lastUsed: expect.any(Date),
        },
      });
    });
  });

  describe('cleanup', () => {
    it('should delete entries older than the default 30 days', async () => {
      const now = new Date('2026-03-16T00:00:00Z');
      vi.setSystemTime(now);

      mockTrackCache.deleteMany.mockResolvedValue({ count: 5 });

      const result = await repo.cleanup();

      expect(mockTrackCache.deleteMany).toHaveBeenCalledWith({
        where: { lastUsed: { lt: expect.any(Date) } },
      });

      const calledDate = mockTrackCache.deleteMany.mock.calls[0][0].where.lastUsed.lt as Date;
      const expectedCutoff = new Date('2026-02-14T00:00:00Z');
      expect(calledDate.getTime()).toBe(expectedCutoff.getTime());

      expect(result).toBe(5);

      vi.useRealTimers();
    });

    it('should delete entries older than a custom number of days', async () => {
      const now = new Date('2026-03-16T00:00:00Z');
      vi.setSystemTime(now);

      mockTrackCache.deleteMany.mockResolvedValue({ count: 2 });

      const result = await repo.cleanup(7);

      const calledDate = mockTrackCache.deleteMany.mock.calls[0][0].where.lastUsed.lt as Date;
      const expectedCutoff = new Date('2026-03-09T00:00:00Z');
      expect(calledDate.getTime()).toBe(expectedCutoff.getTime());

      expect(result).toBe(2);

      vi.useRealTimers();
    });

    it('should return 0 when no entries are deleted', async () => {
      mockTrackCache.deleteMany.mockResolvedValue({ count: 0 });

      const result = await repo.cleanup();

      expect(result).toBe(0);
    });
  });
});
