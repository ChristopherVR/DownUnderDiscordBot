import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DiscordMessage } from '@/lib/api';

export interface TextChannel {
  id: string;
  name: string;
  type: string;
}

/** Ephemeral local-only message displayed inline (command execution feedback, etc.) */
export interface LocalMessage {
  id: string;
  type: 'command_pending' | 'command_result' | 'error' | 'system';
  content: string;
  commandName?: string;
  timestamp: number;
  status?: 'pending' | 'success' | 'error';
}

/** Union of real Discord messages and local ephemeral entries */
export type ChatEntry = { kind: 'discord'; data: DiscordMessage } | { kind: 'local'; data: LocalMessage };

interface LayoutStore {
  // Sidebar
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  /** Persisted order of main nav-item route paths (e.g. ['/', '/dashboard', …]) */
  navOrder: string[];
  setNavOrder: (order: string[]) => void;

  // Chat panel
  chatOpen: boolean;
  toggleChat: () => void;
  setChatOpen: (open: boolean) => void;

  // Chat state
  selectedChannelId: string | null;
  setSelectedChannelId: (id: string | null) => void;
  textChannels: TextChannel[];
  setTextChannels: (channels: TextChannel[]) => void;

  // Messages
  channelMessages: DiscordMessage[];
  setChannelMessages: (msgs: DiscordMessage[]) => void;
  prependChannelMessages: (msgs: DiscordMessage[]) => void;
  appendChannelMessage: (msg: DiscordMessage) => void;
  messagesLoading: boolean;
  setMessagesLoading: (v: boolean) => void;
  hasMoreMessages: boolean;
  setHasMoreMessages: (v: boolean) => void;

  // Local entries (command feedback, hints)
  localEntries: LocalMessage[];
  addLocalEntry: (entry: LocalMessage) => void;
  clearLocalEntries: () => void;

  // Slash command UI state
  activeCommand: string | null;
  setActiveCommand: (name: string | null) => void;
  commandArgs: Record<string, string>;
  setCommandArg: (name: string, value: string) => void;
  resetCommandArgs: () => void;
}

export const useLayoutStore = create<LayoutStore>()(
  persist(
    (set) => ({
      // Sidebar
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      navOrder: [],
      setNavOrder: (order) => set({ navOrder: order }),

      // Chat panel
      chatOpen: false,
      toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen })),
      setChatOpen: (open) => set({ chatOpen: open }),

      // Chat state
      selectedChannelId: null,
      setSelectedChannelId: (id) =>
        set({
          selectedChannelId: id,
          channelMessages: [],
          localEntries: [],
          hasMoreMessages: true,
        }),
      textChannels: [],
      setTextChannels: (channels) => set({ textChannels: channels }),

      // Messages
      channelMessages: [],
      setChannelMessages: (msgs) => set({ channelMessages: msgs }),
      prependChannelMessages: (msgs) =>
        set((s) => {
          // Deduplicate
          const existingIds = new Set(s.channelMessages.map((m) => m.id));
          const unique = msgs.filter((m) => !existingIds.has(m.id));
          return { channelMessages: [...unique, ...s.channelMessages] };
        }),
      appendChannelMessage: (msg) =>
        set((s) => {
          if (s.channelMessages.some((m) => m.id === msg.id)) return s;
          return { channelMessages: [...s.channelMessages, msg] };
        }),
      messagesLoading: false,
      setMessagesLoading: (v) => set({ messagesLoading: v }),
      hasMoreMessages: true,
      setHasMoreMessages: (v) => set({ hasMoreMessages: v }),

      // Local entries
      localEntries: [],
      addLocalEntry: (entry) => set((s) => ({ localEntries: [...s.localEntries, entry] })),
      clearLocalEntries: () => set({ localEntries: [] }),

      // Slash command UI
      activeCommand: null,
      setActiveCommand: (name) => set({ activeCommand: name, commandArgs: {} }),
      commandArgs: {},
      setCommandArg: (name, value) => set((s) => ({ commandArgs: { ...s.commandArgs, [name]: value } })),
      resetCommandArgs: () => set({ commandArgs: {}, activeCommand: null }),
    }),
    {
      name: 'layout-store',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        chatOpen: state.chatOpen,
        selectedChannelId: state.selectedChannelId,
        navOrder: state.navOrder,
      }),
    },
  ),
);
