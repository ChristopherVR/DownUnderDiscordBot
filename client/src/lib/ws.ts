import { useCallback, useEffect, useRef, useState } from 'react';
import { useBotStore } from '@/stores/useBotStore';
import { wsOptimizer } from './wsOptimization';
import type { WebSocketMessage } from 'discord-dashboard-shared';

interface InternalWebSocketStatus {
  connected: boolean;
  reconnecting: boolean;
  attempts: number;
  lastError?: string;
  lastConnectedAt?: number;
}

type MessageLike = WebSocketMessage & { compressed?: boolean };

type Listener = (message: WebSocketMessage) => void;

const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_BASE_DELAY = 1500;

const isBrowser = typeof window !== 'undefined';

const defaultStatus: InternalWebSocketStatus = {
  connected: false,
  reconnecting: false,
  attempts: 0,
  lastError: undefined,
  lastConnectedAt: undefined,
};

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private reconnectAttempts = 0;
  private manualClose = false;
  private status: InternalWebSocketStatus = { ...defaultStatus };
  private queuedMessages: string[] = [];
  private listeners = new Set<Listener>();
  private statusListeners = new Set<(status: InternalWebSocketStatus) => void>();

  public start(): void {
    if (!isBrowser) return;
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return;
    }

    this.manualClose = false;

    if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
      return;
    }

    this.connect();
  }

  public stop(): void {
    if (!isBrowser) return;

    this.manualClose = true;
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.updateStatus(false, false);
    this.updateStoreConnection(false, false);
  }

  public send(message: Record<string, unknown>): void {
    if (!isBrowser) return;

    const normalized = this.normalizeOutgoingMessage(message);
    if (!normalized) return;

    const payload = JSON.stringify(normalized);

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(payload);
      return;
    }

    this.queuedMessages.push(payload);
  }

  public addMessageListener(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public subscribeToStatus(listener: (status: InternalWebSocketStatus) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.getStatus());
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  public getStatus(): InternalWebSocketStatus {
    return { ...this.status };
  }

  private connect(): void {
    try {
      const url = this.resolveWebSocketUrl();
      this.socket = new WebSocket(url);
      this.bindSocketEvents(this.socket);
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.scheduleReconnect(error instanceof Error ? error.message : String(error));
    }
  }

  private resolveWebSocketUrl(): string {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_WS_URL) {
      return import.meta.env.VITE_WS_URL as string;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const path = '/ws';
    return `${protocol}//${host}${path}`;
  }

  private bindSocketEvents(socket: WebSocket): void {
    socket.onopen = () => {
      const reconnected = this.reconnectAttempts > 0;
      this.reconnectAttempts = 0;
      this.updateStatus(true, false, undefined, Date.now());
      this.updateStoreConnection(true, false);
      wsOptimizer.reset();

      if (reconnected) {
        window.dispatchEvent(new CustomEvent('websocket-reconnected'));
      }

      this.flushQueue();
      this.registerDefaultSubscriptions();
    };

    socket.onmessage = (event) => {
      this.handleIncoming(event.data);
    };

    socket.onerror = () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };

    socket.onclose = (event) => {
      this.socket = null;
      const shouldReconnect = !this.manualClose;
      this.updateStatus(false, shouldReconnect, event.reason || undefined);
      this.updateStoreConnection(false, shouldReconnect);

      if (shouldReconnect) {
        this.scheduleReconnect(event.reason || undefined);
      }
    };
  }

  private registerDefaultSubscriptions(): void {
    const defaultEvents = ['player_state', 'bot_status', 'log_entry', 'command_result', 'connection_update'];
    defaultEvents.forEach((event) => {
      this.send({ type: 'subscribe', payload: { type: event } });
    });
  }

  private normalizeOutgoingMessage(message: Record<string, unknown>): MessageLike | null {
    const type = typeof message.type === 'string' ? message.type : 'message';
    const rawPayload = 'payload' in message ? message.payload : message;
    const payload = this.normalizePayload(type, rawPayload);

    const optimized = wsOptimizer.optimizeOutgoingMessage(type, payload);
    if (optimized === null) {
      return null;
    }

    return {
      type: optimized.type,
      payload: optimized.payload,
      compressed: optimized.compressed,
    } as MessageLike;
  }

  private normalizePayload(type: string, payload: unknown): unknown {
    if ((type === 'subscribe' || type === 'unsubscribe') && payload && typeof payload === 'object') {
      const subscription = payload as { type?: string; event?: string } & Record<string, unknown>;
      const resolvedType = typeof subscription.type === 'string' ? subscription.type : subscription.event;

      if (typeof resolvedType === 'string') {
        const { event: _event, ...rest } = subscription;
        return {
          ...rest,
          type: resolvedType,
        };
      }

      const { event: _unusedEvent, ...rest } = subscription;
      return rest;
    }

    return payload;
  }

  private flushQueue(): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

    while (this.queuedMessages.length > 0) {
      const payload = this.queuedMessages.shift();
      if (payload) {
        this.socket.send(payload);
      }
    }
  }

  private handleIncoming(raw: unknown): void {
    if (typeof raw !== 'string') {
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      console.warn('Failed to parse WebSocket message:', error);
      return;
    }

    const process = (message: unknown) => {
      const optimized = wsOptimizer.optimizeIncomingMessage(message as MessageLike);
      if (!optimized) return;
      this.routeMessage(optimized as WebSocketMessage);
    };

    if (parsed && typeof parsed === 'object' && (parsed as { type?: string }).type === 'batch') {
      const messages = (parsed as { payload?: { messages?: unknown[] } }).payload?.messages;
      if (Array.isArray(messages)) {
        messages.forEach(process);
      }
      return;
    }

    process(parsed);
  }

  private routeMessage(message: WebSocketMessage): void {
    const storeGetter = (useBotStore as unknown as {
      getState?: () => {
        setPlayer?: (payload: WebSocketMessage['payload']) => void;
        pushLog?: (payload: WebSocketMessage['payload']) => void;
        addCommandExecution?: (payload: WebSocketMessage['payload']) => void;
        setConnections?: (payload: WebSocketMessage['payload']) => void;
        setStatus?: (payload: { connected: boolean; serverName: string; channelName: string }) => void;
      };
    }).getState;

    const store = typeof storeGetter === 'function' ? storeGetter() : null;

    switch (message.type) {
      case 'player_state':
        store?.setPlayer?.(message.payload);
        break;
      case 'log_entry':
        store?.pushLog?.(message.payload);
        break;
      case 'command_result':
        store?.addCommandExecution?.(message.payload);
        break;
      case 'connection_update':
        store?.setConnections?.(message.payload);
        break;
      case 'bot_status': {
        const current = (store as { status?: { connected: boolean; serverName: string; channelName: string } } | null)?.status ?? {
          connected: false,
          serverName: 'Discord Bot',
          channelName: '',
        };
        store?.setStatus?.({
          ...current,
          connected: message.payload.status === 'online',
        });
        if (message.payload.connections) {
          store?.setConnections?.(message.payload.connections);
        }
        break;
      }
      default:
        break;
    }

    this.listeners.forEach((listener) => {
      try {
        listener(message);
      } catch (error) {
        console.error('WebSocket listener error:', error);
      }
    });
  }

  private scheduleReconnect(reason?: string): void {
    if (!isBrowser || this.manualClose) return;

    this.reconnectAttempts += 1;
    this.updateStatus(false, true, reason);
    this.updateStoreConnection(false, true);

    window.dispatchEvent(
      new CustomEvent('websocket-error', {
        detail: { attempts: this.reconnectAttempts },
      }),
    );

    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      this.updateStatus(false, false, reason);
      this.updateStoreConnection(false, false);
      window.dispatchEvent(
        new CustomEvent('websocket-max-retries', {
          detail: { attempts: this.reconnectAttempts },
        }),
      );
      return;
    }

    const backoff = Math.min(5000, Math.round(RECONNECT_BASE_DELAY * Math.pow(this.reconnectAttempts, 1.2)));
    this.reconnectTimer = window.setTimeout(() => this.connect(), backoff);
  }

  private updateStatus(connected: boolean, reconnecting: boolean, lastError?: string, lastConnectedAt?: number): void {
    this.status = {
      connected,
      reconnecting,
      attempts: reconnecting ? this.reconnectAttempts : 0,
      lastError,
      lastConnectedAt: lastConnectedAt ?? this.status.lastConnectedAt,
    };
    this.notifyStatusListeners();
  }

  private updateStoreConnection(connected: boolean, reconnecting: boolean): void {
    const getter = (useBotStore as unknown as { getState?: () => { setWebSocketStatus?: (connected: boolean, reconnecting: boolean) => void } }).getState;
    if (typeof getter !== 'function') {
      return;
    }

    const store = getter();
    if (store && typeof store.setWebSocketStatus === 'function') {
      store.setWebSocketStatus(connected, reconnecting);
    }
  }

  private notifyStatusListeners(): void {
    if (this.statusListeners.size === 0) {
      return;
    }

    const snapshot = this.getStatus();
    this.statusListeners.forEach((listener) => {
      try {
        listener(snapshot);
      } catch (error) {
        console.error('WebSocket status listener error:', error);
      }
    });
  }
}

