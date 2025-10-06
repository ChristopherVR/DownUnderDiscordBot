import { MessageFlags } from 'discord.js';
import { tCommands, tErrors } from 'discord-dashboard-shared/localization';
import { useDefaultPlayer } from '../helpers/discord/player';
import type { CommandContext, CommandHandler } from '../types/commands';

export const NowPlayingCommand = (): CommandHandler => ({
  name: tCommands('nowplaying.name'),
  description: tCommands('nowplaying.description'),
  run: async (context: CommandContext) => {
    try {
      const player = useDefaultPlayer();
      const guildId = context.guildId;
      if (!guildId) {
        await context.reply({ content: tErrors('generic'), flags: MessageFlags.Ephemeral });
        return;
      }

      const queue = player.nodes.get(guildId);
      if (!queue || !queue.currentTrack) {
        await context.reply({ content: tCommands('nowplaying.responses.nothing'), flags: MessageFlags.Ephemeral });
        return;
      }

      const track = queue.currentTrack;
      await context.reply({
        content: tCommands('nowplaying.responses.info', { track: track.title, artist: track.author }),
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      await context.reply({ content: tErrors('generic'), flags: MessageFlags.Ephemeral });
    }
  },
});

export default NowPlayingCommand;
