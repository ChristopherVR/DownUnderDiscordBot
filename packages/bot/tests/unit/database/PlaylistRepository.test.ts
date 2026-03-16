import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPlaylistTrack = {
  findUnique: vi.fn(),
  create: vi.fn(),
  delete: vi.fn(),
  updateMany: vi.fn(),
  aggregate: vi.fn(),
  update: vi.fn(),
};

const mockPlaylist = {
  create: vi.fn(),
  findUnique: vi.fn(),
  findMany: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

const mockTransaction = vi.fn();

const mockDb = {
  playlist: mockPlaylist,
  playlistTrack: mockPlaylistTrack,
  $transaction: mockTransaction,
};

vi.mock('../../../src/database/client.js', () => ({
  getDatabase: () => mockDb,
}));

import { PlaylistRepository } from '../../../src/database/repositories/PlaylistRepository';

describe('PlaylistRepository', () => {
  let repo: PlaylistRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new PlaylistRepository();
  });

  describe('create', () => {
    it('should create a playlist with required fields', async () => {
      const input = { userId: 'user-1', name: 'My Playlist' };
      const expected = {
        id: 'pl-1',
        ...input,
        guildId: null,
        description: null,
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPlaylist.create.mockResolvedValue(expected);

      const result = await repo.create(input);

      expect(mockPlaylist.create).toHaveBeenCalledWith({ data: input });
      expect(result).toEqual(expected);
    });

    it('should create a playlist with all optional fields', async () => {
      const input = {
        userId: 'user-1',
        name: 'My Playlist',
        guildId: 'guild-1',
        description: 'A test playlist',
        isPublic: true,
      };
      const expected = { id: 'pl-2', ...input, createdAt: new Date(), updatedAt: new Date() };
      mockPlaylist.create.mockResolvedValue(expected);

      const result = await repo.create(input);

      expect(mockPlaylist.create).toHaveBeenCalledWith({ data: input });
      expect(result).toEqual(expected);
    });
  });

  describe('findById', () => {
    it('should find a playlist by id with tracks ordered by position', async () => {
      const expected = {
        id: 'pl-1',
        userId: 'user-1',
        name: 'My Playlist',
        guildId: null,
        tracks: [
          { id: 't-1', position: 0, title: 'Song A' },
          { id: 't-2', position: 1, title: 'Song B' },
        ],
      };
      mockPlaylist.findUnique.mockResolvedValue(expected);

      const result = await repo.findById('pl-1');

      expect(mockPlaylist.findUnique).toHaveBeenCalledWith({
        where: { id: 'pl-1' },
        include: { tracks: { orderBy: { position: 'asc' } } },
      });
      expect(result).toEqual(expected);
    });

    it('should return null when playlist does not exist', async () => {
      mockPlaylist.findUnique.mockResolvedValue(null);

      const result = await repo.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should find all playlists when no userId is provided', async () => {
      const playlists = [{ id: 'pl-1' }, { id: 'pl-2' }];
      mockPlaylist.findMany.mockResolvedValue(playlists);

      const result = await repo.findAll();

      expect(mockPlaylist.findMany).toHaveBeenCalledWith({
        where: undefined,
        orderBy: { updatedAt: 'desc' },
      });
      expect(result).toEqual(playlists);
    });

    it('should filter by userId or public playlists when userId is provided', async () => {
      const playlists = [{ id: 'pl-1', userId: 'user-1' }];
      mockPlaylist.findMany.mockResolvedValue(playlists);

      const result = await repo.findAll('user-1');

      expect(mockPlaylist.findMany).toHaveBeenCalledWith({
        where: { OR: [{ userId: 'user-1' }, { isPublic: true }] },
        orderBy: { updatedAt: 'desc' },
      });
      expect(result).toEqual(playlists);
    });
  });

  describe('findByGuild', () => {
    it('should find playlists by guild without userId filter', async () => {
      const playlists = [{ id: 'pl-1', guildId: 'guild-1' }];
      mockPlaylist.findMany.mockResolvedValue(playlists);

      const result = await repo.findByGuild('guild-1');

      expect(mockPlaylist.findMany).toHaveBeenCalledWith({
        where: { guildId: 'guild-1' },
        orderBy: { updatedAt: 'desc' },
      });
      expect(result).toEqual(playlists);
    });

    it('should find playlists by guild filtered by userId or public', async () => {
      const playlists = [{ id: 'pl-1', guildId: 'guild-1', userId: 'user-1' }];
      mockPlaylist.findMany.mockResolvedValue(playlists);

      const result = await repo.findByGuild('guild-1', 'user-1');

      expect(mockPlaylist.findMany).toHaveBeenCalledWith({
        where: {
          guildId: 'guild-1',
          OR: [{ userId: 'user-1' }, { isPublic: true }],
        },
        orderBy: { updatedAt: 'desc' },
      });
      expect(result).toEqual(playlists);
    });
  });

  describe('addTrack', () => {
    it('should add a track at position 0 when playlist is empty', async () => {
      const trackInput = { title: 'Song A', duration: 200, url: 'https://example.com/a', platform: 'youtube' };
      const expected = { id: 't-1', playlistId: 'pl-1', position: 0, ...trackInput };

      mockPlaylistTrack.aggregate.mockResolvedValue({ _max: { position: null } });
      mockPlaylistTrack.create.mockResolvedValue(expected);

      const result = await repo.addTrack('pl-1', trackInput);

      expect(mockPlaylistTrack.aggregate).toHaveBeenCalledWith({
        where: { playlistId: 'pl-1' },
        _max: { position: true },
      });
      expect(mockPlaylistTrack.create).toHaveBeenCalledWith({
        data: { playlistId: 'pl-1', position: 0, ...trackInput },
      });
      expect(result).toEqual(expected);
    });

    it('should add a track at the next position when tracks exist', async () => {
      const trackInput = {
        title: 'Song B',
        duration: 180,
        url: 'https://example.com/b',
        platform: 'spotify',
        artist: 'Test Artist',
      };
      const expected = { id: 't-2', playlistId: 'pl-1', position: 3, ...trackInput };

      mockPlaylistTrack.aggregate.mockResolvedValue({ _max: { position: 2 } });
      mockPlaylistTrack.create.mockResolvedValue(expected);

      const result = await repo.addTrack('pl-1', trackInput);

      expect(mockPlaylistTrack.create).toHaveBeenCalledWith({
        data: { playlistId: 'pl-1', position: 3, ...trackInput },
      });
      expect(result).toEqual(expected);
    });
  });

  describe('removeTrack', () => {
    it('should remove a track and decrement positions of subsequent tracks', async () => {
      const track = { id: 't-2', playlistId: 'pl-1', position: 1 };
      mockPlaylistTrack.findUnique.mockResolvedValue(track);
      mockPlaylistTrack.delete.mockResolvedValue(track);
      mockPlaylistTrack.updateMany.mockResolvedValue({ count: 2 });
      mockTransaction.mockResolvedValue(undefined);

      await repo.removeTrack('pl-1', 't-2');

      expect(mockPlaylistTrack.findUnique).toHaveBeenCalledWith({ where: { id: 't-2' } });
      expect(mockPlaylistTrack.delete).toHaveBeenCalledWith({ where: { id: 't-2' } });
      expect(mockPlaylistTrack.updateMany).toHaveBeenCalledWith({
        where: { playlistId: 'pl-1', position: { gt: 1 } },
        data: { position: { decrement: 1 } },
      });
      expect(mockTransaction).toHaveBeenCalledTimes(1);
    });

    it('should do nothing when track does not exist', async () => {
      mockPlaylistTrack.findUnique.mockResolvedValue(null);

      await repo.removeTrack('pl-1', 'nonexistent');

      expect(mockTransaction).not.toHaveBeenCalled();
    });

    it('should do nothing when track belongs to a different playlist', async () => {
      const track = { id: 't-2', playlistId: 'pl-other', position: 1 };
      mockPlaylistTrack.findUnique.mockResolvedValue(track);

      await repo.removeTrack('pl-1', 't-2');

      expect(mockTransaction).not.toHaveBeenCalled();
    });
  });

  describe('reorderTrack', () => {
    it('should do nothing when track does not exist', async () => {
      mockPlaylistTrack.findUnique.mockResolvedValue(null);

      await repo.reorderTrack('pl-1', 'nonexistent', 2);

      expect(mockTransaction).not.toHaveBeenCalled();
    });

    it('should do nothing when track belongs to different playlist', async () => {
      mockPlaylistTrack.findUnique.mockResolvedValue({ id: 't-1', playlistId: 'pl-other', position: 0 });

      await repo.reorderTrack('pl-1', 't-1', 2);

      expect(mockTransaction).not.toHaveBeenCalled();
    });

    it('should do nothing when new position equals old position', async () => {
      mockPlaylistTrack.findUnique.mockResolvedValue({ id: 't-1', playlistId: 'pl-1', position: 2 });

      await repo.reorderTrack('pl-1', 't-1', 2);

      expect(mockTransaction).not.toHaveBeenCalled();
    });

    it('should move track forward (higher position) and decrement in-between', async () => {
      mockPlaylistTrack.findUnique.mockResolvedValue({ id: 't-1', playlistId: 'pl-1', position: 1 });

      const mockTx = {
        playlistTrack: {
          update: vi.fn().mockResolvedValue({}),
          updateMany: vi.fn().mockResolvedValue({ count: 2 }),
        },
      };
      mockTransaction.mockImplementation(async (cb: (tx: typeof mockTx) => Promise<void>) => {
        await cb(mockTx);
      });

      await repo.reorderTrack('pl-1', 't-1', 3);

      expect(mockTransaction).toHaveBeenCalledWith(expect.any(Function));

      // First call: move track to position -1 (out of the way)
      expect(mockTx.playlistTrack.update).toHaveBeenCalledWith({
        where: { id: 't-1' },
        data: { position: -1 },
      });

      // Decrement positions between old+1 and new
      expect(mockTx.playlistTrack.updateMany).toHaveBeenCalledWith({
        where: {
          playlistId: 'pl-1',
          position: { gt: 1, lte: 3 },
        },
        data: { position: { decrement: 1 } },
      });

      // Final call: set track to new position
      expect(mockTx.playlistTrack.update).toHaveBeenCalledWith({
        where: { id: 't-1' },
        data: { position: 3 },
      });
    });

    it('should move track backward (lower position) and increment in-between', async () => {
      mockPlaylistTrack.findUnique.mockResolvedValue({ id: 't-3', playlistId: 'pl-1', position: 4 });

      const mockTx = {
        playlistTrack: {
          update: vi.fn().mockResolvedValue({}),
          updateMany: vi.fn().mockResolvedValue({ count: 2 }),
        },
      };
      mockTransaction.mockImplementation(async (cb: (tx: typeof mockTx) => Promise<void>) => {
        await cb(mockTx);
      });

      await repo.reorderTrack('pl-1', 't-3', 1);

      expect(mockTransaction).toHaveBeenCalledWith(expect.any(Function));

      // First call: move track to position -1
      expect(mockTx.playlistTrack.update).toHaveBeenCalledWith({
        where: { id: 't-3' },
        data: { position: -1 },
      });

      // Increment positions between new and old-1
      expect(mockTx.playlistTrack.updateMany).toHaveBeenCalledWith({
        where: {
          playlistId: 'pl-1',
          position: { gte: 1, lt: 4 },
        },
        data: { position: { increment: 1 } },
      });

      // Final call: set track to new position
      expect(mockTx.playlistTrack.update).toHaveBeenCalledWith({
        where: { id: 't-3' },
        data: { position: 1 },
      });
    });
  });

  describe('update', () => {
    it('should update playlist name', async () => {
      const updated = { id: 'pl-1', name: 'Updated Name', userId: 'user-1' };
      mockPlaylist.update.mockResolvedValue(updated);

      const result = await repo.update('pl-1', { name: 'Updated Name' });

      expect(mockPlaylist.update).toHaveBeenCalledWith({
        where: { id: 'pl-1' },
        data: { name: 'Updated Name' },
      });
      expect(result).toEqual(updated);
    });

    it('should update multiple playlist fields at once', async () => {
      const data = { name: 'New Name', description: 'New description', isPublic: true };
      const updated = { id: 'pl-1', userId: 'user-1', ...data };
      mockPlaylist.update.mockResolvedValue(updated);

      const result = await repo.update('pl-1', data);

      expect(mockPlaylist.update).toHaveBeenCalledWith({
        where: { id: 'pl-1' },
        data,
      });
      expect(result).toEqual(updated);
    });
  });

  describe('delete', () => {
    it('should delete a playlist by id', async () => {
      mockPlaylist.delete.mockResolvedValue({ id: 'pl-1' });

      await repo.delete('pl-1');

      expect(mockPlaylist.delete).toHaveBeenCalledWith({ where: { id: 'pl-1' } });
    });
  });
});
