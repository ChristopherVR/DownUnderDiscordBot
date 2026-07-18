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

// This module pulls in playerEventManager.ts (real, not mocked) for
// controllerRegistry/getControllerPayload/getCompletedControllerPayload, so
// it needs the same discord.js/discord-player mock shape that file's own
// tests use.
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

import { QueueRepeatMode } from 'discord-player';
import { TextChannel } from 'discord.js';
import { registerControllerInteractionHandlers } from '../../../../src/helpers/discord/controllerInteractionManager';
import { controllerRegistry } from '../../../../src/helpers/discord/playerEventManager';

function makeClient() {
  let handler: ((interaction: unknown) => Promise<void>) | null = null;
  return {
    on: vi.fn((event: string, fn: (interaction: unknown) => Promise<void>) => {
      if (event === 'interactionCreate') handler = fn;
    }),
    dispatch: async (interaction: unknown) => {
      if (!handler) throw new Error('interactionCreate handler was never registered');
      await handler(interaction);
    },
  };
}

function makePlayerWithQueue(queue: unknown, guildId = 'guild-1') {
  return {
    nodes: {
      get: vi.fn((id: string) => (id === guildId ? queue : null)),
    },
  };
}

function makeButtonInteraction(customId: string, overrides: Partial<Record<string, unknown>> = {}) {
  return {
    isButton: () => true,
    customId,
    guildId: 'guild-1',
    deferred: false,
    replied: false,
    deferUpdate: vi.fn().mockResolvedValue(undefined),
    reply: vi.fn().mockResolvedValue(undefined),
    followUp: vi.fn().mockResolvedValue(undefined),
    user: { id: 'user-1', username: 'tester' },
    ...overrides,
  };
}

function makeQueue(overrides: Partial<Record<string, unknown>> = {}) {
  const track = {
    id: 'track-1',
    title: 'Current Song',
    author: 'Artist',
    url: 'https://example.com/song',
    thumbnail: 'https://example.com/thumb.png',
    duration: '3:00',
    requestedBy: null,
  };
  const base = {
    guild: { id: 'guild-1', name: 'Test Guild' },
    channel: { id: 'voice-1', name: 'General' },
    currentTrack: track,
    tracks: { size: 0, toArray: () => [] },
    history: { previousTrack: null, nextTrack: null },
    repeatMode: QueueRepeatMode.OFF,
    setRepeatMode: vi.fn(),
    metadata: {},
    delete: vi.fn().mockResolvedValue(undefined),
    node: {
      isPaused: () => false,
      getTimestamp: () => null,
      createProgressBar: () => null,
    },
    isPlaying: () => true,
  };
  return { ...base, ...overrides };
}

describe('registerControllerInteractionHandlers - router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    controllerRegistry.deleteController('guild-1');
    controllerRegistry.clearInterval('guild-1');
  });

  it('ignores non-button interactions entirely', async () => {
    const client = makeClient();
    const player = makePlayerWithQueue(makeQueue());
    registerControllerInteractionHandlers(client as never, player as never);

    const nonButton = { isButton: () => false };
    await client.dispatch(nonButton);

    expect(player.nodes.get).not.toHaveBeenCalled();
  });

  it('ignores button interactions with an unrecognized customId', async () => {
    const client = makeClient();
    const player = makePlayerWithQueue(makeQueue());
    registerControllerInteractionHandlers(client as never, player as never);

    const interaction = makeButtonInteraction('some_unrelated_button');
    await client.dispatch(interaction);

    expect(player.nodes.get).not.toHaveBeenCalled();
    expect(interaction.deferUpdate).not.toHaveBeenCalled();
  });

  it('tells the user there is no active player when the guild has no queue', async () => {
    const client = makeClient();
    const player = makePlayerWithQueue(null);
    registerControllerInteractionHandlers(client as never, player as never);

    const interaction = makeButtonInteraction('skip');
    await client.dispatch(interaction);

    expect(interaction.deferUpdate).toHaveBeenCalledTimes(1);
    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({ content: 'There is no active player in this server.' }),
    );
  });

  it('acks the interaction before dispatching to the action handler', async () => {
    const queue = makeQueue({
      node: {
        isPaused: () => false,
        pause: vi.fn().mockResolvedValue(undefined),
        getTimestamp: () => null,
        createProgressBar: () => null,
      },
    });
    const client = makeClient();
    const player = makePlayerWithQueue(queue);
    registerControllerInteractionHandlers(client as never, player as never);

    const interaction = makeButtonInteraction('pause_resume');
    await client.dispatch(interaction);

    expect(interaction.deferUpdate).toHaveBeenCalledTimes(1);
  });
});

