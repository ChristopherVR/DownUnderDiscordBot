import { create } from 'zustand';
import { api, setAuthToken as setApiAuthToken, setAuthFailureHandler } from '@/lib/api';
import { wsService } from '@/lib/ws';
import { clientKind, startOAuth, botProcess } from '@/platform';
import type { BotRunStatus, LocalBotConfig, BotLogLine } from '@/platform';
import type { TrackMediaType, TrackPlatform } from 'discord-dashboard-shared';

export type PlaybackMode = 'bot' | 'local' | 'sync';

/**
 * Desktop-side Track view. Every field is optional because the desktop
 * enriches partial track metadata from multiple sources (search, WS updates,
 * local file scan). The shared `Track` in `discord-dashboard-shared` is the
 * bot-producer shape with stricter required fields - use that when receiving
 * data from the bot, convert to this shape for UI use.
 */
export interface Track {
  title: string;
  artist?: string;
  album?: string;
  duration?: number;
  url?: string;
  thumbnail?: string;
  platform?: TrackPlatform | string;
  filePath?: string;
  fileName?: string;
  requestedBy?: string;
  /** 'audio' or 'video' - indicates the source file type */
  mediaType?: TrackMediaType;
  /** Direct URL for video streaming (set when mediaType is 'video') */
  videoUrl?: string;
}

export interface StreamStatus {
  videoId: string;
  status: 'resolving' | 'fallback' | 'streaming' | 'error';
  client: 'ANDROID' | 'WEB' | 'yt-dlp';
  message?: string;
}

export interface PlayerState {
  isPlaying: boolean;
  currentTrack: Track | null;
  position: number;
  duration: number;
  volume: number;
  loop: 'off' | 'track' | 'queue';
  queue: Track[];
}

/** Per-guild player state received from bot via WebSocket. */
export interface GuildPlayerState extends PlayerState {
  guildId: string;
  guildName?: string;
  guildIcon?: string | null;
}

interface DiscordUser {
  id: string;
  username: string;
  discriminator?: string;
  avatar: string | null;
}

interface Guild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  botPresent: boolean;
}

interface BotConnection {
  host: string;
  port: number;
  connected: boolean;
  botOnline: boolean;
}

interface BotStore {
  // Bot integration (optional - the app works without it)
  botToken: string | null;
  botUser: DiscordUser | null;
  botConnecting: boolean;
  botError: string | null;
  connectToBot: (manualToken?: string) => Promise<void>;
  disconnectBot: () => void;
  restoreBotConnection: () => Promise<void>;

  // Guilds (only relevant when bot is connected)
  guilds: Guild[];
  guildsLoading: boolean;
  focusedGuildId: string | null;
  fetchGuilds: () => Promise<void>;
  focusGuild: (guildId: string | null) => void;

  // Connection
  connection: BotConnection;
  setConnection: (host: string, port: number) => void;
  connect: () => void;
  disconnect: () => void;

  // Bundled local bot sidecar (Tauri only - platform.canRunBotLocally)
  localBotStatus: BotRunStatus;
  localBotLogs: BotLogLine[];
  startLocalBot: (config: LocalBotConfig) => Promise<void>;
  stopLocalBot: () => Promise<void>;
  appendLocalBotLog: (line: BotLogLine) => void;

  // Playback mode: 'bot' (through Discord) or 'local' (through computer speakers)
  playbackMode: PlaybackMode;
  setPlaybackMode: (mode: PlaybackMode) => void;

  // Video preview toggle - when true and current track is a video, show the video player
  showVideoPreview: boolean;
  setShowVideoPreview: (show: boolean) => void;

  // Local audio/video element for local playback
  localAudio: HTMLAudioElement | HTMLVideoElement | null;

  // True from the moment a local track is requested until playback actually
  // starts - covers the (sometimes multi-second) stream-resolution gap on a
  // track's first play, when there's otherwise no feedback that anything
  // is happening.
  localPlaybackLoading: boolean;

  // Local playback queue (separate from bot queue)
  localQueue: Track[];

  // Local playback history (for previous-track support)
  localHistory: Track[];

  // Music folder paths for local library
  musicFolders: string[];
  addMusicFolder: (path: string) => void;
  removeMusicFolder: (path: string) => void;

  // Player state
  player: PlayerState;
  updatePlayerState: (state: Partial<PlayerState>) => void;

  // Per-guild bot player states (keyed by guildId)
  // Per-guild bot player states
  guildPlayers: Record<string, GuildPlayerState>;
  /** Which guild's player is displayed in the PlayerBar (bot mode). null = local */
  activePlayerGuildId: string | null;
  /** Cycle the PlayerBar to the next/previous active guild player */
  cycleActivePlayer: (direction: 'next' | 'prev') => void;
  /** Set a specific guild as the active player */
  setActivePlayerGuild: (guildId: string | null) => void;
  /** Get list of guild IDs that currently have active playback */
  getActiveGuildIds: () => string[];

  // Stream status (YouTube fallback / buffering indicator)
  streamStatus: StreamStatus | null;

  // Transfer local playback to a bot guild
  transferToBot: (guildId?: string) => Promise<void>;

  // Search
  searchResults: Track[];
  searchLoading: boolean;
  search: (query: string, platform?: string) => Promise<void>;
  searchLocalFiles: (query: string) => Promise<Track[]>;
  clearSearch: () => void;

  // Preview (inline audio preview in browser)
  previewTrack: Track | null;
  previewAudio: HTMLAudioElement | null;
  previewPlaying: boolean;
  startPreview: (track: Track) => void;
  stopPreview: () => void;

  // Explicit play targets (independent of playbackMode)
  playOnBot: (track: Track) => Promise<void>;
  playLocally: (track: Track) => Promise<void>;
  queueOnBot: (track: Track) => Promise<void>;
  queueLocally: (track: Track) => void;

  // Voice channel selection - when play needs a channel, this is set for UI to show modal
  pendingPlay: { query: string; platform?: string } | null;
  setPendingPlay: (p: { query: string; platform?: string } | null) => void;
  // When play-all on a playlist needs a voice channel, this holds the playlist id.
  pendingPlaylistPlay: string | null;
  setPendingPlaylistPlay: (id: string | null) => void;
  playWithVoiceChannel: (voiceChannelId: string) => Promise<void>;

  // Playlist actions - respects playbackMode
  playPlaylistById: (playlistId: string) => Promise<void>;

  // Sync-mode local counterparts - only start local playback once the bot
  // side has actually been issued (and, where possible, has actually begun
  // playing), rather than firing both blindly at the same instant. Shared
  // between play()/playPlaylistById() (no voice channel needed) and
  // playWithVoiceChannel() (channel picked after the fact).
  resolveAndPlayLocally: (query: string, platform?: string) => Promise<void>;
  playPlaylistLocally: (playlistId: string) => Promise<void>;

  // Actions
  play: (query: string, platform?: string) => Promise<void>;
  playTrackLocally: (track: Track) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  skip: () => Promise<void>;
  playPrevious: () => Promise<void>;
  seek: (position: number) => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  setLoop: (mode: string) => Promise<void>;
  addToQueue: (query: string, platform?: string) => Promise<void>;
  addTrackToLocalQueue: (track: Track) => void;
  removeFromQueue: (index: number) => Promise<void>;
  moveQueueTrack: (from: number, to: number) => Promise<void>;
  clearQueue: () => Promise<void>;
  shuffleQueue: () => Promise<void>;

