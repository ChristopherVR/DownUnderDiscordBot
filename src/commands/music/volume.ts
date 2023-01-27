import { ApplicationCommandOptionType, ChatInputCommandInteraction } from 'discord.js';
import { localizedString } from '../../i18n';
import { PlayerCommand } from '../../types';

import getLocalizations from '../i18n/discordLocalization';

export const Volume: PlayerCommand = {
  name: localizedString('global:volume'),
  nameLocalizations: getLocalizations('global:volume'),
  description: localizedString('global:adjustVolume'),
  descriptionLocalizations: getLocalizations('global:adjustVolume'),
  voiceChannel: true,
  options: [
    {
      name: localizedString('volume'),
      nameLocalizations: getLocalizations('global:volume'),
      description: localizedString('global:amountOfVolume'),
      descriptionLocalizations: getLocalizations('global:amountOfVolume'),
      type: ApplicationCommandOptionType.Number,
      required: true,
      minValue: 1,
      maxValue: 100,
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
    const queue = global.player.getQueue(interaction.guildId);

    if (!queue) {
      const noMusicCurrentlyPlaying = localizedString('global:noMusicCurrentlyPlaying', {
        lng: interaction.locale,
      });
      return await interaction.reply({
        content: noMusicCurrentlyPlaying,
        ephemeral: true,
      });
    }

    const vol = interaction.options.getNumber('volume') ?? 100;

    if (queue.volume === vol) {
      const volumeAlreadyTheSame = localizedString('global:volumeAlreadyTheSame', {
        lng: interaction.locale,
      });
      return await interaction.reply({
        content: volumeAlreadyTheSame,
        ephemeral: true,
      });
    }

    const success = queue.setVolume(vol);
    const volumeHasBeenModifiedTo = localizedString('global:volumeHasBeenModifiedTo', {
      lng: interaction.locale,
      volume: vol,
    });
    return await interaction.reply({
      content: success ? volumeHasBeenModifiedTo : genericError,
    });
  },
};

export default Volume;
