import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  MessageFlags,
  PermissionFlagsBits,
  TextChannel,
} from 'discord.js';
import { Command } from '../../models/discord.js';
import { useLocalizedString } from '../../helpers/localization/localizedString.js';
import { logger } from '../../helpers/logger/logger.js';

export const SetActive = (): Command<ChatInputCommandInteraction> => ({
  name: 'set-active',
  description: 'Sets a specific bot instance as the active one.',
  defaultMemberPermissions: PermissionFlagsBits.Administrator,
  options: [
    {
      name: 'instance_id',
      description: 'The ID of the bot instance to set as active.',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  run: async (interaction: ChatInputCommandInteraction) => {
    const { localize } = useLocalizedString(interaction.locale);
    const targetInstanceId = interaction.options.getString('instance_id', true);

    if (!process.env.STATUS_CHANNEL_ID) {
      return interaction.reply({
        content: 'The STATUS_CHANNEL_ID environment variable is not set.',
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      const statusChannel = await interaction.client.channels.fetch(process.env.STATUS_CHANNEL_ID);
      if (statusChannel instanceof TextChannel) {
        // Post a "command" message to the channel. All instances will see this.
        await statusChannel.send(`SET_ACTIVE:${targetInstanceId}`);
        await interaction.reply({
          content: `Activation command sent for instance \`[${targetInstanceId}]\`. It may take a moment to take effect.`,
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply({
          content: 'The configured status channel is not a valid text channel.',
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch (error) {
      logger.error({ err: error }, 'Failed to send SET_ACTIVE command.');
      await interaction.reply({
        content: 'An error occurred while trying to send the activation command.',
        flags: MessageFlags.Ephemeral,
      });
    }
  },
});
