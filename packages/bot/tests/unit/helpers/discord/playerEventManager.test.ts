import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockEnhancedLogger = vi.hoisted(() => ({
  system: vi.fn(),
  audit: vi.fn(),
  auditTrack: vi.fn(),
  auditEvent: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
}));

vi.mock('../../../../src/helpers/logger/logger', () => ({
  enhancedLogger: mockEnhancedLogger,
}));

// discord.js's builder classes (EmbedBuilder/ButtonBuilder/ActionRowBuilder/
// ButtonStyle/PermissionFlagsBits) are pure, side-effect-free value classes —
// use the real ones so assertions reflect real chaining/validation behavior.
// TextChannel is swapped for a lightweight marker class so `instanceof`
// checks in the source work against plain test fixtures without fighting
// the real class's Guild/client-backed constructor.
vi.mock('discord.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('discord.js')>();
  class TextChannel {
    id = 'channel-1';
    send = vi.fn();
  }
  return {
    ...actual,
    TextChannel,
  };
});

// The global test setup mocks 'discord-player' with only what the extractor
// tests need (Player/BaseExtractor/Track/Playlist/QueryType) — this file
// also needs the real-shaped QueueRepeatMode/GuildQueueEvent enums that
// playerEventManager.ts switches/keys on.
vi.mock('discord-player', async (importOriginal) => {
  const actual = await importOriginal<typeof import('discord-player')>();
  return {
    ...actual,
    QueueRepeatMode: { OFF: 0, TRACK: 1, QUEUE: 2, AUTOPLAY: 3 },
    GuildQueueEvent: {
      ...(actual as Record<string, unknown>).GuildQueueEvent,
      AudioTrackAdd: 'audioTrackAdd',
    },
  };
});

import { TextChannel } from 'discord.js';
import { QueueRepeatMode, GuildQueueEvent } from 'discord-player';
import {
  getControllerPayload,
  getCompletedControllerPayload,
  controllerRegistry,
  PlayerEventManager,
} from '../../../../src/helpers/discord/playerEventManager';

function makeTextChannel(overrides: Partial<Record<string, unknown>> = {}) {
  const channel = new TextChannel() as unknown as TextChannel & {
    send: ReturnType<typeof vi.fn>;
    permissionsFor: ReturnType<typeof vi.fn>;
  };
  Object.assign(channel, {
    send: vi.fn().mockResolvedValue({ id: 'msg-1' }),
    permissionsFor: vi.fn().mockReturnValue({ has: () => true }),
    ...overrides,
  });
  return channel;
}

function makeQueue(overrides: Partial<Record<string, unknown>> = {}) {
  const base = {
    guild: { id: 'guild-1', name: 'Test Guild' },
    channel: { id: 'voice-1', name: 'General' },
    currentTrack: null as unknown,
    tracks: { size: 0 },
    history: { previousTrack: null, nextTrack: null },
    repeatMode: QueueRepeatMode.OFF,
    metadata: {},
    node: {
      isPaused: () => false,
      getTimestamp: () => null,
      createProgressBar: () => null,
    },
    isPlaying: () => false,
  };
  return { ...base, ...overrides } as unknown as Parameters<typeof getControllerPayload>[0];
}

