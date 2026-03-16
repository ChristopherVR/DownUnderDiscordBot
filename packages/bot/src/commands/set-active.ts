import {
  ChatInputCommandInteraction,
  ApplicationCommandOptionType,
  MessageFlags,
  PermissionFlagsBits,
} from 'discord.js';
import { tCommands, tErrors } from 'discord-dashboard-shared/localization';
import { logger } from '../helpers/logger/logger';
import { StateCoordinator, InactiveInstanceError } from '../state/StateCoordinator';

export const SetActiveCommand = () => ({
  name: tCommands('setActive.name'),
  description: tCommands('setActive.description'),
  defaultMemberPermissions: PermissionFlagsBits.Administrator,
  options: [
    {
      name: 'instance_id',
      description: tCommands('setActive.options.instance'),
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: 'guild_id',
      description: tCommands('setActive.options.guild'),
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ],
  run: async (interaction: ChatInputCommandInteraction) => {
    const respond = async (content: string) => {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      }
      if (interaction.replied) {
        await interaction.followUp({ content, flags: MessageFlags.Ephemeral });
      } else {
        await interaction.editReply({ content });
      }
    };

    const instanceId = interaction.options.getString('instance_id', true).trim();
    const guildId = interaction.options.getString('guild_id') ?? interaction.guildId ?? undefined;

    if (!guildId) {
      await respond(tErrors('command.guildMissing'));
      return;
    }

    try {
      if (!StateCoordinator.hasInstance()) {
        await respond(tErrors('bot.state.unavailable'));
        return;
      }

      const coordinator = StateCoordinator.get();
      const updatedGuild = await coordinator.setActiveInstance(guildId, instanceId, {
        reason: 'command:set-active',
        actorId: interaction.user.id,
      });

      const targetInstance = updatedGuild.instances[instanceId];
      if (!targetInstance) {
        await respond(tCommands('setActive.responses.notFound', { instance: instanceId }));
        return;
      }

      await coordinator.updateInstancePresence(guildId, {
        instanceId,
        online: targetInstance.online,
        isActive: true,
        hostname: targetInstance.hostname,
        pid: targetInstance.pid,
        shardId: targetInstance.shardId,
        extra: targetInstance.extra,
      });

      await respond(
        tCommands('setActive.responses.success', {
          instance: instanceId,
          guild: guildId,
        }),
      );
    } catch (error) {
      if (error instanceof InactiveInstanceError) {
        await respond(
          tCommands('setActive.responses.error', {
            instance: error.activeInstanceId ?? 'unknown',
          }),
        );
        return;
      }

      const message = error instanceof Error ? error.message : String(error);
      logger.error({ err: message, command: 'set-active' });
      await respond(tErrors('generic'));
    }
  },
});

export default SetActiveCommand;
