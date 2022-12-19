import { ChatInputCommandInteraction, Client } from 'discord.js';
import { PlayerCommand } from '../../types';
import { getPlayer } from '../helpers/player';

export const Skip: PlayerCommand = {
  name: 'skip',
  description: 'stop the track',
  voiceChannel: true,

  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) {
      console.log('GuildId is undefined');
      return await interaction.reply({
        content: `Unable to handle your request. Please try again later.`,
        ephemeral: true,
      });
    }
    const queue = getPlayer().getQueue(interaction.guildId);

    if (!queue?.playing)
      return await interaction.reply({
        content: `No music currently playing ${interaction.member?.user.id ?? ''}... try again ? ❌`,
        ephemeral: true,
      });

    const success = queue.skip();

    return await interaction.reply({
      content: success
        ? `Current music ${queue.current.title} skipped ✅`
        : `Something went wrong ${interaction.member?.user.id ?? ''}... try again ? ❌`,
    });
  },
};

export default Skip;