  // Dashboard
  dashboard: DashboardData | null;
  dashboardLoading: boolean;
  fetchDashboard: () => Promise<void>;
  forceStopInstance: (instanceId: string) => Promise<void>;
  clearStaleInstances: () => Promise<void>;

  // Ping / Pong
  pingInstance: (instanceId?: string) => Promise<{
    success: boolean;
    targetInstanceId: string | null;
    responses: Array<{ instanceId: string; rttMs: number; nonce: string }>;
  }>;
}

export interface DashboardGuildPlayer {
  active: boolean;
  isPlaying: boolean;
  currentTrack: {
    title: string;
    artist: string;
    duration: string;
    thumbnail: string;
    url: string;
  } | null;
  queueSize: number;
  voiceChannelId: string | null;
  voiceChannelName: string | null;
}

export interface DashboardGuild {
  guildId: string;
  guildName: string;
  guildIcon: string | null;
  memberCount: number;
  player: DashboardGuildPlayer;
}

export interface DashboardInstanceGuild {
  guildId: string;
  guildName: string;
  isActiveForGuild: boolean;
}

export interface DashboardInstance {
  instanceId: string;
  hostname: string | null;
  pid: number | null;
  shardId: number | null;
  online: boolean;
  isActive: boolean;
  lastHeartbeat: number;
  uptimeSeconds: number | null;
  heartbeatStatus: string;
  forceStopped: boolean;
  guilds: DashboardInstanceGuild[];
}

export interface DashboardInstanceHealth {
  totalInstances: number;
  onlineInstances: number;
  guildsWithBots: number;
  lastUpdated: number;
}

export interface DashboardInstancesSection {
  thisInstanceId: string;
  health: DashboardInstanceHealth;
  list: DashboardInstance[];
}

export interface DashboardData {
  bot: {
    online: boolean;
    uptime: number;
    username: string | null;
    discriminator: string | null;
    avatar: string | null;
    id: string | null;
    guildCount: number;
    ping: number;
  };
  guilds: DashboardGuild[];
  instances: DashboardInstancesSection;
  websocket: {
    totalClients: number;
    activeClients: number;
    totalSubscriptions: number;
  };
}

const AUTH_TOKEN_KEY = 'downunder_auth_token';
const MUSIC_FOLDERS_KEY = 'downunder_music_folders';

/**
 * Poll (briefly) until the bot's guild player reports it has actually
 * started playing, or give up after `timeoutMs`.
 *
 * Sync mode used to fire the bot play request and local playback in the
 * same instant - but the bot side has to join voice, resolve the stream,
 * and start FFmpeg, while local playback (a browser <audio> element) can
 * start almost immediately. That gap is exactly what "sync" drifted by.
 * This doesn't guarantee sample-accurate sync (there's still WS latency
 * reporting the state change), but it closes the multi-second gap that
 * made the two audibly unrelated.
 */
async function waitForBotPlaybackStart(
  getState: () => Pick<BotStore, 'guildPlayers'>,
  guildId: string | null | undefined,
  timeoutMs = 6000,
): Promise<void> {
  if (!guildId) return;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (getState().guildPlayers[guildId]?.isPlaying) return;
    await new Promise((r) => setTimeout(r, 150));
  }
}

function loadMusicFolders(): string[] {
  try {
    const stored = localStorage.getItem(MUSIC_FOLDERS_KEY);
    return stored ? (JSON.parse(stored) as string[]) : [];
  } catch {
    return [];
  }
}

