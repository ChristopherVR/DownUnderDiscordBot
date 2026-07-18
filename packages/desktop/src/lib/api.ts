function resolveDefaultBaseUrl(): string {
  if (typeof window === 'undefined') return 'http://localhost:3000';
  // Browser mode: same-origin. The SPA is served by the bot.
  if (!('__TAURI_INTERNALS__' in window)) return window.location.origin;
  // Tauri mode: explicit override, or legacy localhost default.
  return (import.meta.env?.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000';
}

function resolveInitialAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    // Keep in sync with AUTH_TOKEN_KEY in stores/useBotStore.ts.
    return window.localStorage.getItem('downunder_auth_token');
  } catch {
    return null;
  }
}

let baseUrl = resolveDefaultBaseUrl();
// Initialize synchronously from localStorage so that requests fired before
// `restoreBotConnection` runs (e.g. a page-load fetch from LibraryPage) still
// carry the JWT and don't 401 in a race against the auth-restore effect.
let authToken: string | null = resolveInitialAuthToken();
let onAuthFailure: (() => void) | null = null;

export function setApiBaseUrl(host: string, port: number) {
  baseUrl = `http://${host}:${port}`;
}

export function getApiBaseUrl(): string {
  return baseUrl;
}

/** Set (or clear) the JWT used for every subsequent API request. */
export function setAuthToken(token: string | null) {
  authToken = token;
}

/** Register a handler invoked when the server replies with 401/403. */
export function setAuthFailureHandler(handler: (() => void) | null) {
  onAuthFailure = handler;
}

