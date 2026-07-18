import { Player, GuildQueue, Track, QueueRepeatMode } from 'discord-player';
import { PlayerState, Track as DashboardTrack } from 'discord-dashboard-shared';
import { enhancedLogger } from '../logger/logger';
import { LogLevel } from '../../types/logging';
import { WebSocketManager } from '../websocket';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

export interface ExtendedPlayerState extends PlayerState {
  guildId: string;
  history: DashboardTrack[];
  repeatMode: 'off' | 'track' | 'queue' | 'autoplay';
  shuffled: boolean;
  voiceChannelId?: string;
  textChannelId?: string;
  lastUpdated: number;
}

export interface QueueHistoryEntry {
  track: DashboardTrack;
  playedAt: number;
  requestedBy?: string;
}

export class PlayerStateManager {
  private player: Player;
  private wsManager?: WebSocketManager;
  private guildStates: Map<string, ExtendedPlayerState> = new Map();
  private queueHistory: Map<string, QueueHistoryEntry[]> = new Map();
  private positionIntervals: Map<string, NodeJS.Timeout> = new Map();
  private localFilesPath: string;

  constructor(player: Player, localFilesPath: string = 'uploads/audio') {
    this.player = player;
    this.localFilesPath = localFilesPath;
    this.initializeEventListeners();
  }

  public setWebSocketManager(wsManager: WebSocketManager): void {
    this.wsManager = wsManager;
  }

  private initializeEventListeners(): void {
    // Listen for player events to update state
    this.player.events.on('playerStart', (queue: GuildQueue, track: Track) => {
      this.updatePlayerState(queue.guild.id);
      this.addToHistory(queue.guild.id, track);
      this.startPositionBroadcast(queue.guild.id);
    });

    this.player.events.on('playerPause', (queue: GuildQueue) => {
      this.stopPositionBroadcast(queue.guild.id);
      this.updatePlayerState(queue.guild.id);
    });

    this.player.events.on('playerResume', (queue: GuildQueue) => {
      this.updatePlayerState(queue.guild.id);
      this.startPositionBroadcast(queue.guild.id);
    });

    this.player.events.on('playerFinish', (queue: GuildQueue) => {
      this.stopPositionBroadcast(queue.guild.id);
      this.updatePlayerState(queue.guild.id);
    });

    this.player.events.on('audioTrackAdd', (queue: GuildQueue) => {
      this.updatePlayerState(queue.guild.id);
    });

    this.player.events.on('audioTrackRemove', (queue: GuildQueue) => {
      this.updatePlayerState(queue.guild.id);
    });

    this.player.events.on('disconnect', (queue: GuildQueue) => {
      this.stopPositionBroadcast(queue.guild.id);
      this.updatePlayerState(queue.guild.id);
    });

    this.player.events.on('emptyQueue', (queue: GuildQueue) => {
      this.stopPositionBroadcast(queue.guild.id);
      this.updatePlayerState(queue.guild.id);
    });
  }

  /**
   * Start a 1-second interval that broadcasts *only* the current playback
   * position so the desktop UI can keep its progress bar in sync. Coarse
   * state (track, queue, volume, loop) is emitted via `updatePlayerState`
   * on discrete events - not on every tick.
   */
  private startPositionBroadcast(guildId: string): void {
    this.stopPositionBroadcast(guildId);
    const interval = setInterval(() => {
      const queue = this.player.nodes.get(guildId);
      if (!queue?.isPlaying()) {
        this.stopPositionBroadcast(guildId);
        return;
      }
      const positionMs = queue.node.getTimestamp()?.current?.value ?? 0;
      // Cache the latest position on our tracked state so polled reads stay fresh.
      const state = this.guildStates.get(guildId);
      if (state) {
        state.position = positionMs;
        state.lastUpdated = Date.now();
      }
      this.wsManager?.broadcastPlayerPosition({
        guildId,
        position: Math.floor(positionMs / 1000),
      });
    }, 1000);
    this.positionIntervals.set(guildId, interval);
  }

