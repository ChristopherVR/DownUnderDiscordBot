import { MessageFlags } from 'discord.js';
import { tCommands, tErrors } from 'discord-dashboard-shared/localization';
import type { CommandContext, CommandHandler } from '../types/commands';

export const VolumeCommand = (): CommandHandler => ({
  name: tCommands('volume.name'),
  description: tCommands('volume.description'),
  run: async (context: CommandContext) => {
    await context.reply({ content: tErrors('command.notFound'), flags: MessageFlags.Ephemeral });
  },
});
export default VolumeCommand;
