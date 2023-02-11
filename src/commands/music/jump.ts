import { ApplicationCommandOptionType, ApplicationCommandType, ChatInputCommandInteraction } from 'discord.js';
import { localizedString } from '../../i18n';
import { PlayerCommand } from '../../types';

import getLocalizations from '../../i18n/discordLocalization';

export const Jump: PlayerCommand = {
  name: localizedString('global:jump'),
  description: localizedString('global:jumpDesc'),
  nameLocalizations: getLocalizations('global:jump'),
  descriptionLocalizations: getLocalizations('global:jumpDesc'),
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
  type: ApplicationCommandType.ChatInput,
  run: async (interaction: ChatInputCommandInteraction) => {
    const track = interaction.options.getString('song');
    const number = interaction.options.getNumber('number');
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
    const queue = global.player.getQueue(interaction.guildId);

    if (!queue?.playing) {
      const loc = localizedString('global:noMusicCurrentlyPlaying', {
        lng: interaction.locale,
      });
      return await interaction.reply({
        content: loc,
        ephemeral: true,
      });
    }

    if (!track && !number) {
      const loc = localizedString('global:haveToUseOneOfTheOptions', {
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

          const loc = localizedString('global:skippedTo', {
            lng: interaction.locale,
            track,
          });
          return interaction.reply({ content: loc });
        }
      }

      const loc = localizedString('global:couldNotFindTrack', {
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
        const loc = localizedString('global:trackDoesNotExist', {
          lng: interaction.locale,
        });
        return await interaction.reply({
          content: loc,
          ephemeral: true,
        });
      }

      queue.skipTo(index);
      const loc = localizedString('global:jumpedTo', {
        lng: interaction.locale,
        track: trackname,
      });
      return await interaction.reply({ content: loc });
    }
    const genericError = localizedString('global:genericError', {
      lng: interaction.locale,
    });
    return await interaction.reply({ content: genericError });
  },
};

export default Jump;
