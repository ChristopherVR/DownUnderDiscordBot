import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  MessageFlags,
} from 'discord.js';
import { QueryType } from 'discord-player';
import type { CommandContext, CommandHandler } from '../types/commands';
import { useDefaultPlayer } from '../helpers/discord/player';
import { createLogger } from '../helpers/logger';

const log = createLogger('command-search');

const formatDuration = (d?: string | number | null): string => {
  if (d == null) return '?:??';
  const seconds = typeof d === 'number' ? d : parseInt(String(d), 10);
  if (Number.isNaN(seconds) || seconds < 0) return '?:??';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

const PLATFORM_QUERY_MAP: Record<string, QueryType> = {
  youtube: QueryType.YOUTUBE_SEARCH,
  spotify: QueryType.SPOTIFY_SEARCH,
  soundcloud: QueryType.SOUNDCLOUD_SEARCH,
  auto: QueryType.AUTO,
};

const PLATFORM_EMOJI: Record<string, string> = {
  youtube: '🔴',
  spotify: '🟢',
  soundcloud: '🟠',
  auto: '🔍',
};

export const SearchCommand = (): CommandHandler => ({
  name: 'search',
  description: 'Search for music across platforms',
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'query',
      description: 'What to search for',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: 'platform',
      description: 'Platform to search on',
      type: ApplicationCommandOptionType.String,
      required: false,
      choices: [
        { name: 'Auto Detect', value: 'auto' },
        { name: 'YouTube', value: 'youtube' },
        { name: 'Spotify', value: 'spotify' },
        { name: 'SoundCloud', value: 'soundcloud' },
      ],
    },
  ],
  run: async (context: CommandContext) => {
    const query = context.getString('query');
    const platform = context.getString('platform') ?? 'auto';

    if (!query) {
      await context.reply({ content: 'Please provide a search query.', flags: MessageFlags.Ephemeral });
      return;
    }

    // This command requires Discord interaction for button handling
    if (context.type !== 'interaction' || !context.interaction) {
      await context.reply({ content: 'This command is only available via Discord slash commands.' });
      return;
    }

    const interaction = context.interaction;
    await interaction.deferReply();

    const player = useDefaultPlayer();
    const queryType = PLATFORM_QUERY_MAP[platform] ?? QueryType.AUTO;
    const emoji = PLATFORM_EMOJI[platform] ?? '🔍';

    try {
      const result = await player.search(query, { searchEngine: queryType });

      if (!result.tracks.length) {
        await interaction.editReply({ content: `No results found for "${query}" on ${platform}.` });
        return;
      }

      const tracks = result.tracks.slice(0, 5);
      const embed = new EmbedBuilder()
        .setTitle(`${emoji} Search Results - ${platform.charAt(0).toUpperCase() + platform.slice(1)}`)
        .setColor(0x1db954)
        .setDescription(
          tracks
            .map(
              (t, i) =>
                `**${i + 1}.** [${t.title}](${t.url})\n   ${t.author ?? 'Unknown'} - ${formatDuration(t.duration)}`,
            )
            .join('\n\n'),
        )
        .setFooter({ text: `Showing ${tracks.length} of ${result.tracks.length} results` });

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        ...tracks.map((_, i) =>
          new ButtonBuilder()
            .setCustomId(`search_play_${i}`)
            .setLabel(`${i + 1}`)
            .setStyle(ButtonStyle.Primary),
        ),
        new ButtonBuilder().setCustomId('search_cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary),
      );

      const response = await interaction.editReply({ embeds: [embed], components: [row] });

      try {
        const btnInteraction = await response.awaitMessageComponent({
          componentType: ComponentType.Button,
          time: 30_000,
          filter: (i) => i.user.id === interaction.user.id,
        });

        if (btnInteraction.customId === 'search_cancel') {
          await btnInteraction.update({ content: 'Search cancelled.', embeds: [], components: [] });
          return;
        }

        const trackIndex = parseInt(btnInteraction.customId.split('_')[2], 10);
        const selectedTrack = tracks[trackIndex];

        if (!selectedTrack) {
          await btnInteraction.update({ content: 'Invalid selection.', embeds: [], components: [] });
          return;
        }

        const member = interaction.member && 'voice' in interaction.member ? interaction.member : null;
        const voiceChannel = member?.voice?.channel;
        if (!voiceChannel) {
          await btnInteraction.update({
            content: 'You need to be in a voice channel to play music.',
            embeds: [],
            components: [],
          });
          return;
        }

        await btnInteraction.update({
          content: `Loading **${selectedTrack.title}**...`,
          embeds: [],
          components: [],
        });

        await player.play(voiceChannel, selectedTrack.url, {
          nodeOptions: { leaveOnEmpty: true, leaveOnEmptyCooldown: 300000, leaveOnEnd: false, volume: 65 },
        });
      } catch {
        await interaction.editReply({ content: 'Selection timed out.', embeds: [], components: [] });
      }
    } catch (err) {
      log.error({ err, query, platform }, 'Search failed');
      await interaction.editReply({ content: 'Search failed. Please try again.' });
    }
  },
});

export default SearchCommand;
