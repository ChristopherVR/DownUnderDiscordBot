import { ApplicationCommandType, CommandInteraction } from 'discord.js';
import i18next from 'i18next';
import { Command } from '../types';
import getLocalizations from './i18n/discordLocalization';

export const Meme: Command<CommandInteraction> = {
  name: i18next.t('global:meme'),
  nameLocalizations: getLocalizations('global:meme'),
  description: i18next.t('global:memeDesc'),
  descriptionLocalizations: getLocalizations('global:memeDesc'),
  type: ApplicationCommandType.ChatInput,
  run: async (interaction: CommandInteraction) => {
    const genericError = i18next.t('global:playlistsNotSupported', {
      lng: interaction.locale,
    });

    return await interaction.reply({
      content: genericError,
      ephemeral: true,
    });
  },
};

export default Meme;
