import { useEffect, useCallback, useRef } from 'react';
import { useBotStore } from '@/stores/useBotStore';
import webSocketService from '@/lib/ws';
import type { PlayerState } from 'discord-dashboard-shared';

interface PlayerSyncOptions {
  enableAutoSync?: boolean;
  syncInterval?: number;
  onStateChange?: (state: PlayerState) => void;
  onDiscordStatusUpdate?: (status: { playing: boolean; track?: string; position?: number }) => void;
}

interface PlayerCommandMessage {
  type: 'player_command';
  command: string;
  params?: Record<string, unknown>;
  timestamp: number;
  [key: string]: unknown;
}

interface PlayerStateRequestMessage {
  type: 'request_player_state';
  timestamp: number;
  [key: string]: unknown;
}

interface DiscordStatusRequestMessage {
  type: 'request_discord_status';
  timestamp: number;
  [key: string]: unknown;
}

export function usePlayerSync(options: PlayerSyncOptions = {}) {
  const {
    enableAutoSync = true,
    syncInterval = 1000, // 1 second
    onStateChange,
  } = options;

  const player = useBotStore((state) => state.player);
  const wsConnected = useBotStore((state) => state.wsConnected);
  const syncIntervalRef = useRef<number | null>(null);
  const lastSyncRef = useRef<number>(0);

  // Handle player state changes from WebSocket
  useEffect(() => {
    if (onStateChange) {
      onStateChange(player);
    }
  }, [player, onStateChange]);

  // Send player control commands with real-time feedback
  const sendPlayerCommand = useCallback(
    async (command: string, params?: Record<string, unknown>) => {
      try {
        // Send command via WebSocket for immediate feedback
        if (wsConnected) {
          const message: PlayerCommandMessage = {
            type: 'player_command',
            command,
            params,
            timestamp: Date.now(),
          };
          webSocketService.send(message);
        }

        // Also send via HTTP API for reliability
        const response = await fetch(`http://localhost:3000/api/player/${command}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params || {}),
        });

        if (!response.ok) {
          throw new Error(`Player command failed: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error(`Failed to send player command ${command}:`, error);
        throw error;
      }
    },
    [wsConnected],
  );

  // Request player state sync
  const requestSync = useCallback(() => {
    if (wsConnected) {
      const message: PlayerStateRequestMessage = {
        type: 'request_player_state',
        timestamp: Date.now(),
      };
      webSocketService.send(message);
    }
  }, [wsConnected]);

  // Auto-sync player state periodically
  useEffect(() => {
    if (!enableAutoSync || !wsConnected) {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
      return;
    }

    syncIntervalRef.current = setInterval(() => {
      const now = Date.now();
      // Only sync if we haven't synced recently and player is active
      if (now - lastSyncRef.current > syncInterval && player.status !== 'stopped') {
        requestSync();
        lastSyncRef.current = now;
      }
    }, syncInterval);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    };
  }, [enableAutoSync, wsConnected, syncInterval, requestSync, player.status]);

  // Handle Discord status mirroring
  const requestDiscordStatus = useCallback(() => {
    if (wsConnected) {
      const message: DiscordStatusRequestMessage = {
        type: 'request_discord_status',
        timestamp: Date.now(),
      };
      webSocketService.send(message);
    }
  }, [wsConnected]);

  // Enhanced player controls with real-time sync
  const playerControls = {
    play: useCallback(
      async (trackId?: string) => {
        return sendPlayerCommand('play', trackId ? { trackId } : undefined);
      },
      [sendPlayerCommand],
    ),

    pause: useCallback(async () => {
      return sendPlayerCommand('pause');
    }, [sendPlayerCommand]),

    resume: useCallback(async () => {
      return sendPlayerCommand('resume');
    }, [sendPlayerCommand]),

    stop: useCallback(async () => {
      return sendPlayerCommand('stop');
    }, [sendPlayerCommand]),

    next: useCallback(async () => {
      return sendPlayerCommand('next');
    }, [sendPlayerCommand]),

    previous: useCallback(async () => {
      return sendPlayerCommand('previous');
    }, [sendPlayerCommand]),

    seek: useCallback(
      async (seconds: number) => {
        return sendPlayerCommand('seek', { seconds });
      },
      [sendPlayerCommand],
    ),

    setVolume: useCallback(
      async (volume: number) => {
        return sendPlayerCommand('volume', { volume });
      },
      [sendPlayerCommand],
    ),

    toggleLoop: useCallback(async () => {
      return sendPlayerCommand('loop', { enabled: !player.loop });
    }, [sendPlayerCommand, player.loop]),

    shuffle: useCallback(async () => {
      return sendPlayerCommand('shuffle');
    }, [sendPlayerCommand]),

    addToQueue: useCallback(
      async (trackId: string) => {
        return sendPlayerCommand('queue/add', { trackId });
      },
      [sendPlayerCommand],
    ),

    removeFromQueue: useCallback(
      async (index: number) => {
        return sendPlayerCommand('queue/remove', { index });
      },
      [sendPlayerCommand],
    ),

    clearQueue: useCallback(async () => {
      return sendPlayerCommand('queue/clear');
    }, [sendPlayerCommand]),

    moveQueueItem: useCallback(
      async (fromIndex: number, toIndex: number) => {
        return sendPlayerCommand('queue/move', { fromIndex, toIndex });
      },
      [sendPlayerCommand],
    ),
  };

  // Connection status and sync utilities
  const syncStatus = {
    connected: wsConnected,
    lastSync: lastSyncRef.current,
    isAutoSyncing: enableAutoSync && wsConnected,
    requestSync,
    requestDiscordStatus,
  };

  return {
    player,
    playerControls,
    syncStatus,
    sendPlayerCommand,
  };
}

