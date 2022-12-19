import { Player } from 'discord-player';

export const getPlayer: () => Player = () => (global as any).player;
