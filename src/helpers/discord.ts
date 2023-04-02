import { useMasterPlayer } from 'discord-player';

// eslint-disable-next-line import/prefer-default-export
export const useDefaultPlayer = () => {
  const player = useMasterPlayer();

  if (!player) {
    throw new Error('The Discord player has not been created or initialized yet.');
  }
  return player;
};
