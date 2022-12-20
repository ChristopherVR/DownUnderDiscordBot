import { Player } from 'discord-player';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getPlayer: () => Player = () => (global as any).player;

export default getPlayer;
