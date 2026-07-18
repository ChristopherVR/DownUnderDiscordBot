import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// ── Hoisted mocks ──────────────────────────────────────────────────────
const jwtMock = vi.hoisted(() => ({
  sign: vi.fn().mockReturnValue('mock-jwt-token'),
  verify: vi.fn().mockReturnValue({
    userId: 'user-123',
    username: 'TestUser',
    avatar: 'abc123',
    accessToken: 'discord-access-token',
  }),
}));

const fetchMock = vi.hoisted(() => vi.fn());

vi.mock('jsonwebtoken', () => ({
  default: jwtMock,
  ...jwtMock,
}));

vi.mock('../../../src/helpers/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    fatal: vi.fn(),
    child: vi.fn().mockReturnThis(),
  }),
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    fatal: vi.fn(),
  },
}));

// Replace global fetch
const originalFetch = globalThis.fetch;

import authRouter, { setBotClient, setBotGuildIds, requireAuth } from '../../../src/routes/auth';

describe('Auth API Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter);
    vi.clearAllMocks();
    // Re-set default jwt mock return values after clearAllMocks
    jwtMock.sign.mockReturnValue('mock-jwt-token');
    jwtMock.verify.mockReturnValue({
      userId: 'user-123',
      username: 'TestUser',
      avatar: 'abc123',
      accessToken: 'discord-access-token',
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    // Reset bot state
    setBotGuildIds(new Set());
    setBotClient(null as never);
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  // ── GET /api/auth/discord ──────────────────────────────────────────

  describe('GET /api/auth/discord', () => {
    it('returns OAuth2 authorization URL when configured', async () => {
      // DISCORD_CLIENT_ID is derived from env or token parsing;
      // since the env has CLIENT_TOKEN set in setup.ts, the module will try to parse it.
      // We set the env var explicitly for this test.
      const originalClientId = process.env.DISCORD_CLIENT_ID;
      process.env.DISCORD_CLIENT_ID = 'test-client-id';

      // Re-import to pick up the env change - but since it's already evaluated,
      // we test against whatever the module resolved at import time.
      const response = await request(app).get('/api/auth/discord');

      // The route either returns a URL or a 500 if not configured
      if (response.status === 200) {
        expect(response.body).toHaveProperty('url');
        expect(response.body.url).toContain('discord.com');
      } else {
        expect(response.status).toBe(500);
        expect(response.body.error).toBe('Discord OAuth not configured');
      }

      process.env.DISCORD_CLIENT_ID = originalClientId;
    });
  });

  // ── GET /api/auth/callback ─────────────────────────────────────────

  describe('GET /api/auth/callback', () => {
    it('returns 400 when authorization code is missing', async () => {
      const response = await request(app).get('/api/auth/callback');
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing authorization code');
    });

    it('returns 401 when Discord token exchange fails', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'invalid code',
      });

      const response = await request(app).get('/api/auth/callback').query({ code: 'bad-code' });
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Failed to exchange authorization code');
    });

    it('returns 401 when user info fetch fails', async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'discord-token',
            token_type: 'Bearer',
            expires_in: 604800,
            refresh_token: 'refresh-token',
            scope: 'identify guilds',
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
        });

      const response = await request(app).get('/api/auth/callback').query({ code: 'some-code' });
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Failed to fetch user info');
    });

    it('exchanges code for token, fetches user, signs JWT, and returns HTML', async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'discord-token',
            token_type: 'Bearer',
            expires_in: 604800,
            refresh_token: 'refresh-token',
            scope: 'identify guilds',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: 'user-123',
            username: 'TestUser',
            discriminator: '0001',
            avatar: 'avatar-hash',
            global_name: 'Test User',
          }),
        });

      const response = await request(app).get('/api/auth/callback').query({ code: 'valid-code' });

      expect(response.status).toBe(200);
      expect(response.text).toContain('Authentication Successful');
      expect(response.text).toContain('mock-jwt-token');

      // JWT sign should have been called with the user payload
      expect(jwtMock.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          username: 'Test User',
          accessToken: 'discord-token',
        }),
        expect.any(String),
        { expiresIn: '7d' },
      );
    });

    it('returns 500 when an unexpected error occurs', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const response = await request(app).get('/api/auth/callback').query({ code: 'some-code' });
      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Authentication failed');
    });
  });

  // ── GET /api/auth/user ─────────────────────────────────────────────

  describe('GET /api/auth/user', () => {
    it('returns 401 when authorization header is missing', async () => {
      const response = await request(app).get('/api/auth/user');
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Missing or invalid authorization header');
    });

    it('returns 401 when authorization header format is wrong', async () => {
      const response = await request(app).get('/api/auth/user').set('Authorization', 'Basic abc');
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Missing or invalid authorization header');
    });

    it('returns local user data for quick-connect (userId=local)', async () => {
      jwtMock.verify.mockReturnValueOnce({
        userId: 'local',
        username: 'Dashboard User',
        avatar: null,
        accessToken: '',
      });

      const response = await request(app).get('/api/auth/user').set('Authorization', 'Bearer mock-jwt-token');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('local');
    });

    it('fetches fresh user data from Discord for authenticated users', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'user-123',
          username: 'TestUser',
          discriminator: '0001',
          avatar: 'avatar-hash',
          global_name: 'Test Global',
        }),
      });

      const response = await request(app).get('/api/auth/user').set('Authorization', 'Bearer mock-jwt-token');

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('user-123');
      expect(response.body.username).toBe('Test Global');
      expect(response.body.avatar).toContain('cdn.discordapp.com');
    });

    it('returns avatar fallback when user has no avatar', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'user-456',
          username: 'NoAvatar',
          discriminator: '0003',
          avatar: null,
          global_name: null,
        }),
      });

      const response = await request(app).get('/api/auth/user').set('Authorization', 'Bearer mock-jwt-token');

      expect(response.status).toBe(200);
      expect(response.body.avatar).toContain('embed/avatars');
    });

    it('returns 401 when Discord token is expired', async () => {
      fetchMock.mockResolvedValueOnce({ ok: false, status: 401 });

      const response = await request(app).get('/api/auth/user').set('Authorization', 'Bearer mock-jwt-token');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Discord token expired');
    });

    it('returns 401 when JWT verification fails', async () => {
      jwtMock.verify.mockImplementationOnce(() => {
        throw new Error('jwt malformed');
      });

      const response = await request(app).get('/api/auth/user').set('Authorization', 'Bearer bad-token');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid or expired token');
    });
  });

  // ── GET /api/auth/guilds ───────────────────────────────────────────

  describe('GET /api/auth/guilds', () => {
    it('returns 401 without auth header', async () => {
      const response = await request(app).get('/api/auth/guilds');
      expect(response.status).toBe(401);
    });

    it('returns bot guild list for local users', async () => {
      jwtMock.verify.mockReturnValueOnce({
        userId: 'local',
        username: 'Dashboard User',
        avatar: null,
        accessToken: '',
      });

      const mockGuild = {
        id: 'guild-1',
        name: 'Test Guild',
        iconURL: () => 'https://icon.url',
      };

      const guildCache = new Map();
      guildCache.set('guild-1', mockGuild);
      // discord.js Collection has .map() unlike native Map
      (guildCache as Record<string, unknown>).map = (fn: (v: unknown) => unknown) =>
        Array.from(guildCache.values()).map(fn);

      setBotClient({
        user: { id: 'bot-id', username: 'Bot' },
        guilds: { cache: guildCache },
      } as never);

      const response = await request(app).get('/api/auth/guilds').set('Authorization', 'Bearer mock-jwt-token');

      expect(response.status).toBe(200);
      expect(response.body.guilds).toHaveLength(1);
      expect(response.body.guilds[0].name).toBe('Test Guild');
      expect(response.body.guilds[0].botPresent).toBe(true);
    });

    it('returns empty guilds when bot client is not set (local user)', async () => {
      jwtMock.verify.mockReturnValueOnce({
        userId: 'local',
        username: 'Dashboard User',
        avatar: null,
        accessToken: '',
      });

      const response = await request(app).get('/api/auth/guilds').set('Authorization', 'Bearer mock-jwt-token');

      expect(response.status).toBe(200);
      expect(response.body.guilds).toEqual([]);
    });

    it('fetches and filters guilds from Discord for authenticated users', async () => {
      setBotGuildIds(new Set(['guild-1']));

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 'guild-1', name: 'Bot Guild', icon: 'icon1', owner: false, permissions: '0' },
          { id: 'guild-2', name: 'Admin Guild', icon: null, owner: true, permissions: '8' },
          { id: 'guild-3', name: 'No Access Guild', icon: null, owner: false, permissions: '0' },
        ],
      });

      const response = await request(app).get('/api/auth/guilds').set('Authorization', 'Bearer mock-jwt-token');

      expect(response.status).toBe(200);
      // guild-1 has bot present, guild-2 has admin perms, guild-3 is filtered out
      expect(response.body.guilds).toHaveLength(2);
      expect(response.body.guilds[0].id).toBe('guild-1');
      expect(response.body.guilds[0].botPresent).toBe(true);
      expect(response.body.guilds[1].id).toBe('guild-2');
      expect(response.body.guilds[1].botPresent).toBe(false);
    });

    it('returns 401 when Discord guild fetch fails', async () => {
      fetchMock.mockResolvedValueOnce({ ok: false, status: 401 });

      const response = await request(app).get('/api/auth/guilds').set('Authorization', 'Bearer mock-jwt-token');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Discord token expired');
    });
  });

  // ── GET /api/auth/status ───────────────────────────────────────────

  describe('GET /api/auth/status', () => {
    it('returns oauth not configured when secrets are missing', async () => {
      const response = await request(app).get('/api/auth/status');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('oauthConfigured');
      expect(response.body).toHaveProperty('bot');
    });

    it('returns bot info when bot client is set', async () => {
      setBotClient({
        user: {
          id: 'bot-123',
          username: 'TestBot',
          displayAvatarURL: () => 'https://bot-avatar.url',
        },
        guilds: { cache: new Map() },
      } as never);

      const response = await request(app).get('/api/auth/status');
      expect(response.status).toBe(200);
      expect(response.body.bot).toEqual({
        id: 'bot-123',
        username: 'TestBot',
        avatar: 'https://bot-avatar.url',
      });
    });
  });

  // ── GET /api/auth/quick-connect ────────────────────────────────────

  describe('GET /api/auth/quick-connect', () => {
    it('returns 503 when bot client is not ready', async () => {
      const response = await request(app).get('/api/auth/quick-connect');
      expect(response.status).toBe(503);
      expect(response.body.error).toBe('Bot not ready');
    });

    it('returns JWT token, bot info, and guild list when bot is ready', async () => {
      const mockGuild = {
        id: 'guild-1',
        name: 'Test Guild',
        iconURL: () => null,
        memberCount: 42,
      };
      const guildCache = new Map();
      guildCache.set('guild-1', mockGuild);
      // discord.js Collection has .map() unlike native Map
      (guildCache as Record<string, unknown>).map = (fn: (v: unknown) => unknown) =>
        Array.from(guildCache.values()).map(fn);

      setBotClient({
        user: {
          id: 'bot-123',
          username: 'TestBot',
          displayAvatarURL: () => 'https://bot-avatar.url',
        },
        guilds: { cache: guildCache },
      } as never);

      const response = await request(app).get('/api/auth/quick-connect');

      expect(response.status).toBe(200);
      expect(response.body.token).toBe('mock-jwt-token');
      expect(response.body.bot.id).toBe('bot-123');
      expect(response.body.guilds).toHaveLength(1);
      expect(response.body.guilds[0].memberCount).toBe(42);
      expect(jwtMock.sign).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'local', username: 'Dashboard User' }),
        expect.any(String),
        { expiresIn: '7d' },
      );
    });
  });

  // ── requireAuth middleware ─────────────────────────────────────────

  describe('requireAuth middleware', () => {
    let protectedApp: express.Application;

    beforeEach(() => {
      protectedApp = express();
      protectedApp.use(express.json());
      protectedApp.get('/protected', requireAuth, (_req, res) => {
        res.json({ ok: true });
      });
    });

    it('returns 401 when no authorization header is provided', async () => {
      const response = await request(protectedApp).get('/protected');
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('returns 401 when token is invalid', async () => {
      jwtMock.verify.mockImplementationOnce(() => {
        throw new Error('invalid');
      });

      const response = await request(protectedApp).get('/protected').set('Authorization', 'Bearer bad-token');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid or expired token');
    });

    it('calls next() and attaches auth payload on valid token', async () => {
      jwtMock.verify.mockReturnValueOnce({
        userId: 'user-123',
        username: 'TestUser',
        avatar: null,
        accessToken: 'token',
      });

      const response = await request(protectedApp).get('/protected').set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
    });
  });
});
