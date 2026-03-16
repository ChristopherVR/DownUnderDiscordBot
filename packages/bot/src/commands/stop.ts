import { MessageFlags } from 'discord.js';
import { tCommands, tErrors } from 'discord-dashboard-shared/localization';
import { useDefaultPlayer } from '../helpers/discord/player';
import type { CommandContext, CommandHandler } from '../types/commands';

export const StopCommand = (): CommandHandler => ({
  name: tCommands('stop.name'),
  description: tCommands('stop.description'),
  run: async (context: CommandContext) => {
    try {
      const player = useDefaultPlayer();
      const guildId = context.guildId;
      if (!guildId) {
        await context.reply({ content: tErrors('generic'), flags: MessageFlags.Ephemeral });
        return;
      }

      const queue = player.nodes.get(guildId);
      if (queue) {
        queue.delete();
        await context.reply({ content: tCommands('stop.responses.success'), flags: MessageFlags.Ephemeral });
      } else {
        await context.reply({ content: tCommands('stop.responses.notPlaying'), flags: MessageFlags.Ephemeral });
      }
    } catch (_error) {
      await context.reply({ content: tErrors('generic'), flags: MessageFlags.Ephemeral });
    }
  },
});

export default StopCommand;