  private stopPositionBroadcast(guildId: string): void {
    const interval = this.positionIntervals.get(guildId);
    if (interval) {
      clearInterval(interval);
      this.positionIntervals.delete(guildId);
    }
  }

  public forceUpdate(guildId: string): void {
    this.updatePlayerState(guildId);
  }

  private updatePlayerState(guildId: string): void {
    try {
      const queue = this.player.nodes.get(guildId);
      const currentState = this.getPlayerState(guildId);

      if (!queue) {
        // No active queue - set to stopped state
        const stoppedState: ExtendedPlayerState = {
          ...currentState,
          guildId,
          status: 'stopped',
          track: null,
          position: 0,
          queue: [],
          currentIndex: -1,
          lastUpdated: Date.now(),
        };
        this.guildStates.set(guildId, stoppedState);
        this.broadcastStateUpdate(guildId, stoppedState);
        return;
      }

      const newState: ExtendedPlayerState = {
        guildId,
        status: this.getPlaybackStatus(queue),
        track: queue.currentTrack ? this.convertTrackToDashboard(queue.currentTrack) : null,
        position: queue.node.getTimestamp()?.current?.value || 0,
        volume: queue.node.volume,
        loop: queue.repeatMode !== QueueRepeatMode.OFF,
        queue: queue.tracks.data.map((track) => this.convertTrackToDashboard(track)),
        currentIndex: queue.currentTrack ? 0 : -1,
        history: currentState.history || [],
        repeatMode: this.convertRepeatMode(queue.repeatMode),
        shuffled: queue.isShuffling,
        voiceChannelId: queue.channel?.id,
        textChannelId: (queue.metadata as { channel?: { id?: string } })?.channel?.id,
        lastUpdated: Date.now(),
      };

      this.guildStates.set(guildId, newState);
      this.broadcastStateUpdate(guildId, newState);

      enhancedLogger.system(LogLevel.DEBUG, `Player state updated for guild ${guildId}`, {
        guildId,
        status: newState.status,
        trackTitle: newState.track?.title,
        queueLength: newState.queue.length,
      });
    } catch (error) {
      enhancedLogger.system(LogLevel.ERROR, `Failed to update player state for guild ${guildId}`, {
        guildId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private getPlaybackStatus(queue: GuildQueue): 'playing' | 'paused' | 'stopped' {
    if (!queue.currentTrack) return 'stopped';
    if (queue.node.isPaused()) return 'paused';
    if (queue.isPlaying()) return 'playing';
    return 'stopped';
  }

  private convertTrackToDashboard(track: Track): DashboardTrack {
    const isLocalFile = track.url.startsWith('file://') || !track.url.startsWith('http');

    return {
      id: track.id || uuidv4(),
      title: track.title,
      artist: track.author,
      duration: this.parseDurationToSeconds(track.duration),
      url: track.url,
      thumbnail: track.thumbnail,
      source: isLocalFile ? 'local' : 'online',
      filePath: isLocalFile ? this.normalizeFilePath(track.url) : undefined,
    };
  }

  /**
   * Normalize a local file path so it matches what the desktop Tauri scan produces.
   * Strips `file://` prefix and converts forward slashes to native OS separators.
   */
  private normalizeFilePath(rawPath: string): string {
    let p = rawPath;
    if (p.startsWith('file://')) {
      try {
        // Use URL API for correct decoding of percent-encoded chars
        p = decodeURIComponent(new URL(p).pathname);
      } catch {
        p = p.slice(7); // fallback: strip "file://"
      }
    }
    // On Windows, pathname may start with /D:/... - strip leading slash before drive letter
    if (/^\/[A-Za-z]:/.test(p)) {
      p = p.slice(1);
    }
    // Normalise to OS-native separators
    return path.normalize(p);
  }

  private parseDurationToSeconds(duration: string): number {
    if (!duration || duration === '0:00') return 0;

    const parts = duration.split(':').map(Number);
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1]; // mm:ss
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2]; // hh:mm:ss
    }
    return 0;
  }

  private convertRepeatMode(mode: QueueRepeatMode): 'off' | 'track' | 'queue' | 'autoplay' {
    switch (mode) {
      case QueueRepeatMode.OFF:
        return 'off';
      case QueueRepeatMode.TRACK:
        return 'track';
      case QueueRepeatMode.QUEUE:
        return 'queue';
      case QueueRepeatMode.AUTOPLAY:
        return 'autoplay';
      default:
        return 'off';
    }
  }

  private addToHistory(guildId: string, track: Track): void {
    const history = this.queueHistory.get(guildId) || [];
    const historyEntry: QueueHistoryEntry = {
      track: this.convertTrackToDashboard(track),
      playedAt: Date.now(),
      requestedBy: track.requestedBy?.id,
    };

    history.unshift(historyEntry);

    // Keep only last 50 tracks in history
    if (history.length > 50) {
      history.splice(50);
    }

    this.queueHistory.set(guildId, history);

    // Update the guild state with new history
    const currentState = this.guildStates.get(guildId);
    if (currentState) {
      currentState.history = history.map((entry) => entry.track);
      this.guildStates.set(guildId, currentState);
    }
  }

  private broadcastStateUpdate(guildId: string, state: ExtendedPlayerState): void {
    if (this.wsManager) {
      // Convert to the format the desktop UI expects.
      // The desktop store's PlayerState uses:
      //   isPlaying: boolean, currentTrack, position (seconds), duration (seconds),
      //   volume, loop ('off'|'track'|'queue'), queue
      // The bot's shared PlayerState uses:
      //   status ('playing'|'paused'|'stopped'), track, position (ms), loop (boolean)
      const desktopState = {
        guildId,
        isPlaying: state.status === 'playing',
        currentTrack: state.track
          ? {
              title: state.track.title,
              artist: state.track.artist,
              duration: state.track.duration,
              url: state.track.url,
              thumbnail: state.track.thumbnail,
              filePath: state.track.filePath,
              platform: state.track.source,
              fileName: state.track.filePath ? path.basename(state.track.filePath) : undefined,
            }
          : null,
        position: Math.floor(state.position / 1000), // ms → seconds
        duration: state.track?.duration ?? 0, // already in seconds from convertTrackToDashboard
        volume: state.volume,
        loop: state.repeatMode === 'track' ? 'track' : state.repeatMode === 'queue' ? 'queue' : 'off',
        queue: state.queue.map((t) => ({
          title: t.title,
          artist: t.artist,
          duration: t.duration,
          url: t.url,
          thumbnail: t.thumbnail,
          filePath: t.filePath,
          platform: t.source,
          fileName: t.filePath ? path.basename(t.filePath) : undefined,
        })),
      };

      // The desktop UI expects a different shape than the shared PlayerState type,
      // so we cast here. The desktop store spreads this directly into its own PlayerState.
      this.wsManager.broadcast({
        type: 'player_state',
        payload: desktopState,
      } as unknown as import('discord-dashboard-shared').WebSocketMessage);
    }
  }

  // Public API methods
  public getPlayerState(guildId: string): ExtendedPlayerState {
    return this.guildStates.get(guildId) || this.getDefaultState(guildId);
  }

  public getQueueHistory(guildId: string): QueueHistoryEntry[] {
    return this.queueHistory.get(guildId) || [];
  }

  public async addLocalFile(guildId: string, filePath: string, requestedBy?: string): Promise<boolean> {
    try {
      const queue = this.player.nodes.get(guildId);
      if (!queue) {
        throw new Error('No active queue found');
      }

      // Decode URL-encoded characters (%20 → space, etc.)
      let normalizedPath = decodeURIComponent(filePath);

      // Strip leading slash from Windows-style paths like /D:/Music/...
      // (browsers / Tauri produce these from file:// URLs)
      if (process.platform === 'win32' && /^\/[a-zA-Z]:/.test(normalizedPath)) {
        normalizedPath = normalizedPath.slice(1);
      }

      // Only resolve against localFilesPath when the path is relative
      const fullPath = path.isAbsolute(normalizedPath)
        ? path.normalize(normalizedPath)
        : path.resolve(this.localFilesPath, normalizedPath);

      // Verify file exists
      if (!fs.existsSync(fullPath)) {
        throw new Error(`Local file not found: ${fullPath}`);
      }

      // Create a proper file:// URL for the local file
      const fileUrl = 'file:///' + fullPath.replace(/\\/g, '/');

      // Search for the local file using discord-player
      const result = await this.player.search(fileUrl, {
        requestedBy: requestedBy ?? undefined,
      });

      if (!result || !result.tracks?.length) {
        throw new Error('Failed to load local file');
      }

      const track = result.tracks[0];

      if (!queue.isPlaying()) {
        await queue.node.play(track);
      } else {
        queue.addTrack(track);
      }

      enhancedLogger.system(LogLevel.INFO, `Local file added to queue: ${filePath}`, {
        guildId,
        filePath,
        requestedBy,
      });

      return true;
    } catch (error) {
      enhancedLogger.system(LogLevel.ERROR, `Failed to add local file to queue`, {
        guildId,
        filePath,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  public async seekTo(guildId: string, position: number): Promise<boolean> {
    try {
      const queue = this.player.nodes.get(guildId);
      if (!queue || !queue.currentTrack) {
        return false;
      }

      await queue.node.seek(position * 1000); // Convert to milliseconds
      this.updatePlayerState(guildId);
      return true;
    } catch (error) {
      enhancedLogger.system(LogLevel.ERROR, `Failed to seek in guild ${guildId}`, {
        guildId,
        position,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  public async setVolume(guildId: string, volume: number): Promise<boolean> {
    try {
      const queue = this.player.nodes.get(guildId);
      if (!queue) {
        return false;
      }

      queue.node.setVolume(Math.max(0, Math.min(100, volume)));
      this.updatePlayerState(guildId);
      return true;
    } catch (error) {
      enhancedLogger.system(LogLevel.ERROR, `Failed to set volume in guild ${guildId}`, {
        guildId,
        volume,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  public async setRepeatMode(guildId: string, mode: 'off' | 'track' | 'queue' | 'autoplay'): Promise<boolean> {
    try {
      const queue = this.player.nodes.get(guildId);
      if (!queue) {
        return false;
      }

      let discordMode: QueueRepeatMode;
      switch (mode) {
        case 'track':
          discordMode = QueueRepeatMode.TRACK;
          break;
        case 'queue':
          discordMode = QueueRepeatMode.QUEUE;
          break;
        case 'autoplay':
          discordMode = QueueRepeatMode.AUTOPLAY;
          break;
        default:
          discordMode = QueueRepeatMode.OFF;
          break;
      }

      queue.setRepeatMode(discordMode);
      this.updatePlayerState(guildId);
      return true;
    } catch (error) {
      enhancedLogger.system(LogLevel.ERROR, `Failed to set repeat mode in guild ${guildId}`, {
        guildId,
        mode,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  private getDefaultState(guildId: string): ExtendedPlayerState {
    return {
      guildId,
      status: 'stopped',
      track: null,
      position: 0,
      volume: 100,
      loop: false,
      queue: [],
      currentIndex: -1,
      history: [],
      repeatMode: 'off',
      shuffled: false,
      lastUpdated: Date.now(),
    };
  }

  // Cleanup method
  public cleanup(): void {
    for (const [guildId] of this.positionIntervals) {
      this.stopPositionBroadcast(guildId);
    }
    this.guildStates.clear();
    this.queueHistory.clear();
  }
}
