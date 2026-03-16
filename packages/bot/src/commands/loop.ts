import { MessageFlags } from 'discord.js';
import { tCommands, tErrors } from 'discord-dashboard-shared/localization';
import type { CommandContext, CommandHandler } from '../types/commands';

export const LoopCommand = (): CommandHandler => ({
  name: tCommands('loop.name'),
  description: tCommands('loop.description'),
  run: async (context: CommandContext) => {
    await context.reply({ content: tErrors('command.notFound'), flags: MessageFlags.Ephemeral });
  },
});

export default LoopCommand;
