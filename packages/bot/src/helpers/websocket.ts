import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import { randomUUID } from 'crypto';
import type {
  WebSocketMessage,
  PlayerState,
  PlayerPositionUpdate,
  LogEntry,
  CommandExecution,
  StreamStatusUpdate,
} from 'discord-dashboard-shared';

export interface WebSocketClient {
  id: string;
  ws: WebSocket;
  subscriptions: Set<string>;
  lastPing: number;
  isAlive: boolean;
  userId: string;
  /**
   * Optional per-client guild allow-list. When `null` (default), the client
   * receives broadcasts for every guild. When set, only messages carrying
   * a `guildId` in this set (plus guild-less messages) are delivered.
   */
  guildFilter: Set<string> | null;
}

/**
 * An IncomingMessage that has passed JWT verification during the upgrade
 * handshake. `auth` is attached by the upgrade handler in index.ts.
 */
export interface AuthedIncomingMessage extends IncomingMessage {
  auth?: { userId: string; username?: string };
}

export interface WebSocketSubscription {
  type: 'bot_status' | 'player_state' | 'log_entry' | 'command_result' | 'connection_update' | 'file_upload';
  guildId?: string;
  instanceId?: string;
  category?: string;
}

const SUBSCRIPTION_TYPES = new Set<WebSocketSubscription['type']>([
  'bot_status',
  'player_state',
  'log_entry',
  'command_result',
  'connection_update',
  'file_upload',
]);

const isWebSocketSubscription = (payload: unknown): payload is WebSocketSubscription => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const candidate = payload as Partial<WebSocketSubscription> & { event?: string };
  const type = typeof candidate.type === 'string' ? candidate.type : candidate.event;

  if (!type || !SUBSCRIPTION_TYPES.has(type as WebSocketSubscription['type'])) {
    return false;
  }

  return true;
};

/**
 * Enhanced WebSocket Manager for real-time dashboard updates
 */
export class WebSocketManager {
  private clients: Map<string, WebSocketClient> = new Map();
  private wss: WebSocketServer;
  private pingInterval?: NodeJS.Timeout;

  constructor(wss: WebSocketServer) {
    this.wss = wss;
    this.setupWebSocketServer();
    this.startPingInterval();
  }

  /**
   * Setup WebSocket server with connection handling
   */
  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const clientId = randomUUID();
      const auth = (req as AuthedIncomingMessage).auth;
      const client: WebSocketClient = {
        id: clientId,
        ws,
        subscriptions: new Set(),
        lastPing: Date.now(),
        isAlive: true,
        userId: auth?.userId ?? 'anonymous',
        guildFilter: null,
      };

      this.clients.set(clientId, client);
      console.log(`WebSocket client connected: ${clientId}`);

      // Send initial connection message
      this.sendToClient(clientId, {
        type: 'connection_update',
        payload: [
          {
            id: clientId,
            name: 'Dashboard Client',
            type: 'text',
            connected: true,
            guildId: '',
            channelId: '',
          },
        ],
      });

