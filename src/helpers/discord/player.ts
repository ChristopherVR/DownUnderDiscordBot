import { Player } from 'discord-player';
import { Client } from 'discord.js';
import { PlayerEventManager } from './playerEventManager.js';

let player: Player | null = null;
let playerEventManager: PlayerEventManager | null = null;

export const useDefaultPlayer = (): Player => {
  if (!player) {
    throw new Error('Player has not been initialized.');
  }
  return player;
};

export const initializePlayer = (client: Client): Player => {
  if (player) {
    return player;
  }

  player = new Player(client);
  playerEventManager = new PlayerEventManager(player);

  return player;
};
