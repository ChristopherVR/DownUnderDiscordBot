import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockEntersState } = vi.hoisted(() => ({
  mockEntersState: vi.fn(),
}));

vi.mock('discord-voip', () => ({
  entersState: mockEntersState,
  VoiceConnectionStatus: {
    Ready: 'ready',
    Connecting: 'connecting',
    Signalling: 'signalling',
    Disconnected: 'disconnected',
    Destroyed: 'destroyed',
  },
}));

const { mockCreateAudioPlayer } = vi.hoisted(() => ({
  mockCreateAudioPlayer: vi.fn((opts: unknown) => ({ __audioPlayerOpts: opts })),
}));

vi.mock('discord-player', () => ({
  Player: vi.fn(),
  createAudioPlayer: mockCreateAudioPlayer,
  AudioPlayer: vi.fn(),
  GuildQueue: vi.fn(),
  // player.ts statically imports registerExtractors, which transitively pulls
  // in every extractor module — they need these discord-player exports too.
  BaseExtractor: class BaseExtractor {
    static identifier = 'mock-extractor';
    context: Record<string, unknown> = {};
    createResponse(playlist: unknown, tracks: unknown[]) {
      return { playlist, tracks };
    }
    async activate() {}
    async deactivate() {}
    async validate(_query: string): Promise<boolean> {
      return false;
    }
    async handle(_query: string): Promise<{ playlist: unknown; tracks: unknown[] }> {
      return { playlist: null, tracks: [] };
    }
    async stream(_track: unknown): Promise<unknown> {
      return '';
    }
  },
  Track: class Track {
    constructor(
      public player: unknown,
      public options: Record<string, unknown>,
    ) {}
  },
  Playlist: class Playlist {
    constructor(
      public player: unknown,
      public options: Record<string, unknown>,
    ) {}
  },
  QueryType: {
    AUTO: 0,
    YOUTUBE: 1,
    YOUTUBE_PLAYLIST: 2,
    SOUNDCLOUD_TRACK: 3,
    SOUNDCLOUD_PLAYLIST: 4,
    SOUNDCLOUD: 5,
    SPOTIFY_SONG: 6,
    SPOTIFY_ALBUM: 7,
    SPOTIFY_PLAYLIST: 8,
    YOUTUBE_SEARCH: 9,
    YOUTUBE_VIDEO: 10,
    SOUNDCLOUD_SEARCH: 11,
    FILE: 12,
    AUTO_SEARCH: 13,
  },
}));

import {
  waitForVoiceReady,
  isConnectionHealthy,
  createBotAudioPlayer,
  useDefaultPlayer,
  getPlayerStateManager,
  getPlayerEventManager,
} from '../../../../src/helpers/discord/player';
import { VoiceConnectionStatus } from 'discord-voip';
import type { GuildQueue } from 'discord-player';

function makeQueue(connectionStatus: string | undefined): GuildQueue {
  return {
    connection: connectionStatus === undefined ? null : { state: { status: connectionStatus } },
  } as unknown as GuildQueue;
}

describe('player helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createBotAudioPlayer', () => {
    it('creates an audio player with a raised maxMissedFrames tolerance', () => {
      createBotAudioPlayer();
      expect(mockCreateAudioPlayer).toHaveBeenCalledWith({
        behaviors: { maxMissedFrames: 500 },
      });
    });
  });

  describe('waitForVoiceReady', () => {
    it('resolves immediately when there is no connection yet', async () => {
      const queue = makeQueue(undefined);
      await waitForVoiceReady(queue);
      expect(mockEntersState).not.toHaveBeenCalled();
    });

    it('resolves immediately when the connection is already Ready', async () => {
      const queue = makeQueue(VoiceConnectionStatus.Ready);
      await waitForVoiceReady(queue);
      expect(mockEntersState).not.toHaveBeenCalled();
    });

    it('waits for the Ready state via entersState when not yet ready', async () => {
      mockEntersState.mockResolvedValue(undefined);
      const queue = makeQueue(VoiceConnectionStatus.Connecting);

      await waitForVoiceReady(queue, 5_000);

      expect(mockEntersState).toHaveBeenCalledTimes(1);
      expect(mockEntersState).toHaveBeenCalledWith(queue.connection, VoiceConnectionStatus.Ready, 5_000);
    });

    it('propagates a timeout/rejection from entersState instead of silently continuing', async () => {
      mockEntersState.mockRejectedValue(new Error('timed out'));
      const queue = makeQueue(VoiceConnectionStatus.Connecting);

      await expect(waitForVoiceReady(queue, 100)).rejects.toThrow('timed out');
    });

    it('defaults the timeout to 30 seconds when not specified', async () => {
      mockEntersState.mockResolvedValue(undefined);
      const queue = makeQueue(VoiceConnectionStatus.Signalling);

      await waitForVoiceReady(queue);

      expect(mockEntersState).toHaveBeenCalledWith(queue.connection, VoiceConnectionStatus.Ready, 30_000);
    });
  });

  describe('isConnectionHealthy', () => {
    it('returns false when there is no connection', () => {
      expect(isConnectionHealthy(makeQueue(undefined))).toBe(false);
    });

    it('returns false for a destroyed connection', () => {
      expect(isConnectionHealthy(makeQueue(VoiceConnectionStatus.Destroyed))).toBe(false);
    });

    it('returns false for a disconnected connection', () => {
      expect(isConnectionHealthy(makeQueue(VoiceConnectionStatus.Disconnected))).toBe(false);
    });

    it('returns true for a Ready connection', () => {
      expect(isConnectionHealthy(makeQueue(VoiceConnectionStatus.Ready))).toBe(true);
    });

    it('returns true for an in-progress (e.g. Connecting/Signalling) connection', () => {
      expect(isConnectionHealthy(makeQueue(VoiceConnectionStatus.Connecting))).toBe(true);
      expect(isConnectionHealthy(makeQueue(VoiceConnectionStatus.Signalling))).toBe(true);
    });
  });

  describe('singleton guards before initializePlayer has run', () => {
    it('useDefaultPlayer throws', () => {
      expect(() => useDefaultPlayer()).toThrow('Player has not been initialized.');
    });

    it('getPlayerStateManager throws', () => {
      expect(() => getPlayerStateManager()).toThrow('Player state manager has not been initialized.');
    });

    it('getPlayerEventManager throws', () => {
      expect(() => getPlayerEventManager()).toThrow('Player event manager has not been initialized.');
    });
  });
});