function buildHeaders(
  guildId?: string,
  extra?: Record<string, string>,
  overrideToken?: string,
): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extra,
  };
  if (guildId) {
    headers['x-guild-id'] = guildId;
  }
  const token = overrideToken ?? authToken;
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(path: string, options?: RequestInit & { guildId?: string }): Promise<T> {
  const { guildId, ...fetchOptions } = options ?? ({} as RequestInit & { guildId?: string });
  const res = await fetch(`${baseUrl}${path}`, {
    ...fetchOptions,
    headers: buildHeaders(guildId, fetchOptions?.headers as Record<string, string> | undefined),
  });
  if (res.status === 401 || res.status === 403) {
    onAuthFailure?.();
  }
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function authedRequest<T>(path: string, token: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: buildHeaders(undefined, options?.headers as Record<string, string> | undefined, token),
  });
  if (res.status === 401 || res.status === 403) {
    onAuthFailure?.();
  }
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  // Auth
  getAuthStatus: () =>
    request<{
      oauthConfigured: boolean;
      bot: { id: string; username: string; avatar: string | null } | null;
    }>('/api/auth/status'),

  getAuthUrl: (client: 'tauri' | 'web' = 'tauri', origin?: string) => {
    const params = new URLSearchParams({ client });
    if (origin) params.set('origin', origin);
    return request<{ url: string }>(`/api/auth/discord?${params.toString()}`);
  },

  quickConnect: () =>
    request<{
      token: string;
      bot: { id: string; username: string; avatar: string | null } | null;
      guilds: Array<{
        id: string;
        name: string;
        icon: string | null;
        memberCount: number;
        botPresent: boolean;
      }>;
    }>('/api/auth/quick-connect'),

  getUser: (token: string) =>
    authedRequest<{ id: string; username: string; discriminator?: string; avatar: string | null }>(
      '/api/auth/user',
      token,
    ),

  getGuilds: (token: string) =>
    authedRequest<{
      guilds: Array<{
        id: string;
        name: string;
        icon: string | null;
        owner: boolean;
        botPresent: boolean;
      }>;
    }>('/api/auth/guilds', token),

  // Voice channels
  getVoiceChannels: (guildId: string) =>
    request<{
      channels: Array<{
        id: string;
        name: string;
        userCount: number;
      }>;
    }>(`/api/guild/${guildId}/voice-channels`),

  // Voice channel
  connectVoice: (voiceChannelId: string, guildId?: string) =>
    request<{ success: boolean }>('/api/music/connect', {
      method: 'POST',
      body: JSON.stringify({ voiceChannelId }),
      guildId,
    }),

  // Player controls
  // Note: uses a raw fetch so we can read the 400 body when requiresVoiceChannel is true
  play: async (
    query: string,
    platform?: string,
    voiceChannelId?: string,
    guildId?: string,
  ): Promise<{ success: boolean; requiresVoiceChannel?: boolean; error?: string }> => {
    const res = await fetch(`${baseUrl}/api/music/play`, {
      method: 'POST',
      headers: buildHeaders(guildId),
      body: JSON.stringify({ query, platform, voiceChannelId }),
    });
    if (res.status === 401 || res.status === 403) {
      onAuthFailure?.();
    }
    return res.json();
  },
  pause: (guildId?: string) => request('/api/music/pause', { method: 'POST', guildId }),
  resume: (guildId?: string) => request('/api/music/resume', { method: 'POST', guildId }),
  stop: (guildId?: string) => request('/api/music/stop', { method: 'POST', guildId }),
  skip: (guildId?: string) => request('/api/music/skip', { method: 'POST', guildId }),
  back: (guildId?: string) => request('/api/music/back', { method: 'POST', guildId }),
  seek: (position: number, guildId?: string) =>
    request('/api/music/seek', { method: 'POST', body: JSON.stringify({ position }), guildId }),
  volume: (volume: number, guildId?: string) =>
    request('/api/music/volume', { method: 'POST', body: JSON.stringify({ volume }), guildId }),
  loop: (mode: string, guildId?: string) =>
    request('/api/music/repeat', { method: 'POST', body: JSON.stringify({ mode }), guildId }),

  // Queue
  getQueue: (guildId?: string) => request('/api/music/queue', { guildId }),
  addToQueue: (query: string, platform?: string, guildId?: string) =>
    request('/api/music/queue/add', { method: 'POST', body: JSON.stringify({ query, platform }), guildId }),
  removeFromQueue: (index: number, guildId?: string) =>
    request(`/api/music/queue/${index}`, { method: 'DELETE', guildId }),
  clearQueue: (guildId?: string) => request('/api/music/queue/clear', { method: 'POST', guildId }),
  shuffleQueue: (guildId?: string) => request('/api/music/queue/shuffle', { method: 'POST', guildId }),
  moveQueueTrack: (from: number, to: number, guildId?: string) =>
    request('/api/music/queue/move', { method: 'POST', body: JSON.stringify({ from, to }), guildId }),

  // Search
  search: (query: string, platform = 'auto') =>
    request<{ success: boolean; data: { tracks: unknown[] } }>(`/api/music/search`, {
      method: 'POST',
      body: JSON.stringify({ query, searchEngine: platform }),
    }),

  // State
  getPlayerState: (guildId: string) => request(`/api/music/state?guildId=${guildId}`),
  getHistory: (guildId?: string) => request('/api/music/history', { guildId }),

  // Health
  health: () => request<{ ok: boolean }>('/api/health'),

  // Dashboard
  getDashboard: () =>
    request<{
      bot: {
        online: boolean;
        uptime: number;
        username: string | null;
        discriminator: string | null;
        avatar: string | null;
        id: string | null;
        guildCount: number;
        ping: number;
      };
      guilds: Array<{
        guildId: string;
        guildName: string;
        guildIcon: string | null;
        memberCount: number;
        player: {
          active: boolean;
          isPlaying: boolean;
          currentTrack: {
            title: string;
            artist: string;
            duration: string;
            thumbnail: string;
            url: string;
          } | null;
          queueSize: number;
          voiceChannelId: string | null;
          voiceChannelName: string | null;
        };
      }>;
      instances: {
        thisInstanceId: string;
        health: {
          totalInstances: number;
          onlineInstances: number;
          guildsWithBots: number;
          lastUpdated: number;
        };
        list: Array<{
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
          guilds: Array<{
            guildId: string;
            guildName: string;
            isActiveForGuild: boolean;
          }>;
        }>;
      };
      websocket: {
        totalClients: number;
        activeClients: number;
        totalSubscriptions: number;
      };
    }>('/api/dashboard'),

  // Instance management
  forceStopInstance: (instanceId: string) =>
    request<{ success: boolean; affectedGuilds: Array<{ guildId: string }> }>(
      `/api/instances/${encodeURIComponent(instanceId)}/force-stop`,
      { method: 'POST' },
    ),

  /** Ping a specific bot instance (or all) through the state channel and wait for PONGs. */
  pingInstance: (instanceId?: string, timeoutMs?: number) =>
    request<{
      success: boolean;
      targetInstanceId: string | null;
      responses: Array<{ instanceId: string; rttMs: number; nonce: string }>;
    }>('/api/instances/ping', {
      method: 'POST',
      body: JSON.stringify({
        ...(instanceId ? { instanceId } : {}),
        ...(timeoutMs != null ? { timeoutMs } : {}),
      }),
    }),

  clearStaleInstances: () =>
    request<{ success: boolean; removed: number }>('/api/instances/stale', { method: 'DELETE' }),

  // Local files
  getLocalFiles: () => request('/api/music/local-files'),

  // Library (web-mode equivalents of the Tauri scan_music_folder invokes)
  scanLibraryFolder: (path: string) =>
    request<
      Array<{
        file_path: string;
        file_name: string;
        title: string;
        artist: string;
        album?: string;
        duration?: number;
        size: number;
        media_type?: string;
      }>
    >('/api/library/scan', {
      method: 'POST',
      body: JSON.stringify({ path }),
    }),

  resolveLibraryPaths: (paths: string[]) =>
    request<
      Array<{
        file_path: string;
        file_name: string;
        title: string;
        artist: string;
        album?: string;
        duration?: number;
        size: number;
        media_type?: string;
      }>
    >('/api/library/resolve', {
      method: 'POST',
      body: JSON.stringify({ paths }),
    }),

  libraryIsDirectory: async (path: string) => {
    const res = await request<{ isDirectory: boolean }>('/api/library/is-directory', {
      method: 'POST',
      body: JSON.stringify({ path }),
    });
    return res.isDirectory;
  },

  // Streaming URLs for local playback mode. Token is appended as a query
  // parameter because <audio>/<video> elements can't set Authorization headers.
  getStreamUrl: (trackUrl: string, guildId?: string) => {
    const params = new URLSearchParams({ url: trackUrl });
    if (authToken) params.set('token', authToken);
    if (guildId) params.set('guildId', guildId);
    return `${baseUrl}/api/music/stream?${params.toString()}`;
  },

  getLocalStreamUrl: (filePath: string, guildId?: string) => {
    const params = new URLSearchParams({ path: filePath });
    if (authToken) params.set('token', authToken);
    if (guildId) params.set('guildId', guildId);
    return `${baseUrl}/api/music/stream/local?${params.toString()}`;
  },

  getUploadStreamUrl: (fileName: string, guildId?: string) => {
    const params = new URLSearchParams({ filePath: fileName });
    if (authToken) params.set('token', authToken);
    if (guildId) params.set('guildId', guildId);
    return `${baseUrl}/api/music/stream?${params.toString()}`;
  },

  /**
   * Get a video stream URL for a local file (Tauri music folder).
   * Same as getLocalStreamUrl but semantically for video content.
   */
  getVideoStreamUrl: (filePath: string, guildId?: string) => {
    const params = new URLSearchParams({ path: filePath });
    if (authToken) params.set('token', authToken);
    if (guildId) params.set('guildId', guildId);
    return `${baseUrl}/api/music/stream/local?${params.toString()}`;
  },

  // Playlists
  getPlaylists: () => request<{ success: boolean; data: PlaylistSummary[] }>('/api/playlists'),

  getPlaylist: (id: string) => request<{ success: boolean; data: PlaylistDetail }>(`/api/playlists/${id}`),

  createPlaylist: (name: string, description?: string, isPublic = true) =>
    request<{ success: boolean; data: { id: string; name: string; description: string | null; isPublic: boolean } }>(
      '/api/playlists',
      {
        method: 'POST',
        body: JSON.stringify({ name, description, isPublic }),
      },
    ),

  updatePlaylist: (id: string, data: { name?: string; description?: string; isPublic?: boolean }) =>
    request<{ success: boolean; data: unknown }>(`/api/playlists/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deletePlaylist: (id: string) => request<{ success: boolean }>(`/api/playlists/${id}`, { method: 'DELETE' }),

  addTrackToPlaylist: (
    playlistId: string,
    track: {
      title: string;
      artist?: string;
      duration?: number;
      url: string;
      thumbnail?: string;
      platform?: string;
      filePath?: string;
    },
  ) =>
    request<{ success: boolean; data: unknown }>(`/api/playlists/${playlistId}/tracks`, {
      method: 'POST',
      body: JSON.stringify(track),
    }),

  removeTrackFromPlaylist: (playlistId: string, trackId: string) =>
    request<{ success: boolean }>(`/api/playlists/${playlistId}/tracks/${trackId}`, {
      method: 'DELETE',
    }),

  reorderPlaylistTrack: (playlistId: string, trackId: string, position: number) =>
    request<{ success: boolean }>(`/api/playlists/${playlistId}/tracks/${trackId}/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ position }),
    }),

  playPlaylist: async (
    id: string,
    guildId?: string,
    voiceChannelId?: string,
  ): Promise<{
    success: boolean;
    requiresVoiceChannel?: boolean;
    error?: string;
    data?: { playlistName: string; tracksQueued: number };
  }> => {
    // Raw fetch so we can read the 400 body when requiresVoiceChannel is true.
    const res = await fetch(`${baseUrl}/api/playlists/${id}/play`, {
      method: 'POST',
      headers: buildHeaders(guildId),
      body: JSON.stringify({ voiceChannelId }),
    });
    if (res.status === 401 || res.status === 403) {
      onAuthFailure?.();
    }
    return res.json();
  },

  // Commands (chat panel)
  getCommandRegistry: () => request<{ success: boolean; commands: CommandRegistryItem[] }>('/api/commands/registry'),

  executeCommand: (command: string, args: Record<string, unknown> = {}, guildId?: string, channelId?: string) =>
    request<{ success: boolean; execution: CommandExecutionResult }>('/api/commands/execute', {
      method: 'POST',
      body: JSON.stringify({ command, arguments: args, guildId, channelId }),
    }),

  getCommandGuilds: () =>
    request<{ success: boolean; guilds: Array<{ id: string; name: string }> }>('/api/commands/guilds'),

  getCommandChannels: (guildId: string) =>
    request<{
      success: boolean;
      channels: Array<{ id: string; name: string; type: string }>;
    }>(`/api/commands/guilds/${guildId}/channels`),

  getCommandHistory: (limit = 50) =>
    request<{ success: boolean; history: CommandExecutionResult[] }>(`/api/commands/history?limit=${limit}`),

  clearCommandHistory: () => request<{ success: boolean }>('/api/commands/history', { method: 'DELETE' }),

  getCommandStats: () =>
    request<{
      success: boolean;
      stats: {
        totalCommands: number;
        totalExecutions: number;
        successfulExecutions: number;
        failedExecutions: number;
        mostUsedCommands: Array<{ command: string; count: number }>;
      };
    }>('/api/commands/stats'),

  // Logs
  getLogs: (queryString: string) =>
    request<{
      items: Array<{
        id: string;
        category: 'audit' | 'command' | 'system';
        level: 'info' | 'warn' | 'error' | 'debug';
        message: string;
        ts: number;
        source?: string;
        guildId?: string;
        metadata?: Record<string, unknown>;
      }>;
      total: number;
      hasMore: boolean;
      offset: number;
      limit: number;
    }>(`/api/logs?${queryString}`),

  getLogStats: () =>
    request<{
      total: number;
      byCategory: Record<string, number>;
      byLevel: Record<string, number>;
      recent: { lastHour: number; lastDay: number };
    }>('/api/logs/stats'),

  clearLogs: (type?: string, level?: string) => {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    if (level) params.set('level', level);
    return request<{ success: boolean; clearedCount: number }>(`/api/logs?${params.toString()}`, { method: 'DELETE' });
  },

  // Channel messages (chat panel)
  getChannelMessages: (channelId: string, limit = 50, before?: string) => {
    let url = `/api/channels/${channelId}/messages?limit=${limit}`;
    if (before) url += `&before=${before}`;
    return request<{ success: boolean; messages: DiscordMessage[] }>(url);
  },

  sendChannelMessage: (channelId: string, content: string) =>
    request<{ success: boolean; message: DiscordMessage }>(`/api/channels/${channelId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
};

// Playlist types for API responses
export interface PlaylistSummary {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  userId: string;
  trackCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistTrackItem {
  id: string;
  title: string;
  artist: string | null;
  duration: number;
  url: string;
  thumbnail: string | null;
  platform: string;
  position: number;
}

export interface PlaylistDetail {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  trackCount: number;
  tracks: PlaylistTrackItem[];
}

// Command types for chat panel
export interface CommandRegistryItem {
  name: string;
  description: string;
  category?: string;
  options?: CommandOptionItem[];
}

export interface CommandOptionItem {
  name: string;
  description: string;
  type: 'string' | 'integer' | 'boolean' | 'file';
  required?: boolean;
  choices?: Array<{ name: string; value: string | number }>;
  min?: number;
  max?: number;
}

export interface CommandExecutionResult {
  id: string;
  command: string;
  arguments: Record<string, unknown>;
  timestamp: number;
  status: 'success' | 'error' | 'pending';
  result?: unknown;
  error?: string;
}

// Discord message types
export interface DiscordMessageAuthor {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bot: boolean;
}

export interface DiscordAttachment {
  id: string;
  url: string;
  proxyURL: string;
  name: string | null;
  contentType: string | null;
  size: number;
  width: number | null;
  height: number | null;
}

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline: boolean;
}

export interface DiscordEmbed {
  title: string | null;
  description: string | null;
  url: string | null;
  color: number | null;
  timestamp: string | null;
  footer: { text: string; iconURL?: string } | null;
  thumbnail: { url: string; width?: number; height?: number } | null;
  image: { url: string; width?: number; height?: number } | null;
  author: { name: string; iconURL?: string; url?: string } | null;
  fields: DiscordEmbedField[];
}

export interface DiscordReaction {
  emoji: string;
  count: number;
}

export interface DiscordMessage {
  id: string;
  content: string;
  author: DiscordMessageAuthor;
  timestamp: number;
  editedTimestamp: number | null;
  attachments: DiscordAttachment[];
  embeds: DiscordEmbed[];
  reactions: DiscordReaction[];
  reference: { messageId: string | null; channelId: string | null } | null;
  type: number;
}
