import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction } from 'discord.js';
import i18next from 'i18next';
import { PlayerCommand } from '../../types';
import { getPlayer } from '../helpers/player';
import getLocalizations from '../i18n/discordLocalization';

export const Jump: PlayerCommand = {
  name: i18next.t('global:jump'),
  description: i18next.t('global:jumpDesc'),
  nameLocalizations: getLocalizations('global:jump'),
  descriptionLocalizations: getLocalizations('global:jumpDesc'),
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
  type: ApplicationCommandType.ChatInput,
  run: async (interaction: ChatInputCommandInteraction) => {
    const track = interaction.options.getString('song');
    const number = interaction.options.getNumber('number');
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

    if (!queue?.playing) {
      const loc = i18next.t('global:noMusicCurrentlyPlaying', {
        lng: interaction.locale,
      });
      return await interaction.reply({
        content: loc,
        ephemeral: true,
      });
    }

    if (!track && !number) {
      const loc = i18next.t('global:haveToUseOneOfTheOptions', {
        lng: interaction.locale,
      });
      await interaction.reply({
        content: loc,
        ephemeral: true,
      });
    }

    if (track) {
      // eslint-disable-next-line no-restricted-syntax
      for (const song of queue.tracks) {
        if (song.title === track || song.url === track) {
          queue.skipTo(song);

          const loc = i18next.t('global:skippedTo', {
            lng: interaction.locale,
            track,
          });
          return interaction.reply({ content: loc });
        }
      }

      const loc = i18next.t('global:couldNotFindTrack', {
        lng: interaction.locale,
        track,
      });
      return await interaction.reply({
        content: loc,
        ephemeral: true,
      });
    }
    if (number) {
      const index = number - 1;
      const trackname = queue.tracks[index].title;
      if (!trackname) {
        const loc = i18next.t('global:trackDoesNotExist', {
          lng: interaction.locale,
        });
        return await interaction.reply({
          content: loc,
          ephemeral: true,
        });
      }

      queue.skipTo(index);
      const loc = i18next.t('global:jumpedTo', {
        lng: interaction.locale,
        track: trackname,
      });
      return await interaction.reply({ content: loc });
    }
    const genericError = i18next.t('global:genericError', {
      lng: interaction.locale,
    });
    return await interaction.reply({ content: genericError });
  },
};

export default Jump;
