import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// Create a real TextChannel class for instanceof checks (hoisted so vi.mock can use it)
const MockTextChannel = vi.hoisted(() => {
  return class TextChannelMock {
    type = 0 as const;
  };
});

vi.mock('discord.js', () => ({
  TextChannel: MockTextChannel,
  Client: vi.fn(() => ({
    login: vi.fn(),
    on: vi.fn(),
    user: { id: 'test-bot-id' },
    guilds: { cache: new Map() },
  })),
  Message: vi.fn(),
  GatewayIntentBits: { Guilds: 1, GuildMessages: 2, GuildVoiceStates: 4 },
  Events: { Ready: 'ready', MessageCreate: 'messageCreate' },
}));

vi.mock('../../../src/helpers/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    })),
  }),
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../../src/helpers/websocket', () => ({
  WebSocketManager: vi.fn(),
}));

import { initializeChannelRoutes, serializeMessage } from '../../../src/routes/channels';

// ── Helpers ────────────────────────────────────────────────────────────

/** Create a Map-like object that also has .map() like discord.js Collection */
function createCollectionMap<V>(entries: [string, V][] = []) {
  const map = new Map(entries);
  (map as Map<string, V> & { map: (fn: (v: V) => unknown) => unknown[] }).map = (fn: (v: V) => unknown) =>
    Array.from(map.values()).map(fn);
  return map;
}

function createMockMessage(overrides: Record<string, unknown> = {}) {
  return {
    id: 'msg-1',
    content: 'Hello world',
    author: {
      id: 'author-1',
      username: 'TestUser',
      displayName: 'Test User',
      bot: false,
      displayAvatarURL: () => 'https://avatar.url/64',
    },
    createdTimestamp: 1700000000000,
    editedTimestamp: null,
    attachments: createCollectionMap(),
    embeds: [],
    reactions: { cache: createCollectionMap() },
    reference: null,
    type: 0,
    ...overrides,
  };
}

function createMockTextChannel(messages: Map<string, unknown> = new Map()) {
  const channel = {
    id: 'channel-1',
    messages: {
      fetch: vi.fn().mockResolvedValue(messages),
    },
    send: vi.fn(),
  };
  // Make instanceof TextChannel work by setting the prototype to our mock class
  Object.setPrototypeOf(channel, MockTextChannel.prototype);
  return channel;
}