describe('pause/resume', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    controllerRegistry.deleteController('guild-1');
  });

  it('pauses a playing queue', async () => {
    const pause = vi.fn().mockResolvedValue(undefined);
    const queue = makeQueue({
      node: { isPaused: () => false, pause, getTimestamp: () => null, createProgressBar: () => null },
    });
    const client = makeClient();
    const player = makePlayerWithQueue(queue);
    registerControllerInteractionHandlers(client as never, player as never);

    await client.dispatch(makeButtonInteraction('pause_resume'));
    expect(pause).toHaveBeenCalledTimes(1);
  });

  it('resumes a paused queue', async () => {
    const resume = vi.fn().mockResolvedValue(undefined);
    const queue = makeQueue({
      node: { isPaused: () => true, resume, getTimestamp: () => null, createProgressBar: () => null },
    });
    const client = makeClient();
    const player = makePlayerWithQueue(queue);
    registerControllerInteractionHandlers(client as never, player as never);

    await client.dispatch(makeButtonInteraction('pause_resume'));
    expect(resume).toHaveBeenCalledTimes(1);
  });

  it('does not throw when the node lacks a pause/resume method', async () => {
    const queue = makeQueue({
      node: { isPaused: () => false, getTimestamp: () => null, createProgressBar: () => null },
    });
    const client = makeClient();
    const player = makePlayerWithQueue(queue);
    registerControllerInteractionHandlers(client as never, player as never);

    await expect(client.dispatch(makeButtonInteraction('pause_resume'))).resolves.toBeUndefined();
  });
});

describe('skip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    controllerRegistry.deleteController('guild-1');
  });

  it('calls node.skip()', async () => {
    const skip = vi.fn().mockResolvedValue(undefined);
    const queue = makeQueue({
      node: { isPaused: () => false, skip, getTimestamp: () => null, createProgressBar: () => null },
    });
    const client = makeClient();
    const player = makePlayerWithQueue(queue);
    registerControllerInteractionHandlers(client as never, player as never);

    await client.dispatch(makeButtonInteraction('skip'));
    expect(skip).toHaveBeenCalledTimes(1);
  });

  it('does not throw when the node lacks a skip method', async () => {
    const queue = makeQueue({
      node: { isPaused: () => false, getTimestamp: () => null, createProgressBar: () => null },
    });
    const client = makeClient();
    const player = makePlayerWithQueue(queue);
    registerControllerInteractionHandlers(client as never, player as never);

    await expect(client.dispatch(makeButtonInteraction('skip'))).resolves.toBeUndefined();
  });
});

