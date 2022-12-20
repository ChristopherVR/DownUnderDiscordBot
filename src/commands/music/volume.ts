import { ApplicationCommandOptionType, ChatInputCommandInteraction } from 'discord.js';
import i18next from 'i18next';
import { PlayerCommand } from '../../types';
import { getPlayer } from '../helpers/player';
import getLocalizations from '../i18n/discordLocalization';

export const Volume: PlayerCommand = {
  name: i18next.t('global:volume'),
  nameLocalizations: getLocalizations('global:volume'),
  description: i18next.t('global:adjust'),
  descriptionLocalizations: getLocalizations('global:adjust'),
  voiceChannel: true,
  options: [
    {
      name: i18next.t('volume'),
      nameLocalizations: getLocalizations('global:volume'),
      description: i18next.t('global:amountOfVolume'),
      descriptionLocalizations: getLocalizations('global:amountOfVolume'),
      type: ApplicationCommandOptionType.Number,
      required: true,
      minValue: 1,
      maxValue: 100,
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

    const vol = interaction.options.getNumber('volume') ?? 100;

    if (queue.volume === vol) {
      const volumeAlreadyTheSame = i18next.t('global:volumeAlreadyTheSame', {
        lng: interaction.locale,
      });
      return await interaction.reply({
        content: volumeAlreadyTheSame,
        ephemeral: true,
      });
    }

    const success = queue.setVolume(vol);
    const volumeHasBeenModifiedTo = i18next.t('global:volumeHasBeenModifiedTo', {
      lng: interaction.locale,
      volume: vol,
    });
    return await interaction.reply({
      content: success ? volumeHasBeenModifiedTo : genericError,
    });
  },
};

export default Volume;
