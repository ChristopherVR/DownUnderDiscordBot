import { beforeEach, describe, expect, it, vi } from 'vitest';

// --- Mocks (vi.hoisted so they are available in vi.mock factories) ---

const { mockApi, mockWsService, localStorageMap } = vi.hoisted(() => {
  const _localStorageMap = new Map<string, string>();
  const _mockApi = {
    getAuthStatus: vi.fn(),
    getAuthUrl: vi.fn(),
    quickConnect: vi.fn(),
    getUser: vi.fn(),
    getGuilds: vi.fn(),
    getDashboard: vi.fn(),
    forceStopInstance: vi.fn(),
    clearStaleInstances: vi.fn(),
    pingInstance: vi.fn(),
    play: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    stop: vi.fn(),
    skip: vi.fn(),
    back: vi.fn(),
    seek: vi.fn(),
    volume: vi.fn(),
    loop: vi.fn(),
    search: vi.fn(),
    addToQueue: vi.fn(),
    removeFromQueue: vi.fn(),
    clearQueue: vi.fn(),
    shuffleQueue: vi.fn(),
    moveQueueTrack: vi.fn(),
    getStreamUrl: vi.fn((url: string) => `http://localhost:3000/api/music/stream?url=${encodeURIComponent(url)}`),
    getLocalStreamUrl: vi.fn(
      (path: string) => `http://localhost:3000/api/music/stream/local?path=${encodeURIComponent(path)}`,
    ),
    getUploadStreamUrl: vi.fn(
      (name: string) => `http://localhost:3000/api/music/stream?filePath=${encodeURIComponent(name)}`,
    ),
    health: vi.fn(),
  };
  const _mockWsService = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    on: vi.fn(() => () => {}),
    send: vi.fn(),
    connected: false,
  };
  return { mockApi: _mockApi, mockWsService: _mockWsService, localStorageMap: _localStorageMap };
});

// Mock localStorage
vi.stubGlobal('localStorage', {
  getItem: vi.fn((key: string) => localStorageMap.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => localStorageMap.set(key, value)),
  removeItem: vi.fn((key: string) => localStorageMap.delete(key)),
  clear: vi.fn(() => localStorageMap.clear()),
  get length() {
    return localStorageMap.size;
  },
  key: vi.fn(() => null),
});

vi.mock('@/lib/api', () => ({
  api: mockApi,
  setApiBaseUrl: vi.fn(),
}));

vi.mock('@/lib/ws', () => ({
  WebSocketService: vi.fn(),
  wsService: mockWsService,
}));

// Mock Tauri imports (used by searchLocalFiles, connectToBot, etc.)
vi.mock('@tauri-apps/plugin-shell', () => ({
  open: vi.fn(),
}));

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

import { useBotStore } from '@/stores/useBotStore';
import type { PlayerState, Track, GuildPlayerState } from '@/stores/useBotStore';

// Helper to create a track
function makeTrack(overrides: Partial<Track> = {}): Track {
  return {
    title: 'Test Track',
    artist: 'Test Artist',
    duration: 180,
    url: 'https://youtube.com/watch?v=test',
    thumbnail: 'https://img.youtube.com/test.jpg',
    platform: 'youtube',
    ...overrides,
  };
}

// Default player state for resets
const defaultPlayer: PlayerState = {
  isPlaying: false,
  currentTrack: null,
  position: 0,
  duration: 0,
  volume: 50,
  loop: 'off',
  queue: [],
};

