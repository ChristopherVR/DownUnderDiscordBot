import { MessageFlags } from 'discord.js';
import { tCommands, tErrors } from 'discord-dashboard-shared/localization';
import { useDefaultPlayer } from '../helpers/discord/player';
import type { CommandContext, CommandHandler } from '../types/commands';

export const SkipCommand = (): CommandHandler => ({
  name: tCommands('next.name'),
  description: tCommands('next.description'),
  run: async (context: CommandContext) => {
    try {
      const player = useDefaultPlayer();
      const guildId = context.guildId;
      if (!guildId) {
        await context.reply({ content: tErrors('generic'), flags: MessageFlags.Ephemeral });
        return;
      }

      const queue = player.nodes.get(guildId);
      if (!queue?.isPlaying()) {
        await context.reply({ content: tCommands('next.responses.noNext'), flags: MessageFlags.Ephemeral });
        return;
      }

      const success = queue.node.skip();
      await context.reply({
        content: success ? tCommands('next.responses.success') : tCommands('next.responses.error'),
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      await context.reply({ content: tErrors('generic'), flags: MessageFlags.Ephemeral });
    }
  },
});

export default SkipCommand;