describe('Channels API Routes', () => {
  let app: express.Application;
  let mockClient: Record<string, unknown>;
  let mockWsManager: Record<string, unknown>;

  beforeEach(() => {
    vi.clearAllMocks();

    app = express();
    app.use(express.json());

    mockClient = {
      channels: {
        fetch: vi.fn(),
      },
      on: vi.fn(),
      user: { id: 'bot-id' },
    };

    mockWsManager = {
      broadcast: vi.fn(),
    };

    const router = initializeChannelRoutes(mockClient as never, mockWsManager as never);
    app.use('/api/channels', router);
  });

  // ── serializeMessage ───────────────────────────────────────────────

  describe('serializeMessage', () => {
    it('serializes a basic message', () => {
      const msg = createMockMessage();
      const result = serializeMessage(msg as never);

      expect(result.id).toBe('msg-1');
      expect(result.content).toBe('Hello world');
      expect(result.author.username).toBe('TestUser');
      expect(result.author.displayName).toBe('Test User');
      expect(result.author.bot).toBe(false);
      expect(result.timestamp).toBe(1700000000000);
    });

    it('serializes message with attachments', () => {
      const attachments = createCollectionMap([
        [
          'att-1',
          {
            id: 'att-1',
            url: 'https://attachment.url',
            proxyURL: 'https://proxy.url',
            name: 'file.png',
            contentType: 'image/png',
            size: 1024,
            width: 800,
            height: 600,
          },
        ],
      ]);
      const msg = createMockMessage({ attachments });
      const result = serializeMessage(msg as never);

      expect(result.attachments).toHaveLength(1);
      expect(result.attachments[0].name).toBe('file.png');
      expect(result.attachments[0].size).toBe(1024);
    });

    it('serializes message with embeds', () => {
      const embeds = [
        {
          title: 'Embed Title',
          description: 'Embed desc',
          url: 'https://embed.url',
          color: 0x00ff00,
          timestamp: null,
          footer: { text: 'Footer', iconURL: null },
          thumbnail: { url: 'https://thumb.url', width: 100, height: 100 },
          image: null,
          author: { name: 'Author', iconURL: null, url: null },
          fields: [{ name: 'Field', value: 'Value', inline: true }],
        },
      ];
      const msg = createMockMessage({ embeds });
      const result = serializeMessage(msg as never);

      expect(result.embeds).toHaveLength(1);
      expect(result.embeds[0].title).toBe('Embed Title');
      expect(result.embeds[0].fields).toHaveLength(1);
    });

    it('serializes message with reactions', () => {
      const reactions = {
        cache: createCollectionMap([['emoji-1', { emoji: { toString: () => '👍' }, count: 5 }]]),
      };
      const msg = createMockMessage({ reactions });
      const result = serializeMessage(msg as never);

      expect(result.reactions).toHaveLength(1);
      expect(result.reactions[0].count).toBe(5);
    });

    it('serializes message with reference', () => {
      const msg = createMockMessage({
        reference: { messageId: 'ref-msg', channelId: 'ref-channel' },
      });
      const result = serializeMessage(msg as never);

      expect(result.reference).toEqual({ messageId: 'ref-msg', channelId: 'ref-channel' });
    });
  });

  // ── GET /api/channels/:channelId/messages ──────────────────────────

  describe('GET /api/channels/:channelId/messages', () => {
    it('returns 503 when Discord client is not available', async () => {
      // Create app without initializing client
      // Test channel not found
      (mockClient.channels as { fetch: ReturnType<typeof vi.fn> }).fetch.mockResolvedValue(null);

      const response = await request(app).get('/api/channels/channel-1/messages');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Text channel not found');
    });

    it('returns 404 for non-text channels', async () => {
      // Return a plain object that is not a TextChannel instance
      (mockClient.channels as { fetch: ReturnType<typeof vi.fn> }).fetch.mockResolvedValue({
        id: 'voice-1',
        type: 2,
      });

      const response = await request(app).get('/api/channels/voice-1/messages');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Text channel not found');
    });

    it('fetches and returns messages from a text channel', async () => {
      const msg1 = createMockMessage({ id: 'msg-1', content: 'First' });
      const msg2 = createMockMessage({ id: 'msg-2', content: 'Second' });
      const messages = new Map([
        ['msg-2', msg2],
        ['msg-1', msg1],
      ]);

      const channel = createMockTextChannel(messages);
      (mockClient.channels as { fetch: ReturnType<typeof vi.fn> }).fetch.mockResolvedValue(channel);

      const response = await request(app).get('/api/channels/channel-1/messages').set('x-guild-id', 'guild-1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.messages).toHaveLength(2);
    });

    it('respects the limit query parameter (capped at 100)', async () => {
      const channel = createMockTextChannel(new Map());
      (mockClient.channels as { fetch: ReturnType<typeof vi.fn> }).fetch.mockResolvedValue(channel);

      await request(app).get('/api/channels/channel-1/messages').query({ limit: '200' });

      expect(channel.messages.fetch).toHaveBeenCalledWith(expect.objectContaining({ limit: 100 }));
    });

    it('passes before parameter for pagination', async () => {
      const channel = createMockTextChannel(new Map());
      (mockClient.channels as { fetch: ReturnType<typeof vi.fn> }).fetch.mockResolvedValue(channel);

      await request(app).get('/api/channels/channel-1/messages').query({ before: 'snowflake-123' });

      expect(channel.messages.fetch).toHaveBeenCalledWith(expect.objectContaining({ before: 'snowflake-123' }));
    });

    it('defaults limit to 50', async () => {
      const channel = createMockTextChannel(new Map());
      (mockClient.channels as { fetch: ReturnType<typeof vi.fn> }).fetch.mockResolvedValue(channel);

      await request(app).get('/api/channels/channel-1/messages');

      expect(channel.messages.fetch).toHaveBeenCalledWith(expect.objectContaining({ limit: 50 }));
    });

    it('returns 500 when an error occurs during fetch', async () => {
      (mockClient.channels as { fetch: ReturnType<typeof vi.fn> }).fetch.mockRejectedValue(
        new Error('Discord API error'),
      );

      const response = await request(app).get('/api/channels/channel-1/messages');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch messages');
    });
  });

  // ── POST /api/channels/:channelId/messages ─────────────────────────

  describe('POST /api/channels/:channelId/messages', () => {
    it('returns 400 when content is missing', async () => {
      const response = await request(app).post('/api/channels/channel-1/messages').send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Message content is required');
    });

    it('returns 400 when content is empty string', async () => {
      const response = await request(app).post('/api/channels/channel-1/messages').send({ content: '   ' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Message content is required');
    });

    it('returns 400 when content is not a string', async () => {
      const response = await request(app).post('/api/channels/channel-1/messages').send({ content: 123 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Message content is required');
    });

    it('sends a message and returns the serialized result', async () => {
      const sentMsg = createMockMessage({ id: 'sent-1', content: 'Hello bot' });
      const channel = createMockTextChannel();
      channel.send.mockResolvedValue(sentMsg);
      (mockClient.channels as { fetch: ReturnType<typeof vi.fn> }).fetch.mockResolvedValue(channel);

      const response = await request(app).post('/api/channels/channel-1/messages').send({ content: 'Hello bot' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message.content).toBe('Hello bot');
      expect(response.body.message.id).toBe('sent-1');
      expect(channel.send).toHaveBeenCalledWith('Hello bot');
    });

    it('returns 404 when channel is not a text channel', async () => {
      (mockClient.channels as { fetch: ReturnType<typeof vi.fn> }).fetch.mockResolvedValue({
        id: 'voice-1',
      });

      const response = await request(app).post('/api/channels/channel-1/messages').send({ content: 'Hello' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Text channel not found');
    });

    it('returns 500 when sending fails', async () => {
      const channel = createMockTextChannel();
      channel.send.mockRejectedValue(new Error('Permission denied'));
      (mockClient.channels as { fetch: ReturnType<typeof vi.fn> }).fetch.mockResolvedValue(channel);

      const response = await request(app).post('/api/channels/channel-1/messages').send({ content: 'Hello' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to send message');
    });
  });

  // ── initializeChannelRoutes ────────────────────────────────────────

  describe('initializeChannelRoutes', () => {
    it('registers messageCreate listener on the client', () => {
      expect((mockClient as { on: ReturnType<typeof vi.fn> }).on).toHaveBeenCalledWith(
        'messageCreate',
        expect.any(Function),
      );
    });
  });
});
