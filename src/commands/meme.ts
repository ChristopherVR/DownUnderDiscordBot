import { ApplicationCommandType, CommandInteraction } from 'discord.js';
import { localizedString } from '../i18n';
import { Command } from '../types';
import getLocalizations from '../i18n/discordLocalization';

export const Meme: Command<CommandInteraction> = {
  name: localizedString('global:meme'),
  nameLocalizations: getLocalizations('global:meme'),
  description: localizedString('global:memeDesc'),
  descriptionLocalizations: getLocalizations('global:memeDesc'),
  type: ApplicationCommandType.ChatInput,
  run: async (interaction: CommandInteraction) => {
    const genericError = localizedString('global:playlistsNotSupported', {
      lng: interaction.locale,
    });

    return await interaction.reply({
      content: genericError,
      ephemeral: true,
    });
  },
};

export default Meme;
