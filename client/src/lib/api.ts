import type {
  GlobalState,
  GuildState,
  ApiResult,
  LogsResponse,
  CommandRegistryResponse,
  CommandExecutionResponse,
  CommandHistoryResponse,
  CommandValidationResponse,
  SearchResponse,
  LocalFilesResponse,
  ConnectionsResponse,
  PlaybackOptions,
  UploadedFile,
} from 'discord-dashboard-shared';
import { AppError, NetworkError, ValidationError, AuthError } from './errorHandler';

interface ApiOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

type ApiEnvironment = {
  VITE_API_BASE_URL?: string;
  VITE_API_URL?: string;
  VITE_BACKEND_HOST?: string;
  VITE_BACKEND_PORT?: string;
  VITE_WS_URL?: string;
} & Record<string, string | undefined>;

class ApiClient {
  private baseUrl = '';
  private apiPrefix = '';
  private defaultTimeout = 10000;
  private defaultRetries = 3;
  private defaultRetryDelay = 1000;

  constructor() {
    const env = this.getEnv();
    const envUrl = env?.VITE_API_BASE_URL ?? env?.VITE_API_URL;

    if (envUrl) {
      this.setBaseUrl(envUrl);
      return;
    }

    if (typeof window !== 'undefined' && window.location) {
      const { protocol, hostname, port } = window.location;
      const isViteDevServer = port === '5173' || port === '4173';
      const configuredHost = env?.VITE_BACKEND_HOST ? String(env.VITE_BACKEND_HOST) : undefined;
      const configuredPort = env?.VITE_BACKEND_PORT ? String(env.VITE_BACKEND_PORT) : undefined;
      const basePort = configuredPort || (isViteDevServer ? '3001' : port);
      const hostForUrl = configuredHost || hostname;
      const authority = basePort ? `${hostForUrl}:${basePort}` : hostForUrl;
      this.setBaseUrl(`${protocol}//${authority}`);
      return;
    }

    this.setBaseUrl('http://localhost:3001');
  }

  private getEnv(): ApiEnvironment | undefined {
    return typeof import.meta !== 'undefined' ? (import.meta.env as ApiEnvironment) : undefined;
  }

  private resolveUrl(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    let withPrefix = normalizedPath;
    if (this.apiPrefix) {
      const needsPrefix = normalizedPath !== this.apiPrefix && !normalizedPath.startsWith(`${this.apiPrefix}/`);
      if (needsPrefix) {
        withPrefix = `${this.apiPrefix}${normalizedPath}`;
      }
    }

    return `${this.baseUrl}${withPrefix}`;
  }

  private setBaseUrl(raw: string): void {
    try {
      const parsed = new globalThis.URL(
        raw,
        typeof window !== 'undefined' ? window.location.origin : 'http://localhost',
      );
      this.baseUrl = `${parsed.protocol}//${parsed.host}`.replace(/\/$/, '');
      const trimmedPath = parsed.pathname.replace(/\/$/, '');
      this.apiPrefix = trimmedPath && trimmedPath !== '/' ? trimmedPath : '';
    } catch {
      this.baseUrl = String(raw).replace(/\/$/, '');
      this.apiPrefix = '';
    }
  }

  async request<T>(path: string, options: ApiOptions = {}): Promise<T> {
    const {
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
      retryDelay = this.defaultRetryDelay,
      ...fetchOptions
    } = options;

    let lastError: Error | AppError | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(this.resolveUrl(path), {
          ...fetchOptions,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw this.createErrorFromResponse(response, errorText);
        }

        return (await response.json()) as T;
      } catch (error) {
        const normalized = this.normalizeError(error);
        lastError = normalized;

        if (
          normalized instanceof ValidationError ||
          normalized instanceof AuthError ||
          (normalized instanceof AppError && !normalized.isRetryable)
        ) {
          throw normalized;
        }

        if (attempt === retries) {
          throw normalized;
        }

        await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    }

    throw lastError ?? new AppError('Unknown error occurred', 'UNKNOWN_ERROR');
  }

  private createErrorFromResponse(response: Response, errorText: string): AppError {
    switch (response.status) {
      case 400:
        return new ValidationError(errorText || 'Bad request');
      case 401:
        return new AuthError(errorText || 'Unauthorized');
      case 403:
        return new AuthError(errorText || 'Forbidden');
      case 404:
        return new AppError(errorText || 'Not found', 'NOT_FOUND');
      case 408:
        return new NetworkError(errorText || 'Request timeout');
      case 429:
        return new NetworkError(errorText || 'Rate limited');
      case 500:
      case 502:
      case 503:
      case 504:
        return new NetworkError(errorText || 'Server error');
      default:
        return new NetworkError(errorText || `HTTP ${response.status}`);
    }
  }

  private normalizeError(error: unknown): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return new NetworkError('Request timeout');
      }

      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        return new NetworkError('Network connection failed');
      }

      return new AppError(error.message, 'UNKNOWN_ERROR', undefined, true);
    }

    return new AppError('Unknown error occurred', 'UNKNOWN_ERROR');
  }
}

const apiClient = new ApiClient();

async function j<T>(path: string, options?: ApiOptions): Promise<T> {
  return apiClient.request<T>(path, options ?? {});
}