describe('getControllerPayload', () => {
  it('renders the empty-queue state with all action buttons disabled', () => {
    const payload = getControllerPayload(makeQueue());

    expect(payload.embeds[0].data.title).toBe('No song is currently playing.');
    const allButtons = payload.components.flatMap((row) => row.components);
    for (const button of allButtons) {
      // Every non-loop button should be disabled when there's no track.
      expect(button.data.disabled).toBe(true);
    }
  });

  it('enables track-dependent buttons once a track is playing', () => {
    const track = {
      title: 'Song A',
      thumbnail: 'https://example.com/a.png',
      author: 'Artist A',
      duration: '3:00',
      url: 'https://example.com/a',
      requestedBy: { toString: () => '<@1>' },
    };
    const payload = getControllerPayload(makeQueue({ currentTrack: track, tracks: { size: 2 } }));

    expect(payload.embeds[0].data.title).toBe('Song A');
    const [transportRow] = payload.components;
    const [back, pauseResume, skip, stop] = transportRow.components;
    expect(pauseResume.data.disabled).toBe(false);
    expect(stop.data.disabled).toBe(false);
    // No previous track and no next track/queue → back/skip stay disabled.
    expect(back.data.disabled).toBe(true);
    expect(skip.data.disabled).toBe(false); // tracks.size is 2, so "next" exists
  });

  it('enables back when there is a previous track in history', () => {
    const track = {
      title: 'Song B',
      thumbnail: 'https://example.com/thumb.png',
      author: 'A',
      duration: '1:00',
      url: 'x',
      requestedBy: null,
    };
    const payload = getControllerPayload(
      makeQueue({ currentTrack: track, history: { previousTrack: { title: 'Prev' }, nextTrack: null } }),
    );
    const [{ components }] = payload.components;
    const [back] = components;
    expect(back.data.disabled).toBe(false);
  });

  it('reflects TRACK repeat mode on the loop button', () => {
    const payload = getControllerPayload(makeQueue({ repeatMode: QueueRepeatMode.TRACK }));
    const [, secondRow] = payload.components;
    const loopButton = secondRow.components[1];
    expect(loopButton.data.label).toBe('🔂');
  });

  it('reflects AUTOPLAY repeat mode on the loop button', () => {
    const payload = getControllerPayload(makeQueue({ repeatMode: QueueRepeatMode.AUTOPLAY }));
    const [, secondRow] = payload.components;
    const loopButton = secondRow.components[1];
    expect(loopButton.data.label).toBe('▶️');
  });

  it('shows Paused vs Playing in the Player field based on node state', () => {
    const track = {
      title: 'Song C',
      thumbnail: 'https://example.com/thumb.png',
      author: 'A',
      duration: '2:00',
      url: 'x',
      requestedBy: null,
    };
    const paused = getControllerPayload(
      makeQueue({
        currentTrack: track,
        node: { isPaused: () => true, getTimestamp: () => null, createProgressBar: () => null },
      }),
    );
    const playerField = paused.embeds[0].data.fields?.find((f) => f.name === 'Player');
    expect(playerField?.value).toBe('Paused');
  });
});

describe('getCompletedControllerPayload', () => {
  it('returns a no-button "playback ended" payload', () => {
    const payload = getCompletedControllerPayload();
    expect(payload.components).toEqual([]);
    expect(payload.embeds[0].data.title).toBe('Playback Ended');
  });
});

