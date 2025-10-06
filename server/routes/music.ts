import { Request, Response } from 'express';
import { QueryType, SearchResult } from 'discord-player';
import { useDefaultPlayer, getPlayerStateManager } from '../helpers/discord/player';
import { executeCommand } from '../helpers/commands/DiscordBotIntegration';
import { Track as DashboardTrack } from '../../shared/src/types/index';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { ValidationError, NotFoundError } from '../helpers/errorHandler';
import { expressRouter } from '../helpers/expressRouter';
import { LogLevel } from '../types/logging';
import { enhancedLogger } from '../helpers/logger/pinoBootstrap';
import { tErrors, tCommands } from 'discord-dashboard-shared/localization';

const router = expressRouter();

// Helper function to get guild ID from request
const getGuildId = (req: Request): string => {
  const guildId = (req.headers['x-guild-id'] as string) || (req.query.guildId as string);
  if (!guildId) {
    throw new ValidationError('Guild ID is required', { component: 'MusicPlayer', action: 'getGuildId' });
  }
  return guildId;
};

// Helper function to convert search results to dashboard tracks
const convertSearchResultToDashboard = (result: SearchResult): DashboardTrack[] => {
  if (!result.tracks || !result.tracks.length) {
    return [];
  }

  return result.tracks.map((track) => ({
    id: track.id || uuidv4(),
    title: track.title,
    artist: track.author,
    duration: parseDurationToSeconds(track.duration),
    url: track.url,
    cover: track.thumbnail,
    source: 'online' as const,
  }));
};

const parseDurationToSeconds = (duration: string): number => {
  if (!duration || duration === '0:00') return 0;

  const parts = duration.split(':').map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1]; // mm:ss
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2]; // hh:mm:ss
  }
  return 0;
};

// GET /api/music/state - Get current player state
router.get('/state', async (req: Request, res: Response) => {
  const guildId = getGuildId(req);
  const stateManager = getPlayerStateManager();
  const state = stateManager.getPlayerState(guildId);

  enhancedLogger.system(LogLevel.INFO, 'Retrieved player state', { guildId });

  res.json({
    success: true,
    data: state,
  });
});

// GET /api/music/history - Get playback history
router.get('/history', async (req: Request, res: Response) => {
  const guildId = getGuildId(req);
  const stateManager = getPlayerStateManager();
  const history = stateManager.getQueueHistory(guildId);

  enhancedLogger.system(LogLevel.INFO, 'Retrieved playback history', { guildId, historyCount: history.length });

  res.json({
    success: true,
    data: history,
  });
});

// GET /api/music/search - Proxy to command integration
router.get('/search', async (req: Request, res: Response) => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (!query) {
    return res.status(400).json({
      success: false,
      error: tErrors('command.validation.required'),
    });
  }

  try {
    const result = await executeCommand('search', { query });
    const results = (result as { results?: unknown[] })?.results ?? [];
    res.json({
      success: true,
      results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Search failed',
    });
  }
});

// POST /api/music/search - Search for music online
router.post('/search', async (req: Request, res: Response) => {
  const { query, searchEngine = 'youtube' } = req.body;

  if (!query) {
    return res.status(400).json({
      success: false,
      error: 'Search query is required',
    });
  }

  const player = useDefaultPlayer();

  // Map search engine names to QueryType
  let queryType: QueryType;
  switch (searchEngine.toLowerCase()) {
    case 'youtube':
      queryType = QueryType.YOUTUBE;
      break;
    case 'spotify':
      queryType = QueryType.SOUNDCLOUD; // Use available type as fallback
      break;
    case 'soundcloud':
      queryType = QueryType.SOUNDCLOUD;
      break;
    case 'apple':
      queryType = QueryType.AUTO; // Use available type as fallback
      break;
    default:
      queryType = QueryType.AUTO;
  }

  const result = await player.search(query, { searchEngine: queryType });
  const tracks = convertSearchResultToDashboard(result);

  enhancedLogger.system(LogLevel.INFO, 'Music search completed', { query, searchEngine, resultCount: tracks.length });

  res.json({
    success: true,
    data: {
      query,
      tracks,
      playlist: result.playlist
        ? {
            title: result.playlist.title,
            description: result.playlist.description,
            thumbnail: result.playlist.thumbnail,
            url: result.playlist.url,
          }
        : null,
    },
  });
});

