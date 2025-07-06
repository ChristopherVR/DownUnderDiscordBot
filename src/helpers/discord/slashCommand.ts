import { ChatInputCommandInteraction, MessageFlags, TextChannel, ChannelType } from 'discord.js';
import { useLocalizedString } from '../localization/localizedString.js';
import { logger } from '../logger/logger.js';
import { findCommand, getMiscCommands, getMusicCommands } from '../../commandRegistry.js';
import { getInstanceId, isInstanceActive, setInstanceActive } from '../../instanceManager.js';
import { ADMIN_COMMANDS } from '../../constants/commands.js';

async function isStillActive(client: ChatInputCommandInteraction['client']): Promise<boolean> {
  if (!process.env.STATUS_CHANNEL_ID) {
    // If no status channel is configured, assume single-instance mode.
    return true;
  }
  try {
    const statusChannel = (await client.channels.fetch(process.env.STATUS_CHANNEL_ID)) as TextChannel;
    const messages = await statusChannel.messages.fetch({ limit: 10 });
    const latestActive = messages.find((m) => m.content.startsWith('✅ ACTIVE'));
    if (latestActive) {
      const activeId = latestActive.content.match(/\[(.+)\]/)?.[1];
      const isActive = activeId === getInstanceId();
      if (isInstanceActive() !== isActive) {
        logger.info(`Instance status changed based on channel check. Was: ${isInstanceActive()}, Is: ${isActive}`);
        setInstanceActive(isActive);
      }
      return isActive;
    }
    // No active instance found, this one should probably become active.
    logger.info('No active instances found during pre-command check. Electing self.');
    setInstanceActive(true);
    return true;
  } catch (error) {
    logger.error({ err: error }, 'Failed to verify active status from channel.');
    // Fail-safe: if we can't check, assume we are active to avoid a full outage.
    return true;
  }
}

export const handleSlashCommand = async (interaction: ChatInputCommandInteraction): Promise<void> => {
  const { localize } = useLocalizedString(interaction.locale);

  try {
    const command = findCommand(interaction.commandName);
    if (!command) {
      logger.error({ command: interaction.commandName }, 'Unable to find slash command');
      await interaction.reply({ content: localize('global:genericError'), flags: MessageFlags.Ephemeral });
      return;
    }

    // Admin commands can be run by any instance
    const isAdminCommand = ADMIN_COMMANDS.includes(interaction.commandName);

    // If not an admin command, only the active instance can run it
    if (!isAdminCommand && !isInstanceActive()) {
      logger.warn(
        { instanceId: interaction.client.user?.id, command: interaction.commandName },
        'Inactive instance received a command. Waiting to see if active instance replies.',
      );

      // Wait for just under the 3-second timeout to see if the active bot handles it.
      await new Promise((resolve) => setTimeout(resolve, 2800));

      // If the interaction has been handled by the time we wake up, do nothing.
      if (interaction.replied || interaction.deferred) {
        logger.info('Active instance appears to have handled the interaction. This inactive instance will stand down.');
        return;
      }

      // At this point, the active bot has failed to respond in time.
      // We must check if we should take over.
      logger.warn('Active instance did not reply in time. Checking for leader status.');
      const nowActive = await isStillActive(interaction.client);

      if (nowActive) {
        logger.info('Taking over as active instance. Executing command.');
        // The command's run function is now responsible for deferring and replying.
        await command.run(interaction);
      } else {
        // The leader is still the leader, just slow. We do nothing and let the original interaction fail.
        logger.info('Another instance is still active. Letting interaction time out to avoid conflicts.');
      }
      return;
    }

    if (
      process.env.MUSIC_CHANNEL_ID &&
      getMusicCommands().includes(interaction.commandName) &&
      interaction.channelId !== process.env.MUSIC_CHANNEL_ID
    ) {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      await interaction.editReply({
        content: localize('global:musicCommandsOnlyInMusicChannel'),
      });
      return;
    }

    if (
      process.env.MUSIC_CHANNEL_ID &&
      getMiscCommands().includes(interaction.commandName) &&
      interaction.channelId === process.env.MUSIC_CHANNEL_ID
    ) {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      await interaction.editReply({
        content: localize('global:miscCommandsCannotBeUsedInMusicChannel'),
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

    // If the interaction is unknown, it has expired and we can't reply.
    if ((err as any)?.code === 10062) {
      logger.warn('Interaction expired before it could be handled.');
      return;
    }

    if (!interaction.replied) {
      if (interaction.deferred) {
        await interaction.editReply({ content: localize('global:genericError') });
      } else {
        await interaction.reply({ content: localize('global:genericError'), flags: MessageFlags.Ephemeral });
      }
    }
  }
};
