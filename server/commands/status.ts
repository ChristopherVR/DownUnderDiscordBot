import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags, PermissionFlagsBits } from 'discord.js';
import { logger } from '../helpers/logger/logger';
import { tErrors } from 'discord-dashboard-shared/localization';

export const StatusCommand = () => ({
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

    if (!interaction.deferred) await interaction.deferReply({ ephemeral: true });

    try {
      const statusChannel = await interaction.client.channels.fetch(process.env.STATUS_CHANNEL_ID);
      if (statusChannel && 'messages' in statusChannel) {
        const messages = await (
          statusChannel as {
            messages: { fetch: (options: { limit: number }) => Promise<Map<string, { content: string }>> };
          }
        ).messages.fetch({ limit: 100 });
        const instances: { id: string; status: string; raw: string }[] = [];
        const instanceIds = new Set<string>();
        const statusRegex = /^(\u2705 ACTIVE|\u26aa INACTIVE) \[(.+)\]/;

        for (const message of messages.values()) {
          const match = message.content.match(statusRegex);
          if (match) {
            const status = match[1];
            const id = match[2];
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
        await interaction.editReply({ content: 'The configured status channel is not a valid text channel.' });
      }
    } catch (error) {
      logger.error(error instanceof Error ? error.message : String(error));
      await interaction.editReply({ content: tErrors('generic') });
    }
  },
});

export default StatusCommand;
