import { ApplicationCommandOptionType, ChatInputCommandInteraction } from 'discord.js';
import { localizedString, useLocalizedString } from '../../helpers/localization/localizedString.js';
import { PlayerCommand } from '../../models/discord.js';
import getLocalizations from '../../helpers/localization/getLocalizations.js';
import { logger } from '../../helpers/logger/logger.js';
import { DefaultLoggerMessage } from '../../constants/logger.js';

export const Search: PlayerCommand = {
  name: localizedString('global:search'),
  description: localizedString('global:providerDesc'),
  nameLocalizations: getLocalizations('global:search'),
  descriptionLocalizations: getLocalizations('global:providerDesc'),
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
    const { localize } = useLocalizedString(interaction.locale);
    if (!interaction.guildId) {
      const genericError = localize('global:genericError');
      logger(DefaultLoggerMessage.GuildIsNotDefined).error();
      return await interaction.reply({
        content: genericError,
        ephemeral: true,
      });
    }

    const notYetSupported = localize('global:notYetSupported');

    return await interaction.reply({
      content: notYetSupported,
      ephemeral: true,
    });
  },
};
export default Search;