const webSocketService = new WebSocketService();

export const startWebSocket = () => webSocketService.start();
export const getWebSocketStatus = () => webSocketService.getStatus();

export default webSocketService;

type WebSocketSubscription = (payload: WebSocketMessage['payload']) => void;

export function useWebSocket() {
  const [status, setStatus] = useState(() => webSocketService.getStatus());
  const subscriptionsRef = useRef(new Map<WebSocketMessage['type'], Set<WebSocketSubscription>>());

  useEffect(() => {
    webSocketService.start();

    const subscriptions = subscriptionsRef.current;
    const unsubscribeStatus = webSocketService.subscribeToStatus((nextStatus) => {
      setStatus((current) => {
        if (
          current.connected === nextStatus.connected &&
          current.reconnecting === nextStatus.reconnecting &&
          current.attempts === nextStatus.attempts &&
          current.lastConnectedAt === nextStatus.lastConnectedAt &&
          current.lastError === nextStatus.lastError
        ) {
          return current;
        }
        return nextStatus;
      });
    });

    const handleMessage: Listener = (message) => {
      const handlers = subscriptionsRef.current.get(message.type);
      if (!handlers || handlers.size === 0) {
        return;
      }

      handlers.forEach((handler) => {
        try {
          handler(message.payload);
        } catch (error) {
          console.error('WebSocket subscription handler error:', error);
        }
      });
    };

    const removeMessageListener = webSocketService.addMessageListener(handleMessage);

    return () => {
      removeMessageListener();
      unsubscribeStatus();
      subscriptions.clear();
      webSocketService.stop();
    };
  }, []);

  const subscribe = useCallback((type: WebSocketMessage['type'], handler: WebSocketSubscription) => {
    const handlers = subscriptionsRef.current.get(type) ?? new Set<WebSocketSubscription>();
    handlers.add(handler);
    subscriptionsRef.current.set(type, handlers);
  }, []);

  const unsubscribe = useCallback((type: WebSocketMessage['type'], handler?: WebSocketSubscription) => {
    const handlers = subscriptionsRef.current.get(type);
    if (!handlers) {
      return;
    }

    if (handler) {
      handlers.delete(handler);
    } else {
      handlers.clear();
    }

    if (handlers.size === 0) {
      subscriptionsRef.current.delete(type);
    }
  }, []);

  return {
    isConnected: status.connected,
    subscribe,
    unsubscribe,
  };
}

