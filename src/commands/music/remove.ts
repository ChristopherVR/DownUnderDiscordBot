import { ApplicationCommandOptionType, ChatInputCommandInteraction } from 'discord.js';
import i18next from 'i18next';
import { PlayerCommand } from '../../types';
import { getPlayer } from '../helpers/player';
import getLocalizations from '../i18n/discordLocalization';

export const Remove: PlayerCommand = {
  name: i18next.t('global:remove'),
  description: i18next.t('global:removeSongFromQueue'),
  nameLocalizations: getLocalizations('global:remove'),
  descriptionLocalizations: getLocalizations('global:removeSongFromQueue'),
  voiceChannel: true,
  options: [
    {
      name: i18next.t('global:song'),
      description: i18next.t('global:nameUrlToRemoveFromQueue'),
      nameLocalizations: getLocalizations('global:song'),
      descriptionLocalizations: getLocalizations('global:nameUrlToRemoveFromQueue'),
      type: ApplicationCommandOptionType.String,
      required: false,
    },
    {
      name: i18next.t('global:number'),
      description: i18next.t('global:placeSongIsInQueue'),
      nameLocalizations: getLocalizations('global:number'),
      descriptionLocalizations: getLocalizations('global:placeSongIsInQueue'),
      type: ApplicationCommandOptionType.Number,
      required: false,
    },
  ],
  run: async (interaction: ChatInputCommandInteraction) => {
    const genericError = i18next.t('global:genericError', {
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

    const queue = getPlayer().getQueue(interaction.guildId);

    if (!queue?.playing) {
      const noMusicCurrentlyPlaying = i18next.t('global:noMusicCurrentlyPlaying', {
        lng: interaction.locale,
      });
      return await interaction.reply({
        content: noMusicCurrentlyPlaying,
        ephemeral: true,
      });
    }

    if (!track && !number) {
      const useValidOptionToRemoveSong = i18next.t('global:useValidOptionToRemoveSong', {
        lng: interaction.locale,
      });
      return await interaction.reply({
        content: useValidOptionToRemoveSong,
        ephemeral: true,
      });
    }

    if (track) {
      // eslint-disable-next-line no-restricted-syntax
      for (const song of queue.tracks) {
        if (song.title === track || song.url === track) {
          const removedSongFromQueue = i18next.t('global:removedSongFromQueue', {
            lng: interaction.locale,
            track,
          });
          queue.remove(song);
          return interaction.reply({
            content: removedSongFromQueue,
          });
        }
      }

      const couldNotFindTrack = i18next.t('global:couldNotFindTrack', {
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
        const trackDoesNotExist = i18next.t('global:trackDoesNotExist', {
          lng: interaction.locale,
          track,
        });
        return await interaction.reply({
          content: trackDoesNotExist,
          ephemeral: true,
        });
      }

      queue.remove(index);
      const removedSongFromQueue = i18next.t('global:removedSongFromQueue', {
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
