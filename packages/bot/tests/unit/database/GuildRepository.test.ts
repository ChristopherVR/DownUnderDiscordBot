import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGuild = {
  upsert: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
};

const mockDb = {
  guild: mockGuild,
};

vi.mock('../../../src/database/client.js', () => ({
  getDatabase: () => mockDb,
}));

import { GuildRepository } from '../../../src/database/repositories/GuildRepository';

describe('GuildRepository', () => {
  let repo: GuildRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new GuildRepository();
  });

  describe('findOrCreate', () => {
    it('should upsert a guild with the given id and name', async () => {
      const expected = {
        id: 'guild-1',
        name: 'Test Server',
        preferredLanguage: 'en',
        defaultVolume: 65,
        leaveOnEmpty: true,
        leaveOnEmptyCooldown: 300000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockGuild.upsert.mockResolvedValue(expected);

      const result = await repo.findOrCreate('guild-1', 'Test Server');

      expect(mockGuild.upsert).toHaveBeenCalledWith({
        where: { id: 'guild-1' },
        create: { id: 'guild-1', name: 'Test Server' },
        update: { name: 'Test Server' },
      });
      expect(result).toEqual(expected);
    });

    it('should update the name if guild already exists', async () => {
      const expected = {
        id: 'guild-1',
        name: 'Updated Server Name',
        preferredLanguage: 'en',
        defaultVolume: 65,
        leaveOnEmpty: true,
        leaveOnEmptyCooldown: 300000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockGuild.upsert.mockResolvedValue(expected);

      const result = await repo.findOrCreate('guild-1', 'Updated Server Name');

      expect(mockGuild.upsert).toHaveBeenCalledWith({
        where: { id: 'guild-1' },
        create: { id: 'guild-1', name: 'Updated Server Name' },
        update: { name: 'Updated Server Name' },
      });
      expect(result).toEqual(expected);
    });
  });

  describe('findById', () => {
    it('should return a guild when found', async () => {
      const expected = {
        id: 'guild-1',
        name: 'Test Server',
        preferredLanguage: 'en',
        defaultVolume: 65,
        leaveOnEmpty: true,
        leaveOnEmptyCooldown: 300000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockGuild.findUnique.mockResolvedValue(expected);

      const result = await repo.findById('guild-1');

      expect(mockGuild.findUnique).toHaveBeenCalledWith({ where: { id: 'guild-1' } });
      expect(result).toEqual(expected);
    });

    it('should return null when guild does not exist', async () => {
      mockGuild.findUnique.mockResolvedValue(null);

      const result = await repo.findById('nonexistent');

      expect(mockGuild.findUnique).toHaveBeenCalledWith({ where: { id: 'nonexistent' } });
      expect(result).toBeNull();
    });
  });

  describe('updateSettings', () => {
    it('should update the default volume', async () => {
      const expected = {
        id: 'guild-1',
        name: 'Test Server',
        preferredLanguage: 'en',
        defaultVolume: 80,
        leaveOnEmpty: true,
        leaveOnEmptyCooldown: 300000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockGuild.update.mockResolvedValue(expected);

      const result = await repo.updateSettings('guild-1', { defaultVolume: 80 });

      expect(mockGuild.update).toHaveBeenCalledWith({
        where: { id: 'guild-1' },
        data: { defaultVolume: 80 },
      });
      expect(result).toEqual(expected);
    });

    it('should update the preferred language', async () => {
      const expected = {
        id: 'guild-1',
        name: 'Test Server',
        preferredLanguage: 'ja',
        defaultVolume: 65,
        leaveOnEmpty: true,
        leaveOnEmptyCooldown: 300000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockGuild.update.mockResolvedValue(expected);

      const result = await repo.updateSettings('guild-1', { preferredLanguage: 'ja' });

      expect(mockGuild.update).toHaveBeenCalledWith({
        where: { id: 'guild-1' },
        data: { preferredLanguage: 'ja' },
      });
      expect(result).toEqual(expected);
    });

    it('should update leave on empty settings', async () => {
      const expected = {
        id: 'guild-1',
        name: 'Test Server',
        preferredLanguage: 'en',
        defaultVolume: 65,
        leaveOnEmpty: false,
        leaveOnEmptyCooldown: 600000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockGuild.update.mockResolvedValue(expected);

      const result = await repo.updateSettings('guild-1', {
        leaveOnEmpty: false,
        leaveOnEmptyCooldown: 600000,
      });

      expect(mockGuild.update).toHaveBeenCalledWith({
        where: { id: 'guild-1' },
        data: { leaveOnEmpty: false, leaveOnEmptyCooldown: 600000 },
      });
      expect(result).toEqual(expected);
    });

    it('should update multiple settings at once', async () => {
      const settings = {
        defaultVolume: 50,
        preferredLanguage: 'fr',
        leaveOnEmpty: true,
        leaveOnEmptyCooldown: 120000,
      };
      const expected = {
        id: 'guild-1',
        name: 'Test Server',
        ...settings,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockGuild.update.mockResolvedValue(expected);

      const result = await repo.updateSettings('guild-1', settings);

      expect(mockGuild.update).toHaveBeenCalledWith({
        where: { id: 'guild-1' },
        data: settings,
      });
      expect(result).toEqual(expected);
    });
  });
});
