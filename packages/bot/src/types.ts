// server/types.ts
export type Track = {
  id: string;
  title: string;
  artist: string;
  duration: number;
  url: string;
  cover?: string;
  source: 'online' | 'local' | 'playlist';
  filePath?: string;
};
export type PlayerState = {
  status: 'playing' | 'paused' | 'stopped';
  track: Track | null;
  position: number;
  volume: number;
};

export type LogMessage = {
  id: string;
  category: 'audit' | 'command' | 'system';
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  ts: number;
  source?: string;
  metadata?: Record<string, unknown>;
};

export type BotStatusMessage = { connected: boolean; serverName: string; channelName: string };

export type CommandChoice = { name: string; value: string | number };
export type CommandOption =
  | { name: string; description: string; type: 'string'; required?: boolean; choices?: CommandChoice[] }
  | { name: string; description: string; type: 'integer'; required?: boolean; min?: number; max?: number }
  | { name: string; description: string; type: 'boolean'; required?: boolean };

export type CommandDef = { name: string; description: string; options?: CommandOption[] };

export type SocketEnvelope =
  | { type: 'status'; payload: BotStatusMessage }
  | { type: 'log'; payload: LogMessage }
  | { type: 'player'; payload: PlayerState }
  | { type: 'state'; payload: unknown }
  | { type: 'connections'; payload: ConnectionInfo[] };

export type InstanceInfo = {
  instanceId: string;
  online: boolean;
  lastHeartbeat: number;
  isActive: boolean;
  shardId?: number;
  hostname?: string;
  pid?: number;
  extra?: Record<string, unknown>;
};
export type GuildState = { guildId: string; activeInstanceId: string | null; instances: Record<string, InstanceInfo> };

export type ConnectionInfo = { id: string; name: string; type: 'text' | 'voice'; connected?: boolean };
