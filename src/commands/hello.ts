import { ApplicationCommandType, ChatInputCommandInteraction } from 'discord.js';
import { localizedString } from '../i18n';
import { Command } from '../types';
import getLocalizations from '../i18n/discordLocalization';

const Hello: Command<ChatInputCommandInteraction> = {
  name: localizedString('global:hello'),
  nameLocalizations: getLocalizations('global:hello'),
  description: localizedString('global:helloDesc'),
  descriptionLocalizations: getLocalizations('global:helloDesc'),

  type: ApplicationCommandType.ChatInput,
  run: async (interaction: ChatInputCommandInteraction) => {
    const content = 'OI, OI, OI, OI!';
    await interaction.followUp({
      ephemeral: true,
      content,
    });
  },
};

export default Hello;
