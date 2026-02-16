import { MessageFlags } from 'discord.js';
import { tCommands, tErrors } from 'discord-dashboard-shared/localization';
import type { CommandContext, CommandHandler } from '../types/commands';

export const JumpCommand = (): CommandHandler => ({
  name: tCommands('jump.name'),
  description: tCommands('jump.description'),
  run: async (context: CommandContext) => {
    await context.reply({ content: tErrors('command.notFound'), flags: MessageFlags.Ephemeral });
  },
});

export default JumpCommand;
