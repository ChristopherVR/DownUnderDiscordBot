import { ChatInputCommandInteraction } from 'discord.js';

export type VolumeInputInteraction = ChatInputCommandInteraction & {
  volume?: number;
  increase?: boolean;
};
