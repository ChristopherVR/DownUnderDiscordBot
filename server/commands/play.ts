import { GuildQueue, Player, QueryType, Track } from 'discord-player';
import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  MessageFlags,
  User,
} from 'discord.js';
import { GuildBasedChannel, GuildMember, PermissionFlagsBits, VoiceBasedChannel } from 'discord.js';
import { tCommands, tErrors } from 'discord-dashboard-shared/localization';
import { useDefaultPlayer } from '../helpers/discord/player';
import { CommandHandler, CommandContext } from '../types/commands';
import { InteractionCommandContext } from '../helpers/commands/CommandContext';
import fs from 'fs/promises';
import { join } from 'path';
import { createLogger } from '../helpers/logger';
import Innertube from 'youtubei.js';
import { URL } from 'node:url';

const log = createLogger('command-play');

// Format a duration given in seconds (number or numeric string) to mm:ss
const formatDuration = (d?: string | number | null): string | undefined => {
  if (d == null) return undefined;
  const seconds = typeof d === 'number' ? d : parseInt(String(d), 10);
  if (Number.isNaN(seconds) || seconds < 0) return undefined;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

/* -------------------------
   Permission helpers
-------------------------- */

const PERMISSION_LABELS: Record<string, string> = {
  [PermissionFlagsBits.ViewChannel.toString()]: 'View Channel',
  [PermissionFlagsBits.SendMessages.toString()]: 'Send Messages',
  [PermissionFlagsBits.EmbedLinks.toString()]: 'Embed Links',
  [PermissionFlagsBits.ManageMessages.toString()]: 'Manage Messages',
  [PermissionFlagsBits.Connect.toString()]: 'Connect to Voice',
  [PermissionFlagsBits.Speak.toString()]: 'Speak in Voice',
};

const REQUIRED_TEXT_PERMISSIONS = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.EmbedLinks,
  PermissionFlagsBits.ManageMessages,
];

const REQUIRED_VOICE_PERMISSIONS = [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak];

const formatPermissions = (permissions: bigint[]): string =>
  permissions.map((perm) => PERMISSION_LABELS[perm.toString()] ?? `Permission ${perm.toString()}`).join(', ');

const getMissingPermissions = (channel: GuildBasedChannel, member: GuildMember, permissions: bigint[]): bigint[] => {
  const channelPermissions = channel.permissionsFor(member);
  if (!channelPermissions) return permissions;
  return permissions.filter((permission) => !channelPermissions.has(permission));
};

const ensureChannelPermissions = async (
  context: CommandContext,
  member: GuildMember,
  textChannel: GuildBasedChannel | null,
  voiceChannel: VoiceBasedChannel | null,
): Promise<boolean> => {
  if (!textChannel) {
    await context.reply({
      content: 'Unable to determine the channel for this command.',
      flags: MessageFlags.Ephemeral,
    });
    return false;
  }

  const missingTextPermissions = getMissingPermissions(textChannel, member, REQUIRED_TEXT_PERMISSIONS);
  if (missingTextPermissions.length > 0) {
    await context.reply({
      content: `I am missing the following permissions in ${textChannel.toString()}: ${formatPermissions(
        missingTextPermissions,
      )}.`,
      flags: MessageFlags.Ephemeral,
    });
    return false;
  }

  if (!voiceChannel) {
    await context.reply({ content: 'Connect to a voice channel to use this command.', flags: MessageFlags.Ephemeral });
    return false;
  }

  const missingVoicePermissions = getMissingPermissions(voiceChannel, member, REQUIRED_VOICE_PERMISSIONS);
  if (missingVoicePermissions.length > 0) {
    await context.reply({
      content: `I am missing the following permissions in ${voiceChannel.toString()}: ${formatPermissions(
        missingVoicePermissions,
      )}.`,
      flags: MessageFlags.Ephemeral,
    });
    return false;
  }

  return true;
};

