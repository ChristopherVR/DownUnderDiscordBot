import { Request, Response } from 'express';
import { PlaylistRepository } from '../database/repositories/PlaylistRepository';
import { expressRouter } from '../helpers/expressRouter';
import { enhancedLogger } from '../helpers/logger/pinoBootstrap';
import { LogLevel } from '../types/logging';

const router = expressRouter();
const playlistRepo = new PlaylistRepository();

// Helper function to get guild ID from request
const getGuildId = (req: Request): string => {
  const guildId = (req.headers['x-guild-id'] as string) || (req.query.guildId as string);
  if (!guildId) {
    throw new Error('Guild ID is required');
  }
  return guildId;
};

// GET /api/playlists - List playlists (optionally filtered by guild)
router.get('/', async (req: Request, res: Response) => {
  try {
    const guildId = (req.headers['x-guild-id'] as string) || (req.query.guildId as string) || undefined;
    const userId = (req.headers['x-user-id'] as string) || undefined;
    const playlists = guildId ? await playlistRepo.findByGuild(guildId, userId) : await playlistRepo.findAll(userId);

    // Fetch track counts in parallel
    const withCounts = await Promise.all(
      playlists.map(async (pl) => {
        const full = await playlistRepo.findById(pl.id);
        return {
          id: pl.id,
          name: pl.name,
          description: pl.description,
          isPublic: pl.isPublic,
          userId: pl.userId,
          trackCount: full?.tracks.length ?? 0,
          createdAt: pl.createdAt,
          updatedAt: pl.updatedAt,
        };
      }),
    );

    enhancedLogger.system(LogLevel.INFO, 'Retrieved playlists', { guildId: guildId ?? 'all', count: playlists.length });

    res.json({
      success: true,
      data: withCounts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve playlists',
    });
  }
});

// GET /api/playlists/:id - Get a single playlist with tracks
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const playlist = await playlistRepo.findById(String(req.params.id));

    if (!playlist) {
      return res.status(404).json({
        success: false,
        error: 'Playlist not found',
      });
    }

    enhancedLogger.system(LogLevel.INFO, 'Retrieved playlist', {
      playlistId: playlist.id,
      trackCount: playlist.tracks.length,
    });

    res.json({
      success: true,
      data: {
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        isPublic: playlist.isPublic,
        trackCount: playlist.tracks.length,
        tracks: playlist.tracks.map((t) => ({
          id: t.id,
          title: t.title,
          artist: t.artist,
          duration: t.duration,
          url: t.url,
          thumbnail: t.thumbnail,
          platform: t.platform,
          position: t.position,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve playlist',
    });
  }
});

// POST /api/playlists - Create a new playlist
router.post('/', async (req: Request, res: Response) => {
  try {
    const guildId = (req.headers['x-guild-id'] as string) || (req.query.guildId as string) || undefined;
    const { name, description, isPublic } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Playlist name is required',
      });
    }

    // Use a generic userId for dashboard-created playlists
    const userId = (req.headers['x-user-id'] as string) || 'dashboard';

    const playlist = await playlistRepo.create({
      guildId,
      userId,
      name: name.trim(),
      description: description?.trim(),
      isPublic: isPublic ?? true,
    });

    enhancedLogger.system(LogLevel.INFO, 'Created playlist', { playlistId: playlist.id, name: playlist.name });

    res.status(201).json({
      success: true,
      data: {
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        isPublic: playlist.isPublic,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create playlist',
    });
  }
});

// POST /api/playlists/:id/tracks - Add a track to a playlist
router.post('/:id/tracks', async (req: Request, res: Response) => {
  try {
    const playlist = await playlistRepo.findById(String(req.params.id));
    if (!playlist) {
      return res.status(404).json({ success: false, error: 'Playlist not found' });
    }

    const { title, artist, duration, url, thumbnail, platform, filePath } = req.body;
    if (!title || !url) {
      return res.status(400).json({ success: false, error: 'Track title and url are required' });
    }

    const track = await playlistRepo.addTrack(String(req.params.id), {
      title,
      artist,
      duration: duration ?? 0,
      url,
      thumbnail,
      platform: platform ?? 'unknown',
      filePath,
    });

    res.status(201).json({ success: true, data: track });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add track',
    });
  }
});

// PUT /api/playlists/:id - Update playlist metadata
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const playlist = await playlistRepo.findById(String(req.params.id));
    if (!playlist) {
      return res.status(404).json({ success: false, error: 'Playlist not found' });
    }

    const { name, description, isPublic } = req.body;
    const updated = await playlistRepo.update(String(req.params.id), {
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(isPublic !== undefined && { isPublic }),
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update playlist',
    });
  }
});

// DELETE /api/playlists/:id - Delete a playlist
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await playlistRepo.delete(String(req.params.id));
    res.json({ success: true, message: 'Playlist deleted' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete playlist',
    });
  }
});

// DELETE /api/playlists/:id/tracks/:trackId - Remove a track from playlist
router.delete('/:id/tracks/:trackId', async (req: Request, res: Response) => {
  try {
    const playlist = await playlistRepo.findById(String(req.params.id));
    if (!playlist) {
      return res.status(404).json({ success: false, error: 'Playlist not found' });
    }

    await playlistRepo.removeTrack(String(req.params.id), String(req.params.trackId));
    res.json({ success: true, message: 'Track removed' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove track',
    });
  }
});

// PUT /api/playlists/:id/tracks/:trackId/reorder - Reorder a track
router.put('/:id/tracks/:trackId/reorder', async (req: Request, res: Response) => {
  try {
    const { position } = req.body;
    if (typeof position !== 'number' || position < 0) {
      return res.status(400).json({ success: false, error: 'Valid position is required' });
    }

    await playlistRepo.reorderTrack(String(req.params.id), String(req.params.trackId), position);
    res.json({ success: true, message: 'Track reordered' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reorder track',
    });
  }
});

// POST /api/playlists/:id/play - Play an entire playlist
router.post('/:id/play', async (req: Request, res: Response) => {
  try {
    const guildId = getGuildId(req);
    const playlist = await playlistRepo.findById(String(req.params.id));

    if (!playlist) {
      return res.status(404).json({ success: false, error: 'Playlist not found' });
    }

    if (playlist.tracks.length === 0) {
      return res.status(400).json({ success: false, error: 'Playlist is empty' });
    }

    // Import player and play the first track, queue the rest
    const { useDefaultPlayer } = await import('../helpers/discord/player');
    const { QueryType } = await import('discord-player');
    const player = useDefaultPlayer();

    const guild = player.client.guilds.cache.get(guildId);
    if (!guild) {
      return res.status(404).json({ success: false, error: 'Guild not found' });
    }

    const queue = player.nodes.get(guild) ?? player.nodes.create(guild);
    let queuedCount = 0;

    for (const t of playlist.tracks) {
      const result = await player.search(t.url, { searchEngine: QueryType.AUTO });
      if (result.tracks.length > 0) {
        const track = result.tracks[0];
        if (queuedCount === 0 && !queue.isPlaying()) {
          await queue.node.play(track);
        } else {
          queue.addTrack(track);
        }
        queuedCount++;
      }
    }

    enhancedLogger.system(LogLevel.INFO, 'Playing playlist', {
      guildId,
      playlistId: playlist.id,
      tracksQueued: queuedCount,
    });

    res.json({
      success: true,
      data: {
        playlistName: playlist.name,
        tracksQueued: queuedCount,
      },
    });
  } catch (error) {
    const status = error instanceof Error && error.message === 'Guild ID is required' ? 400 : 500;
    res.status(status).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to play playlist',
    });
  }
});

export default router.getRouter();
