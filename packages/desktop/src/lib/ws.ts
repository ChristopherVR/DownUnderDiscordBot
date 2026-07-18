type MessageHandler = (data: unknown) => void;

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 20;
  private handlers = new Map<string, Set<MessageHandler>>();
  private _connected = false;
  private _host = '';
  private _port = 0;
  private _token: string | null = null;

  get connected() {
    return this._connected;
  }

  /** Set the JWT used on the next (re)connect. Does not reconnect automatically. */
  setAuthToken(token: string | null) {
    this._token = token;
  }

  connect(host: string, port: number, token?: string | null) {
    this._host = host;
    this._port = port;
    if (token !== undefined) this._token = token;
    this.doConnect();
  }

  private buildUrl(): string {
    // Web mode (non-Tauri): derive ws URL from page origin so HTTPS gets wss://.
    // Tauri mode: keep explicit host/port (defaults to ws://localhost:3000).
    let base: string;
    if (typeof window !== 'undefined' && !('__TAURI_INTERNALS__' in window)) {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      base = `${proto}//${window.location.host}/ws`;
    } else {
      base = `ws://${this._host}:${this._port}/ws`;
    }
    return this._token ? `${base}?token=${encodeURIComponent(this._token)}` : base;
  }

  private doConnect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    if (!this._token) {
      // Don't attempt a connection until we have a token — the server will
      // reject the upgrade, and the reconnect loop would hammer it.
      return;
    }

    try {
      this.ws = new WebSocket(this.buildUrl());

      this.ws.onopen = () => {
        this._connected = true;
        this.reconnectAttempts = 0;
        this.emit('connection', { connected: true });
      };

      this.ws.onclose = () => {
        this._connected = false;
        this.emit('connection', { connected: false });
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this._connected = false;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type) {
            this.emit(data.type, data.payload ?? data);
          }
          this.emit('message', data);
        } catch {
          // ignore invalid JSON
        }
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    if (this.reconnectTimer) return;

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.doConnect();
    }, delay);
  }

  on(type: string, handler: MessageHandler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
    return () => this.handlers.get(type)?.delete(handler);
  }

  private emit(type: string, data: unknown) {
    this.handlers.get(type)?.forEach((handler) => handler(data));
  }

  send(data: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  /**
   * Restrict the broadcasts this client receives to a specific set of
   * guilds. Pass `null` (the default) to receive broadcasts for every guild.
   *
   * Guild-scoped messages (player_state, player_position, stream_status,
   * bot_status) for guilds outside the filter are dropped server-side.
   * Guild-less messages (logs, connection updates) are always delivered.
   */
  setGuildFilter(guildIds: string[] | null): void {
    this.send({
      type: 'set_guild_filter',
      payload: { guildIds },
    });
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
    this._connected = false;
  }
}

export const wsService = new WebSocketService();