describe('back', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    controllerRegistry.deleteController('guild-1');
  });

  it('is a no-op when there is no previous track', async () => {
    const back = vi.fn();
    const queue = makeQueue({ history: { previousTrack: null, nextTrack: null, back } });
    const client = makeClient();
    const player = makePlayerWithQueue(queue);
    registerControllerInteractionHandlers(client as never, player as never);

    await client.dispatch(makeButtonInteraction('back'));
    expect(back).not.toHaveBeenCalled();
  });

  it('uses history.back() when it actually moves to a new current track', async () => {
    const prevTrack = { id: 'prev-1', title: 'Previous Song' };
    const play = vi.fn();
    const queue = makeQueue({
      currentTrack: { id: 'track-1' },
      history: { previousTrack: prevTrack, nextTrack: null },
      node: { isPaused: () => false, play, getTimestamp: () => null, createProgressBar: () => null },
    });
    // Mutate the real queue object (not a getter) so the "after" read in
    // onBack sees the change - spreading an object with a getter (as
    // makeQueue does internally) would freeze the getter's first value.
    queue.history.back = vi.fn().mockImplementation(async () => {
      queue.currentTrack = prevTrack;
    });

    const client = makeClient();
    const player = makePlayerWithQueue(queue);
    registerControllerInteractionHandlers(client as never, player as never);

    await client.dispatch(makeButtonInteraction('back'));

    expect(queue.history.back).toHaveBeenCalledWith(true);
    // history.back() succeeded in moving to the previous track - no manual fallback play needed.
    expect(play).not.toHaveBeenCalled();
  });

  it('falls back to node.play(prevTrack) when history.back() does not change the current track', async () => {
    const prevTrack = { id: 'prev-1', title: 'Previous Song' };
    const back = vi.fn().mockResolvedValue(undefined); // current track stays the same
    const play = vi.fn().mockResolvedValue(undefined);
    const queue = makeQueue({
      currentTrack: { id: 'track-1' },
      history: { previousTrack: prevTrack, nextTrack: null, back },
      node: { isPaused: () => false, play, getTimestamp: () => null, createProgressBar: () => null },
    });
    const client = makeClient();
    const player = makePlayerWithQueue(queue);
    registerControllerInteractionHandlers(client as never, player as never);

    await client.dispatch(makeButtonInteraction('back'));

    expect(back).toHaveBeenCalledWith(true);
    expect(play).toHaveBeenCalledWith(prevTrack);
  });

  it('uses node.play(prevTrack) directly when no history API is available', async () => {
    const prevTrack = { id: 'prev-1', title: 'Previous Song' };
    const play = vi.fn().mockResolvedValue(undefined);
    const queue = makeQueue({
      history: { previousTrack: prevTrack, nextTrack: null },
      node: { isPaused: () => false, play, getTimestamp: () => null, createProgressBar: () => null },
    });
    const client = makeClient();
    const player = makePlayerWithQueue(queue);
    registerControllerInteractionHandlers(client as never, player as never);

    await client.dispatch(makeButtonInteraction('back'));

    expect(play).toHaveBeenCalledWith(prevTrack);
  });
});

describe('stop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    controllerRegistry.deleteController('guild-1');
  });

  it('deletes the queue, removes the live controller, and posts a completed shell', async () => {
    const queueDelete = vi.fn().mockResolvedValue(undefined);
    const channelSend = vi.fn().mockResolvedValue({ id: 'completed-msg' });
    const channel = Object.assign(new TextChannel(), { send: channelSend });
    const queue = makeQueue({ delete: queueDelete, metadata: { channel } });

    const controllerMsg = { id: 'controller-1', delete: vi.fn().mockResolvedValue(undefined) };
    controllerRegistry.setController('guild-1', controllerMsg as never);

    const client = makeClient();
    const player = makePlayerWithQueue(queue);
    registerControllerInteractionHandlers(client as never, player as never);

    await client.dispatch(makeButtonInteraction('stop'));

    expect(queueDelete).toHaveBeenCalledTimes(1);
    expect(controllerMsg.delete).toHaveBeenCalledTimes(1);
    expect(controllerRegistry.hasController('guild-1')).toBe(false);
    expect(channelSend).toHaveBeenCalledTimes(1);
  });

  it('still tidies up the controller even if queue.delete() rejects', async () => {
    const queueDelete = vi.fn().mockRejectedValue(new Error('already gone'));
    const queue = makeQueue({ delete: queueDelete, metadata: {} });
    const controllerMsg = { id: 'controller-1', delete: vi.fn().mockResolvedValue(undefined) };
    controllerRegistry.setController('guild-1', controllerMsg as never);

    const client = makeClient();
    const player = makePlayerWithQueue(queue);
    registerControllerInteractionHandlers(client as never, player as never);

    await expect(client.dispatch(makeButtonInteraction('stop'))).resolves.toBeUndefined();
    expect(controllerMsg.delete).toHaveBeenCalledTimes(1);
  });
});

