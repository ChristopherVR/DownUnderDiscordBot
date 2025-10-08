import { Player } from 'discord-player';
import { AttachmentExtractor } from '@discord-player/extractor';
import { Client } from 'discord.js';
import { PlayerEventManager } from './playerEventManager';
import { PlayerStateManager } from '../status/playerStateManager';
import { WebSocketManager } from '../websocket';
import { YoutubeiExtractor } from 'discord-player-youtubei';
import { ClientType, Innertube } from 'youtubei.js';
import { URL } from 'node:url';
import { createLogger } from '../logger';
import { Readable } from 'stream';

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

  await player.extractors.register(AttachmentExtractor, {});

  await player.extractors.register(YoutubeiExtractor, {
    innertubeConfigRaw: {
      // Git issue - https://github.com/LuanRT/YouTube.js/issues/1043
      player_id: '0004de42',
      client_type: 'WEB',
      gl: 'ZA',
      hl: 'en',
    },
    streamOptions: { highWaterMark: 1 << 25 },

    createStream: async (track) => {
      const url = track.url;
      if (!url) throw new Error('Track has no URL');

      try {
        const innerTube = await Innertube.create({
          player_id: '0004de42',
          client_type: ClientType.ANDROID,
        });

        const uarl = new URL(url);

        const vidId = uarl.searchParams.get('v');

        const info = await innerTube.getBasicInfo(vidId!);

        const stream = await info.download();

        return Readable.from(stream);
      } catch (err) {
        log.error({ err, url }, 'Failed to fetch stream with this type, trying fallback');

        throw err;
      }
    },
  });

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
};

export default useDefaultPlayer;
