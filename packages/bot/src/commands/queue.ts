import { MessageFlags } from 'discord.js';
import { tCommands, tErrors } from 'discord-dashboard-shared/localization';
import { useDefaultPlayer } from '../helpers/discord/player';
import type { CommandContext, CommandHandler } from '../types/commands';

export const QueueCommand = (): CommandHandler => ({
  name: tCommands('queue.name'),
  description: tCommands('queue.description'),
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

      const items = queue.tracks.map((track, index: number) => `${index + 1}. ${track.title}`).slice(0, 20);
      const content = items.length ? items.join(String.fromCharCode(10)) : tCommands('queue.responses.empty');
      await context.reply({ content, flags: MessageFlags.Ephemeral });
    } catch (error) {
      await context.reply({ content: tErrors('generic'), flags: MessageFlags.Ephemeral });
    }
  },
});

export default QueueCommand;