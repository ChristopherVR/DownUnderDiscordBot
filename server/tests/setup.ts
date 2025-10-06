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
