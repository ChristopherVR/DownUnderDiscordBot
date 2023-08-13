import { ApplicationCommandType, CommandInteraction } from 'discord.js';
import { localizedString, useLocalizedString } from '../../helpers/localization/localizedString.js';
import { Command } from '../../models/discord.js';
import getLocalizations from '../../helpers/localization/getLocalizations.js';

export const Meme: Command<CommandInteraction> = {
  name: localizedString('global:meme'),
  nameLocalizations: getLocalizations('global:meme'),
  description: localizedString('global:memeDesc'),
  descriptionLocalizations: getLocalizations('global:memeDesc'),
  type: ApplicationCommandType.ChatInput,
  run: async (interaction: CommandInteraction) => {
    const { localize } = useLocalizedString(interaction.locale);
    const genericError = localize('global:playlistsNotSupported');

    return await interaction.reply({
      content: genericError,
      ephemeral: true,
    });
  },
};

export default Meme;