// POST /api/music/play - Play a track or add to queue
router.post('/play', async (req: Request, res: Response) => {
  const guildId = getGuildId(req);
  const { query, source = 'online', filePath, playNow = false } = req.body;

  if (!query && !filePath) {
    throw new ValidationError('errors.validation.required', {
      component: 'MusicPlayer',
      action: 'play',
    });
  }

  const player = useDefaultPlayer();
  const stateManager = getPlayerStateManager();

  // Get or create queue
  const guild = player.client.guilds.cache.get(guildId);
  if (!guild) {
    throw new NotFoundError(tErrors('bot.instanceNotFound'), {
      component: 'MusicPlayer',
      action: 'play',
      guildId,
    });
  }

  let result: SearchResult;

  if (source === 'local' && filePath) {
    // Handle local file playback
    const success = await stateManager.addLocalFile(guildId, filePath);
    if (!success) {
      return res.status(400).json({
        success: false,
        error: tErrors('player.playbackFailed'),
      });
    }

    enhancedLogger.system(LogLevel.INFO, 'Local file added to queue', { guildId, filePath });

    return res.json({
      success: true,
      message: 'Local file added to queue',
    });
  } else {
    // Handle online search and play
    result = await player.search(query, { searchEngine: QueryType.AUTO });

    if (!result || !result.tracks?.length) {
      return res.status(404).json({
        success: false,
        error: 'No tracks found',
      });
    }
  }

  const queue = player.nodes.get(guild) ?? player.nodes.create(guild);
  const track = result.tracks[0];

  if (playNow || !queue.isPlaying()) {
    await queue.node.play(track);
  } else {
    queue.addTrack(track);
  }

  enhancedLogger.system(LogLevel.INFO, `Track ${playNow ? 'played' : 'added to queue'}`, {
    guildId,
    trackTitle: track.title,
    trackUrl: track.url,
    playNow,
  });

  res.json({
    success: true,
    data: {
      track: {
        id: track.id || uuidv4(),
        title: track.title,
        artist: track.author,
        duration: parseDurationToSeconds(track.duration),
        url: track.url,
        cover: track.thumbnail,
        source: 'online' as const,
      },
      action: playNow ? 'playing' : 'queued',
    },
  });
});

// POST /api/music/pause - Pause playback
router.post('/pause', async (req: Request, res: Response) => {
  const guildId = getGuildId(req);
  const player = useDefaultPlayer();
  const queue = player.nodes.get(guildId);

  if (!queue || !queue.isPlaying()) {
    return res.status(400).json({
      success: false,
      error: 'No music currently playing',
    });
  }

  const success = queue.node.pause();

  enhancedLogger.system(LogLevel.INFO, 'Playback paused', { guildId, success });

  res.json({
    success,
    message: success ? tCommands('pause.responses.success') : tCommands('pause.responses.error'),
  });
});

// POST /api/music/resume - Resume playback
router.post('/resume', async (req: Request, res: Response) => {
  const guildId = getGuildId(req);
  const player = useDefaultPlayer();
  const queue = player.nodes.get(guildId);

  if (!queue) {
    return res.status(400).json({
      success: false,
      error: 'No active queue',
    });
  }

  const success = queue.node.resume();

  enhancedLogger.system(LogLevel.INFO, `Playback resumed`, { guildId, success });

  res.json({
    success,
    message: success ? tCommands('resume.responses.success') : tCommands('resume.responses.error'),
  });
});

// POST /api/music/stop - Stop playback
router.post('/stop', async (req: Request, res: Response) => {
  const guildId = getGuildId(req);
  const player = useDefaultPlayer();
  const queue = player.nodes.get(guildId);

  if (!queue) {
    return res.status(400).json({
      success: false,
      error: 'No active queue',
    });
  }

  queue.node.stop();

  enhancedLogger.system(LogLevel.INFO, `Playback stopped`, { guildId });

  res.json({
    success: true,
    message: 'Playback stopped',
  });
});

