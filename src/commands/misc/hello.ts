import { ApplicationCommandType, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { localizedString, useLocalizedString } from '../../helpers/localization/localizedString.js';
import { Command } from '../../models/discord';
import getLocalizations from '../../helpers/localization/getLocalizations.js';

const Hello = (): Command<ChatInputCommandInteraction> => ({
  name: localizedString('global:hello'),
  nameLocalizations: getLocalizations('global:hello'),
  description: localizedString('global:helloDesc'),
  descriptionLocalizations: getLocalizations('global:helloDesc'),

  type: ApplicationCommandType.ChatInput,
  run: async (interaction: ChatInputCommandInteraction) => {
    const { localize } = useLocalizedString(interaction.locale);
    const content = localize('global:oi');
    return await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content,
    });
  },
});

export default Hello;
