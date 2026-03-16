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
import type { CommandContext, CommandHandler } from '../types/commands';
import { useDefaultPlayer } from '../helpers/discord/player';
import { createLogger } from '../helpers/logger';
import { CustomYouTubeExtractor } from '../extractors/YouTubeExtractor';
import { SpotifyExtractor } from '../extractors/SpotifyExtractor';
import { SoundCloudExtractor } from '../extractors/SoundCloudExtractor';
import { LocalExtractor } from '../extractors/LocalExtractor';

const log = createLogger('command-search');

const formatDuration = (d?: string | number | null): string => {
  if (d == null) return '?:??';
  const seconds = typeof d === 'number' ? d : parseInt(String(d), 10);
  if (Number.isNaN(seconds) || seconds < 0) return '?:??';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

// Map platform name → extractor identifier
const PLATFORM_EXTRACTOR_MAP: Record<string, string> = {
  youtube: CustomYouTubeExtractor.identifier,
  spotify: SpotifyExtractor.identifier,
  soundcloud: SoundCloudExtractor.identifier,
  local: LocalExtractor.identifier,
  auto: CustomYouTubeExtractor.identifier,
};

const PLATFORM_EMOJI: Record<string, string> = {
  youtube: '🔴',
  spotify: '🟢',
  soundcloud: '🟠',
  local: '📁',
  auto: '🔍',
};

const PLATFORM_LABEL: Record<string, string> = {
  youtube: 'YouTube',
  spotify: 'Spotify',
  soundcloud: 'SoundCloud',
  local: 'Local File',
};

/** Detect a platform name from a track URL or path */
const detectPlatform = (url?: string): string | undefined => {
  if (!url) return undefined;
  if (/youtu\.?be/i.test(url)) return 'youtube';
  if (/spotify\.com/i.test(url)) return 'spotify';
  if (/soundcloud\.com/i.test(url)) return 'soundcloud';
  if (/music\.apple\.com/i.test(url)) return 'applemusic';
  // Local file paths (absolute or file:// protocol)
  if (/^([a-zA-Z]:\\|\/|file:\/\/)/.test(url)) return 'local';
  return undefined;
};

/** Check whether a URL is a web link (safe to use in markdown links) */
const isWebUrl = (url?: string): boolean => !!url && /^https?:\/\//i.test(url);

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
        { name: 'Local Files', value: 'local' },
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
    const emoji = PLATFORM_EMOJI[platform] ?? '🔍';

    try {
      // Custom extractors' validate() only matches URLs, so player.search()
      // never routes plain-text queries to them.  Call the extractor's handle()
      // directly (same approach the desktop app uses) so text search works.
      const extractorId = PLATFORM_EXTRACTOR_MAP[platform] ?? CustomYouTubeExtractor.identifier;
      const ext = player.extractors.get(extractorId);

      if (!ext) {
        await interaction.editReply({ content: `Extractor for ${platform} is not available.` });
        return;
      }

      let tracks: import('discord-player').Track[];

      if (platform === 'local') {
        // LocalExtractor exposes searchLocal() for text-based file search
        const localExt = ext as LocalExtractor;
        tracks = await localExt.searchLocal(query, 5);
      } else {
        const result = await ext.handle(query, { requestedBy: interaction.user } as never);
        tracks = result?.tracks?.slice(0, 5) ?? [];
      }

      if (!tracks.length) {
        await interaction.editReply({ content: `No results found for "${query}" on ${platform}.` });
        return;
      }
      const embed = new EmbedBuilder()
        .setTitle(`${emoji} Search Results - ${platform.charAt(0).toUpperCase() + platform.slice(1)}`)
        .setColor(0x1db954)
        .setDescription(
          tracks
            .map((t, i) => {
              const source = detectPlatform(t.url) ?? platform;
              const sourceEmoji = PLATFORM_EMOJI[source] ?? '🔗';
              const sourceLabel = PLATFORM_LABEL[source] ?? source;
              const sourceTag = `${sourceEmoji} ${sourceLabel}`;
              const titlePart = isWebUrl(t.url) ? `[${t.title}](${t.url})` : t.title;
              return `**${i + 1}.** ${titlePart}\n   ${t.author ?? 'Unknown'} · ${formatDuration(t.duration)} · ${sourceTag}`;
            })
            .join('\n\n'),
        )
        .setFooter({ text: `Showing ${tracks.length} results` });

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
