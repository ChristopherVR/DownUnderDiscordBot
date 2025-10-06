import { create } from 'zustand';
import type { PlayerState, LogEntry, ConnectionInfo, GlobalState, CommandExecution } from 'discord-dashboard-shared';

export type BotStatus = {
  connected: boolean;
  serverName: string;
  channelName: string;
};

interface AppState {
  // Bot connection status
  status: BotStatus | null;

  // Player state
  player: PlayerState;

  // Logs
  auditLogs: LogEntry[];
  commandLogs: LogEntry[];

  // Connections
  connections: ConnectionInfo[];

  // Guild state management
  globalState: GlobalState | null;
  currentGuildId: string | null;

  // Command execution history
  commandHistory: CommandExecution[];

  // WebSocket connection status
  wsConnected: boolean;
  wsReconnecting: boolean;

  // Actions
  setStatus: (status: BotStatus) => void;
  setPlayer: (player: PlayerState) => void;
  pushLog: (log: LogEntry) => void;
  setConnections: (connections: ConnectionInfo[]) => void;
  setGlobalState: (state: GlobalState) => void;
  setCurrentGuildId: (guildId: string) => void;
  addCommandExecution: (execution: CommandExecution) => void;
  setWebSocketStatus: (connected: boolean, reconnecting?: boolean) => void;
}

export const useBotStore = create<AppState>((set, get) => ({
  // Initial state
  status: null,
  player: {
    status: 'stopped',
    track: null,
    position: 0,
    volume: 70,
    loop: false,
    queue: [],
    currentIndex: 0,
  },
  auditLogs: [],
  commandLogs: [],
  connections: [],
  globalState: null,
  currentGuildId: null,
  commandHistory: [],
  wsConnected: false,
  wsReconnecting: false,

  // Actions
  setStatus: (status) => set({ status }),

  setPlayer: (player) => set({ player }),

  pushLog: (log) => {
    const key = log.category === 'audit' ? 'auditLogs' : 'commandLogs';
    const currentLogs = get()[key] as LogEntry[];
    const updatedLogs = [log, ...currentLogs].slice(0, 1000); // Keep last 1000 entries
    set({ [key]: updatedLogs } as Partial<AppState>);
  },

  setConnections: (connections) => set({ connections }),

  setGlobalState: (globalState) => set({ globalState }),

  setCurrentGuildId: (currentGuildId) => set({ currentGuildId }),

  addCommandExecution: (execution) => {
    const currentHistory = get().commandHistory;
    const updatedHistory = [execution, ...currentHistory].slice(0, 100); // Keep last 100 executions
    set({ commandHistory: updatedHistory });
  },

  setWebSocketStatus: (wsConnected, wsReconnecting = false) => set({ wsConnected, wsReconnecting }),
}));
