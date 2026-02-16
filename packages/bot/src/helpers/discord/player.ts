import { Player } from 'discord-player';
import { Client } from 'discord.js';
import { PlayerEventManager } from './playerEventManager';
import { PlayerStateManager } from '../status/playerStateManager';
import { WebSocketManager } from '../websocket';
import { createLogger } from '../logger';
import { registerExtractors } from '../../extractors/index';

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

  player.events.on('connection', (queue) => {
    queue.dispatcher?.voiceConnection.on('stateChange', (oldState, newState) => {
      log.debug(`Voice connection state changed from ${oldState.status} to ${newState.status}`);
      const oldNetworking = Reflect.get(oldState, 'networking');
      const newNetworking = Reflect.get(newState, 'networking');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const networkStateChangeHandler = (_: any, newNetworkState: any) => {
        const newUdp = Reflect.get(newNetworkState, 'udp');
        clearInterval(newUdp?.keepAliveInterval);
      };

      oldNetworking?.off('stateChange', networkStateChangeHandler);
      newNetworking?.on('stateChange', networkStateChangeHandler);
    });
  });

  // Register all platform extractors (YouTube, Spotify bridge, SoundCloud, local)
  await registerExtractors(player);

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
