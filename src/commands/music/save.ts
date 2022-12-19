import { ChatInputCommandInteraction, Client, EmbedBuilder } from 'discord.js';
import { PlayerCommand } from '../../types';
import { getPlayer } from '../helpers/player';

export const Save: PlayerCommand = {
  name: 'save',
  description: 'save the current track!',
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

    if (!queue)
      return await interaction.reply({
        content: `No music currently playing ${interaction.member?.user.id ?? ''}... try again ? ❌`,
        ephemeral: true,
      });

    try {
      await interaction.user.send({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle(`:arrow_forward: ${queue.current.title}`)
            .setURL(queue.current.url)
            .addFields(
              {
                name: ':hourglass: Duration:',
                value: `\`${queue.current.duration}\``,
                inline: true,
              },
              {
                name: 'Song by:',
                value: `\`${queue.current.author}\``,
                inline: true,
              },
              {
                name: 'Views :eyes:',
                value: `\`${Number(queue.current.views).toLocaleString()}\``,
                inline: true,
              },
              { name: 'Song URL:', value: `\`${queue.current.url}\`` },
            )
            .setThumbnail(queue.current.thumbnail)
            .setFooter({
              text: `from the server ${interaction.guild?.name ?? ''}`,
              iconURL: interaction.guild?.iconURL() ?? undefined,
            }),
        ],
      });

      return await interaction.reply({
        content: `I have sent you the title of the music by private messages ✅`,
        ephemeral: true,
      });
    } catch {
      return await interaction.reply({
        content: `Unable to send you a private message... try again ? ❌`,
        ephemeral: true,
      });
    }
  },
};

export default Save;
