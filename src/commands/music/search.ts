import { ApplicationCommandOptionType, ChatInputCommandInteraction } from 'discord.js';
import i18next from 'i18next';
import { PlayerCommand } from '../../types';
import getLocalizations from '../i18n/discordLocalization';

export const Search: PlayerCommand = {
  name: i18next.t('global:search'),
  description: i18next.t('global:providerDesc'),
  nameLocalizations: getLocalizations('global:search'),
  descriptionLocalizations: getLocalizations('global:providerDesc'),
  voiceChannel: true,
  options: [
    {
      name: i18next.t('global:provider'),
      description: i18next.t('global:providerDesc'),
      nameLocalizations: getLocalizations('global:provider'),
      descriptionLocalizations: getLocalizations('global:providerDesc'),
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        {
          name: 'bandcamp',
          value: 'bandcamp',
        },
        {
          name: 'deezer',
          value: 'deezer',
        },
        {
          name: 'soundcloud',
          value: 'soundcloud',
        },
        {
          name: 'vimeo',
          value: 'vimeo',
        },
      ],
    },
  ],
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

    const notYetSupported = i18next.t('global:notYetSupported', {
      lng: interaction.locale,
    });

    return await interaction.reply({
      content: notYetSupported,
      ephemeral: true,
    });
  },
};
export default Search;
