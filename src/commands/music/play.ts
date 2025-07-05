import { GuildQueue, Player, QueryType, Track } from 'discord-player';
import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
  MessageActionRowComponentBuilder,
  MessageFlags,
} from 'discord.js';
import { localizedString, useLocalizedString } from '../../helpers/localization/localizedString.js';
import { PlayerCommand } from '../../models/discord.js';

import getLocalizations from '../../helpers/localization/getLocalizations.js';
import { useDefaultPlayer } from '../../helpers/discord/player.js';
import { logger } from '../../helpers/logger/logger.js';
import fs from 'fs/promises';
import { join } from 'path';

const playAndQueue = async (
  interaction: ChatInputCommandInteraction,
  queue: GuildQueue,
  tracks: Track[],
  trackIndex: number,
): Promise<Track | null> => {
  try {
    const track = tracks[trackIndex];
    if (!track) return null;

    const userChannel = (interaction.member as GuildMember)?.voice.channel;
    if (!userChannel) return null;

    if (queue.channel?.id !== userChannel.id) {
      await queue.connect(userChannel);
    }

    if (!queue.isPlaying()) {
      await queue.node.play(track);
    } else {
      queue.addTrack(track);
    }
    return track;
  } catch (error) {
    logger.error({ err: error }, 'Error in playAndQueue');
    return null;
  }
};

const handleSearch = async (interaction: ChatInputCommandInteraction, queue: GuildQueue, player: Player) => {
  const { localize } = useLocalizedString(interaction.locale);
  const query = interaction.options.getString('link-or-query', true);
  const result = await player.search(query, {
    requestedBy: interaction.user,
    ignoreCache: true,
    searchEngine: QueryType.YOUTUBE,
  });

  if (!result.hasTracks()) {
    return interaction.followUp({ content: localize('global:noResultsFound'), flags: MessageFlags.Ephemeral });
  }

  const tracks = result.tracks.slice(0, 5);
  const embed = new EmbedBuilder()
    .setColor('Random')
    .setAuthor({ name: localize('global:resultsFor', { track: query }) })
    .setDescription(
      `${tracks.map((track, i) => `**${i + 1}**. ${track.title} | ${track.author}`).join('\n')}\n\n${localize(
        'global:selectAChoiceBetween',
        { count: tracks.length },
      )}`,
    );

  const trackButtons = tracks.map((t, i) =>
    new ButtonBuilder()
      .setLabel(String(i + 1))
      .setCustomId(String(i))
      .setStyle(ButtonStyle.Primary),
  );

  const components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [
    new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(trackButtons),
  ];

  if (tracks.length === 5) {
    components.push(
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        new ButtonBuilder().setLabel(localize('global:cancel')).setCustomId('cancel').setStyle(ButtonStyle.Secondary),
      ),
    );
  } else {
    trackButtons.push(
      new ButtonBuilder().setLabel(localize('global:cancel')).setCustomId('cancel').setStyle(ButtonStyle.Secondary),
    );
  }

  const reply = await interaction.followUp({ embeds: [embed], components });

  const collector = reply.createMessageComponentCollector({ time: 15000 });

  collector.on('collect', async (i) => {
    collector.stop();
    if (i.customId === 'cancel') {
      await i.update({ content: 'Selection cancelled.', embeds: [], components: [] });
      return;
    }

    const track = await playAndQueue(interaction, queue, tracks, parseInt(i.customId, 10));

    if (track) {
      const successEmbed = new EmbedBuilder()
        .setAuthor({ name: localize('global:songAddedToQueue') })
        .setDescription(`[${track.title}](${track.url})`)
        .setThumbnail(track.thumbnail)
        .setColor('Random');
      await i.update({ embeds: [successEmbed], components: [] });
    } else {
      await i.update({ content: 'Failed to queue the selected track.', embeds: [], components: [] });
    }
  });

  collector.on('end', (_collected, reason) => {
    if (reason === 'time') {
      reply.delete().catch(() => {});
    }
  });
};

const handlePlaylist = async (interaction: ChatInputCommandInteraction, queue: GuildQueue, player: Player) => {
  const { localize } = useLocalizedString(interaction.locale);
  const playlistUrl = interaction.options.getString('playlist-link', true);
  const result = await player.search(playlistUrl, {
    requestedBy: interaction.user,
    searchEngine: QueryType.YOUTUBE_PLAYLIST,
  });

  if (!result.hasTracks() || !result.playlist) {
    return interaction.followUp({ content: localize('global:noPlaylistFound'), flags: MessageFlags.Ephemeral });
  }

  queue.addTrack(result.tracks);
  if (!queue.isPlaying()) await queue.node.play(result.tracks[0]);

  const embed = new EmbedBuilder()
    .setAuthor({ name: localize('global:playlistAddedToQueue') })
    .setDescription(`[${result.playlist.title}](${result.playlist.url})`)
    .setThumbnail(result.playlist.thumbnail)
    .setColor('Random');
  return interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
};

