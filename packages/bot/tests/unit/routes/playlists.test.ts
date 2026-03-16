import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// ── Hoisted mocks ──────────────────────────────────────────────────────
const playlistRepoMock = vi.hoisted(() => ({
  findAll: vi.fn(),
  findByGuild: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  addTrack: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  removeTrack: vi.fn(),
  reorderTrack: vi.fn(),
}));

vi.mock('../../../src/database/repositories/PlaylistRepository', () => ({
  PlaylistRepository: class {
    findAll = playlistRepoMock.findAll;
    findByGuild = playlistRepoMock.findByGuild;
    findById = playlistRepoMock.findById;
    create = playlistRepoMock.create;
    addTrack = playlistRepoMock.addTrack;
    update = playlistRepoMock.update;
    delete = playlistRepoMock.delete;
    removeTrack = playlistRepoMock.removeTrack;
    reorderTrack = playlistRepoMock.reorderTrack;
  },
}));

vi.mock('../../../src/helpers/logger/pinoBootstrap', () => ({
  enhancedLogger: {
    system: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../../src/helpers/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn().mockReturnThis(),
  }),
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import playlistsRouter from '../../../src/routes/playlists';

const GUILD_HEADER = { 'x-guild-id': 'guild-1' };

describe('Playlists API Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/playlists', playlistsRouter);
    vi.clearAllMocks();
  });

  // ── GET /api/playlists ─────────────────────────────────────────────

  describe('GET /api/playlists', () => {
    it('returns playlists filtered by guild when x-guild-id header is set', async () => {
      const playlists = [
        {
          id: 'pl-1',
          name: 'My Playlist',
          description: null,
          isPublic: true,
          userId: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      playlistRepoMock.findByGuild.mockResolvedValue(playlists);
      playlistRepoMock.findById.mockResolvedValue({ ...playlists[0], tracks: [{ id: 't1' }, { id: 't2' }] });

      const response = await request(app).get('/api/playlists').set(GUILD_HEADER);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].trackCount).toBe(2);
      expect(playlistRepoMock.findByGuild).toHaveBeenCalledWith('guild-1', undefined);
    });

    it('returns all playlists when no guild filter is provided', async () => {
      playlistRepoMock.findAll.mockResolvedValue([]);

      const response = await request(app).get('/api/playlists');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(playlistRepoMock.findAll).toHaveBeenCalledWith(undefined);
    });

    it('filters by userId when x-user-id header is provided', async () => {
      playlistRepoMock.findByGuild.mockResolvedValue([]);

      await request(app)
        .get('/api/playlists')
        .set({ ...GUILD_HEADER, 'x-user-id': 'user-42' });

      expect(playlistRepoMock.findByGuild).toHaveBeenCalledWith('guild-1', 'user-42');
    });

    it('returns 500 when repository throws', async () => {
      playlistRepoMock.findAll.mockRejectedValue(new Error('DB connection lost'));

      const response = await request(app).get('/api/playlists');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('DB connection lost');
    });
  });

  // ── GET /api/playlists/:id ─────────────────────────────────────────

  describe('GET /api/playlists/:id', () => {
    it('returns a playlist with tracks', async () => {
      const playlist = {
        id: 'pl-1',
        name: 'Rock Hits',
        description: 'Best rock songs',
        isPublic: true,
        tracks: [
          {
            id: 't-1',
            title: 'Song A',
            artist: 'Artist A',
            duration: 180,
            url: 'url-a',
            thumbnail: 'thumb-a',
            platform: 'youtube',
            position: 0,
          },
        ],
      };
      playlistRepoMock.findById.mockResolvedValue(playlist);

      const response = await request(app).get('/api/playlists/pl-1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Rock Hits');
      expect(response.body.data.trackCount).toBe(1);
      expect(response.body.data.tracks[0].title).toBe('Song A');
    });

    it('returns 404 when playlist does not exist', async () => {
      playlistRepoMock.findById.mockResolvedValue(null);

      const response = await request(app).get('/api/playlists/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Playlist not found');
    });
  });

  // ── POST /api/playlists ────────────────────────────────────────────

  describe('POST /api/playlists', () => {
    it('creates a playlist with valid data', async () => {
      const created = { id: 'pl-new', name: 'New Playlist', description: 'desc', isPublic: true };
      playlistRepoMock.create.mockResolvedValue(created);

      const response = await request(app)
        .post('/api/playlists')
        .set(GUILD_HEADER)
        .send({ name: 'New Playlist', description: 'desc' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('New Playlist');
      expect(playlistRepoMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          guildId: 'guild-1',
          name: 'New Playlist',
          description: 'desc',
          isPublic: true,
        }),
      );
    });

    it('returns 400 when name is missing', async () => {
      const response = await request(app).post('/api/playlists').send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Playlist name is required');
    });

    it('returns 400 when name is empty string', async () => {
      const response = await request(app).post('/api/playlists').send({ name: '   ' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Playlist name is required');
    });

    it('trims whitespace from name', async () => {
      playlistRepoMock.create.mockResolvedValue({ id: 'pl-1', name: 'Trimmed', description: null, isPublic: true });

      await request(app).post('/api/playlists').send({ name: '  Trimmed  ' });

      expect(playlistRepoMock.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Trimmed' }));
    });

    it('uses "dashboard" as default userId', async () => {
      playlistRepoMock.create.mockResolvedValue({ id: 'pl-1', name: 'Test', description: null, isPublic: true });

      await request(app).post('/api/playlists').send({ name: 'Test' });

      expect(playlistRepoMock.create).toHaveBeenCalledWith(expect.objectContaining({ userId: 'dashboard' }));
    });

    it('uses x-user-id header when provided', async () => {
      playlistRepoMock.create.mockResolvedValue({ id: 'pl-1', name: 'Test', description: null, isPublic: true });

      await request(app).post('/api/playlists').set({ 'x-user-id': 'custom-user' }).send({ name: 'Test' });

      expect(playlistRepoMock.create).toHaveBeenCalledWith(expect.objectContaining({ userId: 'custom-user' }));
    });
  });

  // ── POST /api/playlists/:id/tracks ─────────────────────────────────

  describe('POST /api/playlists/:id/tracks', () => {
    it('adds a track to an existing playlist', async () => {
      playlistRepoMock.findById.mockResolvedValue({ id: 'pl-1', tracks: [] });
      const track = { id: 't-1', title: 'New Track', url: 'http://example.com/track' };
      playlistRepoMock.addTrack.mockResolvedValue(track);

      const response = await request(app)
        .post('/api/playlists/pl-1/tracks')
        .send({ title: 'New Track', url: 'http://example.com/track' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('New Track');
    });

    it('returns 404 when playlist does not exist', async () => {
      playlistRepoMock.findById.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/playlists/nonexistent/tracks')
        .send({ title: 'Track', url: 'http://example.com' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Playlist not found');
    });

    it('returns 400 when title is missing', async () => {
      playlistRepoMock.findById.mockResolvedValue({ id: 'pl-1', tracks: [] });

      const response = await request(app).post('/api/playlists/pl-1/tracks').send({ url: 'http://example.com' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Track title and url are required');
    });

    it('returns 400 when url is missing', async () => {
      playlistRepoMock.findById.mockResolvedValue({ id: 'pl-1', tracks: [] });

      const response = await request(app).post('/api/playlists/pl-1/tracks').send({ title: 'Track' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Track title and url are required');
    });
  });

  // ── PUT /api/playlists/:id ─────────────────────────────────────────

  describe('PUT /api/playlists/:id', () => {
    it('updates playlist metadata', async () => {
      playlistRepoMock.findById.mockResolvedValue({ id: 'pl-1', name: 'Old', tracks: [] });
      playlistRepoMock.update.mockResolvedValue({ id: 'pl-1', name: 'Updated', description: 'new desc' });

      const response = await request(app).put('/api/playlists/pl-1').send({ name: 'Updated', description: 'new desc' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated');
    });

    it('returns 404 when playlist does not exist', async () => {
      playlistRepoMock.findById.mockResolvedValue(null);

      const response = await request(app).put('/api/playlists/nonexistent').send({ name: 'Updated' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Playlist not found');
    });
  });

  // ── DELETE /api/playlists/:id ──────────────────────────────────────

  describe('DELETE /api/playlists/:id', () => {
    it('deletes a playlist', async () => {
      playlistRepoMock.delete.mockResolvedValue(undefined);

      const response = await request(app).delete('/api/playlists/pl-1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Playlist deleted');
      expect(playlistRepoMock.delete).toHaveBeenCalledWith('pl-1');
    });

    it('returns 500 when deletion fails', async () => {
      playlistRepoMock.delete.mockRejectedValue(new Error('Foreign key constraint'));

      const response = await request(app).delete('/api/playlists/pl-1');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  // ── DELETE /api/playlists/:id/tracks/:trackId ──────────────────────

  describe('DELETE /api/playlists/:id/tracks/:trackId', () => {
    it('removes a track from a playlist', async () => {
      playlistRepoMock.findById.mockResolvedValue({ id: 'pl-1', tracks: [{ id: 't-1' }] });
      playlistRepoMock.removeTrack.mockResolvedValue(undefined);

      const response = await request(app).delete('/api/playlists/pl-1/tracks/t-1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Track removed');
      expect(playlistRepoMock.removeTrack).toHaveBeenCalledWith('pl-1', 't-1');
    });

    it('returns 404 when playlist does not exist', async () => {
      playlistRepoMock.findById.mockResolvedValue(null);

      const response = await request(app).delete('/api/playlists/pl-1/tracks/t-1');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Playlist not found');
    });
  });

  // ── PUT /api/playlists/:id/tracks/:trackId/reorder ─────────────────

  describe('PUT /api/playlists/:id/tracks/:trackId/reorder', () => {
    it('reorders a track to a new position', async () => {
      playlistRepoMock.reorderTrack.mockResolvedValue(undefined);

      const response = await request(app).put('/api/playlists/pl-1/tracks/t-1/reorder').send({ position: 3 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(playlistRepoMock.reorderTrack).toHaveBeenCalledWith('pl-1', 't-1', 3);
    });

    it('returns 400 when position is missing', async () => {
      const response = await request(app).put('/api/playlists/pl-1/tracks/t-1/reorder').send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Valid position is required');
    });

    it('returns 400 when position is negative', async () => {
      const response = await request(app).put('/api/playlists/pl-1/tracks/t-1/reorder').send({ position: -1 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Valid position is required');
    });

    it('returns 400 when position is not a number', async () => {
      const response = await request(app).put('/api/playlists/pl-1/tracks/t-1/reorder').send({ position: 'abc' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Valid position is required');
    });
  });

  // ── POST /api/playlists/:id/play ───────────────────────────────────

  describe('POST /api/playlists/:id/play', () => {
    it('returns 400 when guild ID is missing', async () => {
      playlistRepoMock.findById.mockResolvedValue({ id: 'pl-1', tracks: [{ id: 't-1', url: 'url' }] });

      const response = await request(app).post('/api/playlists/pl-1/play');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Guild ID is required');
    });

    it('returns 404 when playlist does not exist', async () => {
      playlistRepoMock.findById.mockResolvedValue(null);

      const response = await request(app).post('/api/playlists/nonexistent/play').set(GUILD_HEADER);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Playlist not found');
    });

    it('returns 400 when playlist is empty', async () => {
      playlistRepoMock.findById.mockResolvedValue({ id: 'pl-1', tracks: [] });

      const response = await request(app).post('/api/playlists/pl-1/play').set(GUILD_HEADER);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Playlist is empty');
    });
  });
});
