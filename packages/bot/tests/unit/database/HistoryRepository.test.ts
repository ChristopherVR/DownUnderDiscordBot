import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPlayHistory = {
  create: vi.fn(),
  update: vi.fn(),
  findMany: vi.fn(),
};

const mockQueryRaw = vi.fn();

const mockDb = {
  playHistory: mockPlayHistory,
  $queryRaw: mockQueryRaw,
};

vi.mock('../../../src/database/client.js', () => ({
  getDatabase: () => mockDb,
}));

import { HistoryRepository } from '../../../src/database/repositories/HistoryRepository';

describe('HistoryRepository', () => {
  let repo: HistoryRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new HistoryRepository();
  });

  describe('recordPlay', () => {
    it('should create a play history record with required fields', async () => {
      const input = {
        guildId: 'guild-1',
        userId: 'user-1',
        title: 'Test Song',
        duration: 240,
        url: 'https://youtube.com/watch?v=abc',
        platform: 'youtube',
      };
      const expected = {
        id: 'ph-1',
        ...input,
        artist: null,
        platformId: null,
        playedAt: new Date(),
        completedAt: null,
      };
      mockPlayHistory.create.mockResolvedValue(expected);

      const result = await repo.recordPlay(input);

      expect(mockPlayHistory.create).toHaveBeenCalledWith({ data: input });
      expect(result).toEqual(expected);
    });

    it('should create a play history record with all optional fields', async () => {
      const input = {
        guildId: 'guild-1',
        userId: 'user-1',
        title: 'Test Song',
        artist: 'Test Artist',
        duration: 240,
        url: 'https://youtube.com/watch?v=abc',
        platform: 'youtube',
        platformId: 'abc123',
      };
      const expected = { id: 'ph-2', ...input, playedAt: new Date(), completedAt: null };
      mockPlayHistory.create.mockResolvedValue(expected);

      const result = await repo.recordPlay(input);

      expect(mockPlayHistory.create).toHaveBeenCalledWith({ data: input });
      expect(result).toEqual(expected);
    });
  });

  describe('markCompleted', () => {
    it('should update the completedAt timestamp', async () => {
      const now = new Date();
      vi.setSystemTime(now);

      mockPlayHistory.update.mockResolvedValue({ id: 'ph-1', completedAt: now });

      await repo.markCompleted('ph-1');

      expect(mockPlayHistory.update).toHaveBeenCalledWith({
        where: { id: 'ph-1' },
        data: { completedAt: expect.any(Date) },
      });

      vi.useRealTimers();
    });
  });

  describe('getHistory', () => {
    it('should return history with default options', async () => {
      const history = [
        { id: 'ph-1', title: 'Song A', playedAt: new Date() },
        { id: 'ph-2', title: 'Song B', playedAt: new Date() },
      ];
      mockPlayHistory.findMany.mockResolvedValue(history);

      const result = await repo.getHistory('guild-1');

      expect(mockPlayHistory.findMany).toHaveBeenCalledWith({
        where: { guildId: 'guild-1' },
        orderBy: { playedAt: 'desc' },
        take: 50,
        skip: 0,
      });
      expect(result).toEqual(history);
    });

    it('should apply custom limit and offset', async () => {
      mockPlayHistory.findMany.mockResolvedValue([]);

      await repo.getHistory('guild-1', { limit: 10, offset: 20 });

      expect(mockPlayHistory.findMany).toHaveBeenCalledWith({
        where: { guildId: 'guild-1' },
        orderBy: { playedAt: 'desc' },
        take: 10,
        skip: 20,
      });
    });

    it('should filter by userId when provided', async () => {
      mockPlayHistory.findMany.mockResolvedValue([]);

      await repo.getHistory('guild-1', { userId: 'user-1' });

      expect(mockPlayHistory.findMany).toHaveBeenCalledWith({
        where: { guildId: 'guild-1', userId: 'user-1' },
        orderBy: { playedAt: 'desc' },
        take: 50,
        skip: 0,
      });
    });

    it('should not include userId in where clause when not provided', async () => {
      mockPlayHistory.findMany.mockResolvedValue([]);

      await repo.getHistory('guild-1', { limit: 5 });

      expect(mockPlayHistory.findMany).toHaveBeenCalledWith({
        where: { guildId: 'guild-1' },
        orderBy: { playedAt: 'desc' },
        take: 5,
        skip: 0,
      });
    });
  });

  describe('getRecentlyPlayed', () => {
    it('should return recently played tracks with default limit', async () => {
      const tracks = [{ id: 'ph-1', title: 'Song A', url: 'https://example.com/a' }];
      mockPlayHistory.findMany.mockResolvedValue(tracks);

      const result = await repo.getRecentlyPlayed('guild-1');

      expect(mockPlayHistory.findMany).toHaveBeenCalledWith({
        where: { guildId: 'guild-1' },
        orderBy: { playedAt: 'desc' },
        take: 10,
        distinct: ['url'],
      });
      expect(result).toEqual(tracks);
    });

    it('should return recently played tracks with custom limit', async () => {
      mockPlayHistory.findMany.mockResolvedValue([]);

      await repo.getRecentlyPlayed('guild-1', 5);

      expect(mockPlayHistory.findMany).toHaveBeenCalledWith({
        where: { guildId: 'guild-1' },
        orderBy: { playedAt: 'desc' },
        take: 5,
        distinct: ['url'],
      });
    });
  });

  describe('getMostPlayed', () => {
    it('should return most played tracks with default limit', async () => {
      const results = [
        { url: 'https://example.com/a', title: 'Song A', artist: null, platform: 'youtube', play_count: 10 },
        { url: 'https://example.com/b', title: 'Song B', artist: 'Artist B', platform: 'spotify', play_count: 5 },
      ];
      mockQueryRaw.mockResolvedValue(results);

      const result = await repo.getMostPlayed('guild-1');

      expect(mockQueryRaw).toHaveBeenCalled();
      expect(result).toEqual(results);
    });

    it('should pass custom limit to raw query', async () => {
      mockQueryRaw.mockResolvedValue([]);

      await repo.getMostPlayed('guild-1', 3);

      expect(mockQueryRaw).toHaveBeenCalled();
    });
  });
});