const ensureQueue = (player: Player, context: CommandContext): GuildQueue => {
  const guildId = context.guildId;
  if (!guildId) throw new Error('Missing guild identifier for play command');

  return (
    player.nodes.get(guildId) ??
    player.nodes.create(guildId, {
      metadata: { channel: context.channel ?? undefined },
      leaveOnEmpty: true,
      leaveOnEmptyCooldown: 300000,
      leaveOnEnd: false,
      volume: 65,
    })
  );
};

/* -------------------------
   Core playback helpers
-------------------------- */

const playAndQueue = async (
  context: CommandContext,
  queue: GuildQueue,
  tracks: Track[],
  trackIndex: number,
): Promise<Track | null> => {
  const track = tracks[trackIndex];
  if (!track) return null;

  const voiceChannel = context.member?.voice?.channel;
  if (!voiceChannel) return null;

  const currentChannelId = queue.connection?.joinConfig.channelId;
  if (!queue.connection || currentChannelId !== voiceChannel.id) {
    try {
      await queue.connect(voiceChannel);
    } catch (err) {
      log.error({ err }, 'Failed to connect to voice channel');
      return null;
    }
  }

  if (!queue.isPlaying()) {
    await queue.node.play(track);
    log.info({ track: track.title, guildId: queue.guild.id }, 'Started playback via playAndQueue');
  } else {
    queue.addTrack(track);
    log.info({ track: track.title, guildId: queue.guild.id }, 'Queued track via playAndQueue');
  }

  // NOTE: Do NOT post controller here — PlayerEventManager owns the controller.
  return track;
};

/* -------------------------
   Ephemeral selection UI
-------------------------- */

const handleInteractiveSelection = async (
  context: InteractionCommandContext,
  queue: GuildQueue,
  tracks: Track[],
): Promise<void> => {
  const interaction = context.interactionInstance;
  const selectionText = tracks.map((track, index) => `**${index + 1}**. ${track.title} — ${track.author}`).join('\n');

  const embed = new EmbedBuilder()
    .setColor('Random')
    .setAuthor({ name: 'Search Results' })
    .setDescription(selectionText);

  // Up to 5 numeric buttons
  const choiceButtons = tracks.slice(0, 5).map((_, index) =>
    new ButtonBuilder()
      .setLabel(String(index + 1))
      .setCustomId(String(index))
      .setStyle(ButtonStyle.Primary),
  );

  const cancelButton = new ButtonBuilder().setCustomId('cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary);

  const rows: ActionRowBuilder<ButtonBuilder>[] = [
    new ActionRowBuilder<ButtonBuilder>().addComponents(...choiceButtons),
    new ActionRowBuilder<ButtonBuilder>().addComponents(cancelButton),
  ];

  const response = await interaction.followUp({
    embeds: [embed],
    components: rows,
    flags: MessageFlags.Ephemeral,
  });

  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 15_000,
  });

  collector.on('collect', async (buttonInteraction) => {
    try {
      if (!buttonInteraction.deferred && !buttonInteraction.replied) {
        await buttonInteraction.deferUpdate();
      }
    } catch {
      return;
    }

    collector.stop('selected');

    if (buttonInteraction.customId === 'cancel') {
      await response.edit({ content: 'Selection cancelled.', embeds: [], components: [] }).catch(() => {});
      return;
    }

    const index = Number(buttonInteraction.customId);
    let track: Track | null = null;

    try {
      track = await playAndQueue(context, queue, tracks, index);
    } catch {
      // ignore
    }

    if (!track) {
      await response.edit({ content: tErrors('generic'), embeds: [], components: [] }).catch(() => {});
      return;
    }

    const successEmbed = new EmbedBuilder()
      .setAuthor({ name: tCommands('play.responses.queued', { track: track.title }) })
      .setDescription(`[${track.title}](${track.url})`)
      .setColor('Random');

    if (track.thumbnail) successEmbed.setThumbnail(track.thumbnail);

    await response.edit({ embeds: [successEmbed], components: [] }).catch(() => {});
  });

  collector.on('end', async (_collected, reason) => {
    if (reason === 'time') {
      await response.edit({ components: [] }).catch(() => {});
    }
  });
};

/* -------------------------
   Handlers
-------------------------- */

