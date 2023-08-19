import { useMainPlayer } from 'discord-player';
import { DiscordjsError } from 'discord.js';
import { logger } from '../logger/logger';
import { DefaultLoggerMessage } from '../../enums/logger';

// eslint-disable-next-line import/prefer-default-export
export const useDefaultPlayer = async () => {
  const player = useMainPlayer();

  if (!player) {
    throw new DiscordjsError('The Discord player has not been created or initialized yet.');
  }

  if (player.extractors.size === 0) {
    logger(DefaultLoggerMessage.NoExtractorsRegistered).warning();
  }

  return player;
};
