import { MessageFlags } from 'discord.js';
import { tCommands, tErrors } from 'discord-dashboard-shared/localization';
import { useDefaultPlayer } from '../helpers/discord/player';
import type { CommandContext, CommandHandler } from '../types/commands';

export const PlayNextCommand = (): CommandHandler => ({
  name: tCommands('playnext.name'),
  description: tCommands('playnext.description'),
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
        await context.reply({ content: tErrors('player.queueEmpty'), flags: MessageFlags.Ephemeral });
        return;
      }

      await context.reply({ content: tErrors('command.notFound'), flags: MessageFlags.Ephemeral });
    } catch (_error) {
      await context.reply({ content: tErrors('generic'), flags: MessageFlags.Ephemeral });
    }
  },
});

export default PlayNextCommand;
