import { Player, GuildQueue, Track, QueueRepeatMode } from 'discord-player';
import { enhancedLogger } from '../logger/logger';
import { LogLevel, AuditEventType, AuditResult } from '../../types/logging';
import { GuildQueueEvent } from 'discord-player';

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  GuildTextBasedChannel,
  Message,
  PermissionFlagsBits,
  TextChannel,
} from 'discord.js';
import { PlayerStateManager } from '../status/playerStateManager';
import { WebSocketManager } from '../websocket';

/**
 * Guild-scoped registry for the per-guild controller Message and refresh
 * interval. Every method takes `guildId` as its first argument, so callers
 * cannot accidentally key on something else. Previously these were two
 * free-standing `Map` instances - safe only by convention.
 */
class GuildControllerRegistry {
  private controllers = new Map<string, Message>();
  private intervals = new Map<string, NodeJS.Timeout>();

  getController(guildId: string): Message | undefined {
    return this.controllers.get(guildId);
  }

  setController(guildId: string, message: Message): void {
    this.controllers.set(guildId, message);
  }

  hasController(guildId: string): boolean {
    return this.controllers.has(guildId);
  }

  deleteController(guildId: string): void {
    this.controllers.delete(guildId);
  }

  setInterval(guildId: string, interval: NodeJS.Timeout): void {
    this.clearInterval(guildId);
    this.intervals.set(guildId, interval);
  }

  clearInterval(guildId: string): void {
    const existing = this.intervals.get(guildId);
    if (existing) {
      clearInterval(existing);
      this.intervals.delete(guildId);
    }
  }
}

export const controllerRegistry = new GuildControllerRegistry();

const stopUpdateInterval = (guildId: string) => {
  controllerRegistry.clearInterval(guildId);
};

const cleanupControllerMessage = async (guildId: string) => {
  const controller = controllerRegistry.getController(guildId);
  if (!controller) return;

  let canManageMessages = true;
  if (controller.inGuild()) {
    const botUser = controller.client.user;
    const channel = controller.channel;

    if (!botUser || !('permissionsFor' in channel)) {
      canManageMessages = false;
    } else {
      canManageMessages = !!(channel as GuildTextBasedChannel)
        .permissionsFor(botUser)
        ?.has(PermissionFlagsBits.ManageMessages);
    }
  }

  if (canManageMessages) {
    await controller.delete().catch(() => {});
    controllerRegistry.deleteController(guildId);
    return;
  }

  const fallbackEmbed = new EmbedBuilder()
    .setColor('Red')
    .setTitle('Playback Ended')
    .setDescription('I do not have permission to remove the controller message in this channel.')
    .setFooter({ text: 'Grant Manage Messages so I can clean this up automatically.' });

  await controller.edit({ content: null, embeds: [fallbackEmbed], components: [] }).catch(() => {});
};

const logQueueState = (queue: GuildQueue, context: string) => {
  const currentTrack = queue.currentTrack;
  const timestamp = queue.node.getTimestamp();
  enhancedLogger.system(LogLevel.INFO, `Queue diagnostic (${context})`, {
    guildId: queue.guild.id,
    status: queue.node.isPaused() ? 'paused' : queue.isPlaying() ? 'playing' : 'idle',
    queueSize: queue.tracks.size,
    currentTrack: currentTrack
      ? {
          title: currentTrack.title,
          url: currentTrack.url,
          duration: currentTrack.duration,
        }
      : null,
    progress: timestamp?.current?.label ?? null,
    total: timestamp?.total?.label ?? null,
  });
};