// POST /api/music/skip - Skip to next track
router.post('/skip', async (req: Request, res: Response) => {
  const guildId = getGuildId(req);
  const player = useDefaultPlayer();
  const queue = player.nodes.get(guildId);

  if (!queue || !queue.currentTrack) {
    return res.status(400).json({
      success: false,
      error: 'No music currently playing',
    });
  }

  const success = queue.node.skip();

  enhancedLogger.system(LogLevel.INFO, `Track skipped`, { guildId, success });

  res.json({
    success,
    message: success ? tCommands('skip.responses.success') : tCommands('skip.responses.error'),
  });
});

// POST /api/music/seek - Seek to position
router.post('/seek', async (req: Request, res: Response) => {
  const guildId = getGuildId(req);
  const { position } = req.body;

  if (typeof position !== 'number' || position < 0) {
    return res.status(400).json({
      success: false,
      error: 'Valid position (in seconds) is required',
    });
  }

  const stateManager = getPlayerStateManager();
  const success = await stateManager.seekTo(guildId, position);

  enhancedLogger.system(LogLevel.INFO, `Seek operation`, { guildId, position, success });

  res.json({
    success,
    message: success ? tCommands('seek.responses.success') : tCommands('seek.responses.error'),
  });
});

// POST /api/music/volume - Set volume
router.post('/volume', async (req: Request, res: Response) => {
  const guildId = getGuildId(req);
  const { volume } = req.body;

  if (typeof volume !== 'number' || volume < 0 || volume > 100) {
    return res.status(400).json({
      success: false,
      error: 'Volume must be between 0 and 100',
    });
  }

  const stateManager = getPlayerStateManager();
  const success = await stateManager.setVolume(guildId, volume);

  enhancedLogger.system(LogLevel.INFO, `Volume changed`, { guildId, volume, success });

  res.json({
    success,
    message: success ? tCommands('volume.responses.success') : tCommands('volume.responses.error'),
  });
});

// POST /api/music/repeat - Set repeat mode
router.post('/repeat', async (req: Request, res: Response) => {
  const guildId = getGuildId(req);
  const { mode } = req.body;

  if (!['off', 'track', 'queue', 'autoplay'].includes(mode)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid repeat mode. Must be: off, track, queue, or autoplay',
    });
  }

  const stateManager = getPlayerStateManager();
  const success = await stateManager.setRepeatMode(guildId, mode);

  enhancedLogger.system(LogLevel.INFO, `Repeat mode changed`, { guildId, mode, success });

  res.json({
    success,
    message: success ? tCommands('loop.responses.success') : tCommands('loop.responses.error'),
  });
});

// GET /api/music/queue - Get current queue
router.get('/queue', async (req: Request, res: Response) => {
  const guildId = getGuildId(req);
  const player = useDefaultPlayer();
  const queue = player.nodes.get(guildId);

  if (!queue) {
    return res.json({
      success: true,
      data: {
        current: null,
        upcoming: [],
        history: [],
      },
    });
  }

  const stateManager = getPlayerStateManager();
  const state = stateManager.getPlayerState(guildId);

  res.json({
    success: true,
    data: {
      current: state.track,
      upcoming: state.queue,
      history: state.history,
    },
  });
});

// POST /api/music/queue/add - Add track to queue
router.post('/queue/add', async (req: Request, res: Response) => {
  const guildId = getGuildId(req);
  const { query, position } = req.body;

  if (!query) {
    return res.status(400).json({
      success: false,
      error: 'Query is required',
    });
  }

  const player = useDefaultPlayer();
  const result = await player.search(query, { searchEngine: QueryType.AUTO });

  if (!result || !result.tracks?.length) {
    return res.status(404).json({
      success: false,
      error: 'No tracks found',
    });
  }

  const guild = player.client.guilds.cache.get(guildId);
  if (!guild) {
    return res.status(404).json({
      success: false,
      error: tErrors('bot.instanceNotFound'),
    });
  }

  const queue = player.nodes.get(guild) ?? player.nodes.create(guild);
  const track = result.tracks[0];

  if (typeof position === 'number' && position >= 0) {
    queue.insertTrack(track, position);
  } else {
    queue.addTrack(track);
  }

  enhancedLogger.system(LogLevel.INFO, `Track added to queue`, {
    guildId,
    trackTitle: track.title,
    position,
  });

  res.json({
    success: true,
    data: {
      track: {
        id: track.id || uuidv4(),
        title: track.title,
        artist: track.author,
        duration: parseDurationToSeconds(track.duration),
        url: track.url,
        cover: track.thumbnail,
        source: 'online' as const,
      },
      position: position ?? queue.tracks.size,
    },
  });
});

