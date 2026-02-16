import 'dotenv/config';
import express from 'express';
import type { Request, RequestHandler } from 'express';
import path from 'path';
import { promises as fs } from 'fs';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import http, { IncomingMessage } from 'http';
import { v4 as uuid } from 'uuid';
import { fileURLToPath } from 'url';
import type { Logger } from 'pino';
import { logger, createLogger } from './helpers/logger';
import uploadRoutes from './routes/upload';
import musicRoutes from './routes/music';
import { initializeCommandRoutes } from './routes/commands';
import { createLogsRouter } from './routes/logs';
import { ensureUploadDir } from './helpers/fileUpload';
import { WebSocketManager } from './helpers/websocket';
import { tErrors, initI18n } from 'discord-dashboard-shared/localization';

import { BotStatusMessage, LogMessage, PlayerState, SocketEnvelope, Track, ConnectionInfo } from './types';
import { startBot } from './bot';

// index.ts (or the first file that runs)
// import ffmpeg from '@ffmpeg-installer/ffmpeg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDistBuild = __dirname.includes(`${path.sep}dist`);
// packages/bot/src → packages/bot → packages → project root
const projectRoot = isDistBuild ? path.resolve(__dirname, '..', '..', '..') : path.resolve(__dirname, '..', '..');
const localesDir = path.resolve(projectRoot, 'packages', 'shared', 'src', 'localization', 'locales');

const serverLog = createLogger('server');

// Prefer a user override if present; otherwise use the bundled binary.
process.env.FFMPEG_PATH = process.env.FFMPEG_PATH || 'ffmpeg';
serverLog.info({ ffmpeg: process.env.FFMPEG_PATH }, 'FFmpeg configuration');
const wsLog = serverLog.child({ layer: 'websocket' });
const discordLog = serverLog.child({ layer: 'discord' });

