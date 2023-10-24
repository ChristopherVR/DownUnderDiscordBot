import { EmbedBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, Colors } from 'discord.js';
import { localizedString, useLocalizedString } from '../../helpers/localization/localizedString.js';
import { PlayerCommand } from '../../models/discord.js';

import getLocalizations from '../../helpers/localization/getLocalizations.js';
import { useDefaultPlayer } from '../../helpers/discord/player.js';
import { logger } from '../../helpers/logger/logger.js';
import { DefaultLoggerMessage } from '../../enums/logger.js';

export const Queue: PlayerCommand = {
  name: localizedString('global:queue'),
  description: localizedString('global:getSongsFromQueue'),
  nameLocalizations: getLocalizations('global:queue'),
  descriptionLocalizations: getLocalizations('global:getSongsFromQueue'),

  run: async (interaction: ChatInputCommandInteraction) => {
    const { localize } = useLocalizedString(interaction.locale);
    if (!interaction.guildId) {
      const genericError = localize('global:genericError');
      logger(DefaultLoggerMessage.GuildIsNotDefined).error();
      return interaction.reply({
        content: genericError,
        ephemeral: true,
      });
    }
    const player = useDefaultPlayer();
    const queue = player.nodes.get(interaction.guildId);

    if (!queue) {
      const noMusicCurrentlyPlaying = localize('global:noMusicCurrentlyPlaying');
      return interaction.reply({
        content: noMusicCurrentlyPlaying,
        ephemeral: true,
      });
    }

    if (!queue.tracks[0]) {
      const noTrackInQueue = localize('global:noTrackInQueue');
      return interaction.reply({
        content: noTrackInQueue,
        ephemeral: true,
      });
    }

    const methods = ['', '🔁', '🔂'];

    const songs = queue.tracks.data.length;

    const nextSongs =
      songs > 5
        ? localize('global:queueAndOtherSongsInPlaylist', { count: songs - 5, lng: interaction.locale })
        : localize('global:inPlaylistNrSongs', { songs, lng: interaction.locale });

    const tracks = queue.tracks.map(
      (track, i) =>
        `**${i + 1}** - ${track.title} | ${track.author} ${localize('global:requestedBy', {
          by: track?.requestedBy?.username,
          lng: interaction.locale,
        })}`,
    );

    const severQueue = localize('global:severQueue', {
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
        `${localize('global:current')} ${queue.currentTrack?.title}\n\n${tracks
          .slice(0, 5)
          .join('\n')}\n\n${nextSongs}`,
      )
      .setTimestamp()
      .setFooter({
        text: localize('global:defaultFooter'),
        iconURL: interaction.member?.avatar ?? undefined,
      });

    return interaction.reply({ embeds: [embed] });
  },
};

export default Queue;