export const useBotStore = create<BotStore>((set, get) => ({
  // Bot integration state (optional)
  botToken: null,
  botUser: null,
  botConnecting: false,
  botError: null,

  // Guild state
  guilds: [],
  guildsLoading: false,
  focusedGuildId: null,

  // Playback mode - default to local (plays through computer speakers)
  playbackMode: 'local',
  localAudio: null,
  localPlaybackLoading: false,
  localQueue: [],
  localHistory: [],
  showVideoPreview: false,

  // Music folders
  musicFolders: loadMusicFolders(),

  connectToBot: async (manualToken?: string) => {
    set({ botConnecting: true, botError: null });

    try {
      if (manualToken) {
        // Manual token entry - validate it
        const userRes = await api.getUser(manualToken);
        localStorage.setItem(AUTH_TOKEN_KEY, manualToken);
        setApiAuthToken(manualToken);
        wsService.setAuthToken(manualToken);
        set({
          botToken: manualToken,
          botUser: userRes,
          botConnecting: false,
        });
        // Auto-connect WebSocket after authentication
        get().connect();
        return;
      }

      // Check if OAuth is configured on the bot
      const status = await api.getAuthStatus();

      if (status.oauthConfigured) {
        // Full OAuth flow.
        //   Tauri: open the auth URL externally; the token comes back via the
        //     deep-link listener registered in App.tsx.
        //   Web: navigate the current tab; the token comes back via the
        //     /auth/callback SPA route.
        const kind = clientKind();
        const origin = kind === 'web' ? window.location.origin : undefined;
        const { url } = await api.getAuthUrl(kind, origin);
        await startOAuth(url);
        set({ botConnecting: false });
      } else {
        // Quick connect - no OAuth needed, connect directly to bot
        const result = await api.quickConnect();
        localStorage.setItem(AUTH_TOKEN_KEY, result.token);
        setApiAuthToken(result.token);
        wsService.setAuthToken(result.token);
        set({
          botToken: result.token,
          botUser: result.bot
            ? { id: result.bot.id, username: result.bot.username, avatar: result.bot.avatar }
            : { id: 'bot', username: 'Bot', avatar: null },
          guilds: result.guilds.map((g) => ({ ...g, owner: false, botPresent: true })),
          botConnecting: false,
        });
        // Auto-connect WebSocket after authentication
        get().connect();
      }
    } catch (err) {
      set({
        botError: err instanceof Error ? err.message : 'Failed to connect to bot. Is it running?',
        botConnecting: false,
      });
    }
  },

  disconnectBot: () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setApiAuthToken(null);
    wsService.setAuthToken(null);
    get().disconnect();
    set({
      botToken: null,
      botUser: null,
      guilds: [],
      focusedGuildId: null,
      connection: { ...get().connection, connected: false, botOnline: false },
    });
  },

  restoreBotConnection: async () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) return;

    // Set the token on api + ws BEFORE we call any endpoints, so /api/auth/user
    // itself is authenticated on the first call.
    setApiAuthToken(token);
    wsService.setAuthToken(token);

    try {
      const user = await api.getUser(token);
      set({ botToken: token, botUser: user });

      // Also restore guilds
      if (get().guilds.length === 0) {
        try {
          const { guilds } = await api.getGuilds(token);
          set({ guilds });

          // If there's a saved focused guild, restore it
          const savedGuildId = localStorage.getItem('downunder_focused_guild');
          if (savedGuildId && guilds.some((g) => g.id === savedGuildId)) {
            set({ focusedGuildId: savedGuildId });
          }
        } catch {
          // Guilds fetch failed - not critical
        }
      }

      // Auto-connect WebSocket after restoring session
      get().connect();
    } catch {
      // Token expired - clear it silently
      localStorage.removeItem(AUTH_TOKEN_KEY);
      setApiAuthToken(null);
      wsService.setAuthToken(null);
    }
  },

  fetchGuilds: async () => {
    const { botToken, guilds: existingGuilds } = get();
    if (!botToken) return;
    // If guilds are already loaded (e.g. from quick-connect), skip the fetch
    if (existingGuilds.length > 0) return;

    set({ guildsLoading: true });
    try {
      const { guilds } = await api.getGuilds(botToken);
      set({ guilds, guildsLoading: false });
    } catch {
      set({ guilds: [], guildsLoading: false });
    }
  },

  focusGuild: (guildId: string | null) => {
    set({ focusedGuildId: guildId });
    if (guildId) {
      localStorage.setItem('downunder_focused_guild', guildId);
    } else {
      localStorage.removeItem('downunder_focused_guild');
    }
  },

  // Connection
  connection: {
    host: 'localhost',
    port: 3000,
    connected: false,
    botOnline: false,
  },

  localBotStatus: { state: 'stopped' },
  localBotLogs: [],

  player: {
    isPlaying: false,
    currentTrack: null,
    position: 0,
    duration: 0,
    volume: 50,
    loop: 'off',
    queue: [],
  },

  // Per-guild bot player states
  guildPlayers: {},
  activePlayerGuildId: null,

  // Stream status
  streamStatus: null,

  searchResults: [],
  searchLoading: false,

  // Preview
  previewTrack: null,
  previewAudio: null,
  previewPlaying: false,

  // Dashboard
  dashboard: null,
  dashboardLoading: false,

  fetchDashboard: async () => {
    // Guard against overlapping requests - the dashboard poll fires every
    // 10s, but a single request can legitimately take longer than that
    // (Discord API round-trips). Without this guard, requests pile up
    // faster than they drain and each new one queues behind all the
    // previous ones, making load times grow without bound.
    if (get().dashboardLoading) return;
    set({ dashboardLoading: true });
    try {
      const data = await api.getDashboard();
      set({ dashboard: data, dashboardLoading: false });
    } catch {
      set({ dashboardLoading: false });
    }
  },

  forceStopInstance: async (instanceId: string) => {
    try {
      await api.forceStopInstance(instanceId);
      // Refresh dashboard to reflect the updated state
      await get().fetchDashboard();
    } catch (err) {
      console.error('Failed to force-stop instance:', err);
    }
  },

  clearStaleInstances: async () => {
    try {
      await api.clearStaleInstances();
      // Refresh dashboard to reflect the updated state
      await get().fetchDashboard();
    } catch (err) {
      console.error('Failed to clear stale instances:', err);
    }
  },

  pingInstance: async (instanceId?: string) => {
    try {
      return await api.pingInstance(instanceId);
    } catch (err) {
      console.error('Ping failed:', err);
      return { success: false, targetInstanceId: instanceId ?? null, responses: [] };
    }
  },

  // --- Per-guild player cycling ---
  getActiveGuildIds: () => {
    const gp = get().guildPlayers;
    return Object.keys(gp).filter((id) => gp[id].isPlaying || gp[id].currentTrack);
  },

  setActivePlayerGuild: (guildId: string | null) => {
    set({ activePlayerGuildId: guildId });
    if (guildId) {
      const gp = get().guildPlayers[guildId];
      if (gp) {
        // Sync the visible player state with the selected guild's state
        const { guildId: _g, guildName: _n, guildIcon: _i, ...playerOnly } = gp;
        set({ player: playerOnly });
      }
    }
  },

  cycleActivePlayer: (direction: 'next' | 'prev') => {
    const activeIds = get().getActiveGuildIds();
    if (activeIds.length === 0) return;

    const current = get().activePlayerGuildId;
    const idx = current ? activeIds.indexOf(current) : -1;

    let nextIdx: number;
    if (direction === 'next') {
      nextIdx = idx < 0 ? 0 : (idx + 1) % activeIds.length;
    } else {
      nextIdx = idx <= 0 ? activeIds.length - 1 : idx - 1;
    }

    get().setActivePlayerGuild(activeIds[nextIdx]);
  },

  // --- Transfer local playback to bot ---
  transferToBot: async (_guildId?: string) => {
    const { player } = get();
    if (!player.currentTrack) return;

    // Delegate to setPlaybackMode('bot'), which already stops local audio,
    // clears local playback state, and queues the current track as a
    // handoff via pendingPlay (opening the voice-channel picker). This
    // function used to duplicate only the pendingPlay part, which is why
    // local audio kept playing after "To Bot" and the mode pill never
    // flipped to Bot/Sync.
    get().setPlaybackMode('bot');
  },

  setPlaybackMode: (mode: PlaybackMode) => {
    const { playbackMode: current, localAudio, player } = get();
    if (mode === current) return;

    // When switching FROM local-only to bot-only, stop local audio and
    // hand off the current track to the bot. The voice-channel picker
    // opens via pendingPlay so the user chooses where to resume.
    if (current === 'local' && mode === 'bot' && localAudio) {
      const currentTrack = player.currentTrack;
      const handoffQuery = currentTrack ? (currentTrack.filePath ?? currentTrack.url ?? currentTrack.title) : null;

      localAudio.pause();
      localAudio.removeAttribute('src');
      localAudio.load();
      set({
        localAudio: null,
        localQueue: [],
        localHistory: [],
        player: {
          ...player,
          isPlaying: false,
          currentTrack: null,
          position: 0,
          queue: [],
        },
        ...(handoffQuery ? { pendingPlay: { query: handoffQuery, platform: currentTrack?.platform } } : {}),
      });
    }

    // When switching FROM bot-only to local-only, keep local audio (if any)
    // When switching TO sync, keep everything running

    set({ playbackMode: mode });

    // When switching TO bot or sync mode, restore player state from active guild player
    if (mode === 'bot') {
      const { activePlayerGuildId, guildPlayers } = get();
      const gp = activePlayerGuildId ? guildPlayers[activePlayerGuildId] : null;
      if (gp) {
        const { guildId: _g, guildName: _n, guildIcon: _i, ...playerOnly } = gp;
        set({ player: playerOnly });
      } else {
        // No active guild yet - auto-select the first one that has a track
        const activeIds = get().getActiveGuildIds();
        if (activeIds.length > 0) {
          get().setActivePlayerGuild(activeIds[0]);
        }
      }
    }
  },
  setShowVideoPreview: (show: boolean) => set({ showVideoPreview: show }),

  addMusicFolder: (path: string) => {
    const folders = [...get().musicFolders.filter((f) => f !== path), path];
    localStorage.setItem(MUSIC_FOLDERS_KEY, JSON.stringify(folders));
    set({ musicFolders: folders });
  },

  removeMusicFolder: (path: string) => {
    const folders = get().musicFolders.filter((f) => f !== path);
    localStorage.setItem(MUSIC_FOLDERS_KEY, JSON.stringify(folders));
    set({ musicFolders: folders });
  },

  setConnection: (host, port) => set((s) => ({ connection: { ...s.connection, host, port } })),

  appendLocalBotLog: (line) => set((s) => ({ localBotLogs: [...s.localBotLogs, line].slice(-500) })),

  startLocalBot: async (config) => {
    set({ localBotStatus: { state: 'starting' } });
    try {
      await botProcess.saveConfig(config);
      const result = await botProcess.start();
      if (result?.state === 'running') {
        set({ localBotStatus: result });
        // Once the local bot reports a live port, the existing connect flow
        // (including its automatic quick-connect fallback) just works.
        get().setConnection('localhost', result.port);
        get().connect();
        get().connectToBot();
      } else {
        set({ localBotStatus: result ?? { state: 'stopped' } });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start the local bot';
      set({ localBotStatus: { state: 'crashed', message } });
      import('./useToastStore').then(({ toast }) => toast.error(message));
    }
  },

  stopLocalBot: async () => {
    await botProcess.stop();
    set({ localBotStatus: { state: 'stopped' } });
  },

  connect: () => {
    const { host, port } = get().connection;
    const token = get().botToken;
    wsService.connect(host, port, token);

    wsService.on('connection', (data: unknown) => {
      const { connected } = data as { connected: boolean };
      set((s) => ({ connection: { ...s.connection, connected } }));
    });

    wsService.on('player_state', (data: unknown) => {
      const state = data as Partial<PlayerState> & { guildId?: string };
      const guildId = state.guildId;

      if (guildId) {
        // Per-guild state update - store in guildPlayers
        const { guildId: _gid, ...playerFields } = state;
        const guilds = get().guilds;
        const guildInfo = guilds.find((g) => g.id === guildId);

        set((s) => {
          const prev = s.guildPlayers[guildId] ?? {
            isPlaying: false,
            currentTrack: null,
            position: 0,
            duration: 0,
            volume: 50,
            loop: 'off' as const,
            queue: [],
            guildId,
          };
          const updated: GuildPlayerState = {
            ...prev,
            ...playerFields,
            guildId,
            guildName: guildInfo?.name ?? prev.guildName,
            guildIcon: guildInfo?.icon ?? prev.guildIcon,
          };

          const newGuildPlayers = { ...s.guildPlayers, [guildId]: updated };

          // If no active guild set yet and this one is playing, auto-select it
          let newActiveId = s.activePlayerGuildId;
          if (!newActiveId && updated.isPlaying) {
            newActiveId = guildId;
          }

          // If this guild is the active one in the player bar, also sync the visible player
          const syncPlayer = (s.playbackMode === 'bot' || s.playbackMode === 'sync') && newActiveId === guildId;

          return {
            guildPlayers: newGuildPlayers,
            activePlayerGuildId: newActiveId,
            ...(syncPlayer ? { player: { ...s.player, ...playerFields } } : {}),
          };
        });
      } else {
        // Legacy: no guildId in payload, update global player directly
        set((s) => ({ player: { ...s.player, ...state } }));
      }
    });

    wsService.on('player_position', (data: unknown) => {
      const payload = data as { guildId?: string; position?: number };
      const { guildId, position } = payload;
      if (typeof position !== 'number') return;

      if (guildId) {
        set((s) => {
          const prev = s.guildPlayers[guildId];
          if (!prev) return {};
          const updated = { ...prev, position };
          const newGuildPlayers = { ...s.guildPlayers, [guildId]: updated };
          const syncPlayer =
            (s.playbackMode === 'bot' || s.playbackMode === 'sync') && s.activePlayerGuildId === guildId;
          return {
            guildPlayers: newGuildPlayers,
            ...(syncPlayer ? { player: { ...s.player, position } } : {}),
          };
        });
      } else {
        set((s) => ({ player: { ...s.player, position } }));
      }
    });

    wsService.on('queue_update', (data: unknown) => {
      const payload = data as { queue: Track[]; guildId?: string };
      const guildId = payload.guildId;

      if (guildId) {
        set((s) => {
          const prev = s.guildPlayers[guildId];
          if (!prev) return {};
          const updated = { ...prev, queue: payload.queue };
          const newGuildPlayers = { ...s.guildPlayers, [guildId]: updated };
          const syncPlayer =
            (s.playbackMode === 'bot' || s.playbackMode === 'sync') && s.activePlayerGuildId === guildId;
          return {
            guildPlayers: newGuildPlayers,
            ...(syncPlayer ? { player: { ...s.player, queue: payload.queue } } : {}),
          };
        });
      } else {
        set((s) => ({ player: { ...s.player, queue: payload.queue } }));
      }
    });

    wsService.on('track_started', (data: unknown) => {
      const payload = data as Track & { guildId?: string };
      const guildId = payload.guildId;
      const { guildId: _gid, ...track } = payload;

      if (guildId) {
        set((s) => {
          const prev = s.guildPlayers[guildId];
          const updated: GuildPlayerState = {
            ...(prev ?? {
              isPlaying: false,
              currentTrack: null,
              position: 0,
              duration: 0,
              volume: 50,
              loop: 'off' as const,
              queue: [],
              guildId,
            }),
            currentTrack: track,
            isPlaying: true,
            position: 0,
            guildId,
          };
          const newGuildPlayers = { ...s.guildPlayers, [guildId]: updated };

          let newActiveId = s.activePlayerGuildId;
          if (!newActiveId) newActiveId = guildId;

          const syncPlayer = (s.playbackMode === 'bot' || s.playbackMode === 'sync') && newActiveId === guildId;
          return {
            guildPlayers: newGuildPlayers,
            activePlayerGuildId: newActiveId,
            ...(syncPlayer ? { player: { ...s.player, currentTrack: track, isPlaying: true, position: 0 } } : {}),
          };
        });
      } else {
        set((s) => ({
          player: { ...s.player, currentTrack: payload as Track, isPlaying: true, position: 0 },
        }));
      }
    });

    wsService.on('bot_status', (data: unknown) => {
      const { online } = data as { online: boolean };
      set((s) => ({ connection: { ...s.connection, botOnline: online } }));
    });

    wsService.on('stream_status', (data: unknown) => {
      const status = data as StreamStatus;
      // Clear the status once streaming has started or errored
      if (status.status === 'streaming') {
        set({ streamStatus: null });
      } else {
        set({ streamStatus: status });
      }
    });
  },

  disconnect: () => {
    wsService.disconnect();
    set((s) => ({ connection: { ...s.connection, connected: false } }));
  },

  updatePlayerState: (state) => set((s) => ({ player: { ...s.player, ...state } })),

  searchLocalFiles: async (query: string): Promise<Track[]> => {
    const { musicFolders } = get();
    if (musicFolders.length === 0) return [];
    const { libraryPlatform } = await import('@/platform');
    const allTracks: Track[] = [];
    const lowerQuery = query.toLowerCase();
    for (const folder of musicFolders) {
      try {
        const tracks = await libraryPlatform.scanFolder(folder);
        for (const t of tracks) {
          if (
            t.title.toLowerCase().includes(lowerQuery) ||
            t.artist.toLowerCase().includes(lowerQuery) ||
            (t.album ?? '').toLowerCase().includes(lowerQuery) ||
            t.file_name.toLowerCase().includes(lowerQuery)
          ) {
            allTracks.push({
              title: t.title,
              artist: t.artist,
              album: t.album ?? undefined,
              duration: t.duration,
              filePath: t.file_path,
              fileName: t.file_name,
              platform: 'local',
              mediaType: (t.media_type as 'audio' | 'video') ?? 'audio',
            });
          }
        }
      } catch {
        // Individual folder scan failed
      }
    }
    return allTracks;
  },

  search: async (query, platform) => {
    set({ searchLoading: true });
    try {
      const localOnly = platform === 'local';
      const includeLocal = !platform || platform === 'auto' || platform === 'local';

      // Search online sources (skip if local-only)
      let onlineTracks: Track[] = [];
      if (!localOnly) {
        try {
          const result = await api.search(query, platform);
          const raw = (result.data?.tracks ?? []) as Array<Record<string, unknown>>;
          onlineTracks = raw.map((t) => ({
            title: (t.title as string) ?? 'Unknown',
            artist: (t.artist as string) ?? (t.author as string) ?? undefined,
            duration: (t.duration as number) ?? undefined,
            url: (t.url as string) ?? undefined,
            thumbnail: (t.thumbnail as string) ?? (t.cover as string) ?? undefined,
            platform: (t.platform as string) ?? platform ?? 'auto',
          }));
        } catch {
          // Online search failed, continue with local
        }
      }

      // Search local files
      let localTracks: Track[] = [];
      if (includeLocal) {
        localTracks = await get().searchLocalFiles(query);
      }

      // Merge: local results first, then online
      const tracks = [...localTracks, ...onlineTracks];
      set({ searchResults: tracks, searchLoading: false });
    } catch {
      set({ searchResults: [], searchLoading: false });
    }
  },

  clearSearch: () => set({ searchResults: [] }),

  startPreview: (track: Track) => {
    const { previewAudio: existing } = get();
    // Stop any existing preview
    if (existing) {
      existing.pause();
      existing.removeAttribute('src');
      existing.load();
    }

    let streamUrl: string;
    if (track.filePath && track.platform === 'local') {
      streamUrl = api.getLocalStreamUrl(track.filePath);
    } else if (track.url) {
      streamUrl = api.getStreamUrl(track.url);
    } else {
      return;
    }

    const audio = new Audio(streamUrl);
    audio.volume = 0.5;
    audio.addEventListener('ended', () => {
      set({ previewTrack: null, previewAudio: null, previewPlaying: false });
    });
    audio.play().catch(() => {
      /* autoplay may be blocked */
    });
    set({ previewTrack: track, previewAudio: audio, previewPlaying: true });
  },

  stopPreview: () => {
    const { previewAudio } = get();
    if (previewAudio) {
      previewAudio.pause();
      previewAudio.removeAttribute('src');
      previewAudio.load();
    }
    set({ previewTrack: null, previewAudio: null, previewPlaying: false });
  },

  playOnBot: async (track: Track) => {
    const { focusedGuildId } = get();
    const query = track.url ?? track.title;
    try {
      const result = await api.play(query, track.platform, undefined, focusedGuildId ?? undefined);
      if (result?.requiresVoiceChannel) {
        set({ pendingPlay: { query, platform: track.platform } });
      } else if (result?.success) {
        const { toast } = await import('./useToastStore');
        toast.success(`Now playing: ${track.title}`);
      }
    } catch {
      const { toast } = await import('./useToastStore');
      toast.error('Failed to play on bot');
    }
  },

  playLocally: async (track: Track) => {
    await get().playTrackLocally(track);
  },

  queueOnBot: async (track: Track) => {
    const { focusedGuildId } = get();
    try {
      await api.addToQueue(track.url ?? track.title, track.platform, focusedGuildId ?? undefined);
      const { toast } = await import('./useToastStore');
      toast.success('Added to queue');
    } catch {
      const { toast } = await import('./useToastStore');
      toast.error('Failed to add to queue');
    }
  },

  queueLocally: (track: Track) => {
    get().addTrackToLocalQueue(track);
    import('./useToastStore').then(({ toast }) => toast.success('Added to queue'));
  },

  pendingPlay: null,
  setPendingPlay: (p) => set({ pendingPlay: p }),

  pendingPlaylistPlay: null,
  setPendingPlaylistPlay: (id) => set({ pendingPlaylistPlay: id }),

  playWithVoiceChannel: async (voiceChannelId: string) => {
    const { pendingPlay, pendingPlaylistPlay, focusedGuildId, playbackMode } = get();
    // Playlist takes precedence if both happen to be set.
    if (pendingPlaylistPlay) {
      set({ pendingPlaylistPlay: null });
      try {
        await api.playPlaylist(pendingPlaylistPlay, focusedGuildId ?? undefined, voiceChannelId);
        if (playbackMode === 'sync') {
          // The channel pick is done - the bot side is now actually being
          // issued, so start local now instead of back when play() first
          // fired (which is what left local running far ahead of the bot).
          await waitForBotPlaybackStart(get, focusedGuildId);
          await get().playPlaylistLocally(pendingPlaylistPlay);
        }
      } catch {
        /* handled by WS updates */
      }
      return;
    }
    if (!pendingPlay) return;
    set({ pendingPlay: null });
    try {
      await api.play(pendingPlay.query, pendingPlay.platform, voiceChannelId, focusedGuildId ?? undefined);
      if (playbackMode === 'sync') {
        await waitForBotPlaybackStart(get, focusedGuildId);
        await get().resolveAndPlayLocally(pendingPlay.query, pendingPlay.platform);
      }
    } catch {
      /* handled by WS updates */
    }
  },

  // Load a playlist's tracks and play the first one locally, staging the
  // rest in the local queue. Shared by the 'local' path and both sync-mode
  // paths (immediate, and deferred until after a voice-channel pick).
  playPlaylistLocally: async (playlistId: string) => {
    try {
      const detail = await api.getPlaylist(playlistId);
      const items = detail.data?.tracks ?? [];
      if (items.length === 0) {
        const { toast } = await import('./useToastStore');
        toast.error('Playlist is empty');
        return;
      }
      const tracks: Track[] = items.map((t) => ({
        title: t.title,
        artist: t.artist ?? undefined,
        duration: t.duration || undefined,
        url: t.url,
        thumbnail: t.thumbnail ?? undefined,
        platform: t.platform,
      }));
      // Reset local queue and stage the rest.
      set({ localQueue: tracks.slice(1) });
      await get().playTrackLocally(tracks[0]);
    } catch {
      const { toast } = await import('./useToastStore');
      toast.error('Failed to load playlist');
    }
  },

  playPlaylistById: async (playlistId: string) => {
    const { playbackMode, focusedGuildId } = get();

    if (playbackMode === 'local') {
      await get().playPlaylistLocally(playlistId);
      return;
    }

    if (playbackMode === 'sync') {
      try {
        const result = await api.playPlaylist(playlistId, focusedGuildId ?? undefined);
        if (result?.requiresVoiceChannel) {
          // Bot hasn't joined a channel yet - defer local playback until
          // playWithVoiceChannel() actually issues bot playback, instead of
          // starting local now and leaving the bot to catch up whenever the
          // user finishes picking a channel (that gap is what "sync" drifted by).
          set({ pendingPlaylistPlay: playlistId });
          return;
        }
        await waitForBotPlaybackStart(get, focusedGuildId);
      } catch {
        /* handled by WS */
      }
      await get().playPlaylistLocally(playlistId);
      return;
    }

    // Bot mode
    try {
      const result = await api.playPlaylist(playlistId, focusedGuildId ?? undefined);
      if (result?.requiresVoiceChannel) {
        set({ pendingPlaylistPlay: playlistId });
      } else if (result?.success) {
        const { toast } = await import('./useToastStore');
        toast.success(`Queued ${result.data?.tracksQueued ?? 0} tracks`);
      } else if (result?.error) {
        const { toast } = await import('./useToastStore');
        toast.error(result.error);
      }
    } catch {
      const { toast } = await import('./useToastStore');
      toast.error('Failed to play playlist');
    }
  },

  // Resolve a query (search result or local file path) into a Track and
  // play it locally. Shared by the 'local' path and both sync-mode paths
  // (immediate, and deferred until after a voice-channel pick).
  resolveAndPlayLocally: async (query: string, platform?: string) => {
    if (platform === 'local') {
      const track: Track = {
        title: query.split(/[\\/]/).pop() ?? query,
        artist: 'Local File',
        filePath: query,
        platform: 'local',
      };
      await get().playTrackLocally(track);
      return;
    }
    try {
      const result = await api.search(query, platform);
      const raw = (result.data?.tracks ?? []) as Array<Record<string, unknown>>;
      if (raw.length > 0) {
        const t = raw[0];
        const track: Track = {
          title: (t.title as string) ?? 'Unknown',
          artist: (t.artist as string) ?? (t.author as string) ?? undefined,
          duration: (t.duration as number) ?? undefined,
          url: (t.url as string) ?? query,
          thumbnail: (t.thumbnail as string) ?? (t.cover as string) ?? undefined,
          platform: platform ?? 'auto',
        };
        await get().playTrackLocally(track);
      }
    } catch {
      /* search failed */
    }
  },

  play: async (query, platform) => {
    const { playbackMode } = get();

    if (playbackMode === 'local') {
      // In local mode, resolve the track info first via search, then play locally
      // If the query looks like a local file path (has platform 'local' or filePath-like pattern), handle it
      if (platform === 'local') {
        // Playing a local file - build a Track and play it
        const track: Track = {
          title: query.split(/[\\/]/).pop() ?? query,
          artist: 'Local File',
          filePath: query,
          platform: 'local',
        };
        await get().playTrackLocally(track);
        return;
      }

      // Online track → search for info, then stream locally via bot proxy
      try {
        const result = await api.search(query, platform);
        const raw = (result.data?.tracks ?? []) as Array<Record<string, unknown>>;
        if (raw.length > 0) {
          const t = raw[0];
          const track: Track = {
            title: (t.title as string) ?? 'Unknown',
            artist: (t.artist as string) ?? (t.author as string) ?? undefined,
            duration: (t.duration as number) ?? undefined,
            url: (t.url as string) ?? query,
            thumbnail: (t.thumbnail as string) ?? (t.cover as string) ?? undefined,
            platform: platform ?? 'auto',
          };
          await get().playTrackLocally(track);
        }
      } catch {
        /* search failed */
      }
      return;
    }

    if (playbackMode === 'sync') {
      try {
        const result = await api.play(query, platform, undefined, get().focusedGuildId ?? undefined);
        if (result?.requiresVoiceChannel) {
          // Bot hasn't joined a channel yet - defer local playback until
          // playWithVoiceChannel() actually issues bot playback, instead of
          // starting local now and leaving the bot to catch up whenever the
          // user finishes picking a channel (that gap is what "sync" drifted by).
          set({ pendingPlay: { query, platform } });
          return;
        }
        await waitForBotPlaybackStart(get, get().focusedGuildId);
      } catch {
        /* handled by WS updates */
      }
      await get().resolveAndPlayLocally(query, platform);
      return;
    }

    // Bot mode - existing behavior
    try {
      const result = await api.play(query, platform, undefined, get().focusedGuildId ?? undefined);
      if (result?.requiresVoiceChannel) {
        // Bot needs to join a voice channel first - let UI know
        set({ pendingPlay: { query, platform } });
      }
    } catch {
      /* handled by WS updates */
    }
  },

  playTrackLocally: async (track: Track) => {
    const { localAudio: existingAudio, player: currentPlayer } = get();

    // Stop any existing local audio/video
    if (existingAudio) {
      existingAudio.pause();
      existingAudio.removeAttribute('src');
      existingAudio.load();
    }

    // Reflect the pick immediately - stream resolution (first play of a
    // track especially) can take a few seconds, and without this the UI
    // shows no sign anything happened until playback actually starts.
    set({
      localPlaybackLoading: true,
      player: { ...currentPlayer, currentTrack: track, isPlaying: false, position: 0 },
    });

    // Determine the stream URL
    let streamUrl: string;
    if (track.filePath && track.platform === 'local') {
      // Local file from Tauri music folder - stream via bot's local-stream endpoint
      streamUrl = api.getLocalStreamUrl(track.filePath);
    } else if (track.filePath && !track.url) {
      // Uploaded file on the bot server
      streamUrl = api.getUploadStreamUrl(track.filePath);
    } else if (track.url) {
      // Online track - stream via bot proxy
      streamUrl = api.getStreamUrl(track.url);
    } else {
      return; // nothing to play
    }

    // Use a <video> element for video files so video preview is possible;
    // otherwise use <audio> for pure audio tracks.
    const isVideo = track.mediaType === 'video';
    const mediaEl: HTMLAudioElement | HTMLVideoElement = isVideo
      ? document.createElement('video')
      : new Audio(streamUrl);

    if (isVideo) {
      (mediaEl as HTMLVideoElement).src = streamUrl;
      // Keep the video element hidden; the UI component will attach it when showVideoPreview is on
      (mediaEl as HTMLVideoElement).playsInline = true;
    }

    mediaEl.volume = currentPlayer.volume / 100;
    mediaEl.loop = currentPlayer.loop === 'track';

    // Store the video URL on the track for UI access
    const enrichedTrack: Track = {
      ...track,
      videoUrl: isVideo ? streamUrl : undefined,
    };

    // Track time updates
    const onTimeUpdate = () => {
      set((s) => ({ player: { ...s.player, position: Math.floor(mediaEl.currentTime) } }));
    };
    mediaEl.addEventListener('timeupdate', onTimeUpdate);

    // Track loaded metadata (duration)
    const onLoadedMetadata = () => {
      if (Number.isFinite(mediaEl.duration) && mediaEl.duration > 0) {
        set((s) => ({ player: { ...s.player, duration: Math.floor(mediaEl.duration) } }));
      }
    };
    mediaEl.addEventListener('loadedmetadata', onLoadedMetadata);

    // Some formats (e.g. VBR MP3) update duration after initial metadata load
    const onDurationChange = () => {
      if (Number.isFinite(mediaEl.duration) && mediaEl.duration > 0) {
        set((s) => ({ player: { ...s.player, duration: Math.floor(mediaEl.duration) } }));
      }
    };
    mediaEl.addEventListener('durationchange', onDurationChange);

    // Track ended - advance local queue
    const onEnded = () => {
      const { localQueue, player: p } = get();
      if (p.loop === 'track') {
        return;
      }
      // Push finished track to history for "previous" support
      set((s) => ({ localHistory: [...s.localHistory, enrichedTrack] }));
      if (localQueue.length > 0) {
        const [next, ...rest] = localQueue;
        set({ localQueue: rest });
        if (p.loop === 'queue') {
          set((s) => ({ localQueue: [...s.localQueue, enrichedTrack] }));
        }
        get().playTrackLocally(next);
      } else if (p.loop === 'queue' && p.queue.length === 0) {
        set((s) => ({
          player: { ...s.player, isPlaying: false, position: 0, currentTrack: null },
          localAudio: null,
        }));
      } else {
        set((s) => ({
          player: { ...s.player, isPlaying: false, position: 0, currentTrack: null },
          localAudio: null,
        }));
      }
    };
    mediaEl.addEventListener('ended', onEnded);

    try {
      await mediaEl.play();
      // Use mediaEl.duration if already available (loadedmetadata may have fired
      // during play()), otherwise fall back to track metadata or 0.
      const resolvedDuration =
        track.duration ??
        (Number.isFinite(mediaEl.duration) && mediaEl.duration > 0 ? Math.floor(mediaEl.duration) : 0);
      set({
        localAudio: mediaEl,
        localPlaybackLoading: false,
        player: {
          ...currentPlayer,
          isPlaying: true,
          currentTrack: enrichedTrack,
          position: 0,
          duration: resolvedDuration,
          queue: get().localQueue,
        },
      });
    } catch {
      set((s) => ({
        player: { ...s.player, isPlaying: false, currentTrack: null, position: 0 },
        localAudio: null,
        localPlaybackLoading: false,
      }));
      const { toast } = await import('./useToastStore');
      toast.error('Failed to play track - stream unavailable');
    }
  },

  pause: async () => {
    const { playbackMode, localAudio, activePlayerGuildId, focusedGuildId } = get();
    const guildId = activePlayerGuildId ?? focusedGuildId ?? undefined;
    if (playbackMode === 'sync') {
      // Sync: pause both
      if (localAudio) {
        localAudio.pause();
        set((s) => ({ player: { ...s.player, isPlaying: false } }));
      }
      try {
        await api.pause(guildId);
      } catch {
        /* empty */
      }
      return;
    }
    // Prefer controlling local audio when it exists (even in bot mode if bot is offline)
    if (localAudio) {
      localAudio.pause();
      set((s) => ({ player: { ...s.player, isPlaying: false } }));
    } else if (playbackMode === 'bot') {
      try {
        await api.pause(guildId);
      } catch {
        /* empty */
      }
    }
  },
  resume: async () => {
    const { playbackMode, localAudio, activePlayerGuildId, focusedGuildId, player: p } = get();
    const guildId = activePlayerGuildId ?? focusedGuildId ?? undefined;
    if (playbackMode === 'sync') {
      // Sync: resume both
      if (localAudio) {
        await localAudio.play();
        set((s) => ({ player: { ...s.player, isPlaying: true } }));
      }
      try {
        await api.resume(guildId);
      } catch {
        /* empty */
      }
      return;
    }
    // Prefer controlling local audio when it exists (even in bot mode if bot is offline)
    if (localAudio) {
      await localAudio.play();
      set((s) => ({ player: { ...s.player, isPlaying: true } }));
    } else if (p.currentTrack && (playbackMode === 'local' || !get().connection.connected)) {
      // localAudio was lost - re-play the track
      await get().playTrackLocally(p.currentTrack);
    } else if (playbackMode === 'local') {
      // No current track but queue may have items - advance
      const { localQueue } = get();
      if (localQueue.length > 0) {
        const [next, ...rest] = localQueue;
        set({ localQueue: rest });
        await get().playTrackLocally(next);
      }
    } else {
      try {
        await api.resume(guildId);
      } catch {
        /* empty */
      }
    }
  },
  stop: async () => {
    const { playbackMode, localAudio, activePlayerGuildId, focusedGuildId } = get();
    const guildId = activePlayerGuildId ?? focusedGuildId ?? undefined;
    if (playbackMode === 'sync') {
      // Sync: stop both
      if (localAudio) {
        localAudio.pause();
        localAudio.removeAttribute('src');
        localAudio.load();
        set((s) => ({
          player: { ...s.player, isPlaying: false, position: 0, currentTrack: null, queue: [] },
          localAudio: null,
          localQueue: [],
          localHistory: [],
        }));
      }
      try {
        await api.stop(guildId);
      } catch {
        /* empty */
      }
      return;
    }
    // Stop local audio if it exists (even in bot mode)
    if (localAudio) {
      localAudio.pause();
      localAudio.removeAttribute('src');
      localAudio.load();
      set((s) => ({
        player: { ...s.player, isPlaying: false, position: 0, currentTrack: null, queue: [] },
        localAudio: null,
        localQueue: [],
        localHistory: [],
      }));
    } else if (playbackMode === 'bot') {
      try {
        await api.stop(guildId);
      } catch {
        /* empty */
      }
    }
  },
  skip: async () => {
    const { playbackMode, localAudio, localQueue, player: p } = get();
    // If sync mode, skip both
    if (playbackMode === 'sync') {
      if (p.currentTrack) {
        set((s) => ({ localHistory: [...s.localHistory, p.currentTrack!] }));
      }
      if (localAudio) {
        localAudio.pause();
        localAudio.removeAttribute('src');
        localAudio.load();
      }
      if (localQueue.length > 0) {
        const [next, ...rest] = localQueue;
        set({ localQueue: rest });
        await get().playTrackLocally(next);
      } else {
        set((s) => ({
          player: { ...s.player, isPlaying: false, position: 0, currentTrack: null, queue: [] },
          localAudio: null,
        }));
      }
      try {
        await api.skip(get().activePlayerGuildId ?? get().focusedGuildId ?? undefined);
      } catch {
        /* empty */
      }
      return;
    }
    // If local audio is active (even in bot mode while offline), control it locally
    if (localAudio || playbackMode === 'local' || localQueue.length > 0) {
      // Push current track to history before skipping
      if (p.currentTrack) {
        set((s) => ({ localHistory: [...s.localHistory, p.currentTrack!] }));
      }
      if (localAudio) {
        localAudio.pause();
        localAudio.removeAttribute('src');
        localAudio.load();
      }
      if (localQueue.length > 0) {
        const [next, ...rest] = localQueue;
        set({ localQueue: rest });
        await get().playTrackLocally(next);
      } else {
        set((s) => ({
          player: { ...s.player, isPlaying: false, position: 0, currentTrack: null, queue: [] },
          localAudio: null,
        }));
      }
    } else {
      try {
        await api.skip(get().activePlayerGuildId ?? get().focusedGuildId ?? undefined);
      } catch {
        /* empty */
      }
    }
  },
  playPrevious: async () => {
    const { playbackMode, localAudio, localHistory, player: p } = get();
    // If local audio is active or there's local history, handle locally
    if (localAudio || localHistory.length > 0 || playbackMode === 'local') {
      if (localHistory.length === 0) return;
      const prev = localHistory[localHistory.length - 1];
      // Remove the last item from history
      set((s) => ({ localHistory: s.localHistory.slice(0, -1) }));
      // Push current track back to the front of the queue
      if (p.currentTrack) {
        set((s) => ({ localQueue: [p.currentTrack!, ...s.localQueue] }));
      }
      if (localAudio) {
        localAudio.pause();
        localAudio.removeAttribute('src');
        localAudio.load();
      }
      await get().playTrackLocally(prev);
    } else {
      try {
        await api.back(get().activePlayerGuildId ?? get().focusedGuildId ?? undefined);
      } catch {
        /* empty */
      }
    }
  },
  seek: async (position) => {
    const { localAudio, activePlayerGuildId, focusedGuildId } = get();
    const guildId = activePlayerGuildId ?? focusedGuildId ?? undefined;
    if (localAudio) {
      localAudio.currentTime = position;
      set((s) => ({ player: { ...s.player, position } }));
    } else {
      try {
        await api.seek(position, guildId);
      } catch {
        /* empty */
      }
    }
  },
  setVolume: async (volume) => {
    set((s) => ({ player: { ...s.player, volume } }));
    const { localAudio, activePlayerGuildId, focusedGuildId } = get();
    const guildId = activePlayerGuildId ?? focusedGuildId ?? undefined;
    if (localAudio) {
      localAudio.volume = volume / 100;
    } else {
      try {
        await api.volume(volume, guildId);
      } catch {
        /* empty */
      }
    }
  },
  setLoop: async (mode) => {
    set((s) => ({ player: { ...s.player, loop: mode as PlayerState['loop'] } }));
    const { localAudio, activePlayerGuildId, focusedGuildId } = get();
    const guildId = activePlayerGuildId ?? focusedGuildId ?? undefined;
    if (localAudio) {
      localAudio.loop = mode === 'track';
    } else {
      try {
        await api.loop(mode, guildId);
      } catch {
        /* empty */
      }
    }
  },
  addToQueue: async (query, platform) => {
    const { playbackMode } = get();
    if (playbackMode === 'local' || playbackMode === 'sync') {
      // In local / sync mode, resolve the track and add to local queue
      try {
        const result = await api.search(query);
        const raw = (result.data?.tracks ?? []) as Array<Record<string, unknown>>;
        if (raw.length > 0) {
          const t = raw[0];
          const track: Track = {
            title: (t.title as string) ?? 'Unknown',
            artist: (t.artist as string) ?? (t.author as string) ?? undefined,
            duration: (t.duration as number) ?? undefined,
            url: (t.url as string) ?? query,
            thumbnail: (t.thumbnail as string) ?? (t.cover as string) ?? undefined,
          };
          get().addTrackToLocalQueue(track);
        }
      } catch {
        /* empty */
      }
      // In sync mode, also queue on bot
      if (playbackMode === 'sync') {
        try {
          await api.addToQueue(query, platform, get().activePlayerGuildId ?? get().focusedGuildId ?? undefined);
        } catch {
          /* empty */
        }
      }
    } else {
      try {
        await api.addToQueue(query, platform, get().activePlayerGuildId ?? get().focusedGuildId ?? undefined);
      } catch {
        /* empty */
      }
    }
  },
  addTrackToLocalQueue: (track: Track) => {
    set((s) => {
      const newQueue = [...s.localQueue, track];
      return {
        localQueue: newQueue,
        player: { ...s.player, queue: newQueue },
      };
    });
  },
  removeFromQueue: async (index) => {
    const { playbackMode } = get();
    if (playbackMode === 'local' || playbackMode === 'sync') {
      set((s) => {
        const newQueue = s.localQueue.filter((_, i) => i !== index);
        return {
          localQueue: newQueue,
          player: { ...s.player, queue: newQueue },
        };
      });
      if (playbackMode === 'sync') {
        try {
          await api.removeFromQueue(index, get().activePlayerGuildId ?? get().focusedGuildId ?? undefined);
        } catch {
          /* empty */
        }
      }
    } else {
      // Optimistic update: remove the track from local state immediately
      const prevQueue = get().player.queue;
      set((s) => ({
        player: { ...s.player, queue: s.player.queue.filter((_, i) => i !== index) },
      }));
      try {
        await api.removeFromQueue(index, get().activePlayerGuildId ?? get().focusedGuildId ?? undefined);
      } catch {
        // Revert on failure
        set((s) => ({ player: { ...s.player, queue: prevQueue } }));
      }
    }
  },
  moveQueueTrack: async (from, to) => {
    if (from === to) return;
    const { playbackMode } = get();

    // Optimistically reorder local state
    set((s) => {
      const source = playbackMode === 'local' || playbackMode === 'sync' ? s.localQueue : s.player.queue;
      const newQueue = [...source];
      const [moved] = newQueue.splice(from, 1);
      newQueue.splice(to, 0, moved);
      return playbackMode === 'local' || playbackMode === 'sync'
        ? { localQueue: newQueue, player: { ...s.player, queue: newQueue } }
        : { player: { ...s.player, queue: newQueue } };
    });

    if (playbackMode !== 'local') {
      try {
        await api.moveQueueTrack(from, to, get().activePlayerGuildId ?? get().focusedGuildId ?? undefined);
      } catch {
        /* revert would require re-fetching; the next WS state push will fix it */
      }
    }
  },
  clearQueue: async () => {
    const { playbackMode } = get();
    if (playbackMode === 'local' || playbackMode === 'sync') {
      set((s) => ({
        localQueue: [],
        player: { ...s.player, queue: [] },
      }));
      if (playbackMode === 'sync') {
        try {
          await api.clearQueue(get().activePlayerGuildId ?? get().focusedGuildId ?? undefined);
        } catch {
          /* empty */
        }
      }
    } else {
      // Optimistic update: clear queue in local state immediately
      const prevQueue = get().player.queue;
      set((s) => ({ player: { ...s.player, queue: [] } }));
      try {
        await api.clearQueue(get().activePlayerGuildId ?? get().focusedGuildId ?? undefined);
      } catch {
        // Revert on failure
        set((s) => ({ player: { ...s.player, queue: prevQueue } }));
      }
    }
  },
  shuffleQueue: async () => {
    const { playbackMode } = get();
    if (playbackMode === 'local' || playbackMode === 'sync') {
      set((s) => {
        const shuffled = [...s.localQueue].sort(() => Math.random() - 0.5);
        return {
          localQueue: shuffled,
          player: { ...s.player, queue: shuffled },
        };
      });
      if (playbackMode === 'sync') {
        try {
          await api.shuffleQueue(get().activePlayerGuildId ?? get().focusedGuildId ?? undefined);
        } catch {
          /* empty */
        }
      }
    } else {
      try {
        await api.shuffleQueue(get().activePlayerGuildId ?? get().focusedGuildId ?? undefined);
      } catch {
        /* empty */
      }
    }
  },
}));

// When the server rejects an API call with 401/403, the token is no longer
// valid - tear down the session so the UI re-prompts for auth.
setAuthFailureHandler(() => {
  const state = useBotStore.getState();
  if (state.botToken) {
    state.disconnectBot();
  }
});
