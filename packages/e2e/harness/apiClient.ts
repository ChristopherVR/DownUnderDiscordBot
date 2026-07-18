/**
 * Tiny fetch wrapper around the bot's HTTP API, used by tests for arrange
 * steps that would be tedious to drive through the UI.
 *
 * All requests target the local bot started by `playwright.config.ts`
 * `webServer`. The port defaults to 3001 but can be overridden via the
 * `E2E_BOT_PORT` env var - matches the config.
 */

export interface ApiClientOptions {
  baseUrl?: string;
  token?: string;
  guildId?: string;
}

export interface QuickConnectResponse {
  token: string;
  bot: { id: string; username: string; avatar: string | null } | null;
  guilds: Array<{ id: string; name: string; icon: string | null; memberCount: number; botPresent: boolean }>;
}

export class ApiClient {
  readonly baseUrl: string;
  token: string | null;
  guildId: string | null;

  constructor(opts: ApiClientOptions = {}) {
    const port = process.env.E2E_BOT_PORT ?? '3001';
    this.baseUrl = opts.baseUrl ?? `http://localhost:${port}`;
    this.token = opts.token ?? null;
    this.guildId = opts.guildId ?? null;
  }

  setToken(token: string | null): void {
    this.token = token;
  }

  setGuildId(guildId: string | null): void {
    this.guildId = guildId;
  }

  private headers(extra?: Record<string, string>): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json', ...extra };
    if (this.token) h.Authorization = `Bearer ${this.token}`;
    if (this.guildId) h['x-guild-id'] = this.guildId;
    return h;
  }

  async request<T>(method: string, path: string, body?: unknown, extraHeaders?: Record<string, string>): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: this.headers(extraHeaders),
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    const json = text ? (JSON.parse(text) as T) : (undefined as T);
    if (!res.ok) {
      throw new Error(`API ${method} ${path} failed: ${res.status} ${res.statusText} - ${text}`);
    }
    return json;
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', path, body);
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }

  // ─── Convenience helpers ────────────────────────────────────────────
  async health(): Promise<{ ok: boolean }> {
    return this.get('/api/health');
  }

  async quickConnect(): Promise<QuickConnectResponse> {
    return this.get('/api/auth/quick-connect');
  }

  async resetTestState(): Promise<{ ok: boolean }> {
    return this.post('/test/reset');
  }

  async seedTestState(): Promise<{ ok: boolean }> {
    return this.post('/test/seed');
  }
}

/** Shared default client - reuse from tests to avoid spinning up fresh sockets. */
export const api = new ApiClient();