const notifyPlaybackError = async (queue: GuildQueue, track: Track | null, error: Error) => {
  const metadata = queue.metadata as { channel?: TextChannel } | undefined;
  const channel = metadata?.channel;

  if (!channel || !(channel instanceof TextChannel)) return;

  const embed = new EmbedBuilder()
    .setColor('DarkRed')
    .setTitle('Playback Error')
    .setDescription(track ? `I couldn't play **${track.title}**.` : 'I ran into a playback error.')
    .addFields(
      { name: 'Guild', value: queue.guild.name, inline: true },
      { name: 'Channel', value: `<#${channel.id}>`, inline: true },
      { name: 'Reason', value: error.message || 'Unknown error', inline: false },
    )
    .setTimestamp(new Date());

  await channel.send({ embeds: [embed], components: [] }).catch(() => {});
};

/**
 * Build the controller (the ONLY message that has action buttons).
 */
export const getControllerPayload = (queue: GuildQueue) => {
  const track = queue.currentTrack;
  const embed = new EmbedBuilder().setColor('Red');

  const hasPrev = !!queue.history?.previousTrack;
  const hasNext = queue.tracks.size > 0 || !!queue.history?.nextTrack;
  const hasTrack = !!track;

  const loopButton = new ButtonBuilder().setCustomId('loop').setLabel('\uD83D\uDD01').setStyle(ButtonStyle.Secondary);
  switch (queue.repeatMode) {
    case QueueRepeatMode.TRACK:
      loopButton.setLabel('\uD83D\uDD02').setStyle(ButtonStyle.Success);
      break;
    case QueueRepeatMode.AUTOPLAY:
      loopButton.setLabel('\u25B6\uFE0F').setStyle(ButtonStyle.Success);
      break;
  }

  const components = [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('back').setLabel('\u23EA').setStyle(ButtonStyle.Primary).setDisabled(!hasPrev),
      new ButtonBuilder()
        .setCustomId('pause_resume')
        .setLabel('\u23EF\uFE0F')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(!hasTrack),
      new ButtonBuilder().setCustomId('skip').setLabel('\u23E9').setStyle(ButtonStyle.Primary).setDisabled(!hasNext),
      new ButtonBuilder()
        .setCustomId('stop')
        .setLabel('\u23F9\uFE0F')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(!hasTrack),
    ),
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('volume_down')
        .setLabel('\uD83D\uDD09')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!hasTrack),
      loopButton.setDisabled(!hasTrack),
      new ButtonBuilder()
        .setCustomId('queue')
        .setLabel('\uD83D\uDCDC')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!hasTrack),
      new ButtonBuilder()
        .setCustomId('volume_up')
        .setLabel('\uD83D\uDD0A')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!hasTrack),
    ),
  ];

  if (track) {
    embed
      .setTitle(track.title)
      .setThumbnail(track.thumbnail)
      .setAuthor({ name: `Now Playing in ${queue.channel?.name}` });

    if (track.url.startsWith('http')) {
      embed.setURL(track.url);
    }

    const fields: { name: string; value: string; inline: boolean; description?: string }[] = [
      { name: 'Author', value: track.author, inline: true },
      { name: 'Duration', value: track.duration, inline: true },
      { name: 'Requested by', value: track.requestedBy?.toString() ?? 'N/A', inline: true },
      { name: 'Queue Size', value: queue.tracks.size.toString(), inline: true },
      {
        name: 'Player',
        value: queue.node.isPaused() ? 'Paused' : queue.isPlaying() ? 'Playing' : 'Idle',
        inline: true,
      },
    ];

    const timestamp = queue.node.getTimestamp();
    fields.push({
      name: 'Progress',
      value: timestamp?.current?.label ?? '0:00',
      inline: false,
      description: 'Progress',
    });

    if (track.duration !== '0:00') {
      const bar = queue.node.createProgressBar();
      if (bar) fields.push({ name: 'Progress', value: bar, inline: false, description: 'Progress' });
    }

    embed.addFields(fields);
  } else {
    embed.setTitle('No song is currently playing.');
    embed.setDescription('The queue is empty. Use `/play` to add a song!');
  }

  return { embeds: [embed], components };
};

/**
 * Completed controller (no action buttons) to show after Stop.
 */
