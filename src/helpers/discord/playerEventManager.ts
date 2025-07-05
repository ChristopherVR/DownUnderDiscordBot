import { Player, GuildQueue, Track, QueueRepeatMode } from 'discord-player';
import { logger } from '../logger/logger.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Message, TextChannel } from 'discord.js';

// Store controller messages in a map <guildId, message>
export const activeController = new Map<string, Message>();
const updateIntervals = new Map<string, NodeJS.Timeout>();

const stopUpdateInterval = (guildId: string) => {
  const interval = updateIntervals.get(guildId);
  if (interval) {
    clearInterval(interval);
    updateIntervals.delete(guildId);
  }
};

export const getControllerPayload = (queue: GuildQueue) => {
  const track = queue.currentTrack;
  const embed = new EmbedBuilder().setColor('Red');

  const loopButton = new ButtonBuilder().setCustomId('loop').setLabel('🔁').setStyle(ButtonStyle.Secondary);
  switch (queue.repeatMode) {
    case QueueRepeatMode.TRACK:
      loopButton.setLabel('🔂').setStyle(ButtonStyle.Success);
      break;
    case QueueRepeatMode.AUTOPLAY:
      loopButton.setLabel('▶️').setStyle(ButtonStyle.Success);
      break;
  }

  const components = [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('back')
        .setLabel('⏪')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(!queue.history.previousTrack),
      new ButtonBuilder().setCustomId('pause_resume').setLabel('⏯️').setStyle(ButtonStyle.Primary).setDisabled(!track),
      new ButtonBuilder()
        .setCustomId('skip')
        .setLabel('⏩')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(!queue.history.nextTrack),
      new ButtonBuilder().setCustomId('stop').setLabel('⏹️').setStyle(ButtonStyle.Danger).setDisabled(!track),
    ),
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('volume_down').setLabel('🔉').setStyle(ButtonStyle.Secondary).setDisabled(!track),
      loopButton.setDisabled(!track),
      new ButtonBuilder().setCustomId('queue').setLabel('📜').setStyle(ButtonStyle.Secondary).setDisabled(!track),
      new ButtonBuilder().setCustomId('volume_up').setLabel('🔊').setStyle(ButtonStyle.Secondary).setDisabled(!track),
    ),
  ];

  if (track) {
    embed
      .setTitle(track.title)
      .setThumbnail(track.thumbnail)
      .setAuthor({ name: `Now Playing in ${queue.channel?.name}` });

    // Only set URL if it's a valid web URL, not a local file path
    if (track.url.startsWith('http')) {
      embed.setURL(track.url);
    }

    const fields: { name: string; value: string; inline: boolean; description?: string }[] = [
      { name: 'Author', value: track.author, inline: true },
      { name: 'Duration', value: track.duration, inline: true },
      { name: 'Requested by', value: track.requestedBy?.toString() ?? 'N/A', inline: true },
    ];

    // Only add progress bar if duration is not 0:00 (for local files)
    if (track.duration !== '0:00') {
      fields.push({ name: 'Progress', value: queue.node.createProgressBar()!, inline: false, description: 'Progress' });
    }

    embed.addFields(fields);
  } else {
    embed.setTitle('No song is currently playing.');
    embed.setDescription('The queue is empty. Use `/play` to add a song!');
  }

  return { embeds: [embed], components };
};

export class PlayerEventManager {
  private player: Player;

  constructor(player: Player) {
    this.player = player;
    this.attachEventListeners();
  }

  private attachEventListeners() {
    this.player.events.on('audioTrackAdd', (queue: GuildQueue, track: Track) => {
      logger.info(
        {
          guild: queue.guild.id,
          track: track.title,
        },
        'EVENT: audioTrackAdd',
      );
    });

    this.player.events.on('audioTracksAdd', (queue: GuildQueue, tracks: Track[]) => {
      logger.info(
        {
          guild: queue.guild.id,
          count: tracks.length,
        },
        'EVENT: audioTracksAdd',
      );
    });

    this.player.events.on('playerStart', async (queue: GuildQueue, track: Track) => {
      logger.info(
        {
          guild: queue.guild.id,
          track: track.title,
        },
        'EVENT: playerStart',
      );
      const metadata = queue.metadata as { channel: TextChannel };
      if (!metadata.channel || !(metadata.channel instanceof TextChannel)) return;

      const payload = getControllerPayload(queue);
      const controller = activeController.get(queue.guild.id);

      try {
        if (controller) {
          await controller.edit(payload);
        } else {
          const message = await metadata.channel.send(payload);
          activeController.set(queue.guild.id, message);
        }
      } catch (error) {
        // If editing fails (e.g., message deleted), send a new one
        const message = await metadata.channel.send(payload);
        activeController.set(queue.guild.id, message);
      }

      if (track.duration !== '0:00') {
        const interval = setInterval(async () => {
          const currentQueue = this.player.nodes.get(queue.guild.id);
          if (!currentQueue?.isPlaying()) {
            stopUpdateInterval(queue.guild.id);
            return;
          }
          const newPayload = getControllerPayload(currentQueue);
          const controllerMessage = activeController.get(queue.guild.id);
          if (controllerMessage) {
            await controllerMessage.edit(newPayload).catch(() => stopUpdateInterval(queue.guild.id));
          } else {
            stopUpdateInterval(queue.guild.id);
          }
        }, 1000); // Update every 1 seconds
        updateIntervals.set(queue.guild.id, interval);
      } else {
        stopUpdateInterval(queue.guild.id);
      }
    });

    this.player.events.on('playerFinish', (queue: GuildQueue, track: Track) => {
      logger.info(
        {
          guild: queue.guild.id,
          track: track.title,
        },
        'EVENT: playerFinish',
      );
      // Interval will be stopped by emptyQueue or the next playerStart
    });

    this.player.events.on('disconnect', (queue: GuildQueue) => {
      logger.info({ guild: queue.guild.id }, 'EVENT: disconnect');
      stopUpdateInterval(queue.guild.id);
      const controller = activeController.get(queue.guild.id);
      if (controller) {
        controller.delete().catch(() => {});
        activeController.delete(queue.guild.id);
      }
    });

    this.player.events.on('emptyChannel', (queue: GuildQueue) => {
      logger.info({ guild: queue.guild.id }, 'EVENT: emptyChannel');
    });

    this.player.events.on('emptyQueue', (queue: GuildQueue) => {
      logger.info({ guild: queue.guild.id }, 'EVENT: emptyQueue');
      stopUpdateInterval(queue.guild.id);
      const controller = activeController.get(queue.guild.id);
      if (controller) {
        controller.delete().catch(() => {});
        activeController.delete(queue.guild.id);
      }
    });

    this.player.events.on('error', (queue: GuildQueue, error: Error) => {
      logger.error({ guild: queue.guild.id, error: error }, 'EVENT: error');
    });
  }
}
