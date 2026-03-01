import { ApplicationCommandOptionType, ApplicationCommandType, EmbedBuilder, MessageFlags } from 'discord.js';
import type { CommandContext, CommandHandler } from '../types/commands';
import { PlaylistRepository } from '../database/repositories/PlaylistRepository';
import { createLogger } from '../helpers/logger';
import { useDefaultPlayer } from '../helpers/discord/player';

const log = createLogger('command-playlist');
const playlistRepo = new PlaylistRepository();

export const PlaylistCommand = (): CommandHandler => ({
  name: 'playlist',
  description: 'Manage your playlists',
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'action',
      description: 'What to do',
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: 'Create', value: 'create' },
        { name: 'List', value: 'list' },
        { name: 'View', value: 'view' },
        { name: 'Play', value: 'play' },
        { name: 'Add Current', value: 'add' },
        { name: 'Add URL', value: 'add-url' },
        { name: 'Remove', value: 'remove' },
        { name: 'Delete', value: 'delete' },
      ],
    },
    {
      name: 'name',
      description: 'Playlist name (for create/view/play/delete/add/remove)',
      type: ApplicationCommandOptionType.String,
      required: false,
    },
    {
      name: 'description',
      description: 'Playlist description (for create)',
      type: ApplicationCommandOptionType.String,
      required: false,
    },
    {
      name: 'url',
      description: 'Track URL to add (for add-url)',
      type: ApplicationCommandOptionType.String,
      required: false,
    },
    {
      name: 'position',
      description: 'Track position to remove (for remove, 1-based)',
      type: ApplicationCommandOptionType.Integer,
      required: false,
    },
  ],
  run: async (context: CommandContext) => {
    const action = context.getString('action');
    const name = context.getString('name');
    const description = context.getString('description');
    const url = context.getString('url');
    const position = context.getInteger('position');
    const guildId = context.guildId;
    const userId = context.userId;

    if (!guildId || !userId) {
      await context.reply({ content: 'This command can only be used in a server.', flags: MessageFlags.Ephemeral });
      return;
    }

    switch (action) {
      case 'create': {
        if (!name) {
          await context.reply({ content: 'Please provide a playlist name.', flags: MessageFlags.Ephemeral });
          return;
        }
        const playlist = await playlistRepo.create({ guildId, userId, name, description: description ?? undefined });
        await context.reply({
          content: `Playlist **${playlist.name}** created!`,
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case 'list': {
        const playlists = await playlistRepo.findByGuild(guildId, userId);
        if (!playlists.length) {
          await context.reply({ content: 'No playlists found. Create one with `/playlist create`.', flags: MessageFlags.Ephemeral });
          return;
        }

        const embed = new EmbedBuilder()
          .setTitle('Your Playlists')
          .setColor(0x1db954)
          .setDescription(
            playlists
              .map((p, i) => `${i + 1}. **${p.name}**${p.description ? ` - ${p.description}` : ''}`)
              .join('\n'),
          );

        await context.reply({ embeds: [embed] });
        break;
      }

      case 'view': {
        if (!name) {
          await context.reply({ content: 'Please provide a playlist name.', flags: MessageFlags.Ephemeral });
          return;
        }
        const playlists = await playlistRepo.findByGuild(guildId, userId);
        const playlist = playlists.find((p) => p.name.toLowerCase() === name.toLowerCase());
        if (!playlist) {
          await context.reply({ content: `Playlist "${name}" not found.`, flags: MessageFlags.Ephemeral });
          return;
        }
        const full = await playlistRepo.findById(playlist.id);
        if (!full) {
          await context.reply({ content: 'Playlist not found.', flags: MessageFlags.Ephemeral });
          return;
        }

        const embed = new EmbedBuilder()
          .setTitle(full.name)
          .setColor(0x1db954)
          .setDescription(
            full.tracks.length
              ? full.tracks.map((t, i) => `${i + 1}. **${t.title}** - ${t.artist ?? 'Unknown'} (${Math.floor(t.duration / 60)}:${String(t.duration % 60).padStart(2, '0')})`).join('\n')
              : 'No tracks yet. Use `/playlist add` while a song is playing.',
          )
          .setFooter({ text: `${full.tracks.length} track(s)` });

        await context.reply({ embeds: [embed] });
        break;
      }

      case 'add': {
        if (!name) {
          await context.reply({ content: 'Please provide a playlist name.', flags: MessageFlags.Ephemeral });
          return;
        }
        const player = useDefaultPlayer();
        const queue = player.queues.get(guildId);
        const currentTrack = queue?.currentTrack;
        if (!currentTrack) {
          await context.reply({ content: 'No track is currently playing.', flags: MessageFlags.Ephemeral });
          return;
        }
        const playlists = await playlistRepo.findByGuild(guildId, userId);
        const targetPlaylist = playlists.find((p) => p.name.toLowerCase() === name.toLowerCase());
        if (!targetPlaylist) {
          await context.reply({ content: `Playlist "${name}" not found.`, flags: MessageFlags.Ephemeral });
          return;
        }

        // Detect platform from track URL
        const trackUrl = currentTrack.url?.toLowerCase() ?? '';
        let platform = 'unknown';
        if (trackUrl.includes('youtube.com') || trackUrl.includes('youtu.be')) platform = 'youtube';
        else if (trackUrl.includes('spotify.com')) platform = 'spotify';
        else if (trackUrl.includes('soundcloud.com')) platform = 'soundcloud';
        else if (currentTrack.raw?.source === 'local' || trackUrl.startsWith('/') || trackUrl.match(/^[A-Za-z]:\\/)) platform = 'local';

        await playlistRepo.addTrack(targetPlaylist.id, {
          title: currentTrack.title,
          artist: currentTrack.author,
          duration: currentTrack.durationMS ? Math.floor(currentTrack.durationMS / 1000) : 0,
          url: currentTrack.url,
          thumbnail: currentTrack.thumbnail,
          platform,
        });

        await context.reply({
          content: `Added **${currentTrack.title}** to playlist **${targetPlaylist.name}**.`,
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case 'add-url': {
        if (!name) {
          await context.reply({ content: 'Please provide a playlist name.', flags: MessageFlags.Ephemeral });
          return;
        }
        if (!url) {
          await context.reply({ content: 'Please provide a URL to add.', flags: MessageFlags.Ephemeral });
          return;
        }
        const playlists = await playlistRepo.findByGuild(guildId, userId);
        const targetPlaylist = playlists.find((p) => p.name.toLowerCase() === name.toLowerCase());
        if (!targetPlaylist) {
          await context.reply({ content: `Playlist "${name}" not found.`, flags: MessageFlags.Ephemeral });
          return;
        }

        await context.deferReply();

        // Search for the track to get metadata
        const player = useDefaultPlayer();
        const result = await player.search(url);
        if (!result.tracks.length) {
          await context.editReply({ content: 'Could not find a track for that URL.' });
          return;
        }

        const foundTrack = result.tracks[0];
        const foundUrl = foundTrack.url?.toLowerCase() ?? '';
        let detectedPlatform = 'unknown';
        if (foundUrl.includes('youtube.com') || foundUrl.includes('youtu.be')) detectedPlatform = 'youtube';
        else if (foundUrl.includes('spotify.com')) detectedPlatform = 'spotify';
        else if (foundUrl.includes('soundcloud.com')) detectedPlatform = 'soundcloud';

        await playlistRepo.addTrack(targetPlaylist.id, {
          title: foundTrack.title,
          artist: foundTrack.author,
          duration: foundTrack.durationMS ? Math.floor(foundTrack.durationMS / 1000) : 0,
          url: foundTrack.url,
          thumbnail: foundTrack.thumbnail,
          platform: detectedPlatform,
        });

        await context.editReply({
          content: `Added **${foundTrack.title}** to playlist **${targetPlaylist.name}**.`,
        });
        break;
      }

      case 'remove': {
        if (!name) {
          await context.reply({ content: 'Please provide a playlist name.', flags: MessageFlags.Ephemeral });
          return;
        }
        if (!position || position < 1) {
          await context.reply({ content: 'Please provide a valid track position (starting from 1).', flags: MessageFlags.Ephemeral });
          return;
        }
        const playlists = await playlistRepo.findByGuild(guildId, userId);
        const targetPlaylist = playlists.find((p) => p.name.toLowerCase() === name.toLowerCase());
        if (!targetPlaylist) {
          await context.reply({ content: `Playlist "${name}" not found.`, flags: MessageFlags.Ephemeral });
          return;
        }
        const full = await playlistRepo.findById(targetPlaylist.id);
        if (!full || !full.tracks.length) {
          await context.reply({ content: 'Playlist is empty.', flags: MessageFlags.Ephemeral });
          return;
        }
        const trackIndex = position - 1;
        const trackToRemove = full.tracks[trackIndex];
        if (!trackToRemove) {
          await context.reply({ content: `Track position ${position} is out of range (1-${full.tracks.length}).`, flags: MessageFlags.Ephemeral });
          return;
        }
        await playlistRepo.removeTrack(targetPlaylist.id, trackToRemove.id);
        await context.reply({
          content: `Removed **${trackToRemove.title}** from playlist **${targetPlaylist.name}**.`,
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case 'play': {
        if (!name) {
          await context.reply({ content: 'Please provide a playlist name.', flags: MessageFlags.Ephemeral });
          return;
        }
        const playlists = await playlistRepo.findByGuild(guildId, userId);
        const playTarget = playlists.find((p) => p.name.toLowerCase() === name.toLowerCase());
        if (!playTarget) {
          await context.reply({ content: `Playlist "${name}" not found.`, flags: MessageFlags.Ephemeral });
          return;
        }
        const fullPlaylist = await playlistRepo.findById(playTarget.id);
        if (!fullPlaylist || !fullPlaylist.tracks.length) {
          await context.reply({ content: 'Playlist is empty.', flags: MessageFlags.Ephemeral });
          return;
        }

        const member = context.member;
        const voiceChannel = member?.voice?.channel;
        if (!voiceChannel) {
          await context.reply({ content: 'You need to be in a voice channel.', flags: MessageFlags.Ephemeral });
          return;
        }

        await context.reply({ content: `Loading playlist **${playTarget.name}** (${fullPlaylist.tracks.length} tracks)...` });

        const player = useDefaultPlayer();
        for (const track of fullPlaylist.tracks) {
          try {
            await player.play(voiceChannel, track.url, {
              nodeOptions: { leaveOnEmpty: true, leaveOnEmptyCooldown: 300000, leaveOnEnd: false, volume: 65 },
            });
          } catch (err) {
            log.warn({ err, track: track.title }, 'Failed to queue playlist track');
          }
        }
        break;
      }

      case 'delete': {
        if (!name) {
          await context.reply({ content: 'Please provide a playlist name.', flags: MessageFlags.Ephemeral });
          return;
        }
        const playlists = await playlistRepo.findByGuild(guildId, userId);
        const delTarget = playlists.find((p) => p.name.toLowerCase() === name.toLowerCase() && p.userId === userId);
        if (!delTarget) {
          await context.reply({ content: `Playlist "${name}" not found or you don't own it.`, flags: MessageFlags.Ephemeral });
          return;
        }
        await playlistRepo.delete(delTarget.id);
        await context.reply({ content: `Playlist **${delTarget.name}** deleted.`, flags: MessageFlags.Ephemeral });
        break;
      }
    }
  },
});

export default PlaylistCommand;
