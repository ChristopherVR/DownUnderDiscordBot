type MessageHandler = (data: unknown) => void;

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 20;
  private handlers = new Map<string, Set<MessageHandler>>();
  private _connected = false;
  private _url = '';

  get connected() {
    return this._connected;
  }

  connect(host: string, port: number) {
    this._url = `ws://${host}:${port}/ws`;
    this.doConnect();
  }

  private doConnect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    try {
      this.ws = new WebSocket(this._url);

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
