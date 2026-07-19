import 'dotenv/config';
import express from 'express';
import type { Request, RequestHandler } from 'express';
import path from 'path';
import { promises as fs } from 'fs';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import http from 'http';
import type { IncomingMessage } from 'http';

type IncomingMessageWithAuth = IncomingMessage & { auth?: { userId: string; username?: string } };
import { v4 as uuid } from 'uuid';
import { fileURLToPath } from 'url';
import type { Logger } from 'pino';
import { logger, createLogger, onLogEntry } from './helpers/logger';
import uploadRoutes from './routes/upload';
import musicRoutes from './routes/music';
import playlistRoutes from './routes/playlists';
import libraryRoutes from './routes/library';
import authRoutes, {
  setBotGuildIds,
  setBotClient,
  requireAuth,
  requireGuildAccess,
  verifyJwtToken,
} from './routes/auth';
import { initializeCommandRoutes } from './routes/commands';
import { initializeChannelRoutes } from './routes/channels';
import { createLogsRouter } from './routes/logs';
import { ensureUploadDir } from './helpers/fileUpload';
import { guildLockMiddleware } from './helpers/guildLock';
import { WebSocketManager } from './helpers/websocket';
import { tErrors, initI18n } from 'discord-dashboard-shared/localization';
import { resolveI18nLoadPath } from './helpers/localesPath';

import { LogMessage } from './types';
import { startBot } from './bot';
import { isE2EMode, registerTestRoutes } from './testMode/index';
import { getDatabase, ensureSchema } from './database/client';
import { getPlayerStateManager } from './helpers/discord/player';

// index.ts (or the first file that runs)
// import ffmpeg from '@ffmpeg-installer/ffmpeg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// packages/bot/src (tsx dev) or packages/bot/dist (compiled) → packages/bot →
// packages → project root. Both src/ and dist/ sit at the same depth under
// packages/bot/, so this is 3 levels up either way - the previous version
// used a different depth per case, which produced a `packages/packages/...`
// path outside a compiled dist build (e.g. under `tsx`/e2e).
const projectRoot = path.resolve(__dirname, '..', '..', '..');
const localesDir = path.resolve(projectRoot, 'packages', 'shared', 'src', 'localization', 'locales');

const serverLog = createLogger('server');

// Prefer a user override if present; otherwise use the bundled binary.
process.env.FFMPEG_PATH = process.env.FFMPEG_PATH || 'ffmpeg';
serverLog.info({ ffmpeg: process.env.FFMPEG_PATH }, 'FFmpeg configuration');
const wsLog = serverLog.child({ layer: 'websocket' });
const discordLog = serverLog.child({ layer: 'discord' });

