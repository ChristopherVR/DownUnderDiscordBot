import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock localStorage for persist middleware
const localStorageMap = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: vi.fn((key: string) => localStorageMap.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => localStorageMap.set(key, value)),
  removeItem: vi.fn((key: string) => localStorageMap.delete(key)),
  clear: vi.fn(() => localStorageMap.clear()),
  get length() {
    return localStorageMap.size;
  },
  key: vi.fn(() => null),
});

import { useLayoutStore } from '@/stores/useLayoutStore';
import type { DiscordMessage } from '@/lib/api';

function makeMessage(id: string, content = 'test'): DiscordMessage {
  return {
    id,
    content,
    author: { id: 'u1', username: 'user', displayName: 'User', avatar: '', bot: false },
    timestamp: Date.now(),
    editedTimestamp: null,
    attachments: [],
    embeds: [],
    reactions: [],
    reference: null,
    type: 0,
  };
}

describe('useLayoutStore', () => {
  beforeEach(() => {
    localStorageMap.clear();
    vi.clearAllMocks();

    // Reset store to defaults
    useLayoutStore.setState({
      sidebarCollapsed: false,
      chatOpen: false,
      selectedChannelId: null,
      textChannels: [],
      channelMessages: [],
      messagesLoading: false,
      hasMoreMessages: true,
      localEntries: [],
      activeCommand: null,
      commandArgs: {},
      navOrder: [],
    });
  });

  describe('sidebar', () => {
    it('starts with sidebar not collapsed', () => {
      expect(useLayoutStore.getState().sidebarCollapsed).toBe(false);
    });

    it('toggleSidebar flips the collapsed state', () => {
      useLayoutStore.getState().toggleSidebar();
      expect(useLayoutStore.getState().sidebarCollapsed).toBe(true);

      useLayoutStore.getState().toggleSidebar();
      expect(useLayoutStore.getState().sidebarCollapsed).toBe(false);
    });

    it('setSidebarCollapsed sets the value directly', () => {
      useLayoutStore.getState().setSidebarCollapsed(true);
      expect(useLayoutStore.getState().sidebarCollapsed).toBe(true);

      useLayoutStore.getState().setSidebarCollapsed(false);
      expect(useLayoutStore.getState().sidebarCollapsed).toBe(false);
    });
  });

  describe('navOrder', () => {
    it('starts with empty navOrder', () => {
      expect(useLayoutStore.getState().navOrder).toEqual([]);
    });

    it('setNavOrder updates the order', () => {
      const order = ['/', '/dashboard', '/search'];
      useLayoutStore.getState().setNavOrder(order);
      expect(useLayoutStore.getState().navOrder).toEqual(order);
    });
  });

  describe('chat panel', () => {
    it('starts with chat closed', () => {
      expect(useLayoutStore.getState().chatOpen).toBe(false);
    });

    it('toggleChat flips the chat open state', () => {
      useLayoutStore.getState().toggleChat();
      expect(useLayoutStore.getState().chatOpen).toBe(true);

      useLayoutStore.getState().toggleChat();
      expect(useLayoutStore.getState().chatOpen).toBe(false);
    });

    it('setChatOpen sets the value directly', () => {
      useLayoutStore.getState().setChatOpen(true);
      expect(useLayoutStore.getState().chatOpen).toBe(true);
    });
  });

  describe('channel selection', () => {
    it('starts with no selected channel', () => {
      expect(useLayoutStore.getState().selectedChannelId).toBeNull();
    });

    it('setSelectedChannelId sets the channel and resets messages', () => {
      // Add some messages first
      useLayoutStore.setState({
        channelMessages: [makeMessage('m1')],
        localEntries: [{ id: 'e1', type: 'system', content: 'hi', timestamp: Date.now() }],
        hasMoreMessages: false,
      });

      useLayoutStore.getState().setSelectedChannelId('ch-123');

      const state = useLayoutStore.getState();
      expect(state.selectedChannelId).toBe('ch-123');
      expect(state.channelMessages).toEqual([]);
      expect(state.localEntries).toEqual([]);
      expect(state.hasMoreMessages).toBe(true);
    });

    it('setSelectedChannelId to null clears channel', () => {
      useLayoutStore.getState().setSelectedChannelId('ch-123');
      useLayoutStore.getState().setSelectedChannelId(null);
      expect(useLayoutStore.getState().selectedChannelId).toBeNull();
    });
  });

  describe('text channels', () => {
    it('starts with empty text channels', () => {
      expect(useLayoutStore.getState().textChannels).toEqual([]);
    });

    it('setTextChannels replaces channels', () => {
      const channels = [
        { id: 'c1', name: 'general', type: 'GUILD_TEXT' },
        { id: 'c2', name: 'music', type: 'GUILD_TEXT' },
      ];
      useLayoutStore.getState().setTextChannels(channels);
      expect(useLayoutStore.getState().textChannels).toEqual(channels);
    });
  });

  describe('messages', () => {
    it('setChannelMessages replaces all messages', () => {
      const msgs = [makeMessage('m1'), makeMessage('m2')];
      useLayoutStore.getState().setChannelMessages(msgs);
      expect(useLayoutStore.getState().channelMessages).toEqual(msgs);
    });

    it('prependChannelMessages adds messages to the front with deduplication', () => {
      useLayoutStore.getState().setChannelMessages([makeMessage('m2'), makeMessage('m3')]);

      useLayoutStore.getState().prependChannelMessages([makeMessage('m1'), makeMessage('m2')]);

      const msgs = useLayoutStore.getState().channelMessages;
      // m2 is a duplicate and should not be prepended again
      expect(msgs).toHaveLength(3);
      expect(msgs[0].id).toBe('m1');
      expect(msgs[1].id).toBe('m2');
      expect(msgs[2].id).toBe('m3');
    });

    it('appendChannelMessage adds a message to the end', () => {
      useLayoutStore.getState().setChannelMessages([makeMessage('m1')]);
      useLayoutStore.getState().appendChannelMessage(makeMessage('m2'));

      const msgs = useLayoutStore.getState().channelMessages;
      expect(msgs).toHaveLength(2);
      expect(msgs[1].id).toBe('m2');
    });

    it('appendChannelMessage deduplicates by id', () => {
      useLayoutStore.getState().setChannelMessages([makeMessage('m1')]);
      useLayoutStore.getState().appendChannelMessage(makeMessage('m1'));

      expect(useLayoutStore.getState().channelMessages).toHaveLength(1);
    });

    it('setMessagesLoading toggles loading state', () => {
      useLayoutStore.getState().setMessagesLoading(true);
      expect(useLayoutStore.getState().messagesLoading).toBe(true);

      useLayoutStore.getState().setMessagesLoading(false);
      expect(useLayoutStore.getState().messagesLoading).toBe(false);
    });

    it('setHasMoreMessages updates the flag', () => {
      useLayoutStore.getState().setHasMoreMessages(false);
      expect(useLayoutStore.getState().hasMoreMessages).toBe(false);
    });
  });

  describe('local entries', () => {
    it('addLocalEntry appends an entry', () => {
      const entry = { id: 'e1', type: 'system' as const, content: 'System message', timestamp: Date.now() };
      useLayoutStore.getState().addLocalEntry(entry);

      const entries = useLayoutStore.getState().localEntries;
      expect(entries).toHaveLength(1);
      expect(entries[0]).toEqual(entry);
    });

    it('addLocalEntry appends multiple entries in order', () => {
      useLayoutStore.getState().addLocalEntry({ id: 'e1', type: 'system', content: 'First', timestamp: 1 });
      useLayoutStore.getState().addLocalEntry({ id: 'e2', type: 'error', content: 'Second', timestamp: 2 });

      const entries = useLayoutStore.getState().localEntries;
      expect(entries).toHaveLength(2);
      expect(entries[0].id).toBe('e1');
      expect(entries[1].id).toBe('e2');
    });

    it('clearLocalEntries removes all entries', () => {
      useLayoutStore.getState().addLocalEntry({ id: 'e1', type: 'system', content: 'msg', timestamp: 1 });
      useLayoutStore.getState().addLocalEntry({ id: 'e2', type: 'error', content: 'msg', timestamp: 2 });

      useLayoutStore.getState().clearLocalEntries();
      expect(useLayoutStore.getState().localEntries).toEqual([]);
    });
  });

  describe('slash command UI state', () => {
    it('starts with no active command', () => {
      expect(useLayoutStore.getState().activeCommand).toBeNull();
      expect(useLayoutStore.getState().commandArgs).toEqual({});
    });

    it('setActiveCommand sets command and resets args', () => {
      // Set some args first
      useLayoutStore.getState().setCommandArg('query', 'test');
      useLayoutStore.getState().setActiveCommand('play');

      const state = useLayoutStore.getState();
      expect(state.activeCommand).toBe('play');
      expect(state.commandArgs).toEqual({});
    });

    it('setCommandArg adds/updates a single arg', () => {
      useLayoutStore.getState().setCommandArg('query', 'hello');
      expect(useLayoutStore.getState().commandArgs).toEqual({ query: 'hello' });

      useLayoutStore.getState().setCommandArg('platform', 'youtube');
      expect(useLayoutStore.getState().commandArgs).toEqual({ query: 'hello', platform: 'youtube' });

      // Update existing arg
      useLayoutStore.getState().setCommandArg('query', 'updated');
      expect(useLayoutStore.getState().commandArgs.query).toBe('updated');
    });

    it('resetCommandArgs clears command and args', () => {
      useLayoutStore.getState().setActiveCommand('search');
      useLayoutStore.getState().setCommandArg('query', 'test');

      useLayoutStore.getState().resetCommandArgs();

      const state = useLayoutStore.getState();
      expect(state.activeCommand).toBeNull();
      expect(state.commandArgs).toEqual({});
    });
  });
});