// Hook for Discord status mirroring
export function useDiscordStatusSync() {
  const wsConnected = useBotStore((state) => state.wsConnected);
  const player = useBotStore((state) => state.player);

  const requestDiscordStatus = useCallback(() => {
    if (wsConnected) {
      const message: DiscordStatusRequestMessage = {
        type: 'request_discord_status',
        timestamp: Date.now(),
      };
      webSocketService.send(message);
    }
  }, [wsConnected]);

  // Auto-request Discord status when player state changes
  useEffect(() => {
    if (wsConnected && player.track) {
      requestDiscordStatus();
    }
  }, [wsConnected, player.track, player.status, requestDiscordStatus]);

  return {
    requestDiscordStatus,
    connected: wsConnected,
  };
}

// Hook for comprehensive control builder
export function usePlayerControlBuilder() {
  const { playerControls, syncStatus } = usePlayerSync();
  const player = useBotStore((state) => state.player);

  // Helper functions for different play sources
  const sendSearchAndPlay = useCallback(
    async (query: string, options: { autoPlay?: boolean; addToQueue?: boolean; clearQueue?: boolean }) => {
      try {
        const response = await fetch('http://localhost:3000/api/player/search-and-play', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, ...options }),
        });
        return await response.json();
      } catch (error) {
        console.error('Search and play failed:', error);
        throw error;
      }
    },
    [],
  );

  const sendLocalFilePlay = useCallback(
    async (filePath: string, options: { autoPlay?: boolean; addToQueue?: boolean; clearQueue?: boolean }) => {
      try {
        const response = await fetch('http://localhost:3000/api/player/play-local', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filePath, ...options }),
        });
        return await response.json();
      } catch (error) {
        console.error('Local file play failed:', error);
        throw error;
      }
    },
    [],
  );

  const sendPlaylistPlay = useCallback(
    async (playlistUrl: string, options: { autoPlay?: boolean; addToQueue?: boolean; clearQueue?: boolean }) => {
      try {
        const response = await fetch('http://localhost:3000/api/player/play-playlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playlistUrl, ...options }),
        });
        return await response.json();
      } catch (error) {
        console.error('Playlist play failed:', error);
        throw error;
      }
    },
    [],
  );

  // Build comprehensive control object with all playback options
  const controlBuilder = useCallback(
    (
      options: {
        source?: 'search' | 'playlist' | 'local';
        query?: string;
        trackId?: string;
        filePath?: string;
        playlistUrl?: string;
        autoPlay?: boolean;
        addToQueue?: boolean;
        clearQueue?: boolean;
      } = {},
    ) => {
      const {
        source = 'search',
        query,
        trackId,
        filePath,
        playlistUrl,
        autoPlay = true,
        addToQueue = false,
        clearQueue = false,
      } = options;

      return {
        // Basic playback controls
        play: () => {
          if (trackId) {
            return playerControls.play(trackId);
          }
          if (source === 'search' && query) {
            return sendSearchAndPlay(query, { autoPlay, addToQueue, clearQueue });
          }
          if (source === 'local' && filePath) {
            return sendLocalFilePlay(filePath, { autoPlay, addToQueue, clearQueue });
          }
          if (source === 'playlist' && playlistUrl) {
            return sendPlaylistPlay(playlistUrl, { autoPlay, addToQueue, clearQueue });
          }
          return playerControls.play();
        },
        pause: playerControls.pause,
        resume: playerControls.resume,
        stop: playerControls.stop,
        next: playerControls.next,
        previous: playerControls.previous,

        // Advanced controls
        seek: playerControls.seek,
        setVolume: playerControls.setVolume,
        toggleLoop: playerControls.toggleLoop,
        shuffle: playerControls.shuffle,

        // Queue management
        addToQueue: playerControls.addToQueue,
        removeFromQueue: playerControls.removeFromQueue,
        clearQueue: playerControls.clearQueue,
        moveQueueItem: playerControls.moveQueueItem,

        // State information
        currentTrack: player.track,
        status: player.status,
        position: player.position,
        volume: player.volume,
        loop: player.loop,
        queue: player.queue,

        // Sync status
        syncStatus,
      };
    },
    [
      playerControls,
      player,
      syncStatus,
      sendSearchAndPlay,
      sendLocalFilePlay,
      sendPlaylistPlay,
    ],
  );

  return {
    controlBuilder,
    player,
    syncStatus,
  };
}