// DELETE /api/music/queue/:index - Remove track from queue
router.delete('/queue/:index', async (req: Request, res: Response) => {
  const guildId = getGuildId(req);
  const index = parseInt(req.params.index);

  if (isNaN(index) || index < 0) {
    return res.status(400).json({
      success: false,
      error: 'Valid track index is required',
    });
  }

  const player = useDefaultPlayer();
  const queue = player.nodes.get(guildId);

  if (!queue) {
    return res.status(404).json({
      success: false,
      error: 'No active queue',
    });
  }

  if (index >= queue.tracks.size) {
    return res.status(400).json({
      success: false,
      error: 'Track index out of range',
    });
  }

  const removedTrack = queue.removeTrack(index);

  enhancedLogger.system(LogLevel.INFO, `Track removed from queue`, {
    guildId,
    index,
    trackTitle: removedTrack?.title,
  });

  res.json({
    success: true,
    message: 'Track removed from queue',
    data: {
      removedTrack: removedTrack
        ? {
            id: removedTrack.id || uuidv4(),
            title: removedTrack.title,
            artist: removedTrack.author,
            duration: parseDurationToSeconds(removedTrack.duration),
            url: removedTrack.url,
            cover: removedTrack.thumbnail,
            source: 'online' as const,
          }
        : null,
    },
  });
});

// POST /api/music/queue/clear - Clear the queue
router.post('/queue/clear', async (req: Request, res: Response) => {
  const guildId = getGuildId(req);
  const player = useDefaultPlayer();
  const queue = player.nodes.get(guildId);

  if (!queue) {
    return res.status(404).json({
      success: false,
      error: 'No active queue',
    });
  }

  const clearedCount = queue.tracks.size;
  queue.tracks.clear();

  enhancedLogger.system(LogLevel.INFO, `Queue cleared`, { guildId, clearedCount });

  res.json({
    success: true,
    message: `Cleared ${clearedCount} tracks from queue`,
  });
});

// POST /api/music/queue/shuffle - Shuffle the queue
router.post('/queue/shuffle', async (req: Request, res: Response) => {
  const guildId = getGuildId(req);
  const player = useDefaultPlayer();
  const queue = player.nodes.get(guildId);

  if (!queue) {
    return res.status(404).json({
      success: false,
      error: 'No active queue',
    });
  }

  queue.tracks.shuffle();

  enhancedLogger.system(LogLevel.INFO, `Queue shuffled`, { guildId });

  res.json({
    success: true,
    message: 'Queue shuffled',
  });
});

// GET /api/music/local-files - List available local files
router.get('/local-files', async (req: Request, res: Response) => {
  const uploadsDir = path.resolve('uploads/audio');

  if (!fs.existsSync(uploadsDir)) {
    return res.json({
      success: true,
      data: [],
    });
  }

  const files = fs
    .readdirSync(uploadsDir)
    .filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return ['.mp3', '.wav', '.flac', '.ogg', '.m4a'].includes(ext);
    })
    .map((file) => {
      const filePath = path.join(uploadsDir, file);
      const stats = fs.statSync(filePath);

      return {
        id: uuidv4(),
        fileName: file,
        originalName: file,
        filePath: file,
        size: stats.size,
        uploadedAt: stats.mtime.getTime(),
        mimeType: `audio/${path.extname(file).slice(1)}`,
      };
    });

  res.json({
    success: true,
    data: files,
  });
});

export default router.getRouter();
