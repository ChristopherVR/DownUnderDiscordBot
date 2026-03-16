import { MessageFlags } from 'discord.js';
import { tCommands, tErrors } from 'discord-dashboard-shared/localization';
import { useDefaultPlayer } from '../helpers/discord/player';
import type { CommandContext, CommandHandler } from '../types/commands';
import { createLogger } from '../helpers/logger';

const log = createLogger('command-pause');

export const PauseCommand = (): CommandHandler => ({
  name: tCommands('pause.name'),
  description: tCommands('pause.description'),
  run: async (context: CommandContext) => {
    try {
      const player = useDefaultPlayer();
      const guildId = context.guildId;
      if (!guildId) {
        await context.reply({ content: tErrors('generic'), flags: MessageFlags.Ephemeral });
        return;
      }

      const queue = player.nodes.get(guildId);
      if (!queue || !queue.isPlaying()) {
        await context.reply({ content: tCommands('pause.responses.notPlaying'), flags: MessageFlags.Ephemeral });
        return;
      }

      const success = queue.node.pause();
      await context.reply({
        content: success ? tCommands('pause.responses.success') : tCommands('pause.responses.error'),
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      await context.reply({ content: tErrors('generic'), flags: MessageFlags.Ephemeral });
      log.error(error);
    }
  },
});

export default PauseCommand;
