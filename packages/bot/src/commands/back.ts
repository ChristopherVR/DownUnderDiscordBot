import { MessageFlags } from 'discord.js';
import { tCommands, tErrors } from 'discord-dashboard-shared/localization';
import { useDefaultPlayer } from '../helpers/discord/player';
import type { CommandContext, CommandHandler } from '../types/commands';

export const BackCommand = (): CommandHandler => ({
  name: tCommands('previous.name'),
  description: tCommands('previous.description'),
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
        await context.reply({ content: tCommands('previous.responses.noPrevious'), flags: MessageFlags.Ephemeral });
        return;
      }

      const node = queue.node as { back?: () => unknown };
      let success = false;
      if (typeof node.back === 'function') {
        const result = node.back();
        const resolved = await Promise.resolve(result as unknown);
        success = typeof resolved === 'boolean' ? resolved : Boolean(resolved);
      }

      await context.reply({
        content: success ? tCommands('previous.responses.success') : tCommands('previous.responses.error'),
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      await context.reply({ content: tErrors('generic'), flags: MessageFlags.Ephemeral });
    }
  },
});

export default BackCommand;
