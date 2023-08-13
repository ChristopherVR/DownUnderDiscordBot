import { useMainPlayer } from 'discord-player';
import { DiscordjsError } from 'discord.js';

// eslint-disable-next-line import/prefer-default-export
export const useDefaultPlayer = async () => {
  const player = useMainPlayer();

  if (!player) {
    throw new DiscordjsError('The Discord player has not been created or initialized yet.');
  }

  return player;
};
