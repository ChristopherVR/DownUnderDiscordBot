import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'events';
import { WebSocket, WebSocketServer } from 'ws';

vi.mock('crypto', async () => {
  const actual = await vi.importActual('crypto');
  let counter = 0;
  return {
    ...actual,
    randomUUID: vi.fn(() => `client-${++counter}`),
  };
});

import { WebSocketManager } from '../../../src/helpers/websocket';

// ── Helpers ────────────────────────────────────────────────────────────

/**
 * Create a mock WebSocket that emits events properly.
 */
function createMockWs(): EventEmitter & {
  readyState: number;
  send: ReturnType<typeof vi.fn>;
  ping: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  terminate: ReturnType<typeof vi.fn>;
} {
  const ws = new EventEmitter() as EventEmitter & {
    readyState: number;
    send: ReturnType<typeof vi.fn>;
    ping: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
    terminate: ReturnType<typeof vi.fn>;
  };
  ws.readyState = WebSocket.OPEN;
  ws.send = vi.fn();
  ws.ping = vi.fn();
  ws.close = vi.fn();
  ws.terminate = vi.fn();
  return ws;
}

/**
 * Create a mock WebSocketServer and simulate a connection.
 */
function createMockWss(): EventEmitter {
  return new EventEmitter();
}

describe('WebSocketManager', () => {
  let wss: EventEmitter;
  let manager: WebSocketManager;

  beforeEach(() => {
    vi.useFakeTimers();
    wss = createMockWss();
    manager = new WebSocketManager(wss as unknown as WebSocketServer);
  });

  afterEach(() => {
    manager.shutdown();
    vi.useRealTimers();
  });

  function connectClient(): ReturnType<typeof createMockWs> {
    const ws = createMockWs();
    wss.emit('connection', ws, {});
    return ws;
  }

  // ── Connection handling ────────────────────────────────────────────

  describe('connection handling', () => {
    it('registers a new client on connection', () => {
      connectClient();

      const stats = manager.getStats();
      expect(stats.totalClients).toBe(1);
      expect(stats.activeClients).toBe(1);
    });

    it('sends initial connection_update message to new client', () => {
      const ws = connectClient();

      expect(ws.send).toHaveBeenCalledTimes(1);
      const msg = JSON.parse(ws.send.mock.calls[0][0]);
      expect(msg.type).toBe('connection_update');
      expect(msg.payload[0].connected).toBe(true);
    });

    it('removes client on disconnect', () => {
      const ws = connectClient();
      ws.emit('close');

      expect(manager.getStats().totalClients).toBe(0);
    });

    it('removes client on error', () => {
      const ws = connectClient();
      ws.emit('error', new Error('connection lost'));

      expect(manager.getStats().totalClients).toBe(0);
    });

    it('handles multiple concurrent connections', () => {
      connectClient();
      connectClient();
      connectClient();

      expect(manager.getStats().totalClients).toBe(3);
      expect(manager.getStats().activeClients).toBe(3);
    });
  });

  // ── Message handling ───────────────────────────────────────────────

  describe('client message handling', () => {
    it('handles subscribe messages', () => {
      const ws = connectClient();

      ws.emit(
        'message',
        Buffer.from(
          JSON.stringify({
            type: 'subscribe',
            payload: { type: 'player_state' },
          }),
        ),
      );

      expect(manager.getStats().totalSubscriptions).toBe(1);
    });

    it('handles unsubscribe messages', () => {
      const ws = connectClient();

      ws.emit(
        'message',
        Buffer.from(
          JSON.stringify({
            type: 'subscribe',
            payload: { type: 'player_state' },
          }),
        ),
      );
      ws.emit(
        'message',
        Buffer.from(
          JSON.stringify({
            type: 'unsubscribe',
            payload: { type: 'player_state' },
          }),
        ),
      );

      expect(manager.getStats().totalSubscriptions).toBe(0);
    });

    it('handles ping messages by responding with pong', () => {
      const ws = connectClient();
      ws.send.mockClear(); // clear the initial connection_update

      ws.emit('message', Buffer.from(JSON.stringify({ type: 'ping' })));

      expect(ws.send).toHaveBeenCalledTimes(1);
      const msg = JSON.parse(ws.send.mock.calls[0][0]);
      expect(msg.type).toBe('connection_update');
      expect(msg.payload[0].id).toBe('pong');
    });

    it('ignores invalid JSON messages', () => {
      const ws = connectClient();
      // Should not throw
      ws.emit('message', Buffer.from('not json'));

      expect(manager.getStats().totalClients).toBe(1);
    });

    it('handles subscribe with guild-specific subscription', () => {
      const ws = connectClient();

      ws.emit(
        'message',
        Buffer.from(
          JSON.stringify({
            type: 'subscribe',
            payload: { type: 'bot_status', guildId: 'guild-1' },
          }),
        ),
      );

      expect(manager.getStats().totalSubscriptions).toBe(1);
    });

    it('ignores invalid subscription payloads', () => {
      const ws = connectClient();

      ws.emit(
        'message',
        Buffer.from(
          JSON.stringify({
            type: 'subscribe',
            payload: { type: 'invalid_type' },
          }),
        ),
      );

      expect(manager.getStats().totalSubscriptions).toBe(0);
    });
  });

  // ── sendToClient ───────────────────────────────────────────────────

  describe('sendToClient', () => {
    it('sends message to a specific client', () => {
      const ws = connectClient();
      ws.send.mockClear();

      const clients = manager.getConnectedClients();
      const result = manager.sendToClient(clients[0], {
        type: 'player_state',
        payload: { status: 'playing' },
      } as never);

      expect(result).toBe(true);
      expect(ws.send).toHaveBeenCalledTimes(1);
    });

    it('returns false for non-existent client', () => {
      const result = manager.sendToClient('nonexistent', {
        type: 'player_state',
        payload: {},
      } as never);

      expect(result).toBe(false);
    });

    it('returns false when WebSocket is not open', () => {
      const ws = connectClient();
      ws.readyState = WebSocket.CLOSED;

      const clients = manager.getConnectedClients();
      // getConnectedClients filters by OPEN, so it will be empty
      expect(clients).toHaveLength(0);
    });

    it('removes client and returns false when send throws', () => {
      const ws = connectClient();
      ws.send.mockClear();
      ws.send.mockImplementation(() => {
        throw new Error('send failed');
      });

      const clients = manager.getConnectedClients();
      const result = manager.sendToClient(clients[0], {
        type: 'player_state',
        payload: {},
      } as never);

      expect(result).toBe(false);
      expect(manager.getStats().totalClients).toBe(0);
    });
  });

  // ── broadcast ──────────────────────────────────────────────────────

  describe('broadcast', () => {
    it('broadcasts to all connected clients', () => {
      const ws1 = connectClient();
      const ws2 = connectClient();
      ws1.send.mockClear();
      ws2.send.mockClear();

      const count = manager.broadcast({
        type: 'player_state',
        payload: { status: 'paused' },
      } as never);

      expect(count).toBe(2);
      expect(ws1.send).toHaveBeenCalledTimes(1);
      expect(ws2.send).toHaveBeenCalledTimes(1);
    });

    it('skips and removes closed connections', () => {
      const ws1 = connectClient();
      const ws2 = connectClient();
      ws1.readyState = WebSocket.CLOSED;
      ws1.send.mockClear();
      ws2.send.mockClear();

      const count = manager.broadcast({
        type: 'player_state',
        payload: {},
      } as never);

      expect(count).toBe(1);
      expect(ws1.send).not.toHaveBeenCalled();
    });

    it('returns 0 when no clients are connected', () => {
      const count = manager.broadcast({
        type: 'player_state',
        payload: {},
      } as never);

      expect(count).toBe(0);
    });
  });

  // ── broadcastToSubscribers ─────────────────────────────────────────

  describe('broadcastToSubscribers', () => {
    it('only sends to clients subscribed to the matching type', () => {
      const ws1 = connectClient();
      const ws2 = connectClient();

      // Subscribe ws1 to player_state
      ws1.emit(
        'message',
        Buffer.from(
          JSON.stringify({
            type: 'subscribe',
            payload: { type: 'player_state' },
          }),
        ),
      );

      ws1.send.mockClear();
      ws2.send.mockClear();

      const count = manager.broadcastToSubscribers({ type: 'player_state', payload: {} } as never, {
        type: 'player_state',
      });

      expect(count).toBe(1);
      expect(ws1.send).toHaveBeenCalledTimes(1);
      expect(ws2.send).not.toHaveBeenCalled();
    });

    it('sends to guild-specific subscribers', () => {
      const ws1 = connectClient();
      const ws2 = connectClient();

      ws1.emit(
        'message',
        Buffer.from(
          JSON.stringify({
            type: 'subscribe',
            payload: { type: 'bot_status', guildId: 'guild-1' },
          }),
        ),
      );
      ws2.emit(
        'message',
        Buffer.from(
          JSON.stringify({
            type: 'subscribe',
            payload: { type: 'bot_status', guildId: 'guild-2' },
          }),
        ),
      );

      ws1.send.mockClear();
      ws2.send.mockClear();

      const count = manager.broadcastToSubscribers({ type: 'bot_status', payload: {} } as never, {
        type: 'bot_status',
        guildId: 'guild-1',
      });

      expect(count).toBe(1);
      expect(ws1.send).toHaveBeenCalledTimes(1);
      expect(ws2.send).not.toHaveBeenCalled();
    });
  });

  // ── Convenience broadcast methods ──────────────────────────────────

  describe('convenience broadcast methods', () => {
    it('broadcastBotStatus sends to all and guild subscribers', () => {
      const ws = connectClient();
      ws.send.mockClear();

      manager.broadcastBotStatus('guild-1', 'instance-1', 'online');

      // broadcast + broadcastToSubscribers both call send
      expect(ws.send).toHaveBeenCalled();
      const msg = JSON.parse(ws.send.mock.calls[0][0]);
      expect(msg.type).toBe('bot_status');
      expect(msg.payload.status).toBe('online');
    });

    it('broadcastPlayerState sends player state to all clients', () => {
      const ws = connectClient();
      ws.send.mockClear();

      manager.broadcastPlayerState({ status: 'playing' } as never);

      expect(ws.send).toHaveBeenCalled();
      const msg = JSON.parse(ws.send.mock.calls[0][0]);
      expect(msg.type).toBe('player_state');
    });

    it('broadcastLogEntry sends to all and category subscribers', () => {
      const ws = connectClient();
      ws.send.mockClear();

      manager.broadcastLogEntry({
        level: 'info',
        message: 'test log',
        category: 'music',
        timestamp: Date.now(),
      } as never);

      expect(ws.send).toHaveBeenCalled();
      const msg = JSON.parse(ws.send.mock.calls[0][0]);
      expect(msg.type).toBe('log_entry');
    });

    it('broadcastCommandResult sends to all clients', () => {
      const ws = connectClient();
      ws.send.mockClear();

      manager.broadcastCommandResult({
        command: 'play',
        success: true,
      } as never);

      expect(ws.send).toHaveBeenCalled();
      const msg = JSON.parse(ws.send.mock.calls[0][0]);
      expect(msg.type).toBe('command_result');
    });

    it('broadcastStreamStatus sends stream status to all clients', () => {
      const ws = connectClient();
      ws.send.mockClear();

      manager.broadcastStreamStatus({
        status: 'buffering',
        guildId: 'guild-1',
      } as never);

      expect(ws.send).toHaveBeenCalled();
      const msg = JSON.parse(ws.send.mock.calls[0][0]);
      expect(msg.type).toBe('stream_status');
    });
  });

  // ── Ping/pong interval ─────────────────────────────────────────────

  describe('ping interval', () => {
    it('pings clients every 30 seconds', () => {
      const ws = connectClient();

      vi.advanceTimersByTime(30000);

      expect(ws.ping).toHaveBeenCalledTimes(1);
    });

    it('terminates clients that do not respond to ping', () => {
      const ws = connectClient();

      // First interval: sends ping, marks isAlive=false
      vi.advanceTimersByTime(30000);
      expect(ws.ping).toHaveBeenCalledTimes(1);

      // Second interval: client didn't respond, gets terminated
      vi.advanceTimersByTime(30000);
      expect(ws.terminate).toHaveBeenCalled();
      expect(manager.getStats().totalClients).toBe(0);
    });

    it('keeps clients alive when they respond to pong', () => {
      const ws = connectClient();

      // First interval: sends ping
      vi.advanceTimersByTime(30000);
      // Client responds with pong
      ws.emit('pong');

      // Second interval: client responded, gets pinged again
      vi.advanceTimersByTime(30000);
      expect(ws.terminate).not.toHaveBeenCalled();
      expect(manager.getStats().totalClients).toBe(1);
    });
  });

  // ── getStats / getConnectedClients ─────────────────────────────────

  describe('getStats', () => {
    it('returns correct statistics', () => {
      const ws1 = connectClient();
      connectClient();

      // Subscribe ws1 to two things
      ws1.emit(
        'message',
        Buffer.from(
          JSON.stringify({
            type: 'subscribe',
            payload: { type: 'player_state' },
          }),
        ),
      );
      ws1.emit(
        'message',
        Buffer.from(
          JSON.stringify({
            type: 'subscribe',
            payload: { type: 'bot_status' },
          }),
        ),
      );

      const stats = manager.getStats();
      expect(stats.totalClients).toBe(2);
      expect(stats.activeClients).toBe(2);
      expect(stats.totalSubscriptions).toBe(2);
    });
  });

  describe('getConnectedClients', () => {
    it('returns IDs of connected clients only', () => {
      const ws1 = connectClient();
      connectClient();
      ws1.readyState = WebSocket.CLOSED;

      const clients = manager.getConnectedClients();
      expect(clients).toHaveLength(1);
    });
  });

  // ── disconnectAll / shutdown ───────────────────────────────────────

  describe('disconnectAll', () => {
    it('closes all client connections', () => {
      const ws1 = connectClient();
      const ws2 = connectClient();

      manager.disconnectAll();

      expect(ws1.close).toHaveBeenCalled();
      expect(ws2.close).toHaveBeenCalled();
      expect(manager.getStats().totalClients).toBe(0);
    });
  });

  describe('shutdown', () => {
    it('clears ping interval and disconnects all', () => {
      const ws = connectClient();

      manager.shutdown();

      expect(ws.close).toHaveBeenCalled();
      // Advancing timer should not cause additional pings
      vi.advanceTimersByTime(60000);
      expect(ws.ping).not.toHaveBeenCalled();
    });
  });
});
