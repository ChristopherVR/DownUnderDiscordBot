import { MessageFlags } from 'discord.js';
import { tCommands, tErrors } from 'discord-dashboard-shared/localization';
import { useDefaultPlayer } from '../helpers/discord/player';
import type { CommandContext, CommandHandler } from '../types/commands';

export const ResumeCommand = (): CommandHandler => ({
  name: tCommands('resume.name'),
  description: tCommands('resume.description'),
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
        await context.reply({ content: tCommands('resume.responses.notPaused'), flags: MessageFlags.Ephemeral });
        return;
      }

      const success = queue.node.resume();
      await context.reply({
        content: success ? tCommands('resume.responses.success') : tCommands('resume.responses.error'),
        flags: MessageFlags.Ephemeral,
      });
    } catch (_error) {
      await context.reply({ content: tErrors('generic'), flags: MessageFlags.Ephemeral });
    }
  },
});

export default ResumeCommand;
