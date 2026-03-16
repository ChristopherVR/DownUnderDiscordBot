import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockQueueSnapshot = {
  create: vi.fn(),
  findFirst: vi.fn(),
  deleteMany: vi.fn(),
};

const mockDb = {
  queueSnapshot: mockQueueSnapshot,
};

vi.mock('../../../src/database/client.js', () => ({
  getDatabase: () => mockDb,
}));

import { QueueRepository } from '../../../src/database/repositories/QueueRepository';

describe('QueueRepository', () => {
  let repo: QueueRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new QueueRepository();
  });

  describe('saveSnapshot', () => {
    it('should delete old snapshots and create a new one', async () => {
      const tracks = [
        { title: 'Song A', duration: 200, url: 'https://example.com/a', platform: 'youtube' },
        {
          title: 'Song B',
          artist: 'Artist B',
          duration: 180,
          url: 'https://example.com/b',
          thumbnail: 'https://img.com/b.jpg',
          platform: 'spotify',
        },
      ];
      const data = {
        currentTrackUrl: 'https://example.com/a',
        currentPosition: 42,
        volume: 80,
        loopMode: 'queue',
        tracks,
      };

      const expected = {
        id: 'qs-1',
        guildId: 'guild-1',
        currentTrackUrl: 'https://example.com/a',
        currentPosition: 42,
        volume: 80,
        loopMode: 'queue',
        tracks: JSON.stringify(tracks),
        createdAt: new Date(),
      };

      mockQueueSnapshot.deleteMany.mockResolvedValue({ count: 1 });
      mockQueueSnapshot.create.mockResolvedValue(expected);

      const result = await repo.saveSnapshot('guild-1', data);

      expect(mockQueueSnapshot.deleteMany).toHaveBeenCalledWith({ where: { guildId: 'guild-1' } });
      expect(mockQueueSnapshot.create).toHaveBeenCalledWith({
        data: {
          guildId: 'guild-1',
          currentTrackUrl: 'https://example.com/a',
          currentPosition: 42,
          volume: 80,
          loopMode: 'queue',
          tracks: JSON.stringify(tracks),
        },
      });
      expect(result).toEqual(expected);
    });

    it('should use default values for optional fields', async () => {
      const tracks = [{ title: 'Song A', duration: 200, url: 'https://example.com/a', platform: 'youtube' }];
      const data = { tracks };

      const expected = {
        id: 'qs-2',
        guildId: 'guild-1',
        currentTrackUrl: undefined,
        currentPosition: 0,
        volume: 65,
        loopMode: 'off',
        tracks: JSON.stringify(tracks),
        createdAt: new Date(),
      };

      mockQueueSnapshot.deleteMany.mockResolvedValue({ count: 0 });
      mockQueueSnapshot.create.mockResolvedValue(expected);

      await repo.saveSnapshot('guild-1', data);

      expect(mockQueueSnapshot.create).toHaveBeenCalledWith({
        data: {
          guildId: 'guild-1',
          currentTrackUrl: undefined,
          currentPosition: 0,
          volume: 65,
          loopMode: 'off',
          tracks: JSON.stringify(tracks),
        },
      });
    });

    it('should save an empty tracks array', async () => {
      const data = { tracks: [] as { title: string; duration: number; url: string; platform: string }[] };

      mockQueueSnapshot.deleteMany.mockResolvedValue({ count: 0 });
      mockQueueSnapshot.create.mockResolvedValue({ id: 'qs-3', tracks: '[]' });

      await repo.saveSnapshot('guild-1', data);

      expect(mockQueueSnapshot.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tracks: '[]',
        }),
      });
    });
  });

  describe('getLatestSnapshot', () => {
    it('should return the latest snapshot with parsed tracks', async () => {
      const tracks = [{ title: 'Song A', duration: 200, url: 'https://example.com/a', platform: 'youtube' }];
      const snapshot = {
        id: 'qs-1',
        guildId: 'guild-1',
        currentTrackUrl: 'https://example.com/a',
        currentPosition: 10,
        volume: 70,
        loopMode: 'off',
        tracks: JSON.stringify(tracks),
        createdAt: new Date(),
      };

      mockQueueSnapshot.findFirst.mockResolvedValue(snapshot);

      const result = await repo.getLatestSnapshot('guild-1');

      expect(mockQueueSnapshot.findFirst).toHaveBeenCalledWith({
        where: { guildId: 'guild-1' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).not.toBeNull();
      expect(result!.parsedTracks).toEqual(tracks);
      expect(result!.id).toBe('qs-1');
      expect(result!.tracks).toBe(JSON.stringify(tracks));
    });

    it('should return null when no snapshot exists', async () => {
      mockQueueSnapshot.findFirst.mockResolvedValue(null);

      const result = await repo.getLatestSnapshot('guild-1');

      expect(result).toBeNull();
    });

    it('should parse tracks JSON correctly for multiple tracks', async () => {
      const tracks = [
        { title: 'Song A', duration: 200, url: 'https://example.com/a', platform: 'youtube' },
        {
          title: 'Song B',
          artist: 'Artist',
          duration: 180,
          url: 'https://example.com/b',
          thumbnail: 'https://img.com/b.jpg',
          platform: 'spotify',
        },
      ];
      const snapshot = {
        id: 'qs-1',
        guildId: 'guild-1',
        currentTrackUrl: null,
        currentPosition: 0,
        volume: 65,
        loopMode: 'off',
        tracks: JSON.stringify(tracks),
        createdAt: new Date(),
      };

      mockQueueSnapshot.findFirst.mockResolvedValue(snapshot);

      const result = await repo.getLatestSnapshot('guild-1');

      expect(result!.parsedTracks).toHaveLength(2);
      expect(result!.parsedTracks[0].title).toBe('Song A');
      expect(result!.parsedTracks[1].artist).toBe('Artist');
    });
  });

  describe('deleteSnapshots', () => {
    it('should delete all snapshots for a guild', async () => {
      mockQueueSnapshot.deleteMany.mockResolvedValue({ count: 3 });

      await repo.deleteSnapshots('guild-1');

      expect(mockQueueSnapshot.deleteMany).toHaveBeenCalledWith({ where: { guildId: 'guild-1' } });
    });

    it('should not throw when no snapshots exist', async () => {
      mockQueueSnapshot.deleteMany.mockResolvedValue({ count: 0 });

      await expect(repo.deleteSnapshots('guild-1')).resolves.toBeUndefined();
    });
  });
});