export const getCompletedControllerPayload = () => {
  const embed = new EmbedBuilder()
    .setColor('DarkButNotBlack')
    .setTitle('Playback Ended')
    .setDescription('The player has been stopped. Use `/play` to start again.')
    .setFooter({ text: 'Session complete' })
    .setTimestamp(new Date());
  return { embeds: [embed], components: [] as [] };
};

export class PlayerEventManager {
  private player: Player;
  private playerStateManager?: PlayerStateManager;

  constructor(player: Player) {
    this.player = player;
    this.attachEventListeners();
  }

  public setPlayerStateManager(playerStateManager: PlayerStateManager): void {
    this.playerStateManager = playerStateManager;
  }

  public setWebSocketManager(wsManager: WebSocketManager): void {
    if (this.playerStateManager) {
      this.playerStateManager.setWebSocketManager(wsManager);
    }
  }

  private attachEventListeners() {
    this.player.events.on(GuildQueueEvent.AudioTrackAdd, (queue: GuildQueue, track: Track) => {
      enhancedLogger.auditTrack(
        AuditEventType.TRACK_ADDED,
        track.requestedBy?.id || 'unknown',
        queue.guild.id,
        {
          title: track.title,
          url: track.url,
          duration: track.duration,
          author: track.author,
          thumbnail: track.thumbnail,
        },
        {
          username: track.requestedBy?.username || 'unknown',
          guildName: queue.guild.name,
          channelId: queue.channel?.id,
        },
      );

      this.playerStateManager?.forceUpdate(queue.guild.id);

      // Refresh controller immediately if it exists so Next enables
      const controller = controllerRegistry.getController(queue.guild.id);
      if (controller) controller.edit(getControllerPayload(queue)).catch(() => {});
    });

    this.player.events.on('audioTracksAdd', (queue: GuildQueue, tracks: Track[]) => {
      enhancedLogger.audit(LogLevel.INFO, `Multiple tracks added to queue: ${tracks.length} tracks`, {
        level: LogLevel.INFO,
        timestamp: new Date().toISOString(),
        userId: tracks[0]?.requestedBy?.id || 'unknown',
        guildId: queue.guild.id,
        channelId: queue.channel?.id,
        username: tracks[0]?.requestedBy?.username || 'unknown',
        action: 'tracks_added',
        trackCount: tracks.length,
      });

      const controller = controllerRegistry.getController(queue.guild.id);
      if (controller) controller.edit(getControllerPayload(queue)).catch(() => {});
    });

    this.player.events.on('playerStart', async (queue: GuildQueue, track: Track) => {
      enhancedLogger.auditTrack(
        AuditEventType.TRACK_PLAYED,
        track.requestedBy?.id || 'unknown',
        queue.guild.id,
        {
          title: track.title,
          url: track.url,
          duration: track.duration,
          author: track.author,
          thumbnail: track.thumbnail,
        },
        {
          username: track.requestedBy?.username || 'unknown',
          guildName: queue.guild.name,
          channelId: queue.channel?.id,
        },
      );

      this.playerStateManager?.forceUpdate(queue.guild.id);
      logQueueState(queue, 'playerStart');

      const metadata = queue.metadata as { channel: TextChannel } | undefined;
      const textChannel = metadata?.channel;
      if (!textChannel || !(textChannel instanceof TextChannel)) return;

      const payload = getControllerPayload(queue);
      const controller = controllerRegistry.getController(queue.guild.id);

      try {
        if (controller) {
          await controller.edit(payload);
        } else {
          const message = await textChannel.send(payload);
          controllerRegistry.setController(queue.guild.id, message);
        }
      } catch {
        const message = await textChannel.send(payload);
        controllerRegistry.setController(queue.guild.id, message);
      }

      if (track.duration !== '0:00') {
        const interval = setInterval(async () => {
          const currentQueue = this.player.nodes.get(queue.guild.id);
          if (!currentQueue?.isPlaying()) {
            stopUpdateInterval(queue.guild.id);
            return;
          }
          const newPayload = getControllerPayload(currentQueue);
          const controllerMessage = controllerRegistry.getController(queue.guild.id);
          if (controllerMessage) {
            await controllerMessage.edit(newPayload).catch(() => stopUpdateInterval(queue.guild.id));
          } else {
            stopUpdateInterval(queue.guild.id);
          }
        }, 1000);
        controllerRegistry.setInterval(queue.guild.id, interval);
      } else {
        stopUpdateInterval(queue.guild.id);
      }
    });

    this.player.events.on('playerFinish', (queue: GuildQueue, track: Track) => {
      enhancedLogger.audit(LogLevel.INFO, `Track finished playing: ${track.title}`, {
        level: LogLevel.INFO,
        timestamp: new Date().toISOString(),
        userId: track.requestedBy?.id || 'unknown',
        guildId: queue.guild.id,
        channelId: queue.channel?.id,
        username: track.requestedBy?.username || 'unknown',
        action: 'track_finished',
        track: track.title,
      });

      logQueueState(queue, 'playerFinish');
      this.playerStateManager?.forceUpdate(queue.guild.id);
      // Controller will progress to next via playerStart or be cleaned up by emptyQueue/disconnect.
    });

    this.player.events.on('disconnect', (queue: GuildQueue) => {
      enhancedLogger.auditEvent(
        AuditEventType.VOICE_LEFT,
        'system',
        queue.guild.id,
        { previousState: 'connected', newState: 'disconnected' },
        AuditResult.SUCCESS,
        { guildName: queue.guild.name, channelId: queue.channel?.id },
      );
      stopUpdateInterval(queue.guild.id);
      void cleanupControllerMessage(queue.guild.id);
    });

    this.player.events.on('emptyChannel', (queue: GuildQueue) => {
      enhancedLogger.system(LogLevel.INFO, 'Voice channel became empty', {
        guildId: queue.guild.id,
        channelId: queue.channel?.id,
        action: 'empty_channel',
      });
    });

    this.player.events.on('emptyQueue', (queue: GuildQueue) => {
      enhancedLogger.audit(LogLevel.INFO, 'Queue became empty', {
        level: LogLevel.INFO,
        timestamp: new Date().toISOString(),
        userId: 'system',
        guildId: queue.guild.id,
        channelId: queue.channel?.id,
        action: 'queue_empty',
      });
      stopUpdateInterval(queue.guild.id);
      void cleanupControllerMessage(queue.guild.id);
    });

    this.player.events.on('playerError', async (queue: GuildQueue, error: Error, track: Track) => {
      enhancedLogger.auditEvent(
        AuditEventType.ERROR_OCCURRED,
        'system',
        queue.guild.id,
        {
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
            code: (error as { code?: string }).code,
          },
          track: {
            title: track?.title,
            url: track?.url,
            duration: track?.duration,
            author: track?.author,
          },
        },
        AuditResult.FAILURE,
        { guildName: queue.guild.name, channelId: queue.channel?.id },
      );
      enhancedLogger.system(LogLevel.ERROR, 'Playback error occurred', {
        guildId: queue.guild.id,
        error: error.message,
        trackTitle: track?.title,
      });
      logQueueState(queue, 'playerError');
      await notifyPlaybackError(queue, track ?? null, error);
      stopUpdateInterval(queue.guild.id);
      void cleanupControllerMessage(queue.guild.id);
    });

    this.player.events.on('debug', (queue: GuildQueue | undefined, message: string) => {
      const guildId = queue?.guild?.id ?? 'unknown';
      enhancedLogger.system(LogLevel.DEBUG, 'Player debug message', { guildId, message });
    });

    this.player.events.on('error', (queue: GuildQueue, error: Error) => {
      enhancedLogger.auditEvent(
        AuditEventType.ERROR_OCCURRED,
        'system',
        queue.guild.id,
        {
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
            code: (error as { code?: string }).code,
          },
        },
        AuditResult.FAILURE,
        { guildName: queue.guild.name, channelId: queue.channel?.id },
      );
    });
  }
}