      // Handle incoming messages
      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleClientMessage(clientId, message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        console.log(`WebSocket client disconnected: ${clientId}`);
        this.clients.delete(clientId);
      });

      // Handle pong responses
      ws.on('pong', () => {
        const pongClient = this.clients.get(clientId);
        if (pongClient) {
          pongClient.isAlive = true;
          pongClient.lastPing = Date.now();
        }
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
        this.clients.delete(clientId);
      });
    });
  }

  /**
   * Handle incoming messages from clients
   */
  private handleClientMessage(clientId: string, message: { type: string; payload?: unknown }): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (message.type) {
      case 'subscribe': {
        const subscription = this.normalizeSubscriptionPayload(message.payload);
        if (subscription) {
          this.handleSubscription(clientId, subscription);
        } else {
          console.warn('Invalid subscription payload received', message.payload);
        }
        break;
      }
      case 'unsubscribe': {
        const subscription = this.normalizeSubscriptionPayload(message.payload);
        if (subscription) {
          this.handleUnsubscription(clientId, subscription);
        } else {
          console.warn('Invalid unsubscription payload received', message.payload);
        }
        break;
      }
      case 'ping':
        this.sendToClient(clientId, {
          type: 'connection_update',
          payload: [
            {
              id: 'pong',
              name: 'Pong',
              type: 'text',
              connected: true,
              guildId: '',
              channelId: '',
            },
          ],
        });
        break;
      case 'set_guild_filter': {
        const filterClient = this.clients.get(clientId);
        if (!filterClient) break;
        const payload = message.payload as { guildIds?: unknown } | undefined;
        const raw = payload?.guildIds;
        if (raw === null || raw === undefined) {
          filterClient.guildFilter = null;
        } else if (Array.isArray(raw)) {
          const ids = raw.filter((v): v is string => typeof v === 'string' && v.length > 0);
          filterClient.guildFilter = ids.length > 0 ? new Set(ids) : null;
        } else {
          console.warn('Invalid set_guild_filter payload', payload);
        }
        break;
      }
      default:
        console.warn(`Unknown message type: ${message.type}`);
    }
  }

  /**
   * Return true if a client should receive a message tied to `guildId`.
   * Messages without a guildId are always delivered.
   */
  private clientAcceptsGuild(client: WebSocketClient, guildId: string | undefined): boolean {
    if (!guildId) return true;
    if (!client.guildFilter) return true;
    return client.guildFilter.has(guildId);
  }

  /**
   * Like `broadcast`, but drops clients whose guild filter excludes the
   * message's `guildId`. Use this for anything carrying a guildId so
   * operators viewing guild A don't receive guild B traffic.
   */
  private broadcastWithGuildFilter(message: WebSocketMessage, guildId: string | undefined): number {
    let sentCount = 0;
    for (const [clientId, client] of this.clients.entries()) {
      if (client.ws.readyState !== WebSocket.OPEN) {
        this.clients.delete(clientId);
        continue;
      }
      if (!this.clientAcceptsGuild(client, guildId)) continue;
      try {
        client.ws.send(JSON.stringify(message));
        sentCount++;
      } catch (error) {
        console.error(`Error broadcasting to client ${clientId}:`, error);
        this.clients.delete(clientId);
      }
    }
    return sentCount;
  }

  /**
   * Handle client subscription requests
   */
  private handleSubscription(clientId: string, subscription: WebSocketSubscription): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    const subKey = this.getSubscriptionKey(subscription);
    client.subscriptions.add(subKey);

    console.log(`Client ${clientId} subscribed to: ${subKey}`);
  }

  /**
   * Handle client unsubscription requests
   */
  private handleUnsubscription(clientId: string, subscription: WebSocketSubscription): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    const subKey = this.getSubscriptionKey(subscription);
    client.subscriptions.delete(subKey);

    console.log(`Client ${clientId} unsubscribed from: ${subKey}`);
  }

  /**
   * Generate subscription key from subscription object
   */
  private getSubscriptionKey(subscription: WebSocketSubscription): string {
    let key = subscription.type;
    if (subscription.guildId) key += `:guild:${subscription.guildId}`;
    if (subscription.instanceId) key += `:instance:${subscription.instanceId}`;
    if (subscription.category) key += `:category:${subscription.category}`;
    return key;
  }

  private normalizeSubscriptionPayload(payload: unknown): WebSocketSubscription | null {
    if (!isWebSocketSubscription(payload)) {
      return null;
    }

    const candidate = payload as Partial<WebSocketSubscription> & { event?: string };
    const type = (candidate.type ?? candidate.event) as WebSocketSubscription['type'];

    if (!type || !SUBSCRIPTION_TYPES.has(type)) {
      return null;
    }

    return {
      type,
      guildId: typeof candidate.guildId === 'string' ? candidate.guildId : undefined,
      instanceId: typeof candidate.instanceId === 'string' ? candidate.instanceId : undefined,
      category: typeof candidate.category === 'string' ? candidate.category : undefined,
    };
  }

  /**
   * Send message to specific client
   */
  public sendToClient(clientId: string, message: WebSocketMessage): boolean {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      client.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error(`Error sending message to client ${clientId}:`, error);
      this.clients.delete(clientId);
      return false;
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  public broadcast(message: WebSocketMessage): number {
    let sentCount = 0;

    for (const [clientId, client] of this.clients.entries()) {
      if (client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(JSON.stringify(message));
          sentCount++;
        } catch (error) {
          console.error(`Error broadcasting to client ${clientId}:`, error);
          this.clients.delete(clientId);
        }
      } else {
        this.clients.delete(clientId);
      }
    }

    return sentCount;
  }

  /**
   * Broadcast message to clients with specific subscriptions
   */
  public broadcastToSubscribers(message: WebSocketMessage, subscription: WebSocketSubscription): number {
    const subKey = this.getSubscriptionKey(subscription);
    let sentCount = 0;

    for (const [clientId, client] of this.clients.entries()) {
      if (client.subscriptions.has(subKey) && client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(JSON.stringify(message));
          sentCount++;
        } catch (error) {
          console.error(`Error sending to subscriber ${clientId}:`, error);
          this.clients.delete(clientId);
        }
      }
    }

    return sentCount;
  }

  /**
   * Broadcast bot status update
   */
  public broadcastBotStatus(guildId: string, instanceId: string, status: 'online' | 'offline'): void {
    const message: WebSocketMessage = {
      type: 'bot_status',
      payload: {
        guildId,
        instanceId,
        status,
      },
    };

    this.broadcastWithGuildFilter(message, guildId);
    this.broadcastToSubscribers(message, { type: 'bot_status', guildId });
  }

  /**
   * Broadcast player state update
   */
  public broadcastPlayerState(playerState: PlayerState & { guildId?: string }): void {
    const message: WebSocketMessage = {
      type: 'player_state',
      payload: playerState,
    };

    this.broadcastWithGuildFilter(message, playerState.guildId);
  }

  /**
   * Broadcast a fine-grained position tick — cheaper than a full player_state
   * since it only carries guildId + position. Sent once per second during
   * playback.
   */
  public broadcastPlayerPosition(payload: PlayerPositionUpdate): void {
    const message: WebSocketMessage = {
      type: 'player_position',
      payload,
    };

    this.broadcastWithGuildFilter(message, payload.guildId);
  }

  /**
   * Broadcast stream status update (fallback / buffering indicators)
   */
  public broadcastStreamStatus(status: StreamStatusUpdate & { guildId?: string }): void {
    const message: WebSocketMessage = {
      type: 'stream_status',
      payload: status,
    };

    this.broadcastWithGuildFilter(message, status.guildId);
  }

  /**
   * Broadcast log entry
   */
  public broadcastLogEntry(logEntry: LogEntry): void {
    const message: WebSocketMessage = {
      type: 'log_entry',
      payload: logEntry,
    };

    // Broadcast to all clients and category-specific subscribers
    this.broadcast(message);
    if (logEntry.category) {
      this.broadcastToSubscribers(message, { type: 'log_entry', category: logEntry.category });
    }
  }

  /**
   * Broadcast command result
   */
  public broadcastCommandResult(commandExecution: CommandExecution): void {
    const message: WebSocketMessage = {
      type: 'command_result',
      payload: commandExecution,
    };

    this.broadcast(message);
  }

  /**
   * Start ping interval to check client connections
   */
  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      const _now = Date.now();

      for (const [clientId, client] of this.clients.entries()) {
        if (client.ws.readyState === WebSocket.OPEN) {
          if (!client.isAlive) {
            // Client didn't respond to last ping, terminate connection
            console.log(`Terminating unresponsive client: ${clientId}`);
            client.ws.terminate();
            this.clients.delete(clientId);
          } else {
            // Send ping and mark as not alive until pong is received
            client.isAlive = false;
            client.ws.ping();
          }
        } else {
          // Connection is not open, remove client
          this.clients.delete(clientId);
        }
      }
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Get connection statistics
   */
  public getStats(): {
    totalClients: number;
    activeClients: number;
    totalSubscriptions: number;
  } {
    let activeClients = 0;
    let totalSubscriptions = 0;

    for (const client of this.clients.values()) {
      if (client.ws.readyState === WebSocket.OPEN) {
        activeClients++;
      }
      totalSubscriptions += client.subscriptions.size;
    }

    return {
      totalClients: this.clients.size,
      activeClients,
      totalSubscriptions,
    };
  }

  /**
   * Get all connected client IDs
   */
  public getConnectedClients(): string[] {
    return Array.from(this.clients.entries())
      .filter(([, client]) => client.ws.readyState === WebSocket.OPEN)
      .map(([clientId]) => clientId);
  }

  /**
   * Disconnect all clients
   */
  public disconnectAll(): void {
    for (const [clientId, client] of this.clients.entries()) {
      try {
        client.ws.close();
      } catch (error) {
        console.error(`Error closing connection for client ${clientId}:`, error);
      }
    }
    this.clients.clear();
  }

  /**
   * Shutdown the WebSocket manager
   */
  public shutdown(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    this.disconnectAll();
  }
}