export const Api = {
  getLogs: (type: 'audit' | 'command', q?: string, level?: 'info' | 'warn' | 'error', category?: string) =>
    j<LogsResponse>(
      `/api/logs?type=${type}${q ? `&q=${encodeURIComponent(q)}` : ''}${level ? `&level=${level}` : ''}${
        category ? `&category=${category}` : ''
      }`,
    ),
  getLogStats: () =>
    j<{
      total: number;
      byCategory: Record<string, number>;
      byLevel: Record<string, number>;
      recent: { lastHour: number; lastDay: number };
    }>('/api/logs/stats'),
  clearLogs: (type?: 'audit' | 'command', level?: string, category?: string) =>
    j<{ success: boolean; message: string; clearedCount: number }>('/api/logs', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, level, category }),
    }),
  getCommandRegistry: () => j<CommandRegistryResponse>('/api/commands/registry'),
  executeSlash: (command: string, args?: Record<string, unknown>) =>
    j<CommandExecutionResponse>('/api/commands/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, arguments: args }),
    }),
  getCommandHistory: (options?: { limit?: number; command?: string; status?: string; since?: number }) =>
    j<CommandHistoryResponse>(
      `/api/commands/history${
        options
          ? '?' +
            new URLSearchParams(
              Object.entries(options)
                .filter(([, value]) => value !== undefined)
                .map(([key, value]) => [key, String(value)]),
            ).toString()
          : ''
      }`,
    ),
  clearCommandHistory: () =>
    j<{ success: boolean; message: string }>('/api/commands/history', {
      method: 'DELETE',
    }),
  validateCommand: (command: string, args?: Record<string, unknown>) =>
    j<CommandValidationResponse>('/api/commands/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, arguments: args }),
    }),
  play: (trackId?: string) =>
    j<ApiResult<undefined>>('/api/player/play', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackId }),
    }),
  pause: () => j<ApiResult<undefined>>('/api/player/pause', { method: 'POST' }),
  resume: () => j<ApiResult<undefined>>('/api/player/resume', { method: 'POST' }),
  stop: () => j<ApiResult<undefined>>('/api/player/stop', { method: 'POST' }),
  next: () => j<ApiResult<undefined>>('/api/player/next', { method: 'POST' }),
  previous: () => j<ApiResult<undefined>>('/api/player/previous', { method: 'POST' }),
  seek: (seconds: number) =>
    j<ApiResult<undefined>>('/api/player/seek', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seconds }),
    }),
  setVolume: (volume: number) =>
    j<ApiResult<undefined>>('/api/player/volume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ volume }),
    }),
  toggleLoop: (enabled: boolean) =>
    j<ApiResult<undefined>>('/api/player/loop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    }),
  shuffle: () => j<ApiResult<undefined>>('/api/player/shuffle', { method: 'POST' }),
  addToQueue: (trackId: string) =>
    j<ApiResult<undefined>>('/api/player/queue/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackId }),
    }),
  removeFromQueue: (index: number) =>
    j<ApiResult<undefined>>('/api/player/queue/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ index }),
    }),
  clearQueue: () => j<ApiResult<undefined>>('/api/player/queue/clear', { method: 'POST' }),
  moveQueueItem: (fromIndex: number, toIndex: number) =>
    j<ApiResult<undefined>>('/api/player/queue/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromIndex, toIndex }),
    }),
  searchAndPlay: (query: string, options?: PlaybackOptions) =>
    j<ApiResult<undefined>>('/api/player/search-and-play', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, ...options }),
    }),
  playLocal: (filePath: string, options?: PlaybackOptions) =>
    j<ApiResult<undefined>>('/api/player/play-local', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath, ...options }),
    }),
  playPlaylist: (playlistUrl: string, options?: PlaybackOptions) =>
    j<ApiResult<undefined>>('/api/player/play-playlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playlistUrl, ...options }),
    }),
  search: (q: string) => j<SearchResponse>(`/api/search?q=${encodeURIComponent(q)}`),
  getGlobalState: () => j<GlobalState>('/api/state'),
  listInstances: (guildId: string) => j<GuildState>(`/api/state/${guildId}/instances`),
  makeActive: (guildId: string, instanceId: string) =>
    j(`/api/state/${guildId}/active`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instanceId }),
    }),
  shutdown: (guildId: string, instanceId: string) =>
    j(`/api/state/${guildId}/shutdown`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instanceId }),
    }),
  ping: (targetInstanceId?: string) =>
    j<{ nonce: string }>(`/api/state/ping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetInstanceId }),
    }),
  getConnections: () => j<ConnectionsResponse>('/api/connections'),
  connect: (id: string) =>
    j<ApiResult<undefined>>('/api/connections/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }),
  disconnect: (id: string) =>
    j<ApiResult<undefined>>('/api/connections/disconnect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }),
  getLocalFiles: () => j<LocalFilesResponse>('/api/files/local'),
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('audio', file);
    return apiClient.request<ApiResult<UploadedFile>>('/api/upload/single', {
      method: 'POST',
      body: formData,
    });
  },
  deleteFile: (fileId: string) =>
    j<ApiResult<undefined>>(`/api/files/${fileId}`, {
      method: 'DELETE',
    }),
};

export type ApiClientType = typeof Api;

