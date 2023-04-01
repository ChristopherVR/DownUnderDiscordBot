import { EmbedBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, Colors } from 'discord.js';
import { localizedString } from '../../i18n';
import { PlayerCommand } from '../../types';

import getLocalizations from '../../i18n/discordLocalization';

export const Queue: PlayerCommand = {
  name: localizedString('global:queue'),
  description: localizedString('global:getSongsFromQueue'),
  nameLocalizations: getLocalizations('global:queue'),
  descriptionLocalizations: getLocalizations('global:getSongsFromQueue'),
  voiceChannel: true,

  run: async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) {
      const genericError = localizedString('global:genericError', {
        lng: interaction.locale,
      });
      console.log('GuildId is undefined');
      return await interaction.reply({
        content: genericError,
        ephemeral: true,
      });
    }
    const queue = global.player.nodes.get(interaction.guildId);

    if (!queue) {
      const noMusicCurrentlyPlaying = localizedString('global:noMusicCurrentlyPlaying', {
        lng: interaction.locale,
      });
      return await interaction.reply({
        content: noMusicCurrentlyPlaying,
        ephemeral: true,
      });
    }

    if (!queue.tracks[0]) {
      const noTrackInQueue = localizedString('global:noTrackInQueue', {
        lng: interaction.locale,
      });
      return await interaction.reply({
        content: noTrackInQueue,
        ephemeral: true,
      });
    }

    const methods = ['', '🔁', '🔂'];

    const songs = queue.tracks.data.length;

    const nextSongs =
      songs > 5
        ? localizedString('global:queueAndOtherSongsInPlaylist', { count: songs - 5, lng: interaction.locale })
        : localizedString('global:inPlaylistNrSongs', { songs, lng: interaction.locale });

    const tracks = queue.tracks.map(
      (track, i) =>
        `**${i + 1}** - ${track.title} | ${track.author} ${localizedString('global:requestedBy', {
          by: track?.requestedBy?.username,
          lng: interaction.locale,
        })}`,
    );

    const severQueue = localizedString('global:severQueue', {
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
      .setDescription(
        `${localizedString('global:current')} ${queue.currentTrack?.title}\n\n${tracks
          .slice(0, 5)
          .join('\n')}\n\n${nextSongs}`,
      )
      .setTimestamp()
      .setFooter({
        text: localizedString('global:defaultFooter', {
          lng: interaction.locale,
        }),
        iconURL: interaction.member?.avatar ?? undefined,
      });

    return await interaction.reply({ embeds: [embed] });
  },
};

export default Queue;
