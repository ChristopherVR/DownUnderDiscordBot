import { MessageFlags } from 'discord.js';
import { tCommands, tErrors } from 'discord-dashboard-shared/localization';
import type { CommandContext, CommandHandler } from '../types/commands';

export const SaveCommand = (): CommandHandler => ({
  name: tCommands('save.name'),
  description: tCommands('save.description'),
  run: async (context: CommandContext) => {
    await context.reply({ content: tErrors('command.notFound'), flags: MessageFlags.Ephemeral });
  },
});
export default SaveCommand;
