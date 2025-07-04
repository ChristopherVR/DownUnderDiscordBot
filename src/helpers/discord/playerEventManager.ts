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
  const embed = new EmbedBuilder().setColor('Random');

  const loopButton = new ButtonBuilder().setCustomId('loop').setLabel('🔁').setStyle(ButtonStyle.Secondary);
  switch (queue.repeatMode) {
    case QueueRepeatMode.TRACK:
      loopButton.setLabel('🔂').setStyle(ButtonStyle.Success);
      break;
    case QueueRepeatMode.QUEUE:
      loopButton.setLabel('🔁').setStyle(ButtonStyle.Success);
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
      new ButtonBuilder().setCustomId('skip').setLabel('⏩').setStyle(ButtonStyle.Primary).setDisabled(!track),
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
      logger(`EVENT: audioTrackAdd - GUILD: ${queue.guild.id} - TRACK: ${track.title}`).info();
    });

    this.player.events.on('audioTracksAdd', (queue: GuildQueue, tracks: Track[]) => {
      logger(`EVENT: audioTracksAdd - GUILD: ${queue.guild.id} - COUNT: ${tracks.length}`).info();
    });

    this.player.events.on('playerStart', async (queue: GuildQueue, track: Track) => {
      logger(`EVENT: playerStart - GUILD: ${queue.guild.id} - TRACK: ${track.title}`).info();
      const metadata = queue.metadata as { channel: TextChannel };
      if (!metadata.channel || !(metadata.channel instanceof TextChannel)) return;

      // Delete old controller if it exists
      const oldController = activeController.get(queue.guild.id);
      if (oldController) await oldController.delete().catch(() => {});
      stopUpdateInterval(queue.guild.id);

      const payload = getControllerPayload(queue);
      const message = await metadata.channel.send(payload);
      activeController.set(queue.guild.id, message);

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
      }
    });

    this.player.events.on('playerFinish', (queue: GuildQueue, track: Track) => {
      logger(`EVENT: playerFinish - GUILD: ${queue.guild.id} - TRACK: ${track.title}`).info();
      // Interval will be stopped by emptyQueue or the next playerStart
    });

    this.player.events.on('disconnect', (queue: GuildQueue) => {
      logger(`EVENT: disconnect - GUILD: ${queue.guild.id}`).info();
      stopUpdateInterval(queue.guild.id);
      const controller = activeController.get(queue.guild.id);
      if (controller) {
        controller.delete().catch(() => {});
        activeController.delete(queue.guild.id);
      }
    });

    this.player.events.on('emptyChannel', (queue: GuildQueue) => {
      logger(`EVENT: emptyChannel - GUILD: ${queue.guild.id}`).info();
    });

    this.player.events.on('emptyQueue', (queue: GuildQueue) => {
      logger(`EVENT: emptyQueue - GUILD: ${queue.guild.id}`).info();
      stopUpdateInterval(queue.guild.id);
      const controller = activeController.get(queue.guild.id);
      if (controller) {
        controller.delete().catch(() => {});
        activeController.delete(queue.guild.id);
        const metadata = queue.metadata as { channel: TextChannel };
        if (metadata.channel) {
          metadata.channel.send('✅ The queue is empty. Music session has ended!');
        }
      }
    });

    this.player.events.on('error', (queue: GuildQueue, error: Error) => {
      logger(`EVENT: error - GUILD: ${queue.guild.id}`, error).error();
    });
  }
}
