import { ApplicationCommandOptionType, ChatInputCommandInteraction } from 'discord.js';
import { localizedString } from '../../helpers/localization';
import { PlayerCommand } from '../../types';
import getLocalizations from '../../helpers/multiMapLocalization';

export const Search: PlayerCommand = {
  name: localizedString('global:search'),
  description: localizedString('global:providerDesc'),
  nameLocalizations: getLocalizations('global:search'),
  descriptionLocalizations: getLocalizations('global:providerDesc'),
  voiceChannel: true,
  options: [
    {
      name: localizedString('global:provider'),
      description: localizedString('global:providerDesc'),
      nameLocalizations: getLocalizations('global:provider'),
      descriptionLocalizations: getLocalizations('global:providerDesc'),
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        {
          name: 'Bandcamp',
          value: 'bandcamp',
        },
        {
          name: 'Deezer',
          value: 'deezer',
        },
        {
          name: 'Soundcloud',
          value: 'soundcloud',
        },
        {
          name: 'Vimeo',
          value: 'vimeo',
        },
      ],
    },
  ],
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

    const notYetSupported = localizedString('global:notYetSupported', {
      lng: interaction.locale,
    });

    return await interaction.reply({
      content: notYetSupported,
      ephemeral: true,
    });
  },
};
export default Search;
