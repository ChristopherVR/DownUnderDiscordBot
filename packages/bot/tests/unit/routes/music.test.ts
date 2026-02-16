import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import musicRouter from '../../../routes/music';

const stateManagerMock = {
  getPlayerState: vi.fn().mockReturnValue({ status: 'playing' }),
  getQueueHistory: vi.fn().mockReturnValue([{ id: 'track-1' }]),
  seekTo: vi.fn().mockResolvedValue(true),
  setVolume: vi.fn().mockResolvedValue(true),
};

const queueMock = {
  node: {
    pause: vi.fn(),
    resume: vi.fn(),
    skip: vi.fn(),
    setVolume: vi.fn(),
    seek: vi.fn(),
  },
  tracks: {
    size: 0,
    clear: vi.fn(),
    shuffle: vi.fn(),
  },
  history: {
    previousTrack: null,
    nextTrack: null,
  },
};

const playerMock = {
  search: vi.fn().mockResolvedValue({
    playlist: null,
    tracks: [
      {
        id: '1',
        title: 'Mock Track',
        author: 'Mock Artist',
        duration: '3:00',
        url: 'mock-url',
        thumbnail: 'mock-thumb',
      },
    ],
  }),
  nodes: {
    get: vi.fn().mockReturnValue(queueMock),
  },
};

vi.mock('../../../helpers/discord/player', () => ({
  useDefaultPlayer: () => playerMock,
  getPlayerStateManager: () => stateManagerMock,
}));

vi.mock('../../../helpers/commands/DiscordBotIntegration', () => ({
  executeCommand: vi.fn().mockResolvedValue({
    success: true,
    results: [
      {
        id: 'search-1',
        title: 'Search Result',
        artist: 'Tester',
        duration: 200,
        url: 'search-url',
      },
    ],
  }),
}));

import { executeCommand } from '../../../helpers/commands/DiscordBotIntegration';

const GUILD_HEADER = { 'x-guild-id': 'guild-1' };

describe('Music API Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/music', musicRouter);
    vi.clearAllMocks();
  });

  it('GET /api/music/state returns player state', async () => {
    const response = await request(app).get('/api/music/state').set(GUILD_HEADER).expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('playing');
  });

  it('GET /api/music/history returns history list', async () => {
    const response = await request(app).get('/api/music/history').set(GUILD_HEADER).expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
  });

  it('GET /api/music/search proxies to command integration', async () => {
    const response = await request(app).get('/api/music/search').query({ q: 'test' }).expect(200);
    expect(executeCommand).toHaveBeenCalledWith('search', { query: 'test' });
    expect(response.body.results).toHaveLength(1);
    expect(response.body.results[0].title).toBe('Search Result');
  });

  it('GET /api/music/search validates query parameter', async () => {
    await request(app).get('/api/music/search').expect(400);
  });

  it('POST /api/music/seek validates payload', async () => {
    await request(app).post('/api/music/seek').set(GUILD_HEADER).send({ position: -5 }).expect(400);
  });

  it('POST /api/music/seek succeeds with valid payload', async () => {
    const response = await request(app)
      .post('/api/music/seek')
      .set(GUILD_HEADER)
      .send({ position: 42 })
      .expect(200);
    expect(response.body.success).toBe(true);
  });
});