const handleSearch = async (
  context: CommandContext,
  queue: GuildQueue,
  player: Player,
  query: string,
): Promise<void> => {
  const result = await player.search(query, {
    requestedBy: context.username ?? 'dashboard',
    ignoreCache: true,
    searchEngine: QueryType.YOUTUBE,
  });

  if (!result.tracks.length) {
    if (URL.canParse(query)) {
      const res = await Innertube.create();

      const uarl = new URL(query);

      // Support both full YouTube URLs (youtube.com/watch?v=ID) and short youtu.be/ID
      let vidId = uarl.searchParams.get('v');
      if (!vidId) {
        // For youtu.be links the pathname contains the id as '/ID'
        const pathname = (uarl.pathname || '').replace(/^\//, '');
        if (pathname) {
          // strip any extra segments or query-like parts (shouldn't be present in pathname)
          vidId = pathname.split('/')[0];
        }
      }

      if (!vidId) {
        // If we still don't have an id, attempt to extract from the raw query as a last resort
        // e.g., links like https://www.youtube.com/clip/Ugkx... may not have v param
        const match = query.match(/[?&]v=([a-zA-Z0-9_-]{6,})/);
        if (match) vidId = match[1];
      }

      if (!vidId) {
        // Unable to determine a video id; fall back to original behavior (will cause notFound)
        vidId = undefined as unknown as string;
      }

      const info = await res.getBasicInfo(vidId!);

      const urlTrack = new Track(player, {
        url: query,
        title: info.basic_info.title,
        author: info.basic_info.author,
        thumbnail: info.basic_info.thumbnail ? info.basic_info.thumbnail[0].url : undefined,
        requestedBy: context.username as unknown as User,
        queryType: QueryType.YOUTUBE,
        description: info.basic_info.short_description,
        duration: formatDuration(info.basic_info.duration),
      });

      result.setTracks([urlTrack]);
    }

    if (!result.tracks.length) {
      await context.followUp({
        content: tCommands('play.responses.notFound', { query }),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
  }

  const tracks = result.tracks.slice(0, 5);

  if (context.type === 'interaction' && tracks.length > 1) {
    await handleInteractiveSelection(context as InteractionCommandContext, queue, tracks);
    return;
  }

  const track = await playAndQueue(context, queue, tracks, 0);
  if (!track) throw new Error('Failed to queue track');

  await context.followUp({
    content: tCommands('play.responses.queued', { track: track.title }),
    flags: MessageFlags.Ephemeral,
  });
};

const handlePlaylist = async (
  context: CommandContext,
  queue: GuildQueue,
  player: Player,
  playlistUrl: string,
): Promise<void> => {
  const result = await player.search(playlistUrl, {
    requestedBy: context.username ?? 'dashboard',
    searchEngine: QueryType.YOUTUBE_PLAYLIST,
  });

  if (!result.hasTracks() || !result.playlist) {
    await context.followUp({ content: 'Playlist not found.', flags: MessageFlags.Ephemeral });
    return;
  }

  // Add all tracks (API compatibility)
  if (
    'addTracks' in queue &&
    typeof (queue as unknown as { addTracks: (ts: Track[]) => unknown }).addTracks === 'function'
  ) {
    (queue as unknown as { addTracks: (ts: Track[]) => unknown }).addTracks(result.tracks);
  } else {
    for (const t of result.tracks) queue.addTrack(t);
  }

  if (!queue.isPlaying()) {
    await queue.node.play(result.tracks[0]);
  }

  // Plain embed; no components here
  await context.followUp({
    embeds: [
      new EmbedBuilder()
        .setAuthor({ name: tCommands('play.responses.queued', { track: result.playlist.title }) })
        .setDescription(`[${result.playlist.title}](${result.playlist.url})`)
        .setColor('Random')
        .setThumbnail(result.playlist.thumbnail ?? undefined),
    ],
    components: [], // ensure no action buttons leak here
    flags: MessageFlags.Ephemeral,
  });
};

const handleLocalFile = async (
  context: CommandContext,
  queue: GuildQueue,
  player: Player,
  fileName: string,
): Promise<void> => {
  const musicFolderPath = process.env.MUSIC_FOLDER_PATH;
  if (!musicFolderPath) throw new Error('Music folder path is not configured');

  const files = await fs.readdir(musicFolderPath);
  const match = files.find((file) => file.toLowerCase().includes(fileName.toLowerCase()));
  if (!match) {
    await context.followUp({ content: 'File not found.', flags: MessageFlags.Ephemeral });
    return;
  }

  const filePath = join(musicFolderPath, match);
  log.info({ file: filePath, guildId: queue.guild.id }, 'Queuing local file via play command');

  const result = await player.search(filePath, {
    requestedBy: context.username ?? 'dashboard',
    searchEngine: QueryType.FILE,
  });

  if (!result.hasTracks()) {
    await context.followUp({ content: 'Unable to play that file.', flags: MessageFlags.Ephemeral });
    return;
  }

  const track = await playAndQueue(context, queue, result.tracks, 0);
  if (!track) throw new Error('Failed to queue local track');

  await context.followUp({
    embeds: [
      new EmbedBuilder().setAuthor({ name: tCommands('play.responses.queued', { track: match }) }).setColor('Random'),
    ],
    components: [], // ensure no action buttons leak here
    flags: MessageFlags.Ephemeral,
  });
};

/* -------------------------
   Command definition
-------------------------- */

export const PlayCommand = (): CommandHandler => ({
  name: tCommands('play.name'),
  description: tCommands('play.description'),
  options: [
    { name: 'link-or-query', description: tCommands('play.options.query'), type: ApplicationCommandOptionType.String },
    {
      name: 'playlist-link',
      description: tCommands('play.options.playlist'),
      type: ApplicationCommandOptionType.String,
    },
    { name: 'local-file', description: tCommands('play.options.file'), type: ApplicationCommandOptionType.String },
  ],
  run: async (context: CommandContext) => {
    try {
      const player = useDefaultPlayer();

      // Defer ASAP to avoid "This interaction failed"
      if (context.type === 'interaction') {
        const itx = (context as InteractionCommandContext).interactionInstance;
        if (!itx.deferred && !itx.replied) {
          try {
            await itx.deferReply({ ephemeral: true });
          } catch (deferErr) {
            log.error({ err: deferErr }, 'Failed to defer interaction early');
            return;
          }
        }
      }

      if (context.type === 'interaction') {
        const guild = context.guild;
        const botMember = guild?.members.me ?? null;
        const textChannel = context.channel ?? null;
        const voiceChannel = context.member?.voice?.channel ?? null;

        if (!guild || !botMember) {
          await context.reply({
            content: 'Unable to verify permissions for this server.',
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        const hasPermissions = await ensureChannelPermissions(context, botMember, textChannel, voiceChannel);
        if (!hasPermissions) return;
      }

      if (!context.guildId || !context.guild) {
        await context.reply({ content: tErrors('generic'), flags: MessageFlags.Ephemeral });
        return;
      }

      if (!context.member?.voice?.channel) {
        await context.reply({
          content: 'Connect to a voice channel to use this command.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const queue = ensureQueue(player, context);
      const linkOrQuery = context.getString('link-or-query');
      const playlistLink = context.getString('playlist-link');
      const localFileName = context.getString('local-file');

      if (linkOrQuery) {
        await handleSearch(context, queue, player, linkOrQuery);
      } else if (playlistLink) {
        await handlePlaylist(context, queue, player, playlistLink);
      } else if (localFileName) {
        await handleLocalFile(context, queue, player, localFileName);
      } else {
        await context.followUp({
          content: 'Provide a query, playlist link, or local file name.',
          components: [], // explicit
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch (error) {
      log.error({ err: error }, 'Play command failed');
      try {
        await context.followUp({ content: tErrors('generic'), components: [], flags: MessageFlags.Ephemeral });
      } catch (followUpError) {
        log.warn({ err: followUpError }, 'Failed to send play command error response');
      }
    }
  },
});

export default PlayCommand;