const handleLocalFile = async (interaction: ChatInputCommandInteraction, queue: GuildQueue, player: Player) => {
  const { localize } = useLocalizedString(interaction.locale);
  const fileName = interaction.options.getString('local-file-name', true);
  const musicFolderPath = process.env.MUSIC_FOLDER_PATH;

  if (!musicFolderPath) {
    logger.error('Music folder path is not set.');
    throw new Error('Music folder path is not configured.');
  }

  try {
    const files = await fs.readdir(musicFolderPath);
    const file = files.find((f) => f.toLowerCase().includes(fileName.toLowerCase()));

    if (!file) {
      return interaction.followUp({ content: localize('global:fileNotFound'), flags: MessageFlags.Ephemeral });
    }

    const filePath = join(musicFolderPath, file);
    const result = await player.search(filePath, {
      requestedBy: interaction.user,
      searchEngine: QueryType.FILE,
    });

    if (!result.hasTracks()) {
      return interaction.followUp({ content: localize('global:fileCouldNotBePlayed'), flags: MessageFlags.Ephemeral });
    }

    const track = await playAndQueue(interaction, queue, result.tracks, 0);

    if (!track) {
      throw new Error('Failed to play or queue the track.');
    }

    const embed = new EmbedBuilder()
      .setAuthor({ name: localize('global:songAddedToQueue') })
      .setDescription(file)
      .setColor('Random');
    return interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
  } catch (err) {
    logger.error({ err }, 'Error handling local file:');
    // Re-throw to be caught by the centralized handler
    throw err;
  }
};

export const Play: PlayerCommand = {
  name: localizedString('global:play'),
  description: localizedString('global:playTrackOrPlaylistByProviding'),
  nameLocalizations: getLocalizations('global:play'),
  descriptionLocalizations: getLocalizations('global:playTrackOrPlaylistByProviding'),

  options: [
    {
      name: 'link-or-query',
      description: 'The song to search for',
      nameLocalizations: getLocalizations('global:linkOrQuery'),
      descriptionLocalizations: getLocalizations('global:theSongToSearch'),
      type: ApplicationCommandOptionType.String,
    },
    {
      name: 'playlist-link',
      description: 'Link to a playlist',
      nameLocalizations: getLocalizations('global:playlistLink'),
      descriptionLocalizations: getLocalizations('global:playlistLinkDescription'),
      type: ApplicationCommandOptionType.String,
    },
    {
      name: 'local-file-name',
      description: 'Name of a local file',
      nameLocalizations: getLocalizations('global:localFileName'),
      descriptionLocalizations: getLocalizations('global:localFileNameDescription'),
      type: ApplicationCommandOptionType.String,
    },
  ],

  run: async (interaction: ChatInputCommandInteraction) => {
    const { localize } = useLocalizedString(interaction.locale);
    if (!interaction.guildId || !interaction.guild) {
      return interaction.reply({ content: localize('global:genericError'), flags: MessageFlags.Ephemeral });
    }

    const memberChannel = (interaction.member as GuildMember)?.voice.channel;
    if (!memberChannel) {
      return interaction.reply({
        content: localize('global:connectToVoiceChannelToUseBot'),
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.deferReply();

    const player = useDefaultPlayer();
    const queue =
      player.nodes.get(interaction.guild) ??
      player.nodes.create(interaction.guild, {
        metadata: { channel: interaction.channel },
        leaveOnEmpty: true,
        leaveOnEmptyCooldown: 300000,
        leaveOnEnd: false,
        volume: 65,
      });

    if (interaction.options.getString('link-or-query')) {
      logger.info('Searching for track or query');
      await handleSearch(interaction, queue, player);
    } else if (interaction.options.getString('playlist-link')) {
      logger.info('Searching for playlist');
      await handlePlaylist(interaction, queue, player);
    } else if (interaction.options.getString('local-file-name')) {
      logger.info('Searching for local file');
      await handleLocalFile(interaction, queue, player);
    } else {
      await interaction.followUp({ content: localize('global:noOptionsProvided'), flags: MessageFlags.Ephemeral });
    }
  },
};

export default Play;
