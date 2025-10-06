import {
  ChatInputCommandInteraction,
  ApplicationCommandOptionType,
  MessageFlags,
  PermissionFlagsBits,
} from 'discord.js';
import { tCommands, tErrors } from 'discord-dashboard-shared/localization';
import { logger } from '../helpers/logger/logger';
import { StateCoordinator } from '../state/StateCoordinator';
import { v4 as uuid } from 'uuid';

export const ShutdownCommand = () => ({
  name: tCommands('shutdown.name'),
  description: tCommands('shutdown.description'),
  defaultMemberPermissions: PermissionFlagsBits.Administrator,
  options: [
    {
      name: 'instance_id',
      description: tCommands('shutdown.options.instance'),
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  run: async (interaction: ChatInputCommandInteraction) => {
    const instanceArg = interaction.options.getString('instance_id', true).trim();
    const currentInstanceId = process.env.INSTANCE_ID || `local-${uuid()}`;

    const ensureDeferred = async () => {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      }
    };

    const reply = async (content: string) => {
      await ensureDeferred();
      if (interaction.replied) {
        await interaction.followUp({ content, flags: MessageFlags.Ephemeral });
      } else {
        await interaction.editReply({ content });
      }
    };

    if (instanceArg !== currentInstanceId) {
      await reply(
        tCommands('shutdown.responses.mismatch', {
          requested: instanceArg,
          current: currentInstanceId,
        }),
      );
      return;
    }

    await reply(tCommands('shutdown.responses.self', { instance: currentInstanceId }));

    try {
      if (StateCoordinator.hasInstance()) {
        const coordinator = StateCoordinator.get();
        const guildStates = await coordinator.getAllGuildStates();
        for (const guild of guildStates) {
          if (guild.instances[currentInstanceId]) {
            await coordinator.setInstanceOffline(guild.guildId, currentInstanceId);
          }
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error({ err: message, command: 'shutdown' });
      await interaction.followUp({ content: tErrors('bot.commandFailed'), flags: MessageFlags.Ephemeral });
    }

    logger.info(`Shutdown command received for this instance [${currentInstanceId}]. Shutting down.`);

    setTimeout(() => {
      process.exit(0);
    }, 500);
  },
});

export default ShutdownCommand;
