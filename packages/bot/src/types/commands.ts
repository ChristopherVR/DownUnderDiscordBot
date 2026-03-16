import type { CommandContext } from '../helpers/commands/CommandContext';
import type { ApplicationCommandType } from 'discord.js';
import type { DiscordCommandOption } from 'discord-dashboard-shared';

export interface CommandHandler {
  name: string;
  description: string;
  options?: DiscordCommandOption[];
  category?: string;
  type?: ApplicationCommandType;
  run: (context: CommandContext, args?: Record<string, unknown>) => Promise<unknown>;
}

export type { CommandContext } from '../helpers/commands/CommandContext';
