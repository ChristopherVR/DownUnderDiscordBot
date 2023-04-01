import { ApplicationCommandOptionType, ChatInputCommandInteraction } from 'discord.js';
import { localizedString } from '../../i18n';
import { PlayerCommand } from '../../types';

import getLocalizations from '../../i18n/discordLocalization';
import { useDefaultPlayer } from '../../helpers/discord';

export const Remove: PlayerCommand = {
  name: localizedString('global:remove'),
  description: localizedString('global:removeSongFromQueue'),
  nameLocalizations: getLocalizations('global:remove'),
  descriptionLocalizations: getLocalizations('global:removeSongFromQueue'),
  voiceChannel: true,
  options: [
    {
      name: localizedString('global:song'),
      description: localizedString('global:nameUrlToRemoveFromQueue'),
      nameLocalizations: getLocalizations('global:song'),
      descriptionLocalizations: getLocalizations('global:nameUrlToRemoveFromQueue'),
      type: ApplicationCommandOptionType.String,
      required: false,
    },
    {
      name: localizedString('global:number'),
      description: localizedString('global:placeSongIsInQueue'),
      nameLocalizations: getLocalizations('global:number'),
      descriptionLocalizations: getLocalizations('global:placeSongIsInQueue'),
      type: ApplicationCommandOptionType.Number,
      required: false,
    },
  ],
  run: async (interaction: ChatInputCommandInteraction) => {
    const genericError = localizedString('global:genericError', {
      lng: interaction.locale,
    });
    if (!interaction.guildId) {
      console.log('GuildId is undefined');
      return await interaction.reply({
        content: genericError,
        ephemeral: true,
      });
    }
    const number = interaction.options.getNumber('number');
    const track = interaction.options.getString('song');
    const player = useDefaultPlayer();
    const queue = player.nodes.get(interaction.guildId);

    if (!queue?.isPlaying()) {
      const noMusicCurrentlyPlaying = localizedString('global:noMusicCurrentlyPlaying', {
        lng: interaction.locale,
      });
      return await interaction.reply({
        content: noMusicCurrentlyPlaying,
        ephemeral: true,
      });
    }

    if (!track && !number) {
      const useValidOptionToRemoveSong = localizedString('global:useValidOptionToRemoveSong', {
        lng: interaction.locale,
      });
      return await interaction.reply({
        content: useValidOptionToRemoveSong,
        ephemeral: true,
      });
    }

    if (track) {
      // eslint-disable-next-line no-restricted-syntax
      for (const song of queue.tracks.data) {
        if (song.title === track || song.url === track) {
          const removedSongFromQueue = localizedString('global:removedSongFromQueue', {
            lng: interaction.locale,
            track,
          });
          queue.removeTrack(song);
          return interaction.reply({
            content: removedSongFromQueue,
          });
        }
      }

      const couldNotFindTrack = localizedString('global:couldNotFindTrack', {
        lng: interaction.locale,
        track,
      });
      return await interaction.reply({
        content: couldNotFindTrack,
        ephemeral: true,
      });
    }

    if (number) {
      const index = number - 1;
      const trackname = queue.tracks[index].title;

      if (!trackname) {
        const trackDoesNotExist = localizedString('global:trackDoesNotExist', {
          lng: interaction.locale,
          track,
        });
        return await interaction.reply({
          content: trackDoesNotExist,
          ephemeral: true,
        });
      }

      queue.removeTrack(index);
      const removedSongFromQueue = localizedString('global:removedSongFromQueue', {
        lng: interaction.locale,
        track,
      });
      return await interaction.reply({
        content: removedSongFromQueue,
      });
    }

    return await interaction.reply({ content: genericError });
  },
};

export default Remove;
