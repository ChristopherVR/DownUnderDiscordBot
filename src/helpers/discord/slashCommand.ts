import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { COMMANDS } from '../../constants/commands.js';
import { useLocalizedString } from '../localization/localizedString.js';
import { logger } from '../logger/logger.js';

const MUSIC_COMMANDS = [
  'back',
  'clear',
  'jump',
  'loop',
  'nowplaying',
  'pause',
  'play',
  'playnext',
  'remove',
  'resume',
  'save',
  'seek',
  'shuffle',
  'skip',
  'stop',
  'volume',
  'queue',
];

export const handleSlashCommand = async (interaction: ChatInputCommandInteraction): Promise<void> => {
  const { localize } = useLocalizedString(interaction.locale);

  try {
    const command = COMMANDS.find((c) => c.name === interaction.commandName);
    if (!command) {
      logger.error({ command: interaction.commandName }, 'Unable to find slash command');
      await interaction.reply({ content: localize('global:genericError'), flags: MessageFlags.Ephemeral });
      return;
    }

    if (
      process.env.MUSIC_CHANNEL_ID &&
      MUSIC_COMMANDS.includes(interaction.commandName) &&
      interaction.channelId !== process.env.MUSIC_CHANNEL_ID
    ) {
      await interaction.reply({
        content: `Music commands can only be used in the designated music channel.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    logger.info(
      {
        command: command.name,
        user: interaction.user.id,
        guild: interaction.guildId,
        channel: interaction.channelId,
      },
      `COMMAND: ${command.name} - EXECUTING`,
    );
    await command.run(interaction);
    logger.info(
      {
        command: command.name,
        user: interaction.user.id,
        guild: interaction.guildId,
        channel: interaction.channelId,
      },
      `COMMAND: ${command.name} - SUCCESS`,
    );
  } catch (err) {
    logger.error(
      {
        command: interaction.commandName,
        user: interaction.user.id,
        guild: interaction.guildId,
        channel: interaction.channelId,
        error: err,
      },
      `COMMAND: ${interaction.commandName} - FAILED`,
    );
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: localize('global:genericError'), flags: MessageFlags.Ephemeral });
    } else {
      await interaction.reply({ content: localize('global:genericError'), flags: MessageFlags.Ephemeral });
    }
  }
};
