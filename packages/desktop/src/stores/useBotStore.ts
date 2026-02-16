import { create } from 'zustand';
import { api } from '@/lib/api';
import { wsService } from '@/lib/ws';

export interface Track {
  title: string;
  artist?: string;
  duration?: number;
  url?: string;
  thumbnail?: string;
  platform?: string;
  filePath?: string;
  requestedBy?: string;
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

interface BotConnection {
  host: string;
  port: number;
  connected: boolean;
  botOnline: boolean;
  guildId: string;
}

interface BotStore {
  // Connection
  connection: BotConnection;
  setConnection: (host: string, port: number) => void;
  setGuildId: (guildId: string) => void;
  connect: () => void;
  disconnect: () => void;

  // Player state
  player: PlayerState;
  updatePlayerState: (state: Partial<PlayerState>) => void;

  // Search
  searchResults: Track[];
  searchLoading: boolean;
  search: (query: string, platform?: string) => Promise<void>;
  clearSearch: () => void;

  // Actions
  play: (query: string, platform?: string) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  skip: () => Promise<void>;
  seek: (position: number) => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  setLoop: (mode: string) => Promise<void>;
  addToQueue: (query: string) => Promise<void>;
  removeFromQueue: (index: number) => Promise<void>;
  clearQueue: () => Promise<void>;
  shuffleQueue: () => Promise<void>;

  // UI
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export const useBotStore = create<BotStore>((set, get) => ({
  connection: {
    host: 'localhost',
    port: 3001,
    connected: false,
    botOnline: false,
    guildId: '',
  },

  player: {
    isPlaying: false,
    currentTrack: null,
    position: 0,
    duration: 0,
    volume: 50,
    loop: 'off',
    queue: [],
  },

  searchResults: [],
  searchLoading: false,
  sidebarCollapsed: false,

  setConnection: (host, port) =>
    set((s) => ({ connection: { ...s.connection, host, port } })),

  setGuildId: (guildId) =>
    set((s) => ({ connection: { ...s.connection, guildId } })),

  connect: () => {
    const { host, port } = get().connection;
    wsService.connect(host, port);

    wsService.on('connection', (data: unknown) => {
      const { connected } = data as { connected: boolean };
      set((s) => ({ connection: { ...s.connection, connected } }));
    });

    wsService.on('player_state', (data: unknown) => {
      const state = data as Partial<PlayerState>;
      set((s) => ({ player: { ...s.player, ...state } }));
    });

    wsService.on('queue_update', (data: unknown) => {
      const { queue } = data as { queue: Track[] };
      set((s) => ({ player: { ...s.player, queue } }));
    });

    wsService.on('track_started', (data: unknown) => {
      const track = data as Track;
      set((s) => ({
        player: { ...s.player, currentTrack: track, isPlaying: true, position: 0 },
      }));
    });

    wsService.on('bot_status', (data: unknown) => {
      const { online } = data as { online: boolean };
      set((s) => ({ connection: { ...s.connection, botOnline: online } }));
    });
  },

  disconnect: () => {
    wsService.disconnect();
    set((s) => ({ connection: { ...s.connection, connected: false } }));
  },

  updatePlayerState: (state) =>
    set((s) => ({ player: { ...s.player, ...state } })),

  search: async (query, platform) => {
    set({ searchLoading: true });
    try {
      const result = await api.search(query, platform);
      const raw = (result.data?.tracks ?? []) as Array<Record<string, unknown>>;
      const tracks: Track[] = raw.map((t) => ({
        title: (t.title as string) ?? 'Unknown',
        artist: (t.artist as string) ?? (t.author as string) ?? undefined,
        duration: (t.duration as number) ?? undefined,
        url: (t.url as string) ?? undefined,
        thumbnail: (t.thumbnail as string) ?? (t.cover as string) ?? undefined,
        platform: platform ?? 'auto',
      }));
      set({ searchResults: tracks, searchLoading: false });
    } catch {
      set({ searchResults: [], searchLoading: false });
    }
  },

  clearSearch: () => set({ searchResults: [] }),

  play: async (query, platform) => {
    try { await api.play(query, platform); } catch { /* handled by WS updates */ }
  },
  pause: async () => {
    try { await api.pause(); } catch {}
  },
  resume: async () => {
    try { await api.resume(); } catch {}
  },
  stop: async () => {
    try { await api.stop(); } catch {}
  },
  skip: async () => {
    try { await api.skip(); } catch {}
  },
  seek: async (position) => {
    try { await api.seek(position); } catch {}
  },
  setVolume: async (volume) => {
    set((s) => ({ player: { ...s.player, volume } }));
    try { await api.volume(volume); } catch {}
  },
  setLoop: async (mode) => {
    set((s) => ({ player: { ...s.player, loop: mode as PlayerState['loop'] } }));
    try { await api.loop(mode); } catch {}
  },
  addToQueue: async (query) => {
    try { await api.addToQueue(query); } catch {}
  },
  removeFromQueue: async (index) => {
    try { await api.removeFromQueue(index); } catch {}
  },
  clearQueue: async () => {
    try { await api.clearQueue(); } catch {}
  },
  shuffleQueue: async () => {
    try { await api.shuffleQueue(); } catch {}
  },

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));
