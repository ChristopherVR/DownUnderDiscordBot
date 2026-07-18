import { Request, Response } from 'express';
import { QueryType, SearchResult } from 'discord-player';
import {
  useDefaultPlayer,
  getPlayerStateManager,
  createBotAudioPlayer,
  waitForVoiceReady,
  isConnectionHealthy,
} from '../helpers/discord/player';
import { executeCommand } from '../helpers/commands/DiscordBotIntegration';
import { Track as DashboardTrack } from 'discord-dashboard-shared';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { getAudioStreamUrl } from '../helpers/ytdlp.js';
import { CustomYouTubeExtractor } from '../extractors/YouTubeExtractor.js';
import { SpotifyExtractor } from '../extractors/SpotifyExtractor.js';
import { SoundCloudExtractor } from '../extractors/SoundCloudExtractor.js';
import { AppleMusicExtractor } from '../extractors/AppleMusicExtractor.js';
import { isE2EMode, FixtureExtractor } from '../testMode/index.js';
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

/**
 * Pump a whatwg ReadableStream reader into an Express response, aborting the
 * upstream read as soon as the client disconnects.
 *
 * Without this, skipping/changing tracks (which aborts the browser's fetch
 * to this endpoint) left the recursive read loop running indefinitely —
 * `res.write()` on a dead socket doesn't stop the loop on its own, so every
 * track change accumulated another orphaned stream still pulling audio
 * bytes from the upstream CDN into memory. That's the real cause behind
 * runaway memory growth during normal skip/replay use.
 */
async function pumpReaderToResponse(reader: ReadableStreamDefaultReader<Uint8Array>, req: Request, res: Response) {
  let clientGone = false;
  const onClose = () => {
    clientGone = true;
    reader.cancel().catch(() => {});
  };
  req.on('close', onClose);

  try {
    for (;;) {
      if (clientGone || res.destroyed) break;
      const { done, value } = await reader.read();
      if (done) break;
      if (clientGone || res.destroyed) break;
      if (!res.write(value)) {
        await new Promise<void>((resolve) => res.once('drain', resolve));
      }
    }
  } finally {
    req.off('close', onClose);
    if (!res.destroyed) res.end();
    if (!clientGone) reader.cancel().catch(() => {});
  }
}

// Map extractor identifiers to user-facing platform names
const identifierToPlatform: Record<string, string> = {
  [CustomYouTubeExtractor.identifier]: 'youtube',
  [SpotifyExtractor.identifier]: 'spotify',
  [SoundCloudExtractor.identifier]: 'soundcloud',
  [AppleMusicExtractor.identifier]: 'applemusic',
};

/** Detect platform from a track URL */
const detectPlatformFromUrl = (url?: string): string | undefined => {
  if (!url) return undefined;
  if (/youtu\.?be/i.test(url)) return 'youtube';
  if (/spotify\.com/i.test(url)) return 'spotify';
  if (/soundcloud\.com/i.test(url)) return 'soundcloud';
  if (/music\.apple\.com/i.test(url)) return 'applemusic';
  return undefined;
};

