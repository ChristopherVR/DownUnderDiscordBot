import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  MessageFlags,
  PermissionFlagsBits,
} from 'discord.js';
import { Command } from '../../models/discord.js';
import { useLocalizedString } from '../../helpers/localization/localizedString.js';
import { getInstanceId } from '../../instanceManager.js';
import { logger } from '../../helpers/logger/logger.js';

export const Shutdown = (): Command<ChatInputCommandInteraction> => ({
  name: 'shutdown',
  description: 'Shuts down a specific bot instance.',
  defaultMemberPermissions: PermissionFlagsBits.Administrator,
  options: [
    {
      name: 'instance_id',
      description: 'The ID of the bot instance to shut down.',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  run: async (interaction: ChatInputCommandInteraction) => {
    const { localize } = useLocalizedString(interaction.locale);
    const targetInstanceId = interaction.options.getString('instance_id', true);
    const currentInstanceId = getInstanceId();

    if (targetInstanceId === currentInstanceId) {
      await interaction.reply({
        content: `Shutting down instance \`[${currentInstanceId}]\`...`,
        flags: MessageFlags.Ephemeral,
      });
      logger.info(`Shutdown command received for this instance [${currentInstanceId}]. Shutting down.`);
      // The SIGTERM handler will do the rest of the graceful shutdown.
      process.exit(0);
    } else {
      await interaction.reply({
        content: `This command is for a different instance (\`[${targetInstanceId}]\`). My ID is \`[${currentInstanceId}]\`.`,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
});
