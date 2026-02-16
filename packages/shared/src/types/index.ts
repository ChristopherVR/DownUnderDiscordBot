// Core State Management Types
export interface GlobalState {
  guilds: Record<string, GuildState>;
  lastUpdated: number;
}

export interface GuildState {
  guildId: string;
  activeInstanceId: string | null;
  instances: Record<string, InstanceInfo>;
}

export interface InstanceInfo {
  instanceId: string;
  online: boolean;
  lastHeartbeat: number;
  isActive: boolean;
  hostname?: string;
  pid?: number;
  shardId?: number;
  extra?: Record<string, unknown>;
}

// Player and Music Types
export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  url: string;
  cover?: string;
  source: 'online' | 'local' | 'playlist';
  filePath?: string; // for local files
}

export interface PlayerState {
  status: 'playing' | 'paused' | 'stopped';
  track: Track | null;
  position: number;
  volume: number;
  loop: boolean;
  queue: Track[];
  currentIndex: number;
}

// Command System Types
export interface CommandDefinition {
  name: string;
  description: string;
  options?: CommandOption[];
  category?: string;
}

export interface CommandOption {
  name: string;
  description: string;
  type: 'string' | 'integer' | 'boolean' | 'file';
  required?: boolean;
  choices?: CommandChoice[];
  min?: number;
  max?: number;
}

export interface CommandChoice {
  name: string;
  value: string | number;
}

export interface CommandExecution {
  id: string;
  command: string;
  arguments: Record<string, unknown>;
  timestamp: number;
  status: 'success' | 'error' | 'pending';
  result?: unknown;
  error?: string;
}

// Logging Types
export interface LogEntry {
  id: string;
  category: 'audit' | 'command' | 'system';
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: number;
  source?: string;
  metadata?: Record<string, unknown>;
}

// Connection Types
export interface ConnectionInfo {
  id: string;
  name: string;
  type: 'text' | 'voice';
  connected: boolean;
  guildId: string;
  channelId: string;
}

// File Upload Types
export interface UploadedFile {
  id: string;
  originalName: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  size: number;
  uploadedAt: number;
  metadata?: {
    duration?: number;
    bitrate?: number;
    artist?: string;
    title?: string;
    album?: string;
  };
}

export interface FileUploadProgress {
  fileId: string;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

// WebSocket Message Types
export type WebSocketMessage =
  | { type: 'bot_status'; payload: BotStatusUpdate }
  | { type: 'player_state'; payload: PlayerState }
  | { type: 'log_entry'; payload: LogEntry }
  | { type: 'command_result'; payload: CommandExecution }
  | { type: 'connection_update'; payload: ConnectionInfo[] };

export interface BotStatusUpdate {
  guildId: string;
  instanceId: string;
  status: 'online' | 'offline';
  connections?: ConnectionInfo[];
}

// Discord.js Command Types
export interface DiscordCommandOption {
  name: string;
  description: string;
  type: number; // Discord.js ApplicationCommandOptionType
  required?: boolean;
  choices?: DiscordCommandChoice[];
  min_value?: number;
  max_value?: number;
}

export interface DiscordCommandChoice {
  name: string;
  value: string | number;
}

// API Response Types
export interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface LogsResponse {
  items: LogEntry[];
  total: number;
  hasMore: boolean;
}

export interface CommandRegistryResponse {
  success: boolean;
  commands: CommandDefinition[];
  count: number;
}

export interface CommandExecutionResponse {
  success: boolean;
  execution?: CommandExecution;
  error?: string;
}

export interface CommandHistoryResponse {
  success: boolean;
  history: CommandExecution[];
  count: number;
}

export interface CommandValidationResponse {
  success: boolean;
  validation: {
    valid: boolean;
    errors: string[];
  };
}

export interface SearchResult {
  id: string;
  title: string;
  artist?: string;
  duration?: number;
  url: string;
  thumbnail?: string;
}

export interface SearchResponse {
  items: SearchResult[];
}

export interface LocalFilesResponse {
  files: UploadedFile[];
}

export interface ConnectionsResponse {
  items: ConnectionInfo[];
}

// Player Control Options
export interface PlaybackOptions {
  volume?: number;
  loop?: boolean;
  shuffle?: boolean;
  position?: number;
}

// Error Message Types
export interface ErrorMessages {
  'errors.connection.failed': string;
  'errors.command.invalid': string;
  'errors.command.unauthorized': string;
  'errors.upload.fileTooBig': string;
  'errors.upload.invalidFormat': string;
  'errors.player.trackNotFound': string;
  'errors.bot.notConnected': string;
  'errors.generic': string;
}