async function main() {
  serverLog.info('Bootstrapping Discord dashboard server');
  serverLog.debug('Initializing localization resources');
  // Initialize localization for server
  await initI18n({
    isServer: true,
    lng: 'en',
    debug: process.env.NODE_ENV === 'development',
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
  // MOCK DATA
  // ------------------------------
  const botConnected = true;
  const serverName = 'LoFi Lounge';
  let channelName = '#music';

  const catalog: Track[] = [
    {
      id: 't1',
      title: 'Coffee Beats',
      artist: 'DJ Chill',
      duration: 240,
      url: 'https://example.com/coffee',
      source: 'online',
    },
    {
      id: 't2',
      title: 'Morning Sun',
      artist: 'Aurora Sky',
      duration: 198,
      url: 'https://example.com/sun',
      source: 'online',
    },
    {
      id: 't3',
      title: 'Neon Drift',
      artist: 'Citywave',
      duration: 260,
      url: 'https://example.com/neon',
      source: 'online',
    },
    {
      id: 't4',
      title: 'Rainy Alley',
      artist: 'Lo-Fi Crew',
      duration: 215,
      url: 'https://example.com/rain',
      source: 'online',
    },
  ];

  const player: PlayerState = {
    status: 'stopped',
    track: null,
    position: 0,
    volume: 70,
  };
  const auditLogs: LogMessage[] = [];
  const commandLogs: LogMessage[] = [];

  // Command registry is now handled by the CommandRegistry service

  const connections: ConnectionInfo[] = [
    { id: 'v1', name: 'General Voice', type: 'voice', connected: true },
    { id: 'v2', name: 'Chill Vibes', type: 'voice', connected: false },
    { id: 't1', name: '#music', type: 'text', connected: true },
    { id: 't2', name: '#bot-commands', type: 'text', connected: true },
  ];

  function pushLog(
    category: 'audit' | 'command' | 'system',
    level: 'info' | 'warn' | 'error' | 'debug',
    message: string,
    source?: string,
    metadata?: Record<string, unknown>,
  ) {
    const log: LogMessage = {
      id: uuid(),
      category,
      level,
      message,
      ts: Date.now(),
      source,
      metadata,
    };
    if (category === 'audit') auditLogs.unshift(log);
    else if (category === 'command') commandLogs.unshift(log);
    else auditLogs.unshift(log); // system logs go to audit logs
    if (auditLogs.length > 1000) auditLogs.pop();
    if (commandLogs.length > 1000) commandLogs.pop();
    broadcast({ type: 'log', payload: log });
  }

  // ------------------------------
  // WebSocket setup
  // ------------------------------
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });
  const wsManager = new WebSocketManager(wss);

  function send(ws: WebSocket, data: SocketEnvelope) {
    ws.send(JSON.stringify(data));
  }
  function broadcast(data: SocketEnvelope) {
    // Use the enhanced WebSocket manager for broadcasting
    if (data.type === 'log') {
      // Convert LogMessage to LogEntry format
      const logEntry = {
        ...data.payload,
        timestamp: data.payload.ts,
      };
      wsManager.broadcastLogEntry(logEntry);
    } else if (data.type === 'player') {
      // Convert server PlayerState to shared PlayerState format
      const playerState = {
        ...data.payload,
        loop: false, // Default value
        queue: [], // Default value
        currentIndex: -1, // Default value
      };
      wsManager.broadcastPlayerState(playerState);
    } else {
      // Fallback to old broadcast method for compatibility
      const raw = JSON.stringify(data);
      wss.clients.forEach((client: WebSocket) => {
        if (client.readyState === 1) client.send(raw);
      });
    }
  }

  // Legacy WebSocket connection handler for backward compatibility
  wss.on('connection', (ws: WebSocket, _req: IncomingMessage) => {
    const status: BotStatusMessage = {
      connected: botConnected,
      serverName,
      channelName,
    };
    send(ws, { type: 'status', payload: status });
    send(ws, { type: 'player', payload: { ...player } });
    send(ws, { type: 'connections', payload: connections });
    auditLogs.slice(0, 200).forEach((l) => send(ws, { type: 'log', payload: l }));
    commandLogs.slice(0, 200).forEach((l) => send(ws, { type: 'log', payload: l }));
    pushLog('audit', 'info', 'Client connected to WebSocket');
  });

  setInterval(() => {
    if (player.status === 'playing' && player.track) {
      player.position += 1;
      if (player.position >= player.track.duration) {
        const idx = catalog.findIndex((t) => t.id === player.track?.id);
        const next = catalog[(idx + 1) % catalog.length];
        player.track = next;
        player.position = 0;
        pushLog('audit', 'info', `Now playing: ${next.title} — ${next.artist}`);
      }
      broadcast({ type: 'player', payload: { ...player } });
    }
  }, 1000);

  // ------------------------------
  // Start Discord bot + state service
  // ------------------------------
  serverLog.info('Starting Discord bot');
  const botCtx = await startBot(wsManager);
  serverLog.info({ guildId: botCtx.GUILD_ID }, 'Discord bot started');
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

  // File upload routes
  app.use('/api/upload', uploadRoutes);

  // Music player routes
  app.use('/api/music', musicRoutes);

  // Command system routes
  serverLog.info('Mounting command routes');
  app.use('/api/commands', initializeCommandRoutes(wsManager, botCtx.client));
  serverLog.info('Command routes ready');

  // Logs routes
  app.use('/api/logs', createLogsRouter(auditLogs, commandLogs));

  // WebSocket management endpoints
  app.get('/api/websocket/stats', (_req, res) => {
    const stats = wsManager.getStats();
    res.json(stats);
  });

  app.get('/api/websocket/clients', (_req, res) => {
    const clients = wsManager.getConnectedClients();
    res.json({ clients });
  });

  app.post('/api/websocket/broadcast', (req, res) => {
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

  // Commands are now handled by the command routes

  // Player
  app.post('/api/player/play', (req, res) => {
    const log = withEndpointLog(req, 'player:play');
    const { trackId } = req.body as { trackId?: string };
    const track = trackId ? catalog.find((c) => c.id === trackId) : catalog[0];
    if (!track) {
      log.warn({ trackId }, 'Play request ignored - track not found');
      return res.status(404).json({ status: 'fail', message: tErrors('player.trackNotFound') });
    }
    player.track = track;
    player.position = 0;
    player.status = 'playing';
    broadcast({ type: 'player', payload: { ...player } });
    log.info({ trackId: track.id, title: track.title }, 'Playback started');
    res.json({ status: 'success' });
  });
  app.post('/api/player/pause', (req, res) => {
    const log = withEndpointLog(req, 'player:pause');
    if (player.status === 'playing') {
      player.status = 'paused';
      broadcast({ type: 'player', payload: { ...player } });
      log.info('Playback paused');
    } else {
      log.debug({ status: player.status }, 'Pause request ignored');
    }
    res.json({ status: 'success' });
  });
  app.post('/api/player/resume', (req, res) => {
    const log = withEndpointLog(req, 'player:resume');
    if (player.status === 'paused') {
      player.status = 'playing';
      broadcast({ type: 'player', payload: { ...player } });
      log.info('Playback resumed');
    } else {
      log.debug({ status: player.status }, 'Resume request ignored');
    }
    res.json({ status: 'success' });
  });
  app.post('/api/player/stop', (req, res) => {
    const log = withEndpointLog(req, 'player:stop');
    player.status = 'stopped';
    player.position = 0;
    broadcast({ type: 'player', payload: { ...player } });
    log.info('Playback stopped');
    res.json({ status: 'success' });
  });
  app.post('/api/player/next', (req, res) => {
    const log = withEndpointLog(req, 'player:next');
    const currentIndex = catalog.findIndex((t) => t.id === player.track?.id);
    const nextTrack = catalog[(currentIndex + 1) % catalog.length];
    player.track = nextTrack;
    player.position = 0;
    player.status = 'playing';
    broadcast({ type: 'player', payload: { ...player } });
    log.info({ trackId: nextTrack.id, title: nextTrack.title }, 'Advanced to next track');
    res.json({ status: 'success' });
  });
  app.post('/api/player/seek', (req, res) => {
    const log = withEndpointLog(req, 'player:seek');
    const { seconds } = req.body as { seconds: number };
    if (!player.track) {
      log.warn('Seek ignored - no track loaded');
      return res.status(400).json({ status: 'fail', message: 'No track loaded' });
    }
    player.position = Math.max(0, Math.min(player.track.duration, seconds));
    broadcast({ type: 'player', payload: { ...player } });
    log.info({ seconds, position: player.position }, 'Seek applied');
    res.json({ status: 'success' });
  });
  app.get('/api/search', (req, res) => {
    const q = String(req.query.q || '').toLowerCase();
    const items = catalog.filter((t) => `${t.title} ${t.artist}`.toLowerCase().includes(q)).slice(0, 10);
    res.json({ items });
  });

  // Instances / State management
  app.get('/api/state', async (_req, res) => res.json(await state.getState()));
  app.get('/api/state/:guildId/instances', async (req, res) => res.json(await state.getGuildState(req.params.guildId)));
  app.post('/api/state/:guildId/active', async (req, res) => {
    const { instanceId } = req.body as { instanceId: string };
    const g = await state.setActiveInstance(req.params.guildId, instanceId);
    res.json(g);
  });
  app.post('/api/state/:guildId/online', async (req, res) => {
    const { instanceId, online } = req.body as {
      instanceId: string;
      online: boolean;
    };
    const g = await state.setOnline(req.params.guildId, {
      instanceId,
      online,
      isActive: false,
    });
    res.json(g);
  });
  app.post('/api/state/ping', async (req, res) => {
    const { targetInstanceId } = req.body as { targetInstanceId?: string };
    const nonce = await state.sendPing(targetInstanceId);
    res.json({ nonce });
  });

  // Connections (mock)
  app.get('/api/connections', (_req, res) => res.json({ items: connections }));
  app.post('/api/connections/connect', (req, res) => {
    const { id } = req.body as { id: string };
    const c = connections.find((x) => x.id === id);
    if (!c) {
      return res.status(404).json({ error: tErrors('connection.discord.unavailable') });
    }

    if (c.type !== 'voice') {
      return res.status(400).json({ error: tErrors('connection.discord.permissionDenied') });
    }

    c.connected = true;
    channelName = c.name;
    broadcast({ type: 'connections', payload: connections });
    res.json({ status: 'success' });
  });
  app.post('/api/connections/disconnect', (req, res) => {
    const { id } = req.body as { id: string };
    const c = connections.find((x) => x.id === id);
    if (!c) {
      return res.status(404).json({ error: tErrors('connection.discord.unavailable') });
    }

    if (c.type !== 'voice') {
      return res.status(400).json({ error: tErrors('connection.discord.permissionDenied') });
    }

    c.connected = false;
    broadcast({ type: 'connections', payload: connections });
    res.json({ status: 'success' });
  });

  // Static file serving removed - dashboard is now a Tauri desktop app

  const PORT = Number(process.env.PORT) || 3001;
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
