import { Player, createAudioPlayer, AudioPlayer, GuildQueue } from 'discord-player';
import { entersState, VoiceConnectionStatus } from 'discord-voip';
import { Client } from 'discord.js';
import { monitorEventLoopDelay } from 'node:perf_hooks';
import { PlayerEventManager } from './playerEventManager';
import { PlayerStateManager } from '../status/playerStateManager';
import { WebSocketManager } from '../websocket';
import { createLogger } from '../logger';
import { registerExtractors } from '../../extractors/index';
import { CustomYouTubeExtractor } from '../../extractors/YouTubeExtractor';
import type { StreamStatusEvent } from '../../extractors/YouTubeExtractor';
import { isE2EMode, registerE2EExtractors } from '../../testMode/index';

let player: Player | null = null;
let playerEventManager: PlayerEventManager | null = null;
let playerStateManager: PlayerStateManager | null = null;

const log = createLogger('player');

export const useDefaultPlayer = (): Player => {
  if (!player) {
    throw new Error('Player has not been initialized.');
  }
  return player;
};

export const getPlayerStateManager = (): PlayerStateManager => {
  if (!playerStateManager) {
    throw new Error('Player state manager has not been initialized.');
  }
  return playerStateManager;
};

export const getPlayerEventManager = (): PlayerEventManager => {
  if (!playerEventManager) {
    throw new Error('Player event manager has not been initialized.');
  }
  return playerEventManager;
};

/**
 * Create an AudioPlayer with a higher maxMissedFrames threshold.
 *
 * discord-voip defaults to maxMissedFrames=5 (100ms of silence before stopping).
 * FFmpeg takes ~100–300ms to start producing audio after being spawned, so the
 * default threshold causes playback to stop almost immediately (6 × 20ms = 120ms).
 * Setting it to 500 gives FFmpeg 10 seconds to start producing frames.
 */
export const createBotAudioPlayer = (): AudioPlayer =>
  createAudioPlayer({
    behaviors: {
      maxMissedFrames: 500,
    },
  });

/**
 * Wait for a queue's voice connection to reach "Ready" state.
 *
 * `queue.connect()` resolves immediately after the WebSocket IDENTIFY, but the
 * full UDP handshake + secret_key exchange takes another 1-3 seconds. If
 * `queue.node.play()` is called before the connection is Ready, FFmpeg
 * transcodes the entire track (especially fast for local files) while the
 * connection is still negotiating. By the time the AudioPlayer starts reading
 * from the resource, the pipeline has already finished → playbackDuration: 120ms.
 *
 * Calling this helper between `queue.connect()` and `queue.node.play()` ensures
 * the voice connection is fully ready before streaming begins.
 */
export const waitForVoiceReady = async (queue: GuildQueue, timeout = 30_000): Promise<void> => {
  const connection = queue.connection;
  if (!connection) return;
  if (connection.state.status === VoiceConnectionStatus.Ready) return;
  await entersState(connection, VoiceConnectionStatus.Ready, timeout);
};

/**
 * Check whether a queue's voice connection is in a usable state.
 *
 * A connection that is "destroyed" or "disconnected" will never become Ready on
 * its own. Callers should destroy the queue node and reconnect when this
 * returns false.
 */
export const isConnectionHealthy = (queue: GuildQueue): boolean => {
  const connection = queue.connection;
  if (!connection) return false;
  const status = connection.state.status;
  return status !== VoiceConnectionStatus.Destroyed && status !== VoiceConnectionStatus.Disconnected;
};

/**
 * Voice audio is sent as one 20ms Opus packet per timer tick, so any event
 * loop stall longer than a few frames is heard as choppy playback. Sample the
 * loop delay while something is playing and warn when it spikes, so stutter
 * can be told apart from network jitter (which this won't show).
 */
const LAG_SAMPLE_MS = 10_000;
const LAG_WARN_MS = 60;

const startEventLoopLagMonitor = (): void => {
  const histogram = monitorEventLoopDelay({ resolution: 10 });
  histogram.enable();
  const timer = setInterval(() => {
    const playing = player?.nodes.cache.some((queue) => queue.isPlaying()) ?? false;
    const maxMs = histogram.max / 1e6;
    if (playing && maxMs >= LAG_WARN_MS) {
      log.warn(
        {
          maxMs: Math.round(maxMs),
          p99Ms: Math.round(histogram.percentile(99) / 1e6),
          meanMs: Math.round(histogram.mean / 1e6),
          windowMs: LAG_SAMPLE_MS,
        },
        'Event loop stalled during playback - audio may stutter',
      );
    }
    histogram.reset();
  }, LAG_SAMPLE_MS);
  timer.unref();
};

export const initializePlayer = async (client: Client, wsManager?: WebSocketManager): Promise<Player> => {
  if (player) {
    return player;
  }

  player = new Player(client);

  player.events.on('debug', (_queue, message) => {
    log.debug(`Debug: ${message} on guild ${_queue.guild.id}`);
  });
  player.events.on('playerError', (queue, error) => {
    log.error(error);
  });

  player.events.on('playerStart', (queue, track) => {
    log.info(`${queue.guild.id} Started playing: ${track.title}`);
  });
  player.events.on('playerFinish', (queue, track) => {
    log.info(`${queue.guild.id} Finished playing: ${track.title}`);
  });

  player.events.on('error', (queue, err) => {
    log.error(err);
  });

  // When a track's own extractor can't stream it, discord-player's fallback
  // searches the other extractors for a "matching" track and plays that
  // instead (e.g. a 30s SoundCloud preview standing in for a YouTube video).
  // Fail the track instead. Set here so every queue-creation path gets it.
  player.events.on('queueCreate', (queue) => {
    queue.options.disableFallbackStream = true;
  });

  startEventLoopLagMonitor();

  player.events.on('connection', (queue) => {
    log.debug(`Voice connection established for guild ${queue.guild.id}`);
  });

  // Register platform extractors. In E2E mode, swap in the fixture extractor
  // so no real network / platform calls happen.
  if (isE2EMode()) {
    await registerE2EExtractors(player);
  } else {
    await registerExtractors(player);
  }

  // Initialize state manager with enhanced functionality
  playerStateManager = new PlayerStateManager(player);

  // Initialize event manager and connect it to state manager
  playerEventManager = new PlayerEventManager(player);
  playerEventManager.setPlayerStateManager(playerStateManager);

  // Connect WebSocket manager if provided
  if (wsManager) {
    playerEventManager.setWebSocketManager(wsManager);
  }

  return player;
};

export const setWebSocketManager = (wsManager: WebSocketManager): void => {
  if (playerEventManager) {
    playerEventManager.setWebSocketManager(wsManager);
  }

  // Wire YouTube extractor stream status events to WebSocket
  if (player) {
    const ytExtractor = player.extractors.get(CustomYouTubeExtractor.identifier) as CustomYouTubeExtractor | undefined;
    if (ytExtractor) {
      ytExtractor.events.removeAllListeners('streamStatus');
      ytExtractor.events.on('streamStatus', (status: StreamStatusEvent) => {
        wsManager.broadcastStreamStatus(status);
      });
      log.info('YouTube extractor stream status events wired to WebSocket');
    }
  }
};

export default useDefaultPlayer;