async function main() {
  serverLog.info('Bootstrapping Discord dashboard server');

  // Make sure the database schema exists before anything queries it. A bundled
  // or first-run bot points at an empty SQLite file with no `prisma db push`
  // step, so create any missing tables/indexes up front.
  serverLog.debug('Ensuring database schema');
  await ensureSchema();
  serverLog.info('Database schema ready');

  serverLog.debug('Initializing localization resources');
  // Initialize localization for server
  await initI18n({
    isServer: true,
    lng: 'en',
    debug: process.env.NODE_ENV === 'development',
    loadPath: resolveI18nLoadPath(),
  });
  serverLog.info('Localization initialized');

  serverLog.debug('Creating Express application');
  const app = express();
  serverLog.debug('Registering HTTP middleware');

  const requestLogger = serverLog.child({ layer: 'api-request' });
  const getRequestLogger = (req: Request & { log?: Logger }) => req.log ?? requestLogger;
  const withEndpointLog = (req: Request, endpoint: string) => getRequestLogger(req).child({ endpoint });

  const httpMiddleware: RequestHandler = (req, res, next) => {
    const start = process.hrtime.bigint();
    const httpLog = serverLog.child({ layer: 'http', method: req.method, url: req.url });
    (req as Request & { log?: Logger }).log = httpLog;

    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
      const { statusCode } = res;
      const logPayload = { statusCode, durationMs };
      if (statusCode >= 500) {
        httpLog.error(logPayload, 'Request completed');
      } else if (statusCode >= 400) {
        httpLog.warn(logPayload, 'Request completed');
      } else {
        httpLog.info(logPayload, 'Request completed');
      }
    });

    next();
  };

  app.use(httpMiddleware);

  app.use(cors());
  app.use(express.json());

  // Content-Security-Policy for browser (web-mode) clients. Tauri enforces its
  // own CSP from tauri.conf.json and ignores this header.
  app.use((_req, res, next) => {
    res.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "connect-src 'self' ws: wss: https://discord.com https://cdn.discordapp.com",
        "img-src 'self' https: data:",
        "media-src 'self' blob:",
        "style-src 'self' 'unsafe-inline'",
        "script-src 'self' 'unsafe-inline'",
        "font-src 'self' data:",
      ].join('; '),
    );
    next();
  });

  app.get('/api/locales/:lng/:ns', async (req, res) => {
    const { lng, ns } = req.params;
    const namespace = ns.replace(/\.json$/, '');
    const requestLog = withEndpointLog(req, 'locales').child({ lng, namespace });
    requestLog.debug('Locale bundle requested');
    try {
      const filePath = path.resolve(localesDir, lng, `${namespace}.json`);
      const file = await fs.readFile(filePath, 'utf-8');
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.send(file);
      requestLog.info('Locale bundle served');
    } catch (error: unknown) {
      requestLog.warn({ err: error }, 'Missing translation bundle');
      res.status(404).json({ error: 'Translation not found' });
    }
  });

  // Ensure upload directory exists
  serverLog.debug('Ensuring upload directory');
  await ensureUploadDir();
  serverLog.info('Upload directory ready');

  // ------------------------------
  // Log storage (used by /api/logs)
  // ------------------------------
  const auditLogs: LogMessage[] = [];
  const commandLogs: LogMessage[] = [];

  function pushLog(
    category: 'audit' | 'command' | 'system',
    level: 'info' | 'warn' | 'error' | 'debug',
    message: string,
    source?: string,
    metadata?: Record<string, unknown>,
    guildId?: string,
  ) {
    const resolvedGuildId =
      guildId ?? (metadata && typeof metadata.guildId === 'string' ? (metadata.guildId as string) : undefined);
    const log: LogMessage = {
      id: uuid(),
      category,
      level,
      message,
      ts: Date.now(),
      source,
      guildId: resolvedGuildId,
      metadata,
    };
    if (category === 'audit') auditLogs.unshift(log);
    else if (category === 'command') commandLogs.unshift(log);
    else auditLogs.unshift(log); // system logs go to audit logs
    if (auditLogs.length > 1000) auditLogs.pop();
    if (commandLogs.length > 1000) commandLogs.pop();
    broadcastLog({ type: 'log', payload: log });
  }

  // ------------------------------
  // WebSocket setup
  // ------------------------------
  const server = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true });
  const wsManager = new WebSocketManager(wss);

  // Manual HTTP upgrade handling so we can verify the JWT before the WS
  // handshake completes. The token is expected as a `?token=` query parameter
  // on the upgrade request (browsers cannot set Authorization headers on WS).
  server.on('upgrade', (req, socket, head) => {
    if (!req.url?.startsWith('/ws')) {
      socket.destroy();
      return;
    }

    const rejectUnauthorized = (body?: string) => {
      const message = body ?? 'Unauthorized';
      socket.write(
        `HTTP/1.1 401 Unauthorized\r\nContent-Type: text/plain\r\nContent-Length: ${Buffer.byteLength(message)}\r\nConnection: close\r\n\r\n${message}`,
      );
      socket.destroy();
    };

    try {
      const parsed = new URL(req.url, 'http://localhost');
      const token = parsed.searchParams.get('token');
      if (!token) {
        rejectUnauthorized('Missing token');
        return;
      }
      const payload = verifyJwtToken(token);
      (req as IncomingMessageWithAuth).auth = { userId: payload.userId, username: payload.username };

      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    } catch (err) {
      wsLog.warn({ err }, 'WebSocket upgrade rejected: invalid token');
      rejectUnauthorized('Invalid or expired token');
    }
  });

  function broadcastLog(data: { type: 'log'; payload: LogMessage }) {
    const logEntry = {
      ...data.payload,
      timestamp: data.payload.ts,
    };
    wsManager.broadcastLogEntry(logEntry);
  }

  // Wire up the pino logger so every log entry populates the in-memory arrays
  // and is broadcast to WebSocket clients in real-time.
  onLogEntry((entry) => {
    const level = entry.level as string;
    const msg = String(entry.msg ?? '');
    const context = (entry.context as string) ?? 'system';
    const entryGuildId = typeof entry.guildId === 'string' ? (entry.guildId as string) : undefined;

    // Map pino level label to our level type
    let logLevel: 'info' | 'warn' | 'error' | 'debug' = 'info';
    if (level === 'warn' || level === 'warning') logLevel = 'warn';
    else if (level === 'error' || level === 'fatal') logLevel = 'error';
    else if (level === 'debug' || level === 'trace') logLevel = 'debug';

    // Derive category from context binding
    let category: 'audit' | 'command' | 'system' = 'system';
    if (context.toLowerCase().includes('command')) category = 'command';
    else if (context.toLowerCase().includes('audit')) category = 'audit';

    pushLog(category, logLevel, msg, context, entry as Record<string, unknown>, entryGuildId);
  });

  // ------------------------------
  // Start Discord bot + state service
  // ------------------------------
  serverLog.info('Starting Discord bot');
  const botCtx = await startBot(wsManager);
  serverLog.info({ guildId: botCtx.GUILD_ID }, 'Discord bot started');

  // Sync bot guild IDs for auth route filtering
  const syncBotGuilds = () => {
    const ids = new Set(botCtx.client.guilds.cache.map((g) => g.id));
    setBotGuildIds(ids);
  };
  syncBotGuilds();
  setBotClient(botCtx.client);
  // Re-sync periodically as bot joins/leaves guilds
  setInterval(syncBotGuilds, 60_000);
  const _GUILD_ID = botCtx.GUILD_ID;
  const state = botCtx.state;

  // Connect WebSocket manager to player system after bot initialization
  try {
    const { setWebSocketManager } = await import('./helpers/discord/player');
    discordLog.info('WebSocket manager linked to player system');
    setWebSocketManager(wsManager);
  } catch (error: unknown) {
    discordLog.warn({ err: error }, 'Failed to connect WebSocket manager to player system');
  }

  // Commands are now automatically registered by the CommandRegistry service

  // ------------------------------
  // REST endpoints
  // ------------------------------
  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  // Guild voice channels endpoint
  app.get('/api/guild/:guildId/voice-channels', requireAuth, requireGuildAccess, (req, res) => {
    const guildId = String(req.params.guildId);
    const guild = botCtx.client.guilds.cache.get(guildId);
    if (!guild) {
      return res.status(404).json({ error: 'Guild not found' });
    }

    const channels = guild.channels.cache
      .filter((ch) => ch.type === 2) // GuildVoice = 2
      .map((ch) => ({
        id: ch.id,
        name: ch.name,
        userCount: 'members' in ch ? ch.members.size : 0,
      }));

    res.json({ channels });
  });

  // Bot management endpoint - status info
  app.get('/api/bot/status', requireAuth, (_req, res) => {
    const client = botCtx.client;
    res.json({
      online: client.isReady(),
      uptime: client.uptime ?? 0,
      guilds: client.guilds.cache.size,
      username: client.user?.username ?? null,
      avatar: client.user?.displayAvatarURL?.() ?? null,
    });
  });

  // Comprehensive dashboard endpoint - aggregates all status info
  app.get('/api/dashboard', requireAuth, async (_req, res) => {
    const client = botCtx.client;
    const wsStats = wsManager.getStats();

    // Gather per-guild player info from the discord-player instance
    const guildStatuses = client.guilds.cache.map((guild) => {
      const queue = botCtx.player.nodes.get(guild.id);
      const isPlaying = queue?.isPlaying() ?? false;
      const currentTrack = queue?.currentTrack;
      const queueSize = queue?.tracks.data.length ?? 0;
      const voiceChannelId = queue?.channel?.id ?? null;
      const voiceChannelName = queue?.channel?.name ?? null;

      return {
        guildId: guild.id,
        guildName: guild.name,
        guildIcon: guild.iconURL({ size: 64 }),
        memberCount: guild.memberCount,
        player: {
          active: !!queue && (isPlaying || !!currentTrack),
          isPlaying,
          currentTrack: currentTrack
            ? {
                title: currentTrack.title,
                artist: currentTrack.author,
                duration: currentTrack.duration,
                thumbnail: currentTrack.thumbnail,
                url: currentTrack.url,
              }
            : null,
          queueSize,
          voiceChannelId,
          voiceChannelName,
        },
      };
    });

    // ---  Bot instance tracking from the state service ---
    const onlineInstancesByGuild: Record<
      string,
      Array<{
        instanceId: string;
        online: boolean;
        lastHeartbeat: number;
        isActive: boolean;
        forceStopped?: boolean;
        hostname?: string;
        pid?: number;
        shardId?: number;
        extra?: Record<string, unknown>;
      }>
    > = {};
    let healthStatus = { totalInstances: 0, onlineInstances: 0, guildsWithBots: 0, lastUpdated: 0 };

    try {
      // Opportunistically clean up stale instances before building the response
      await state.removeTimedOutInstances();

      // Fetch ALL instances (not just online) so force-stopped / offline ones
      // still appear in the dashboard with the correct heartbeatStatus.
      const fullState = await state.getState();
      for (const [guildId, guild] of Object.entries(fullState.guilds)) {
        const instances = Object.values(guild.instances);
        if (instances.length > 0) {
          onlineInstancesByGuild[guildId] = instances;
        }
      }
      healthStatus = await state.getHealthStatus();
    } catch (err) {
      serverLog.warn({ err }, 'Failed to fetch instance state for dashboard');
    }

    // Build a de-duplicated list of unique bot instances across all guilds
    const instanceMap = new Map<
      string,
      {
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
        guilds: Array<{ guildId: string; guildName: string; isActiveForGuild: boolean }>;
      }
    >();

    for (const [guildId, instances] of Object.entries(onlineInstancesByGuild)) {
      const guild = client.guilds.cache.get(guildId);
      const guildName = guild?.name ?? guildId;

      for (const inst of instances) {
        const existing = instanceMap.get(inst.instanceId);
        const guildEntry = { guildId, guildName, isActiveForGuild: inst.isActive };

        if (existing) {
          existing.guilds.push(guildEntry);
          // upgrade the global 'isActive' flag if active in any guild
          if (inst.isActive) existing.isActive = true;
          // keep the freshest heartbeat
          if (inst.lastHeartbeat > existing.lastHeartbeat) {
            existing.lastHeartbeat = inst.lastHeartbeat;
          }
        } else {
          const uptimeRaw = (inst.extra as Record<string, unknown> | undefined)?.uptime;
          instanceMap.set(inst.instanceId, {
            instanceId: inst.instanceId,
            hostname: inst.hostname ?? null,
            pid: inst.pid ?? null,
            shardId: inst.shardId ?? null,
            online: inst.online,
            isActive: inst.isActive,
            lastHeartbeat: inst.lastHeartbeat,
            uptimeSeconds: typeof uptimeRaw === 'number' ? Math.floor(uptimeRaw) : null,
            heartbeatStatus: state.getHeartbeatStatus(inst as import('./state/schema').InstanceInfo),
            forceStopped: !!(inst as Record<string, unknown>).forceStopped,
            guilds: [guildEntry],
          });
        }
      }
    }

    res.json({
      bot: {
        online: client.isReady(),
        uptime: client.uptime ?? 0,
        username: client.user?.username ?? null,
        discriminator: client.user?.discriminator ?? null,
        avatar: client.user?.displayAvatarURL?.({ size: 128 }) ?? null,
        id: client.user?.id ?? null,
        guildCount: client.guilds.cache.size,
        ping: client.ws.ping,
      },
      guilds: guildStatuses,
      instances: {
        thisInstanceId: botCtx.INSTANCE_ID,
        health: healthStatus,
        list: Array.from(instanceMap.values()),
      },
      websocket: {
        totalClients: wsStats.totalClients,
        activeClients: wsStats.activeClients,
        totalSubscriptions: wsStats.totalSubscriptions,
      },
    });
  });

  // Force-stop an instance (admin dashboard action)
  app.post('/api/instances/:instanceId/force-stop', requireAuth, async (req, res) => {
    const instanceId = String(req.params.instanceId);

    try {
      // Force-stop in every guild that contains this instance
      const doc = await state.getState();
      const results: Array<{ guildId: string }> = [];

      for (const [guildId, guild] of Object.entries(doc.guilds)) {
        if (guild.instances[instanceId]) {
          await state.forceStopInstance(guildId, instanceId);
          results.push({ guildId });
        }
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'Instance not found in any guild' });
      }

      res.json({ success: true, affectedGuilds: results });
    } catch (error: unknown) {
      serverLog.error({ err: error }, 'Failed to force-stop instance');
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to force-stop instance',
      });
    }
  });

  // Ping a specific bot instance (or all) via the state channel and wait for PONG(s)
  app.post('/api/instances/ping', requireAuth, async (req, res) => {
    const { instanceId, timeoutMs } = req.body ?? {};

    try {
      const results = await state.pingAndWait(
        instanceId ?? undefined,
        typeof timeoutMs === 'number' ? timeoutMs : undefined,
      );

      res.json({
        success: true,
        targetInstanceId: instanceId ?? null,
        responses: results.map((r) => ({
          instanceId: r.responderId,
          rttMs: r.rttMs,
          nonce: r.nonce,
        })),
      });
    } catch (error: unknown) {
      serverLog.error({ err: error }, 'Ping failed');
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Ping failed',
      });
    }
  });

  // Auth routes (Discord OAuth)
  app.use('/api/auth', authRoutes);

  // Remove all timed-out / stale instances (admin dashboard action)
  app.delete('/api/instances/stale', requireAuth, async (_req, res) => {
    try {
      const result = await state.removeTimedOutInstances();
      res.json({ success: true, removed: result.removed });
    } catch (error: unknown) {
      serverLog.error({ err: error }, 'Failed to remove stale instances');
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to remove stale instances',
      });
    }
  });

  // ------------------------------
  // API command logging middleware
  // Captures mutating requests from the desktop app as command log entries
  // so every action taken via the UI is tracked in Command Logs.
  // ------------------------------
  const API_LOG_PATHS = ['/api/music', '/api/playlists', '/api/commands', '/api/upload', '/api/instances'];
  app.use((req, _res, next) => {
    // Only log mutating requests (POST / PUT / DELETE)
    if (!['POST', 'PUT', 'DELETE'].includes(req.method)) return next();

    // Only log requests under tracked API paths
    const matched = API_LOG_PATHS.some((prefix) => req.originalUrl.startsWith(prefix));
    if (!matched) return next();

    // Derive a human-readable action label from the URL
    const urlSegments = req.originalUrl.replace(/\?.*$/, '').split('/').filter(Boolean);
    // e.g. /api/music/play → "music/play", /api/playlists/123/tracks → "playlists/tracks"
    const actionParts = urlSegments.slice(1); // drop "api"
    const action = actionParts.join('/');

    const meta: Record<string, unknown> = {
      method: req.method,
      path: req.originalUrl,
      source: 'desktop-api',
    };
    if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
      // Include a sanitised copy of the body (strip large payloads)
      const bodyCopy = { ...req.body };
      for (const key of Object.keys(bodyCopy)) {
        if (typeof bodyCopy[key] === 'string' && (bodyCopy[key] as string).length > 200) {
          bodyCopy[key] = (bodyCopy[key] as string).slice(0, 200) + '…';
        }
      }
      meta.body = bodyCopy;
    }
    if (req.headers['x-guild-id']) {
      meta.guildId = req.headers['x-guild-id'];
    }

    pushLog('command', 'info', `${req.method} ${action}`, 'desktop-api', meta);
    next();
  });

  // File upload routes
  app.use('/api/upload', requireAuth, uploadRoutes);

  // Music player routes - every endpoint is guild-scoped via x-guild-id header / guildId body
  // Mutating music requests are serialized per-guild via guildLockMiddleware
  // so rapid /play or /skip calls on the same guild don't race each other.
  // GET requests are read-only - skip the lock to keep status polling cheap.
  // Search is also exempt from guild-access - it queries external services,
  // not a specific guild's player.
  app.use(
    '/api/music',
    requireAuth,
    (req, res, next) => {
      // Skip guild-access check for endpoints that aren't guild-scoped:
      // - /search queries external services
      // - /stream proxies audio for desktop playback
      if (req.path === '/search' || req.path.startsWith('/stream')) {
        next();
        return;
      }
      requireGuildAccess(req, res, next);
    },
    (req, res, next) => {
      if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
        next();
        return;
      }
      guildLockMiddleware(req, res, next);
    },
    musicRoutes,
  );

  // Playlist routes (user-scoped; no guild)
  app.use('/api/playlists', requireAuth, playlistRoutes);

  // Library routes - server-side filesystem scans used by web-mode UI
  app.use('/api/library', requireAuth, libraryRoutes);

  // Command system routes - slash-command execution is guild-scoped
  serverLog.info('Mounting command routes');
  app.use('/api/commands', requireAuth, initializeCommandRoutes(wsManager, botCtx.client));
  serverLog.info('Command routes ready');

  // Channel (chat) routes
  serverLog.info('Mounting channel routes');
  app.use('/api/channels', requireAuth, initializeChannelRoutes(botCtx.client, wsManager));
  serverLog.info('Channel routes ready');

  // Logs routes
  app.use('/api/logs', requireAuth, createLogsRouter(auditLogs, commandLogs));

  // WebSocket management endpoints
  app.get('/api/websocket/stats', requireAuth, (_req, res) => {
    const stats = wsManager.getStats();
    res.json(stats);
  });

  app.get('/api/websocket/clients', requireAuth, (_req, res) => {
    const clients = wsManager.getConnectedClients();
    res.json({ clients });
  });

  app.post('/api/websocket/broadcast', requireAuth, (req, res) => {
    const { type, payload } = req.body;

    try {
      let sentCount = 0;

      switch (type) {
        case 'bot_status':
          wsManager.broadcastBotStatus(payload.guildId, payload.instanceId, payload.status);
          sentCount = wsManager.getStats().activeClients;
          break;
        case 'player_state':
          wsManager.broadcastPlayerState(payload);
          sentCount = wsManager.getStats().activeClients;
          break;
        case 'log_entry':
          wsManager.broadcastLogEntry(payload);
          sentCount = wsManager.getStats().activeClients;
          break;
        case 'command_result':
          wsManager.broadcastCommandResult(payload);
          sentCount = wsManager.getStats().activeClients;
          break;
        default:
          return res.status(400).json({ error: 'Invalid message type' });
      }

      res.json({ success: true, sentCount });
    } catch (error: unknown) {
      wsLog.error({ err: error }, 'Broadcast error');
      res.status(500).json({
        error: error instanceof Error ? error.message : tErrors('connection.failed'),
      });
    }
  });

  // Instances / State management
  app.get('/api/state', requireAuth, async (_req, res) => res.json(await state.getState()));
  app.get('/api/state/:guildId/instances', requireAuth, requireGuildAccess, async (req, res) =>
    res.json(await state.getGuildState(String(req.params.guildId))),
  );
  app.post('/api/state/:guildId/active', requireAuth, requireGuildAccess, async (req, res) => {
    const { instanceId } = req.body as { instanceId: string };
    const g = await state.setActiveInstance(String(req.params.guildId), instanceId);
    res.json(g);
  });
  app.post('/api/state/:guildId/online', requireAuth, requireGuildAccess, async (req, res) => {
    const { instanceId, online } = req.body as {
      instanceId: string;
      online: boolean;
    };
    const g = await state.setOnline(String(req.params.guildId), {
      instanceId,
      online,
      isActive: false,
    });
    res.json(g);
  });
  app.post('/api/state/ping', requireAuth, async (req, res) => {
    const { targetInstanceId } = req.body as { targetInstanceId?: string };
    const nonce = await state.sendPing(targetInstanceId);
    res.json({ nonce });
  });

  // SPA static serving - the built desktop bundle is served same-origin so
  // the web UI and the API share a host. Disable by setting DISABLE_SPA=1.
  if (process.env.DISABLE_SPA !== '1') {
    const spaDir = process.env.SPA_DIST_DIR ?? path.resolve(projectRoot, 'packages', 'desktop', 'dist');
    try {
      await fs.access(path.join(spaDir, 'index.html'));
      app.use(express.static(spaDir, { index: false }));
      // SPA history fallback - anything that isn't an API/WS route renders index.html.
      app.get(/^\/(?!api\/|ws(\/|$)).*/, (_req, res) => {
        res.sendFile(path.join(spaDir, 'index.html'));
      });
      serverLog.info({ spaDir }, 'Serving SPA assets from dist');
    } catch {
      serverLog.info({ spaDir }, 'No SPA build found - skipping static serving (run `pnpm build:desktop`)');
    }
  }

  // ------------------------------
  // E2E test-mode routes (404 unless E2E=true)
  // Mounted after all regular routes, before the server starts listening.
  // ------------------------------
  if (isE2EMode()) {
    try {
      registerTestRoutes(app, {
        prisma: getDatabase() as unknown as Parameters<typeof registerTestRoutes>[1]['prisma'],
        player: botCtx.player,
        client: botCtx.client,
        wsManager,
        playerStateManager: getPlayerStateManager(),
      });
    } catch (err) {
      serverLog.error({ err }, 'Failed to register E2E test routes');
    }
  }

  const PORT = Number(process.env.PORT) || 3000;
  serverLog.info('Starting HTTP server');
  server.listen(PORT, () => serverLog.info({ port: PORT }, 'Server listening'));

  // Graceful shutdown handling
  process.on('SIGINT', () => {
    serverLog.info('Received termination signal - shutting down server');
    wsManager.shutdown();
    server.close(() => {
      serverLog.info('Server shut down gracefully');
      process.exit(0);
    });
  });

  process.on('SIGTERM', () => {
    serverLog.info('Received termination signal - shutting down server');
    wsManager.shutdown();
    server.close(() => {
      serverLog.info('Server shut down gracefully');
      process.exit(0);
    });
  });
}

main().catch((e) => {
  logger.error({ err: e }, 'Fatal error during startup');
  process.exit(1);
});
