import { ApplicationCommandOptionType, ChatInputCommandInteraction, Client } from 'discord.js';
import { PlayerCommand } from '../../types';
import { getPlayer } from '../helpers/player';

export const Volume: PlayerCommand = {
  name: 'volume',
  description: 'adjust',
  voiceChannel: true,
  options: [
    {
      name: 'volume',
      description: 'the amount volume',
      type: ApplicationCommandOptionType.Number,
      required: true,
      minValue: 1,
      maxValue: 100,
    },
  ],
  run: async (client: Client, interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) {
      console.log('GuildId is undefined');
      return await interaction.reply({
        content: `Unable to handle your request. Please try again later.`,
        ephemeral: true,
      });
    }
    const queue = getPlayer().getQueue(interaction.guildId);

    if (!queue)
      return await interaction.reply({
        content: `No music currently playing ${interaction.member?.user.id ?? ''}... try again ? ❌`,
        ephemeral: true,
      });
    const vol = interaction.options.getNumber('volume') ?? 100;

    if (queue.volume === vol)
      return await interaction.reply({
        content: `The volume you want to change is already the current one ${
          interaction.member?.user.id ?? ''
        }... try again ? ❌`,
        ephemeral: true,
      });

    const success = queue.setVolume(vol);

    return await interaction.reply({
      content: success
        ? `The volume has been modified to **${vol}**/**${100}**% 🔊`
        : `Something went wrong ${interaction.member?.user.id ?? ''}... try again ? ❌`,
    });
  },
};

export default Volume;
