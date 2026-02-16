import { MessageFlags } from 'discord.js';
import { tCommands, tErrors } from 'discord-dashboard-shared/localization';
import { useDefaultPlayer } from '../helpers/discord/player';
import type { CommandContext, CommandHandler } from '../types/commands';

export const ClearCommand = (): CommandHandler => ({
  name: tCommands('clear.name'),
  description: tCommands('clear.description'),
  run: async (context: CommandContext) => {
    try {
      const player = useDefaultPlayer();
      const guildId = context.guildId;
      if (!guildId) {
        await context.reply({ content: tErrors('generic'), flags: MessageFlags.Ephemeral });
        return;
      }

      const queue = player.nodes.get(guildId);
      if (!queue) {
        await context.reply({ content: tCommands('clear.responses.empty'), flags: MessageFlags.Ephemeral });
        return;
      }

      queue.delete();
      await context.reply({ content: tCommands('clear.responses.success'), flags: MessageFlags.Ephemeral });
    } catch (error) {
      await context.reply({ content: tErrors('generic'), flags: MessageFlags.Ephemeral });
    }
  },
});

export default ClearCommand;
