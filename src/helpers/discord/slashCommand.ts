import { ChatInputCommandInteraction } from 'discord.js';
import { COMMANDS } from '../../constants/commands.js';
import { useLocalizedString } from '../localization/localizedString.js';
import { logger } from '../logger/logger.js';
import { DefaultLoggerMessage } from '../../enums/logger.js';

export const handleSlashCommand = async (interaction: ChatInputCommandInteraction): Promise<void> => {
  const { localize } = useLocalizedString(interaction.locale);

  try {
    const command = COMMANDS.find((c) => c.name === interaction.commandName);
    if (!command) {
      logger(DefaultLoggerMessage.UnableToFindSlashCommand, interaction.commandName).error();
      await interaction.reply({ content: localize('global:genericError'), ephemeral: true });
      return;
    }

    logger(
      `COMMAND: ${command.name} - EXECUTING - USER: ${interaction.user.id} - GUILD: ${interaction.guildId}`,
    ).info();
    await command.run(interaction);
    logger(`COMMAND: ${command.name} - SUCCESS - USER: ${interaction.user.id} - GUILD: ${interaction.guildId}`).info();
  } catch (err) {
    logger(
      `COMMAND: ${interaction.commandName} - FAILED - USER: ${interaction.user.id} - GUILD: ${interaction.guildId}`,
      err,
    ).error();
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: localize('global:genericError'), ephemeral: true });
    } else {
      await interaction.reply({ content: localize('global:genericError'), ephemeral: true });
    }
  }
};
