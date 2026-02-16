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
        { name: 'Delete', value: 'delete' },
      ],
    },
    {
      name: 'name',
      description: 'Playlist name (for create/view/play/delete)',
      type: ApplicationCommandOptionType.String,
      required: false,
    },
    {
      name: 'description',
      description: 'Playlist description (for create)',
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ],
  run: async (context: CommandContext) => {
    const action = context.getString('action');
    const name = context.getString('name');
    const description = context.getString('description');
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

        await playlistRepo.addTrack(targetPlaylist.id, {
          title: currentTrack.title,
          artist: currentTrack.author,
          duration: currentTrack.durationMS ? Math.floor(currentTrack.durationMS / 1000) : 0,
          url: currentTrack.url,
          thumbnail: currentTrack.thumbnail,
          platform: 'youtube',
        });

        await context.reply({
          content: `Added **${currentTrack.title}** to playlist **${targetPlaylist.name}**.`,
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
