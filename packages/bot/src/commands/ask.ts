import { MessageFlags } from 'discord.js';
import { tCommands, tCommon } from 'discord-dashboard-shared/localization';
import type { CommandHandler, CommandContext } from '../types/commands';

export const AskCommand = (): CommandHandler => ({
  name: tCommands('ask.name'),
  description: tCommands('ask.description'),
  run: async (context: CommandContext) => {
    if (!context.deferred) {
      await context.deferReply();
    }
    await context.followUp({ content: tCommon('placeholders.enterText'), flags: MessageFlags.Ephemeral });
  },
});

export default AskCommand;
