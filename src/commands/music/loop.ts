import { QueueRepeatMode } from 'discord-player';
import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction, Client } from 'discord.js';
import { PlayerCommand } from '../../types';
import { getPlayer } from '../helpers/player';

export const Loop: PlayerCommand = {
  name: 'loop',
  description: "enable or disable looping of song's or the whole queue",
  voiceChannel: true,
  options: [
    {
      name: 'action',
      description: 'what action you want to preform on the loop',
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: 'Queue', value: 'enable_loop_queue' },
        { name: 'Disable', value: 'disable_loop' },
        { name: 'Song', value: 'enable_loop_song' },
      ],
    },
  ],
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
        content: `No music currently playing ${interaction.member?.user.id ?? ''}... try again ? ❌`,
        ephemeral: true,
      });
    switch (interaction.options.data.map((x) => x.value).toString()) {
      case 'enable_loop_queue': {
        if (queue.repeatMode === 1)
          return await interaction.reply({
            content: `You must first disable the current music in the loop mode (/loop Disable) ${
              interaction.member?.user.id ?? ''
            }... try again ? ❌`,
            ephemeral: true,
          });

        const success = queue.setRepeatMode(QueueRepeatMode.QUEUE);

        return await interaction.reply({
          content: success
            ? `Repeat mode **enabled** the whole queue will be repeated endlessly 🔁`
            : `Something went wrong ${interaction.member?.user.id ?? ''}... try again ? ❌`,
        });
      }
      case 'disable_loop': {
        const success = queue.setRepeatMode(QueueRepeatMode.OFF);

        return await interaction.reply({
          content: success
            ? `Repeat mode **disabled**`
            : `Something went wrong ${interaction.member?.user.id ?? ''}... try again ? ❌`,
        });
      }
      case 'enable_loop_song': {
        if (queue.repeatMode === 2)
          return await interaction.reply({
            content: `You must first disable the current music in the loop mode (/loop Disable) ${
              interaction.member?.user.id ?? ''
            }... try again ? ❌`,
            ephemeral: true,
          });

        const success = queue.setRepeatMode(QueueRepeatMode.TRACK);

        return await interaction.reply({
          content: success
            ? `Repeat mode **enabled** the current song will be repeated endlessly (you can end the loop with /loop disable)`
            : `Something went wrong ${interaction.member?.user.id ?? ''}... try again ? ❌`,
        });
      }
      default: {
        return await interaction.reply({
          content: `Something went wrong ${interaction.member?.user.username ?? ''}... try again ? ❌`,
        });
      }
    }
  },
};

export default Loop;
