import { EmbedBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, Client, Colors } from 'discord.js';
import { PlayerCommand } from '../../types';
import { getPlayer } from '../helpers/player';

export const Queue: PlayerCommand = {
  name: 'queue',
  description: 'Get the songs in the queue',
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

    if (!queue.tracks[0])
      return await interaction.reply({
        content: `No music in the queue after the current one ${interaction.member?.user.id ?? ''}... try again ? ❌`,
        ephemeral: true,
      });

    const methods = ['', '🔁', '🔂'];

    const songs = queue.tracks.length;

    const nextSongs = songs > 5 ? `And **${songs - 5}** other song(s)...` : `In the playlist **${songs}** song(s)...`;

    const tracks = queue.tracks.map(
      (track, i) => `**${i + 1}** - ${track.title} | ${track.author} (requested by : ${track.requestedBy.username})`,
    );

    const embed = new EmbedBuilder()
      .setColor(Colors.Default)
      .setThumbnail(interaction.guild?.iconURL({ size: 2048 }) ?? null)
      .setAuthor({
        name: `Server queue - ${interaction.guild?.name ?? ''} ${methods[queue.repeatMode]}`,
        iconURL: client.user?.displayAvatarURL({ size: 1024 }),
      })
      .setDescription(`Current ${queue.current.title}\n\n${tracks.slice(0, 5).join('\n')}\n\n${nextSongs}`)
      .setTimestamp()
      .setFooter({
        text: 'Music comes first - Made with heart by ChristopherVR ❤️',
        iconURL: interaction.member?.avatar ?? undefined,
      });

    return await interaction.reply({ embeds: [embed] });
  },
};

export default Queue;
