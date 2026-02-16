let baseUrl = 'http://localhost:3001';

export function setApiBaseUrl(host: string, port: number) {
  baseUrl = `http://${host}:${port}`;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  // Player controls
  play: (query: string, platform?: string) =>
    request('/api/music/play', { method: 'POST', body: JSON.stringify({ query, platform }) }),
  pause: () => request('/api/music/pause', { method: 'POST' }),
  resume: () => request('/api/music/resume', { method: 'POST' }),
  stop: () => request('/api/music/stop', { method: 'POST' }),
  skip: () => request('/api/music/skip', { method: 'POST' }),
  seek: (position: number) =>
    request('/api/music/seek', { method: 'POST', body: JSON.stringify({ position }) }),
  volume: (volume: number) =>
    request('/api/music/volume', { method: 'POST', body: JSON.stringify({ volume }) }),
  loop: (mode: string) =>
    request('/api/music/repeat', { method: 'POST', body: JSON.stringify({ mode }) }),

  // Queue
  getQueue: () => request('/api/music/queue'),
  addToQueue: (query: string) =>
    request('/api/music/queue/add', { method: 'POST', body: JSON.stringify({ query }) }),
  removeFromQueue: (index: number) =>
    request(`/api/music/queue/${index}`, { method: 'DELETE' }),
  clearQueue: () => request('/api/music/queue/clear', { method: 'POST' }),
  shuffleQueue: () => request('/api/music/queue/shuffle', { method: 'POST' }),

  // Search
  search: (query: string, platform = 'auto') =>
    request<{ success: boolean; data: { tracks: unknown[] } }>(
      `/api/music/search`,
      { method: 'POST', body: JSON.stringify({ query, searchEngine: platform }) },
    ),

  // State
  getPlayerState: (guildId: string) =>
    request(`/api/music/state?guildId=${guildId}`),
  getHistory: () => request('/api/music/history'),

  // Health
  health: () => request<{ ok: boolean }>('/api/health'),

  // Local files
  getLocalFiles: () => request('/api/music/local-files'),

  // Playlists
  getPlaylists: () => request('/api/playlists'),
  getPlaylist: (id: string) => request(`/api/playlists/${id}`),
  playPlaylist: (id: string) => request(`/api/playlists/${id}/play`, { method: 'POST' }),
};