describe('volume', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    controllerRegistry.deleteController('guild-1');
  });

  it('increases volume by 10 and clamps at 100', async () => {
    const setVolume = vi.fn();
    const queue = makeQueue({
      node: { isPaused: () => false, volume: 95, setVolume, getTimestamp: () => null, createProgressBar: () => null },
    });
    const client = makeClient();
    const player = makePlayerWithQueue(queue);
    registerControllerInteractionHandlers(client as never, player as never);

    await client.dispatch(makeButtonInteraction('volume_up'));
    expect(setVolume).toHaveBeenCalledWith(100);
  });

  it('decreases volume by 10 and clamps at 0', async () => {
    const setVolume = vi.fn();
    const queue = makeQueue({
      node: { isPaused: () => false, volume: 5, setVolume, getTimestamp: () => null, createProgressBar: () => null },
    });
    const client = makeClient();
    const player = makePlayerWithQueue(queue);
    registerControllerInteractionHandlers(client as never, player as never);

    await client.dispatch(makeButtonInteraction('volume_down'));
    expect(setVolume).toHaveBeenCalledWith(0);
  });

  it('defaults current volume to 65 when the node does not expose one', async () => {
    const setVolume = vi.fn();
    const queue = makeQueue({
      node: { isPaused: () => false, setVolume, getTimestamp: () => null, createProgressBar: () => null },
    });
    const client = makeClient();
    const player = makePlayerWithQueue(queue);
    registerControllerInteractionHandlers(client as never, player as never);

    await client.dispatch(makeButtonInteraction('volume_up'));
    expect(setVolume).toHaveBeenCalledWith(75);
  });
});

describe('loop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    controllerRegistry.deleteController('guild-1');
  });

  it('cycles OFF -> TRACK -> AUTOPLAY -> OFF', async () => {
    const setRepeatMode = vi.fn();
    const queue = makeQueue({ repeatMode: QueueRepeatMode.OFF });
    // Mutate the real queue object (not a getter) - see the `back` tests for
    // why spreading a getter inside makeQueue would break this.
    queue.setRepeatMode = (next: number) => {
      queue.repeatMode = next;
      setRepeatMode(next);
    };
    const client = makeClient();
    const player = makePlayerWithQueue(queue);
    registerControllerInteractionHandlers(client as never, player as never);

    await client.dispatch(makeButtonInteraction('loop'));
    expect(setRepeatMode).toHaveBeenNthCalledWith(1, QueueRepeatMode.TRACK);

    await client.dispatch(makeButtonInteraction('loop'));
    expect(setRepeatMode).toHaveBeenNthCalledWith(2, QueueRepeatMode.AUTOPLAY);

    await client.dispatch(makeButtonInteraction('loop'));
    expect(setRepeatMode).toHaveBeenNthCalledWith(3, QueueRepeatMode.OFF);
  });
});

describe('show queue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    controllerRegistry.deleteController('guild-1');
  });

  it('replies ephemerally then follows up with the queue contents', async () => {
    const tracks = [
      { title: 'Song 1', author: 'A' },
      { title: 'Song 2', author: 'B' },
    ];
    const queue = makeQueue({ tracks: { size: 2, toArray: () => tracks } });
    const client = makeClient();
    const player = makePlayerWithQueue(queue);
    registerControllerInteractionHandlers(client as never, player as never);

    const interaction = makeButtonInteraction('queue');
    await client.dispatch(interaction);

    expect(interaction.reply).toHaveBeenCalledTimes(1);
    expect(interaction.followUp).toHaveBeenCalledTimes(1);
  });
});
