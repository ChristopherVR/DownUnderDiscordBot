import { ApplicationCommandOptionType, ApplicationCommandType, EmbedBuilder, MessageFlags } from 'discord.js';
import type { CommandContext, CommandHandler } from '../types/commands';
import { HistoryRepository } from '../database/repositories/HistoryRepository';

const historyRepo = new HistoryRepository();

export const HistoryCommand = (): CommandHandler => ({
  name: 'history',
  description: 'View play history',
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'view',
      description: 'What to view',
      type: ApplicationCommandOptionType.String,
      required: false,
      choices: [
        { name: 'Recent', value: 'recent' },
        { name: 'Most Played', value: 'top' },
      ],
    },
  ],
  run: async (context: CommandContext) => {
    const view = context.getString('view') ?? 'recent';
    const guildId = context.guildId;

    if (!guildId) {
      await context.reply({ content: 'This command can only be used in a server.', flags: MessageFlags.Ephemeral });
      return;
    }

    if (view === 'top') {
      const topTracks = await historyRepo.getMostPlayed(guildId, 10);

      if (!topTracks.length) {
        await context.reply({ content: 'No play history yet.', flags: MessageFlags.Ephemeral });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle('🏆 Most Played Tracks')
        .setColor(0xffd700)
        .setDescription(
          topTracks
            .map((t, i) => `**${i + 1}.** ${t.title} - ${t.artist ?? 'Unknown'} (${t.play_count} plays)`)
            .join('\n'),
        );

      await context.reply({ embeds: [embed] });
    } else {
      const recent = await historyRepo.getRecentlyPlayed(guildId, 10);

      if (!recent.length) {
        await context.reply({ content: 'No play history yet.', flags: MessageFlags.Ephemeral });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle('🕐 Recently Played')
        .setColor(0x1db954)
        .setDescription(
          recent
            .map((t, i) => {
              const ago = getTimeAgo(t.playedAt);
              return `**${i + 1}.** ${t.title} - ${t.artist ?? 'Unknown'} (${ago})`;
            })
            .join('\n'),
        );

      await context.reply({ embeds: [embed] });
    }
  },
});

function getTimeAgo(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default HistoryCommand;