describe('controllerRegistry', () => {
  beforeEach(() => {
    // Registry is a module-level singleton — reset between tests.
    controllerRegistry.deleteController('guild-a');
    controllerRegistry.deleteController('guild-b');
    controllerRegistry.clearInterval('guild-a');
    controllerRegistry.clearInterval('guild-b');
  });

  it('tracks controllers independently per guild', () => {
    const msgA = { id: 'a' } as never;
    const msgB = { id: 'b' } as never;
    controllerRegistry.setController('guild-a', msgA);
    controllerRegistry.setController('guild-b', msgB);

    expect(controllerRegistry.getController('guild-a')).toBe(msgA);
    expect(controllerRegistry.getController('guild-b')).toBe(msgB);
    expect(controllerRegistry.hasController('guild-a')).toBe(true);

    controllerRegistry.deleteController('guild-a');
    expect(controllerRegistry.hasController('guild-a')).toBe(false);
    // Deleting one guild's controller must not affect another guild's.
    expect(controllerRegistry.hasController('guild-b')).toBe(true);
  });

  it('replacing an interval for a guild clears the previous one', () => {
    vi.useFakeTimers();
    try {
      const first = setInterval(() => {}, 1000);
      const second = setInterval(() => {}, 1000);
      const clearSpy = vi.spyOn(global, 'clearInterval');

      controllerRegistry.setInterval('guild-a', first);
      controllerRegistry.setInterval('guild-a', second);

      expect(clearSpy).toHaveBeenCalledWith(first);
      controllerRegistry.clearInterval('guild-a');
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('PlayerEventManager', () => {
  function makePlayer() {
    const handlers = new Map<string, (...args: unknown[]) => unknown>();
    return {
      handlers,
      events: {
        on: vi.fn((event: string, handler: (...args: unknown[]) => unknown) => {
          handlers.set(event, handler);
        }),
      },
      nodes: {
        get: vi.fn(),
      },
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    controllerRegistry.deleteController('guild-1');
    controllerRegistry.clearInterval('guild-1');
  });

  it('registers a listener for every lifecycle event it depends on', () => {
    const player = makePlayer();
    const _manager = new PlayerEventManager(player as never);

    for (const event of [
      GuildQueueEvent.AudioTrackAdd,
      'audioTracksAdd',
      'playerStart',
      'playerFinish',
      'disconnect',
      'emptyChannel',
      'emptyQueue',
      'playerError',
      'debug',
      'error',
    ]) {
      expect(player.handlers.has(event)).toBe(true);
    }
  });

  it('playerStart posts a new controller message when none exists yet', async () => {
    vi.useFakeTimers();
    try {
      const player = makePlayer();
      const _manager = new PlayerEventManager(player as never);

      const channel = makeTextChannel();
      const track = {
        title: 'Song',
        duration: '3:00',
        requestedBy: null,
        thumbnail: 'https://example.com/thumb.png',
        url: 'https://example.com/song',
        author: 'Artist',
      };
      const queue = makeQueue({ currentTrack: track, metadata: { channel } });

      const handler = player.handlers.get('playerStart')!;
      await handler(queue, track);

      expect(channel.send).toHaveBeenCalledTimes(1);
      expect(controllerRegistry.getController('guild-1')).toEqual({ id: 'msg-1' });
    } finally {
      vi.useRealTimers();
    }
  });

  it('playerStart edits the existing controller instead of posting a new one', async () => {
    vi.useFakeTimers();
    try {
      const player = makePlayer();
      const _manager = new PlayerEventManager(player as never);

      const existing = { id: 'msg-existing', edit: vi.fn().mockResolvedValue(undefined) };
      controllerRegistry.setController('guild-1', existing as never);

      const channel = makeTextChannel();
      const track = {
        title: 'Song',
        duration: '3:00',
        requestedBy: null,
        thumbnail: 'https://example.com/thumb.png',
        url: 'https://example.com/song',
        author: 'Artist',
      };
      const queue = makeQueue({ currentTrack: track, metadata: { channel } });

      const handler = player.handlers.get('playerStart')!;
      await handler(queue, track);

      expect(existing.edit).toHaveBeenCalledTimes(1);
      expect(channel.send).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('falls back to posting a new controller when editing the existing one fails', async () => {
    vi.useFakeTimers();
    try {
      const player = makePlayer();
      const _manager = new PlayerEventManager(player as never);

      const existing = { id: 'msg-existing', edit: vi.fn().mockRejectedValue(new Error('unknown message')) };
      controllerRegistry.setController('guild-1', existing as never);

      const channel = makeTextChannel();
      const track = {
        title: 'Song',
        duration: '3:00',
        requestedBy: null,
        thumbnail: 'https://example.com/thumb.png',
        url: 'https://example.com/song',
        author: 'Artist',
      };
      const queue = makeQueue({ currentTrack: track, metadata: { channel } });

      const handler = player.handlers.get('playerStart')!;
      await handler(queue, track);

      expect(channel.send).toHaveBeenCalledTimes(1);
      expect(controllerRegistry.getController('guild-1')).toEqual({ id: 'msg-1' });
    } finally {
      vi.useRealTimers();
    }
  });

  it('the periodic controller-update interval stops once the queue stops playing', async () => {
    vi.useFakeTimers();
    try {
      const player = makePlayer();
      const _manager = new PlayerEventManager(player as never);

      const channel = makeTextChannel();
      const track = {
        title: 'Song',
        duration: '3:00',
        requestedBy: null,
        thumbnail: 'https://example.com/thumb.png',
        url: 'https://example.com/song',
        author: 'Artist',
      };
      let isPlaying = true;
      const queue = makeQueue({
        currentTrack: track,
        metadata: { channel },
        isPlaying: () => isPlaying,
      });
      player.nodes.get.mockReturnValue(queue);

      const handler = player.handlers.get('playerStart')!;
      await handler(queue, track);

      const controllerMsg = controllerRegistry.getController('guild-1') as unknown as {
        edit: ReturnType<typeof vi.fn>;
      };
      // Give it a `.edit` we can observe on subsequent ticks.
      (controllerMsg as unknown as { edit: unknown }).edit = vi.fn().mockResolvedValue(undefined);

      await vi.advanceTimersByTimeAsync(1000);
      expect((controllerMsg as unknown as { edit: ReturnType<typeof vi.fn> }).edit).toHaveBeenCalledTimes(1);

      isPlaying = false;
      await vi.advanceTimersByTimeAsync(1000);
      // No further edits once playback has stopped — the interval self-clears.
      await vi.advanceTimersByTimeAsync(3000);
      expect((controllerMsg as unknown as { edit: ReturnType<typeof vi.fn> }).edit).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('disconnect clears the update interval and cleans up the controller message', async () => {
    const player = makePlayer();
    const _manager = new PlayerEventManager(player as never);

    const controller = {
      id: 'msg-1',
      inGuild: () => false,
      edit: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    controllerRegistry.setController('guild-1', controller as never);
    controllerRegistry.setInterval(
      'guild-1',
      setInterval(() => {}, 1000),
    );

    const queue = makeQueue();
    const handler = player.handlers.get('disconnect')!;
    await handler(queue);
    // Cleanup runs fire-and-forget (`void cleanupControllerMessage(...)`).
    await new Promise((r) => setTimeout(r, 0));

    expect(controllerRegistry.hasController('guild-1')).toBe(false);
  });

  it('emptyQueue clears the update interval and cleans up the controller message', async () => {
    const player = makePlayer();
    const _manager = new PlayerEventManager(player as never);

    const controller = {
      id: 'msg-1',
      inGuild: () => false,
      edit: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    controllerRegistry.setController('guild-1', controller as never);

    const queue = makeQueue();
    const handler = player.handlers.get('emptyQueue')!;
    handler(queue);
    await new Promise((r) => setTimeout(r, 0));

    expect(controllerRegistry.hasController('guild-1')).toBe(false);
  });

  it('playerError notifies the text channel and cleans up without throwing', async () => {
    const player = makePlayer();
    const _manager = new PlayerEventManager(player as never);

    const channel = makeTextChannel();
    const queue = makeQueue({ metadata: { channel } });
    const track = { title: 'Song', url: 'x', duration: '1:00', author: 'A' };

    const handler = player.handlers.get('playerError')!;
    await expect(handler(queue, new Error('stream died'), track)).resolves.toBeUndefined();

    expect(channel.send).toHaveBeenCalledTimes(1);
  });

  it('a permission-less guild gets a fallback message instead of message deletion', async () => {
    const player = makePlayer();
    const _manager = new PlayerEventManager(player as never);

    const editMock = vi.fn().mockResolvedValue(undefined);
    const deleteMock = vi.fn();
    const controller = {
      id: 'msg-1',
      inGuild: () => true,
      client: { user: { id: 'bot' } },
      channel: {
        permissionsFor: () => ({ has: () => false }),
      },
      edit: editMock,
      delete: deleteMock,
    };
    controllerRegistry.setController('guild-1', controller as never);

    const queue = makeQueue();
    const handler = player.handlers.get('emptyQueue')!;
    handler(queue);
    await new Promise((r) => setTimeout(r, 0));

    expect(deleteMock).not.toHaveBeenCalled();
    expect(editMock).toHaveBeenCalledTimes(1);
    // Controller registry entry is only cleared on successful delete, so a
    // missing-permission guild keeps its entry (matches current source
    // behavior — no state gets silently dropped).
    expect(controllerRegistry.hasController('guild-1')).toBe(true);
    controllerRegistry.deleteController('guild-1');
  });
});
