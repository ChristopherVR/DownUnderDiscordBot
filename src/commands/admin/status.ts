import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags, PermissionFlagsBits, TextChannel } from 'discord.js';
import { Command } from '../../models/discord.js';
import { logger } from '../../helpers/logger/logger.js';

export const Status = (): Command<ChatInputCommandInteraction> => ({
  name: 'status',
  description: 'Displays the status of all running bot instances.',
  defaultMemberPermissions: PermissionFlagsBits.Administrator,
  run: async (interaction: ChatInputCommandInteraction) => {
    if (!process.env.STATUS_CHANNEL_ID) {
      return interaction.reply({
        content: 'The STATUS_CHANNEL_ID environment variable is not set.',
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!interaction.deferred) {
      await interaction.deferReply({ ephemeral: true });
    }

    try {
      const statusChannel = await interaction.client.channels.fetch(process.env.STATUS_CHANNEL_ID);
      if (statusChannel instanceof TextChannel) {
        const messages = await statusChannel.messages.fetch({ limit: 100 });
        const instances: { id: string; status: string; raw: string }[] = [];
        const instanceIds = new Set<string>();

        // Regex to match the status lines
        const statusRegex = /^(✅ ACTIVE|⚪ INACTIVE) \[(.+)\]/;

        for (const message of messages.values()) {
          const match = message.content.match(statusRegex);
          if (match) {
            const status = match[1];
            const id = match[2];

            // Only add the most recent status for each instance
            if (!instanceIds.has(id)) {
              instances.push({ id, status, raw: message.content });
              instanceIds.add(id);
            }
          }
        }

        const embed = new EmbedBuilder().setTitle('Bot Instance Status').setColor('Blue').setTimestamp();

        if (instances.length > 0) {
          const description = instances
            .map((i) => `**Instance ID:** \`${i.id}\`\n**Status:** ${i.status}`)
            .join('\n\n');
          embed.setDescription(description);
        } else {
          embed.setDescription('No active bot instances found in the status channel.');
        }

        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.editReply({
          content: 'The configured status channel is not a valid text channel.',
        });
      }
    } catch (error) {
      logger.error({ err: error }, 'Failed to fetch bot statuses.');
      await interaction.editReply({
        content: 'An error occurred while trying to fetch the bot statuses.',
      });
    }
  },
});
