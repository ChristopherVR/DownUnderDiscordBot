import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api, setApiBaseUrl } from '@/lib/api';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function jsonResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  };
}

describe('api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset baseUrl to default
    setApiBaseUrl('localhost', 3000);
  });

  describe('setApiBaseUrl', () => {
    it('changes the base URL used by requests', async () => {
      setApiBaseUrl('192.168.1.50', 8080);
      mockFetch.mockResolvedValue(jsonResponse({ ok: true }));

      await api.health();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://192.168.1.50:8080/api/health',
        expect.objectContaining({
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        }),
      );
    });
  });

  describe('health', () => {
    it('calls GET /api/health', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ ok: true }));
      const result = await api.health();
      expect(result).toEqual({ ok: true });
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/health', expect.anything());
    });
  });

  describe('getAuthStatus', () => {
    it('calls GET /api/auth/status', async () => {
      const data = { oauthConfigured: true, bot: { id: 'b1', username: 'Bot', avatar: null } };
      mockFetch.mockResolvedValue(jsonResponse(data));

      const result = await api.getAuthStatus();

      expect(result).toEqual(data);
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/auth/status', expect.anything());
    });
  });

  describe('getUser', () => {
    it('calls GET /api/auth/user with Authorization header', async () => {
      const user = { id: 'u1', username: 'TestUser', avatar: null };
      mockFetch.mockResolvedValue(jsonResponse(user));

      const result = await api.getUser('my-token');

      expect(result).toEqual(user);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/user',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my-token',
          }),
        }),
      );
    });
  });

  describe('getGuilds', () => {
    it('calls GET /api/auth/guilds with Authorization header', async () => {
      const data = { guilds: [{ id: 'g1', name: 'Test', icon: null, owner: true, botPresent: true }] };
      mockFetch.mockResolvedValue(jsonResponse(data));

      const result = await api.getGuilds('tok');

      expect(result).toEqual(data);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/guilds',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer tok',
          }),
        }),
      );
    });
  });

  describe('player controls', () => {
    it('play sends POST with query, platform, and voiceChannelId', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ success: true }));

      await api.play('test song', 'youtube', 'vc-1', 'guild-1');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/music/play',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ query: 'test song', platform: 'youtube', voiceChannelId: 'vc-1' }),
          headers: expect.objectContaining({
            'x-guild-id': 'guild-1',
          }),
        }),
      );
    });

    it('pause sends POST to /api/music/pause', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ success: true }));
      await api.pause('g1');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/music/pause',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'x-guild-id': 'g1' }),
        }),
      );
    });

    it('resume sends POST to /api/music/resume', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ success: true }));
      await api.resume('g1');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/music/resume',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('stop sends POST to /api/music/stop', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ success: true }));
      await api.stop();
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/music/stop',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('skip sends POST to /api/music/skip', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ success: true }));
      await api.skip();
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/music/skip',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('seek sends POST with position', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ success: true }));
      await api.seek(120, 'g1');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/music/seek',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ position: 120 }),
        }),
      );
    });

    it('volume sends POST with volume value', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ success: true }));
      await api.volume(75, 'g1');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/music/volume',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ volume: 75 }),
        }),
      );
    });

    it('loop sends POST with mode', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ success: true }));
      await api.loop('track', 'g1');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/music/repeat',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ mode: 'track' }),
        }),
      );
    });
  });

  describe('queue operations', () => {
    it('addToQueue sends POST with query and platform', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ success: true }));
      await api.addToQueue('song', 'spotify', 'g1');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/music/queue/add',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ query: 'song', platform: 'spotify' }),
          headers: expect.objectContaining({ 'x-guild-id': 'g1' }),
        }),
      );
    });

    it('removeFromQueue sends DELETE to correct index', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ success: true }));
      await api.removeFromQueue(3, 'g1');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/music/queue/3',
        expect.objectContaining({ method: 'DELETE' }),
      );
    });

    it('clearQueue sends POST to queue/clear', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ success: true }));
      await api.clearQueue('g1');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/music/queue/clear',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('shuffleQueue sends POST to queue/shuffle', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ success: true }));
      await api.shuffleQueue('g1');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/music/queue/shuffle',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('moveQueueTrack sends POST with from and to', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ success: true }));
      await api.moveQueueTrack(0, 3, 'g1');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/music/queue/move',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ from: 0, to: 3 }),
        }),
      );
    });
  });

  describe('search', () => {
    it('sends POST to /api/music/search with query and engine', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ success: true, data: { tracks: [] } }));
      await api.search('test query', 'youtube');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/music/search',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ query: 'test query', searchEngine: 'youtube' }),
        }),
      );
    });

    it('defaults platform to auto', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ success: true, data: { tracks: [] } }));
      await api.search('test');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/music/search',
        expect.objectContaining({
          body: JSON.stringify({ query: 'test', searchEngine: 'auto' }),
        }),
      );
    });
  });

  describe('error handling', () => {
    it('throws on non-ok response for request()', async () => {
      mockFetch.mockResolvedValue(jsonResponse({}, 500));
      await expect(api.health()).rejects.toThrow('API error: 500');
    });

    it('throws on non-ok response for authedRequest()', async () => {
      mockFetch.mockResolvedValue(jsonResponse({}, 401));
      await expect(api.getUser('bad-token')).rejects.toThrow('API error: 401');
    });

    it('play() does not throw on non-ok responses (uses raw fetch)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ success: false, requiresVoiceChannel: true }),
      });

      const result = await api.play('query');
      expect(result).toEqual({ success: false, requiresVoiceChannel: true });
    });
  });

  describe('URL builders', () => {
    it('getStreamUrl encodes URL parameter', () => {
      const url = api.getStreamUrl('https://youtube.com/watch?v=abc&t=10');
      expect(url).toBe(
        'http://localhost:3000/api/music/stream?url=https%3A%2F%2Fyoutube.com%2Fwatch%3Fv%3Dabc%26t%3D10',
      );
    });

    it('getLocalStreamUrl encodes path parameter', () => {
      const url = api.getLocalStreamUrl('/music/my song.mp3');
      expect(url).toBe('http://localhost:3000/api/music/stream/local?path=%2Fmusic%2Fmy+song.mp3');
    });

    it('getUploadStreamUrl encodes fileName parameter', () => {
      const url = api.getUploadStreamUrl('song file.mp3');
      expect(url).toBe('http://localhost:3000/api/music/stream?filePath=song+file.mp3');
    });

    it('getVideoStreamUrl returns same format as getLocalStreamUrl', () => {
      const url = api.getVideoStreamUrl('/videos/clip.mp4');
      expect(url).toBe(api.getLocalStreamUrl('/videos/clip.mp4'));
    });
  });

  describe('playlists', () => {
    it('getPlaylists calls GET /api/playlists', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ success: true, data: [] }));
      await api.getPlaylists();
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/playlists', expect.anything());
    });

    it('createPlaylist sends POST with name and description', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ success: true, data: { id: 'p1' } }));
      await api.createPlaylist('My Playlist', 'Desc', true);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/playlists',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'My Playlist', description: 'Desc', isPublic: true }),
        }),
      );
    });

    it('deletePlaylist sends DELETE to /api/playlists/:id', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ success: true }));
      await api.deletePlaylist('p1');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/playlists/p1',
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });

  describe('channel messages', () => {
    it('getChannelMessages builds correct URL with limit and before', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ success: true, messages: [] }));
      await api.getChannelMessages('ch-1', 25, 'msg-50');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/channels/ch-1/messages?limit=25&before=msg-50',
        expect.anything(),
      );
    });

    it('sendChannelMessage sends POST with content', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ success: true, message: {} }));
      await api.sendChannelMessage('ch-1', 'Hello!');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/channels/ch-1/messages',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ content: 'Hello!' }),
        }),
      );
    });
  });

  describe('dashboard and instances', () => {
    it('getDashboard calls GET /api/dashboard', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ bot: {}, guilds: [] }));
      await api.getDashboard();
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/dashboard', expect.anything());
    });

    it('forceStopInstance sends POST with encoded instanceId', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ success: true, affectedGuilds: [] }));
      await api.forceStopInstance('instance/123');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/instances/instance%2F123/force-stop',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('clearStaleInstances sends DELETE to /api/instances/stale', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ success: true, removed: 2 }));
      await api.clearStaleInstances();
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/instances/stale',
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });

  describe('logs', () => {
    it('getLogs passes query string to /api/logs', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ items: [], total: 0, hasMore: false, offset: 0, limit: 50 }));
      await api.getLogs('category=audit&level=info');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/logs?category=audit&level=info',
        expect.anything(),
      );
    });

    it('clearLogs builds params and sends DELETE', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ success: true, clearedCount: 5 }));
      await api.clearLogs('audit', 'info');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/logs?'),
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });
});
