import { vi } from 'vitest';

// Mock Discord.js
vi.mock('discord.js', () => ({
  Client: vi.fn(() => ({
    login: vi.fn(),
    on: vi.fn(),
    user: { id: 'test-bot-id' },
    guilds: {
      cache: new Map(),
    },
  })),
  GatewayIntentBits: {
    Guilds: 1,
    GuildMessages: 2,
    GuildVoiceStates: 4,
  },
  Events: {
    Ready: 'ready',
    MessageCreate: 'messageCreate',
  },
}));

// Mock Discord Player
vi.mock('discord-player', () => ({
  Player: vi.fn(() => ({
    extractors: {
      loadDefault: vi.fn(),
    },
    events: {
      on: vi.fn(),
    },
    play: vi.fn(),
    pause: vi.fn(),
    stop: vi.fn(),
    skip: vi.fn(),
  })),
  BaseExtractor: class BaseExtractor {
    static identifier = 'mock-extractor';
    context: Record<string, unknown> = {};
    createResponse(playlist: unknown, tracks: unknown[]) {
      return { playlist, tracks };
    }
    async activate() {}
    async deactivate() {}
    async validate(_query: string): Promise<boolean> {
      return false;
    }
    async handle(_query: string): Promise<{ playlist: unknown; tracks: unknown[] }> {
      return { playlist: null, tracks: [] };
    }
    async stream(_track: unknown): Promise<unknown> {
      return '';
    }
  },
  Track: class Track {
    constructor(
      public player: unknown,
      public options: Record<string, unknown>,
    ) {}
  },
  Playlist: class Playlist {
    constructor(
      public player: unknown,
      public options: Record<string, unknown>,
    ) {}
  },
  QueryType: {
    AUTO: 0,
    YOUTUBE: 1,
    YOUTUBE_PLAYLIST: 2,
    SOUNDCLOUD_TRACK: 3,
    SOUNDCLOUD_PLAYLIST: 4,
    SOUNDCLOUD: 5,
    SPOTIFY_SONG: 6,
    SPOTIFY_ALBUM: 7,
    SPOTIFY_PLAYLIST: 8,
    YOUTUBE_SEARCH: 9,
    YOUTUBE_VIDEO: 10,
    SOUNDCLOUD_SEARCH: 11,
    FILE: 12,
    AUTO_SEARCH: 13,
  },
}));

// Mock file system operations
vi.mock('fs', async () => {
  const actual = await vi.importActual('fs');
  return {
    ...actual,
    existsSync: vi.fn(() => true),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
    readFileSync: vi.fn(() => '{}'),
  };
});

// Mock environment variables
(process.env as Record<string, string>).NODE_ENV = 'test';
(process.env as Record<string, string>).DISCORD_TOKEN = 'test-token';
(process.env as Record<string, string>).PORT = '3001';