// Helper function to convert search results to dashboard tracks
const convertSearchResultToDashboard = (
  result: SearchResult,
  platformHint?: string,
): (DashboardTrack & { platform?: string })[] => {
  if (!result.tracks || !result.tracks.length) {
    return [];
  }

  return result.tracks.map((track) => ({
    id: track.id || uuidv4(),
    title: track.title,
    artist: track.author,
    duration: parseDurationToSeconds(track.duration),
    url: track.url,
    thumbnail: track.thumbnail,
    source: 'online' as const,
    platform: platformHint ?? detectPlatformFromUrl(track.url),
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

// POST /api/music/connect - Join a voice channel
router.post('/connect', async (req: Request, res: Response) => {
  const guildId = getGuildId(req);
  const { voiceChannelId } = req.body;

  if (!voiceChannelId) {
    return res.status(400).json({ success: false, error: 'voiceChannelId is required' });
  }

  const player = useDefaultPlayer();
  const guild = player.client.guilds.cache.get(guildId);
  if (!guild) {
    return res.status(404).json({ success: false, error: tErrors('bot.instanceNotFound') });
  }

  try {
    let queue = player.nodes.get(guild) ?? player.nodes.create(guild);

    // Destroy stale connections so we start fresh
    if (queue.connection && !isConnectionHealthy(queue)) {
      enhancedLogger.system(LogLevel.WARN, 'Stale voice connection detected, reconnecting', { guildId });
      queue.delete();
      queue = player.nodes.create(guild);
    }

    if (!queue.connection) {
      await queue.connect(voiceChannelId, { deaf: true, audioPlayer: createBotAudioPlayer() });
    }

    await waitForVoiceReady(queue);
    enhancedLogger.system(LogLevel.INFO, 'Bot joined voice channel', { guildId, voiceChannelId });
    res.json({ success: true, voiceChannelId });
  } catch (error) {
    enhancedLogger.system(LogLevel.ERROR, 'Failed to join voice channel', {
      guildId,
      voiceChannelId,
      error: error instanceof Error ? error.message : String(error),
    });
    res
      .status(502)
      .json({ success: false, error: error instanceof Error ? error.message : 'Failed to join voice channel' });
  }
});

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
//
// The custom extractors' validate() only matches URLs, so player.search() with
// QueryType never routes plain-text search queries to them.  Instead we look up
// the registered extractor by identifier and call its handle() directly, which
// includes a search fallback path for every extractor.
router.post('/search', async (req: Request, res: Response) => {
  const { query, searchEngine = 'auto' } = req.body;

  if (!query) {
    return res.status(400).json({
      success: false,
      error: 'Search query is required',
    });
  }

  const player = useDefaultPlayer();
  const isUrl = /^https?:\/\//.test(query.trim());

  try {
    // For URLs, let discord-player resolve via validate() — that still works.
    if (isUrl) {
      const result = await player.search(query, { searchEngine: QueryType.AUTO });
      const urlPlatform = detectPlatformFromUrl(query);
      const tracks = convertSearchResultToDashboard(result, urlPlatform);

      enhancedLogger.system(LogLevel.INFO, 'Music search completed (URL)', {
        query,
        resultCount: tracks.length,
      });

      return res.json({
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
    }

    // --- Text search: call the correct extractor directly ---
    const engine = searchEngine.toLowerCase();

    // Map engine name → extractor identifier
    const engineToIdentifier: Record<string, string> = {
      youtube: CustomYouTubeExtractor.identifier,
      spotify: SpotifyExtractor.identifier,
      soundcloud: SoundCloudExtractor.identifier,
      apple: AppleMusicExtractor.identifier,
      apple_music: AppleMusicExtractor.identifier,
      applemusic: AppleMusicExtractor.identifier,
    };

    // For 'auto', default to YouTube search (most universal) — except in E2E
    // mode, where the real platform extractors aren't registered at all
    // (initializePlayer swaps in FixtureExtractor instead; see player.ts).
    const autoIdentifier = isE2EMode() ? FixtureExtractor.identifier : CustomYouTubeExtractor.identifier;
    const identifiers = engine === 'auto' ? [autoIdentifier] : [engineToIdentifier[engine] ?? autoIdentifier];

    let tracks: (DashboardTrack & { platform?: string })[] = [];
    let playlistData: { title: string; description: string; thumbnail: string; url: string } | null = null;

    for (const id of identifiers) {
      const ext = player.extractors.get(id);
      if (!ext) {
        enhancedLogger.system(LogLevel.WARN, `Extractor ${id} not found in registry`);
        continue;
      }

      const resolvedPlatform = identifierToPlatform[id] ?? detectPlatformFromUrl(query);

      // Create a minimal search context (no guild interaction needed for search)
      const fakeContext = { requestedBy: null } as never;
      const result = await ext.handle(query, fakeContext);
      if (result && result.tracks && result.tracks.length > 0) {
        tracks = result.tracks.map((track) => ({
          id: track.id || uuidv4(),
          title: track.title,
          artist: track.author,
          duration: parseDurationToSeconds(track.duration),
          url: track.url,
          thumbnail: track.thumbnail,
          source: 'online' as const,
          platform: resolvedPlatform ?? detectPlatformFromUrl(track.url),
        }));

        if (result.playlist) {
          playlistData = {
            title: result.playlist.title,
            description: result.playlist.description ?? '',
            thumbnail: result.playlist.thumbnail ?? '',
            url: result.playlist.url ?? '',
          };
        }
        break;
      }
    }

    enhancedLogger.system(LogLevel.INFO, 'Music search completed', {
      query,
      searchEngine,
      resultCount: tracks.length,
    });

    res.json({
      success: true,
      data: {
        query,
        tracks,
        playlist: playlistData,
      },
    });
  } catch (error) {
    enhancedLogger.system(LogLevel.ERROR, 'Music search failed', {
      query,
      searchEngine,
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Search failed',
    });
  }
});

// POST /api/music/play - Play a track or add to queue
router.post('/play', async (req: Request, res: Response) => {
  const guildId = getGuildId(req);
  const { query, source: sourceRaw, platform, filePath: filePathRaw, playNow = false, voiceChannelId } = req.body;
  // Desktop sends `platform` while older callers use `source` — accept both.
  const source: string = sourceRaw ?? platform ?? 'online';
  // When the desktop plays a local file in bot mode it sends the path as `query`
  // with platform='local' but no separate `filePath` field.
  const filePath: string | undefined = filePathRaw ?? (source === 'local' && query ? query : undefined);

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

  let queue = player.nodes.get(guild) ?? player.nodes.create(guild);

  // If the existing connection is in a bad state (disconnected/destroyed),
  // tear it down so we can create a fresh one.
  if (queue.connection && !isConnectionHealthy(queue)) {
    enhancedLogger.system(LogLevel.WARN, 'Stale voice connection detected, reconnecting', { guildId });
    queue.delete();
    queue = player.nodes.create(guild);
  }

  // Join voice channel if not already connected
  if (!queue.connection) {
    if (!voiceChannelId) {
      return res.status(400).json({
        success: false,
        error: 'Bot is not in a voice channel. Provide voiceChannelId to connect.',
        requiresVoiceChannel: true,
      });
    }

    try {
      await queue.connect(voiceChannelId, { deaf: true, audioPlayer: createBotAudioPlayer() });
      enhancedLogger.system(LogLevel.INFO, 'Bot joined voice channel for playback', { guildId, voiceChannelId });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to join voice channel',
      });
    }
  }

  // Ensure the voice connection is fully ready (UDP handshake + encryption)
  // before streaming. Without this, FFmpeg finishes transcoding local files
  // before the connection is ready, causing the audio pipeline to end immediately.
  try {
    await waitForVoiceReady(queue);
  } catch {
    // Voice connection failed to become ready (e.g. UDP handshake timed out).
    // Clean up so the next attempt starts fresh.
    queue.delete();
    return res.status(502).json({
      success: false,
      error: 'Voice connection timed out. Discord voice server may be unreachable — please try again.',
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
    // Use AUTO for URLs (extractors resolve them), YOUTUBE_SEARCH for text queries
    const isUrl = /^https?:\/\//.test(query.trim());
    const searchType = isUrl ? QueryType.AUTO : QueryType.YOUTUBE_SEARCH;
    result = await player.search(query, { searchEngine: searchType });

    if (!result || !result.tracks?.length) {
      return res.status(404).json({
        success: false,
        error: 'No tracks found',
      });
    }
  }

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

// POST /api/music/back - Go to previous track
router.post('/back', async (req: Request, res: Response) => {
  const guildId = getGuildId(req);
  const player = useDefaultPlayer();
  const queue = player.nodes.get(guildId);

  if (!queue || !queue.currentTrack) {
    return res.status(400).json({
      success: false,
      error: 'No music currently playing',
    });
  }

  const node = queue.node as { back?: () => unknown };
  let success = false;
  if (typeof node.back === 'function') {
    const result = node.back();
    const resolved = await Promise.resolve(result as unknown);
    success = typeof resolved === 'boolean' ? resolved : Boolean(resolved);
  }

  enhancedLogger.system(LogLevel.INFO, `Track back`, { guildId, success });

  res.json({
    success,
    message: success ? tCommands('previous.responses.success') : tCommands('previous.responses.error'),
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
  const { query, position, platform } = req.body;

  if (!query) {
    return res.status(400).json({
      success: false,
      error: 'Query is required',
    });
  }

  const player = useDefaultPlayer();

  // Handle local files via the state manager (same as the /play endpoint)
  if (platform === 'local') {
    const stateManager = getPlayerStateManager();
    const guild = player.client.guilds.cache.get(guildId);
    if (!guild) {
      return res.status(404).json({ success: false, error: tErrors('bot.instanceNotFound') });
    }
    // Ensure a queue exists
    const _queue = player.nodes.get(guild) ?? player.nodes.create(guild);

    const success = await stateManager.addLocalFile(guildId, query);
    if (!success) {
      return res.status(400).json({ success: false, error: 'Failed to add local file to queue' });
    }

    return res.json({ success: true, message: 'Local file added to queue' });
  }

  // Use AUTO for URLs, YOUTUBE_SEARCH for plain text queries
  const isUrl = /^https?:\/\//.test(query.trim());
  const searchType = isUrl ? QueryType.AUTO : QueryType.YOUTUBE_SEARCH;
  const result = await player.search(query, { searchEngine: searchType });

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
  const index = parseInt(String(req.params.index));

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

  // Broadcast updated state so WebSocket clients (desktop UI) reflect the change
  const stateManager = getPlayerStateManager();
  stateManager.forceUpdate(guildId);

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

  // Broadcast updated state so WebSocket clients (desktop UI) reflect the change
  const stateManager = getPlayerStateManager();
  stateManager.forceUpdate(guildId);

  enhancedLogger.system(LogLevel.INFO, `Queue cleared`, { guildId, clearedCount });

  res.json({
    success: true,
    message: `Cleared ${clearedCount} tracks from queue`,
  });
});

// POST /api/music/queue/move - Move a track to a new position in the queue
router.post('/queue/move', async (req: Request, res: Response) => {
  const guildId = getGuildId(req);
  const { from, to } = req.body;

  if (typeof from !== 'number' || typeof to !== 'number' || from < 0 || to < 0) {
    return res.status(400).json({
      success: false,
      error: 'Valid "from" and "to" indices are required',
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

  if (from >= queue.tracks.size || to >= queue.tracks.size) {
    return res.status(400).json({
      success: false,
      error: 'Track index out of range',
    });
  }

  const track = queue.removeTrack(from);
  if (!track) {
    return res.status(500).json({
      success: false,
      error: 'Failed to remove track from queue',
    });
  }

  queue.insertTrack(track, to);

  enhancedLogger.system(LogLevel.INFO, `Track moved in queue`, {
    guildId,
    from,
    to,
    trackTitle: track.title,
  });

  res.json({
    success: true,
    message: `Track moved from position ${from} to ${to}`,
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

  // Broadcast updated state so WebSocket clients (desktop UI) reflect the change
  const stateManager = getPlayerStateManager();
  stateManager.forceUpdate(guildId);

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

// GET /api/music/stream - Stream audio for local playback on the desktop app.
// Accepts either a `url` (online track) or `filePath` (uploaded local file) query param.
// For YouTube URLs it resolves a direct audio stream via yt-dlp and proxies it.
// For other URLs it uses the built-in fetch to proxy the response.
// For local files it streams from the uploads/audio directory.
router.get('/stream', async (req: Request, res: Response) => {
  const url = req.query.url as string | undefined;
  const filePath = req.query.filePath as string | undefined;

  if (!url && !filePath) {
    return res.status(400).json({ success: false, error: 'url or filePath query parameter is required' });
  }

  try {
    // --- Local file streaming ---
    if (filePath) {
      const audioDir = path.resolve('uploads/audio');
      const videoDir = path.resolve('uploads/video');
      const safeName = path.basename(filePath);

      // Check both audio and video upload directories
      let fullPath = path.join(audioDir, safeName);
      if (!fs.existsSync(fullPath)) {
        fullPath = path.join(videoDir, safeName);
      }

      if (!fs.existsSync(fullPath)) {
        return res.status(404).json({ success: false, error: 'File not found' });
      }

      const stat = fs.statSync(fullPath);
      const ext = path.extname(safeName).toLowerCase().slice(1);
      const mimeMap: Record<string, string> = {
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        flac: 'audio/flac',
        ogg: 'audio/ogg',
        m4a: 'audio/mp4',
        aac: 'audio/aac',
        webm: 'audio/webm',
        mp4: 'video/mp4',
        mkv: 'video/x-matroska',
        avi: 'video/x-msvideo',
        mov: 'video/quicktime',
        flv: 'video/x-flv',
        ogv: 'video/ogg',
        '3gp': 'video/3gpp',
      };
      const contentType = mimeMap[ext] ?? 'application/octet-stream';

      // Support range requests for seeking
      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': end - start + 1,
          'Content-Type': contentType,
        });
        fs.createReadStream(fullPath, { start, end }).pipe(res);
      } else {
        res.writeHead(200, {
          'Content-Length': stat.size,
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes',
        });
        fs.createReadStream(fullPath).pipe(res);
      }

      enhancedLogger.system(LogLevel.INFO, 'Streaming local file', { filePath: safeName });
      return;
    }

    // --- Online URL streaming ---
    const trackUrl = url!;

    // Check if it's a YouTube URL
    const isYouTube = /(?:youtube\.com|youtu\.be)/i.test(trackUrl);

    if (isYouTube) {
      // Resolve audio stream URL via yt-dlp (youtubei.js decipher is broken)
      const streamUrl = await getAudioStreamUrl(trackUrl);

      // Proxy the audio stream
      const audioRes = await fetch(streamUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });

      if (!audioRes.ok || !audioRes.body) {
        return res.status(502).json({ success: false, error: 'Failed to fetch audio stream' });
      }

      res.writeHead(200, {
        'Content-Type': audioRes.headers.get('content-type') ?? 'audio/webm',
        'Content-Length': audioRes.headers.get('content-length') ?? '',
        'Accept-Ranges': 'bytes',
      });

      // Pipe the web ReadableStream to the Node response
      await pumpReaderToResponse(audioRes.body.getReader(), req, res);

      enhancedLogger.system(LogLevel.INFO, 'Streamed YouTube audio via yt-dlp', { url: trackUrl });
      return;
    }

    // Generic URL proxy — for SoundCloud, Spotify resolved URLs, etc.
    // First try to resolve via discord-player to get the actual track URL
    const player = useDefaultPlayer();
    const searchResult = await player.search(trackUrl, { searchEngine: QueryType.AUTO });
    const resolvedTrack = searchResult.tracks[0];

    // Fixture tracks (E2E mode) use a non-fetchable placeholder `url`
    // (e.g. "test:song-1") — the actual audio comes from the extractor's
    // own stream() method (a Readable over a bundled silent WAV), not an
    // HTTP resource. Every other branch here proxies a real network fetch,
    // which fails immediately for these.
    if (isE2EMode() && resolvedTrack?.extractor?.identifier === FixtureExtractor.identifier) {
      const stream = await resolvedTrack.extractor.stream(resolvedTrack);
      res.writeHead(200, { 'Content-Type': 'audio/wav', 'Accept-Ranges': 'bytes' });
      (stream as fs.ReadStream).pipe(res);
      enhancedLogger.system(LogLevel.INFO, 'Streamed fixture track (E2E mode)', { url: trackUrl });
      return;
    }

    let resolvedUrl = trackUrl;
    if (resolvedTrack) {
      // Try to get a streamable URL from the first track
      resolvedUrl = resolvedTrack.url || trackUrl;
    }

    const proxyRes = await fetch(resolvedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    if (!proxyRes.ok || !proxyRes.body) {
      return res.status(502).json({ success: false, error: 'Failed to fetch audio from URL' });
    }

    res.writeHead(200, {
      'Content-Type': proxyRes.headers.get('content-type') ?? 'audio/mpeg',
      'Transfer-Encoding': 'chunked',
    });

    await pumpReaderToResponse(proxyRes.body.getReader(), req, res);

    enhancedLogger.system(LogLevel.INFO, 'Streamed online audio', { url: trackUrl });
  } catch (error) {
    enhancedLogger.system(LogLevel.ERROR, 'Stream failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Stream failed',
      });
    } else {
      res.end();
    }
  }
});

// GET /api/music/stream/local - Stream a local file from a Tauri music folder path.
// The desktop app sends the full file path, and the bot reads and serves it.
router.get('/stream/local', async (req: Request, res: Response) => {
  const filePath = req.query.path as string | undefined;
  if (!filePath) {
    return res.status(400).json({ success: false, error: 'path query parameter is required' });
  }

  try {
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    const stat = fs.statSync(filePath);
    const ext = path.extname(filePath).toLowerCase().slice(1);
    const mimeMap: Record<string, string> = {
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      flac: 'audio/flac',
      ogg: 'audio/ogg',
      m4a: 'audio/mp4',
      aac: 'audio/aac',
      webm: 'audio/webm',
      mp4: 'video/mp4',
      mkv: 'video/x-matroska',
      avi: 'video/x-msvideo',
      mov: 'video/quicktime',
      flv: 'video/x-flv',
      ogv: 'video/ogg',
      '3gp': 'video/3gpp',
    };
    const contentType = mimeMap[ext] ?? 'application/octet-stream';

    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': end - start + 1,
        'Content-Type': contentType,
      });
      fs.createReadStream(filePath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': stat.size,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
      });
      fs.createReadStream(filePath).pipe(res);
    }

    enhancedLogger.system(LogLevel.INFO, 'Streaming local folder file', { filePath });
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to stream file',
      });
    }
  }
});

export default router.getRouter();
