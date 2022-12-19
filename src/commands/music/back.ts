import { ApplicationCommandType, ChatInputCommandInteraction, Client } from 'discord.js';
import { PlayerCommand } from '../../types';
import { getPlayer } from '../helpers/player';

export const Back: PlayerCommand = {
  name: 'back',
  description: 'Go back to the previous song',
  voiceChannel: true,
  type: ApplicationCommandType.ChatInput,
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
        content: `No music currently playing ${interaction.member?.user.username ?? ''}... try again ? ❌`,
        ephemeral: true,
      });

    if (!queue.previousTracks[1])
      return await interaction.reply({
        content: `There was no music played before ${interaction.member?.user.username ?? ''}... try again ? ❌`,
        ephemeral: true,
      });

    await queue.back();

    return await interaction.reply({ content: `Playing the **previous** track ✅` });
  },
};

export default Back;