describe('useBotStore', () => {
  beforeEach(() => {
    localStorageMap.clear();
    vi.clearAllMocks();

    // Reset store to clean state
    useBotStore.setState({
      botToken: null,
      botUser: null,
      botConnecting: false,
      botError: null,
      guilds: [],
      guildsLoading: false,
      focusedGuildId: null,
      connection: { host: 'localhost', port: 3000, connected: false, botOnline: false },
      playbackMode: 'local',
      localAudio: null,
      localQueue: [],
      localHistory: [],
      showVideoPreview: false,
      musicFolders: [],
      player: { ...defaultPlayer },
      guildPlayers: {},
      activePlayerGuildId: null,
      streamStatus: null,
      searchResults: [],
      searchLoading: false,
      previewTrack: null,
      previewAudio: null,
      previewPlaying: false,
      dashboard: null,
      dashboardLoading: false,
      pendingPlay: null,
    });
  });

  // ---- Connection State ----

  describe('connection state', () => {
    it('has default connection values', () => {
      const { connection } = useBotStore.getState();
      expect(connection.host).toBe('localhost');
      expect(connection.port).toBe(3000);
      expect(connection.connected).toBe(false);
      expect(connection.botOnline).toBe(false);
    });

    it('setConnection updates host and port', () => {
      useBotStore.getState().setConnection('192.168.1.100', 8080);
      const { connection } = useBotStore.getState();
      expect(connection.host).toBe('192.168.1.100');
      expect(connection.port).toBe(8080);
    });

    it('connect calls wsService.connect and registers event handlers', () => {
      useBotStore.getState().connect();
      expect(mockWsService.connect).toHaveBeenCalledWith('localhost', 3000);
      expect(mockWsService.on).toHaveBeenCalledWith('connection', expect.any(Function));
      expect(mockWsService.on).toHaveBeenCalledWith('player_state', expect.any(Function));
      expect(mockWsService.on).toHaveBeenCalledWith('queue_update', expect.any(Function));
      expect(mockWsService.on).toHaveBeenCalledWith('track_started', expect.any(Function));
      expect(mockWsService.on).toHaveBeenCalledWith('bot_status', expect.any(Function));
      expect(mockWsService.on).toHaveBeenCalledWith('stream_status', expect.any(Function));
    });

    it('disconnect calls wsService.disconnect and sets connected to false', () => {
      useBotStore.setState({ connection: { host: 'localhost', port: 3000, connected: true, botOnline: true } });
      useBotStore.getState().disconnect();
      expect(mockWsService.disconnect).toHaveBeenCalled();
      expect(useBotStore.getState().connection.connected).toBe(false);
    });
  });

  // ---- Bot Authentication ----

  describe('bot authentication', () => {
    it('connectToBot with quick connect sets token, user, and guilds', async () => {
      mockApi.getAuthStatus.mockResolvedValue({ oauthConfigured: false, bot: null });
      mockApi.quickConnect.mockResolvedValue({
        token: 'test-token',
        bot: { id: 'bot-1', username: 'TestBot', avatar: null },
        guilds: [{ id: 'g1', name: 'Guild 1', icon: null, memberCount: 10, botPresent: true }],
      });

      await useBotStore.getState().connectToBot();

      const state = useBotStore.getState();
      expect(state.botToken).toBe('test-token');
      expect(state.botUser?.username).toBe('TestBot');
      expect(state.guilds).toHaveLength(1);
      expect(state.botConnecting).toBe(false);
    });

    it('connectToBot with manual token validates and sets user', async () => {
      mockApi.getUser.mockResolvedValue({ id: 'u1', username: 'Manual User', avatar: null });

      await useBotStore.getState().connectToBot('manual-token-123');

      const state = useBotStore.getState();
      expect(state.botToken).toBe('manual-token-123');
      expect(state.botUser?.username).toBe('Manual User');
      expect(state.botConnecting).toBe(false);
    });

    it('connectToBot sets botError on failure', async () => {
      mockApi.getAuthStatus.mockRejectedValue(new Error('Network error'));

      await useBotStore.getState().connectToBot();

      const state = useBotStore.getState();
      expect(state.botError).toBe('Network error');
      expect(state.botConnecting).toBe(false);
      expect(state.botToken).toBeNull();
    });

    it('disconnectBot clears auth state and calls disconnect', () => {
      useBotStore.setState({
        botToken: 'tok',
        botUser: { id: 'u1', username: 'User', avatar: null },
        guilds: [{ id: 'g1', name: 'G', icon: null, owner: false, botPresent: true }],
        focusedGuildId: 'g1',
      });

      useBotStore.getState().disconnectBot();

      const state = useBotStore.getState();
      expect(state.botToken).toBeNull();
      expect(state.botUser).toBeNull();
      expect(state.guilds).toEqual([]);
      expect(state.focusedGuildId).toBeNull();
      expect(mockWsService.disconnect).toHaveBeenCalled();
    });
  });

  // ---- Guild Management ----

  describe('guild management', () => {
    it('focusGuild sets focusedGuildId and persists to localStorage', () => {
      useBotStore.getState().focusGuild('guild-123');
      expect(useBotStore.getState().focusedGuildId).toBe('guild-123');
      expect(localStorage.setItem).toHaveBeenCalledWith('downunder_focused_guild', 'guild-123');
    });

    it('focusGuild with null removes from localStorage', () => {
      useBotStore.getState().focusGuild('guild-123');
      useBotStore.getState().focusGuild(null);
      expect(useBotStore.getState().focusedGuildId).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith('downunder_focused_guild');
    });

    it('fetchGuilds skips when guilds are already loaded', async () => {
      useBotStore.setState({
        botToken: 'tok',
        guilds: [{ id: 'g1', name: 'G', icon: null, owner: false, botPresent: true }],
      });

      await useBotStore.getState().fetchGuilds();
      expect(mockApi.getGuilds).not.toHaveBeenCalled();
    });

    it('fetchGuilds fetches when guilds are empty', async () => {
      useBotStore.setState({ botToken: 'tok', guilds: [] });
      mockApi.getGuilds.mockResolvedValue({
        guilds: [{ id: 'g1', name: 'Guild One', icon: null, owner: true, botPresent: true }],
      });

      await useBotStore.getState().fetchGuilds();

      expect(mockApi.getGuilds).toHaveBeenCalledWith('tok');
      expect(useBotStore.getState().guilds).toHaveLength(1);
      expect(useBotStore.getState().guildsLoading).toBe(false);
    });

    it('fetchGuilds does nothing without botToken', async () => {
      useBotStore.setState({ botToken: null });
      await useBotStore.getState().fetchGuilds();
      expect(mockApi.getGuilds).not.toHaveBeenCalled();
    });
  });

  // ---- Player State ----

  describe('player state', () => {
    it('has default player state', () => {
      const { player } = useBotStore.getState();
      expect(player.isPlaying).toBe(false);
      expect(player.currentTrack).toBeNull();
      expect(player.position).toBe(0);
      expect(player.duration).toBe(0);
      expect(player.volume).toBe(50);
      expect(player.loop).toBe('off');
      expect(player.queue).toEqual([]);
    });

    it('updatePlayerState merges partial state', () => {
      useBotStore.getState().updatePlayerState({ isPlaying: true, volume: 80 });
      const { player } = useBotStore.getState();
      expect(player.isPlaying).toBe(true);
      expect(player.volume).toBe(80);
      // Other fields unchanged
      expect(player.currentTrack).toBeNull();
      expect(player.position).toBe(0);
    });

    it('updatePlayerState sets current track', () => {
      const track = makeTrack();
      useBotStore.getState().updatePlayerState({ currentTrack: track, isPlaying: true, duration: 180 });
      const { player } = useBotStore.getState();
      expect(player.currentTrack).toEqual(track);
      expect(player.isPlaying).toBe(true);
      expect(player.duration).toBe(180);
    });
  });

  // ---- Per-Guild Player States ----

  describe('per-guild player states', () => {
    it('starts with empty guildPlayers', () => {
      expect(useBotStore.getState().guildPlayers).toEqual({});
    });

    it('setActivePlayerGuild sets the active guild and syncs player state', () => {
      const gp: GuildPlayerState = {
        guildId: 'g1',
        guildName: 'Guild 1',
        guildIcon: null,
        isPlaying: true,
        currentTrack: makeTrack(),
        position: 42,
        duration: 180,
        volume: 75,
        loop: 'off',
        queue: [],
      };
      useBotStore.setState({ guildPlayers: { g1: gp } });

      useBotStore.getState().setActivePlayerGuild('g1');

      expect(useBotStore.getState().activePlayerGuildId).toBe('g1');
      const { player } = useBotStore.getState();
      expect(player.isPlaying).toBe(true);
      expect(player.position).toBe(42);
      expect(player.volume).toBe(75);
    });

    it('setActivePlayerGuild with null sets activePlayerGuildId to null', () => {
      useBotStore.setState({ activePlayerGuildId: 'g1' });
      useBotStore.getState().setActivePlayerGuild(null);
      expect(useBotStore.getState().activePlayerGuildId).toBeNull();
    });

    it('getActiveGuildIds returns guilds with active playback', () => {
      useBotStore.setState({
        guildPlayers: {
          g1: {
            guildId: 'g1',
            isPlaying: true,
            currentTrack: makeTrack(),
            position: 0,
            duration: 0,
            volume: 50,
            loop: 'off',
            queue: [],
          },
          g2: {
            guildId: 'g2',
            isPlaying: false,
            currentTrack: null,
            position: 0,
            duration: 0,
            volume: 50,
            loop: 'off',
            queue: [],
          },
          g3: {
            guildId: 'g3',
            isPlaying: false,
            currentTrack: makeTrack(),
            position: 0,
            duration: 0,
            volume: 50,
            loop: 'off',
            queue: [],
          },
        },
      });

      const activeIds = useBotStore.getState().getActiveGuildIds();
      // g1 is playing, g3 has currentTrack (but not playing), g2 has neither
      expect(activeIds).toContain('g1');
      expect(activeIds).toContain('g3');
      expect(activeIds).not.toContain('g2');
    });

    it('cycleActivePlayer cycles to the next active guild', () => {
      const gpBase = {
        isPlaying: true,
        position: 0,
        duration: 0,
        volume: 50,
        loop: 'off' as const,
        queue: [],
      };
      useBotStore.setState({
        guildPlayers: {
          g1: { ...gpBase, guildId: 'g1', currentTrack: makeTrack({ title: 'T1' }) },
          g2: { ...gpBase, guildId: 'g2', currentTrack: makeTrack({ title: 'T2' }) },
          g3: { ...gpBase, guildId: 'g3', currentTrack: makeTrack({ title: 'T3' }) },
        },
        activePlayerGuildId: 'g1',
      });

      useBotStore.getState().cycleActivePlayer('next');
      expect(useBotStore.getState().activePlayerGuildId).toBe('g2');

      useBotStore.getState().cycleActivePlayer('next');
      expect(useBotStore.getState().activePlayerGuildId).toBe('g3');

      // Wraps around
      useBotStore.getState().cycleActivePlayer('next');
      expect(useBotStore.getState().activePlayerGuildId).toBe('g1');
    });

    it('cycleActivePlayer cycles in prev direction', () => {
      const gpBase = {
        isPlaying: true,
        position: 0,
        duration: 0,
        volume: 50,
        loop: 'off' as const,
        queue: [],
      };
      useBotStore.setState({
        guildPlayers: {
          g1: { ...gpBase, guildId: 'g1', currentTrack: makeTrack() },
          g2: { ...gpBase, guildId: 'g2', currentTrack: makeTrack() },
        },
        activePlayerGuildId: 'g1',
      });

      useBotStore.getState().cycleActivePlayer('prev');
      expect(useBotStore.getState().activePlayerGuildId).toBe('g2');
    });

    it('cycleActivePlayer does nothing when no active guilds', () => {
      useBotStore.setState({ guildPlayers: {}, activePlayerGuildId: null });
      useBotStore.getState().cycleActivePlayer('next');
      expect(useBotStore.getState().activePlayerGuildId).toBeNull();
    });
  });

  // ---- Playback Mode ----

  describe('playback mode', () => {
    it('defaults to local mode', () => {
      expect(useBotStore.getState().playbackMode).toBe('local');
    });

    it('setPlaybackMode changes the mode', () => {
      useBotStore.getState().setPlaybackMode('bot');
      expect(useBotStore.getState().playbackMode).toBe('bot');
    });

    it('setPlaybackMode to same mode is a no-op', () => {
      useBotStore.getState().setPlaybackMode('local');
      // Should not throw or change state
      expect(useBotStore.getState().playbackMode).toBe('local');
    });

    it('switching to bot mode syncs player from active guild', () => {
      const gp: GuildPlayerState = {
        guildId: 'g1',
        guildName: 'Guild',
        guildIcon: null,
        isPlaying: true,
        currentTrack: makeTrack(),
        position: 60,
        duration: 180,
        volume: 80,
        loop: 'track',
        queue: [makeTrack({ title: 'Queued' })],
      };
      useBotStore.setState({
        playbackMode: 'local',
        guildPlayers: { g1: gp },
        activePlayerGuildId: 'g1',
      });

      useBotStore.getState().setPlaybackMode('bot');

      const { player } = useBotStore.getState();
      expect(player.isPlaying).toBe(true);
      expect(player.position).toBe(60);
      expect(player.volume).toBe(80);
    });
  });

  // ---- Search ----

  describe('search', () => {
    it('clearSearch resets searchResults', () => {
      useBotStore.setState({ searchResults: [makeTrack()] });
      useBotStore.getState().clearSearch();
      expect(useBotStore.getState().searchResults).toEqual([]);
    });

    it('search sets searchLoading and then results', async () => {
      mockApi.search.mockResolvedValue({
        success: true,
        data: {
          tracks: [{ title: 'Found Track', artist: 'Artist', url: 'https://youtube.com/test', duration: 200 }],
        },
      });

      await useBotStore.getState().search('test query', 'youtube');

      const state = useBotStore.getState();
      expect(state.searchLoading).toBe(false);
      expect(state.searchResults).toHaveLength(1);
      expect(state.searchResults[0].title).toBe('Found Track');
    });

    it('search handles API errors gracefully', async () => {
      mockApi.search.mockRejectedValue(new Error('Network error'));

      await useBotStore.getState().search('failing query');

      const state = useBotStore.getState();
      expect(state.searchLoading).toBe(false);
      expect(state.searchResults).toEqual([]);
    });
  });

  // ---- Dashboard ----

  describe('dashboard', () => {
    it('fetchDashboard loads and sets dashboard data', async () => {
      const dashData = {
        bot: {
          online: true,
          uptime: 3600,
          username: 'Bot',
          discriminator: null,
          avatar: null,
          id: 'b1',
          guildCount: 2,
          ping: 42,
        },
        guilds: [],
        instances: {
          thisInstanceId: 'i1',
          health: { totalInstances: 1, onlineInstances: 1, guildsWithBots: 2, lastUpdated: Date.now() },
          list: [],
        },
        websocket: { totalClients: 1, activeClients: 1, totalSubscriptions: 3 },
      };
      mockApi.getDashboard.mockResolvedValue(dashData);

      await useBotStore.getState().fetchDashboard();

      expect(useBotStore.getState().dashboard).toEqual(dashData);
      expect(useBotStore.getState().dashboardLoading).toBe(false);
    });

    it('fetchDashboard handles errors gracefully', async () => {
      mockApi.getDashboard.mockRejectedValue(new Error('fail'));

      await useBotStore.getState().fetchDashboard();

      expect(useBotStore.getState().dashboard).toBeNull();
      expect(useBotStore.getState().dashboardLoading).toBe(false);
    });
  });

  // ---- Music Folders ----

  describe('music folders', () => {
    it('addMusicFolder adds a folder and persists', () => {
      useBotStore.getState().addMusicFolder('/music/rock');
      expect(useBotStore.getState().musicFolders).toContain('/music/rock');
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'downunder_music_folders',
        expect.stringContaining('/music/rock'),
      );
    });

    it('addMusicFolder deduplicates existing folders', () => {
      useBotStore.getState().addMusicFolder('/music/rock');
      useBotStore.getState().addMusicFolder('/music/rock');
      expect(useBotStore.getState().musicFolders.filter((f) => f === '/music/rock')).toHaveLength(1);
    });

    it('removeMusicFolder removes a folder and persists', () => {
      useBotStore.setState({ musicFolders: ['/music/rock', '/music/jazz'] });
      useBotStore.getState().removeMusicFolder('/music/rock');
      expect(useBotStore.getState().musicFolders).toEqual(['/music/jazz']);
      expect(localStorage.setItem).toHaveBeenCalled();
    });
  });

  // ---- Local Queue Management ----

  describe('local queue', () => {
    it('addTrackToLocalQueue appends track to localQueue and player.queue', () => {
      const track = makeTrack({ title: 'Queued Track' });
      useBotStore.getState().addTrackToLocalQueue(track);

      const state = useBotStore.getState();
      expect(state.localQueue).toHaveLength(1);
      expect(state.localQueue[0].title).toBe('Queued Track');
      expect(state.player.queue).toHaveLength(1);
    });

    it('addTrackToLocalQueue appends multiple tracks in order', () => {
      useBotStore.getState().addTrackToLocalQueue(makeTrack({ title: 'First' }));
      useBotStore.getState().addTrackToLocalQueue(makeTrack({ title: 'Second' }));

      const { localQueue } = useBotStore.getState();
      expect(localQueue).toHaveLength(2);
      expect(localQueue[0].title).toBe('First');
      expect(localQueue[1].title).toBe('Second');
    });
  });

  // ---- Pending Play / Voice Channel ----

  describe('pending play', () => {
    it('setPendingPlay sets and clears pending play', () => {
      useBotStore.getState().setPendingPlay({ query: 'test song', platform: 'youtube' });
      expect(useBotStore.getState().pendingPlay).toEqual({ query: 'test song', platform: 'youtube' });

      useBotStore.getState().setPendingPlay(null);
      expect(useBotStore.getState().pendingPlay).toBeNull();
    });

    it('playWithVoiceChannel calls api.play and clears pendingPlay', async () => {
      useBotStore.setState({
        pendingPlay: { query: 'test song', platform: 'youtube' },
        focusedGuildId: 'g1',
      });
      mockApi.play.mockResolvedValue({ success: true });

      await useBotStore.getState().playWithVoiceChannel('vc-123');

      expect(mockApi.play).toHaveBeenCalledWith('test song', 'youtube', 'vc-123', 'g1');
      expect(useBotStore.getState().pendingPlay).toBeNull();
    });

    it('playWithVoiceChannel does nothing when no pendingPlay', async () => {
      useBotStore.setState({ pendingPlay: null });

      await useBotStore.getState().playWithVoiceChannel('vc-123');

      expect(mockApi.play).not.toHaveBeenCalled();
    });
  });

  // ---- Stream Status ----

  describe('stream status', () => {
    it('defaults to null', () => {
      expect(useBotStore.getState().streamStatus).toBeNull();
    });

    it('can be set via setState', () => {
      useBotStore.setState({
        streamStatus: { videoId: 'abc', status: 'resolving', client: 'ANDROID' },
      });
      expect(useBotStore.getState().streamStatus?.status).toBe('resolving');
    });
  });

  // ---- Video Preview ----

  describe('video preview', () => {
    it('defaults to false', () => {
      expect(useBotStore.getState().showVideoPreview).toBe(false);
    });

    it('setShowVideoPreview toggles the flag', () => {
      useBotStore.getState().setShowVideoPreview(true);
      expect(useBotStore.getState().showVideoPreview).toBe(true);

      useBotStore.getState().setShowVideoPreview(false);
      expect(useBotStore.getState().showVideoPreview).toBe(false);
    });
  });

  // ---- Volume & Loop (bot mode, no local audio) ----

  describe('volume and loop (bot mode)', () => {
    it('setVolume updates player volume and calls API when no local audio', async () => {
      useBotStore.setState({
        playbackMode: 'bot',
        localAudio: null,
        focusedGuildId: 'g1',
      });
      mockApi.volume.mockResolvedValue({});

      await useBotStore.getState().setVolume(75);

      expect(useBotStore.getState().player.volume).toBe(75);
      expect(mockApi.volume).toHaveBeenCalledWith(75, 'g1');
    });

    it('setLoop updates player loop and calls API when no local audio', async () => {
      useBotStore.setState({
        playbackMode: 'bot',
        localAudio: null,
        focusedGuildId: 'g1',
      });
      mockApi.loop.mockResolvedValue({});

      await useBotStore.getState().setLoop('queue');

      expect(useBotStore.getState().player.loop).toBe('queue');
      expect(mockApi.loop).toHaveBeenCalledWith('queue', 'g1');
    });
  });
});
