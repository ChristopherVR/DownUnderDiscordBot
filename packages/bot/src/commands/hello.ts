import { MessageFlags, ApplicationCommandType } from 'discord.js';
import { tCommands, tCommon } from 'discord-dashboard-shared/localization';
import type { CommandContext, CommandHandler } from '../types/commands';

export const HelloCommand = (): CommandHandler => ({
  name: tCommands('hello.name'),
  description: tCommands('hello.description'),
  type: ApplicationCommandType.ChatInput,
  run: async (context: CommandContext) => {
    await context.reply({ content: tCommon('messages.success'), flags: MessageFlags.Ephemeral });
  },
});

export default HelloCommand;
