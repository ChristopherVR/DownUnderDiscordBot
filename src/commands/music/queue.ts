import { EmbedBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, Colors } from 'discord.js';
import i18next from 'i18next';
import { PlayerCommand } from '../../types';
import { getPlayer } from '../helpers/player';
import getLocalizations from '../i18n/discordLocalization';

export const Queue: PlayerCommand = {
  name: i18next.t('global:queue'),
  description: i18next.t('global:getSongsFromQueue'),
  nameLocalizations: getLocalizations('global:queue'),
  descriptionLocalizations: getLocalizations('global:getSongsFromQueue'),
  voiceChannel: true,

  run: async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) {
      const genericError = i18next.t('global:genericError', {
        lng: interaction.locale,
      });
      console.log('GuildId is undefined');
      return await interaction.reply({
        content: genericError,
        ephemeral: true,
      });
    }
    const queue = getPlayer().getQueue(interaction.guildId);

    if (!queue) {
      const noMusicCurrentlyPlaying = i18next.t('global:noMusicCurrentlyPlaying', {
        lng: interaction.locale,
      });
      return await interaction.reply({
        content: noMusicCurrentlyPlaying,
        ephemeral: true,
      });
    }

    if (!queue.tracks[0]) {
      const noTrackInQueue = i18next.t('global:noTrackInQueue', {
        lng: interaction.locale,
      });
      return await interaction.reply({
        content: noTrackInQueue,
        ephemeral: true,
      });
    }

    const methods = ['', '🔁', '🔂'];

    const songs = queue.tracks.length;

    // TODO: Add translations
    const nextSongs = songs > 5 ? `And **${songs - 5}** other song(s)...` : `In the playlist **${songs}** song(s)...`;

    // TODO: Add translations
    const tracks = queue.tracks.map(
      (track, i) => `**${i + 1}** - ${track.title} | ${track.author} (requested by : ${track.requestedBy.username})`,
    );

    const severQueue = i18next.t('global:severQueue', {
      lng: interaction.locale,
      guild: interaction.guild?.name ?? '',
      value: methods[queue.repeatMode],
    });

    const embed = new EmbedBuilder()
      .setColor(Colors.Default)
      .setThumbnail(interaction.guild?.iconURL({ size: 2048 }) ?? null)
      .setAuthor({
        name: severQueue,
        iconURL: interaction.client.user?.displayAvatarURL({ size: 1024 }),
      })
      // TODO: Add translations
      .setDescription(`Current ${queue.current.title}\n\n${tracks.slice(0, 5).join('\n')}\n\n${nextSongs}`)
      .setTimestamp()
      .setFooter({
        text: i18next.t('global:defaultFooter', {
          lng: interaction.locale,
        }),
        iconURL: interaction.member?.avatar ?? undefined,
      });

    return await interaction.reply({ embeds: [embed] });
  },
};

export default Queue;
