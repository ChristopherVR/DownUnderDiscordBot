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
export type TrackPlatform = 'youtube' | 'spotify' | 'soundcloud' | 'applemusic' | 'local' | 'unknown';
export type TrackSource = 'online' | 'local' | 'playlist';
export type TrackMediaType = 'audio' | 'video';

/**
 * Canonical Track shape shared between bot and desktop.
 *
 * The bot populates all legacy fields (id, artist, duration, url, source).
 * The new optional fields (platform, mediaType, videoUrl, fileName, album,
 * requestedBy) exist to cover the richer metadata the desktop renders.
 */
export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  url: string;
  thumbnail?: string;
  source: TrackSource;
  filePath?: string;
  // Richer metadata — optional so existing bot-side producers stay valid.
  platform?: TrackPlatform | string;
  mediaType?: TrackMediaType;
  videoUrl?: string;
  fileName?: string;
  album?: string;
  requestedBy?: string;
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
  /** Whether the file is audio or video */
  mediaType?: 'audio' | 'video';
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

/**
 * Emitted when a new track actually starts playing. The bot sends this
 * in addition to `player_state` because `player_state` also fires on
 * volume/loop changes — subscribers that care specifically about "track
 * transitions" should listen for `track_started`.
 */
export interface TrackStartedUpdate extends Track {
  guildId?: string;
}

/**
 * Emitted when the queue contents change (add / remove / reorder / clear).
 * Separate from `player_state` so we don't re-broadcast the full queue on
 * every position tick.
 */
export interface QueueUpdate {
  guildId?: string;
  queue: Track[];
}

/**
 * Fine-grained position tick. Emitted ~once per second while a track plays,
 * carrying only the minimum needed to advance the progress bar. Splitting
 * this from `player_state` avoids re-broadcasting the full track + queue
 * on every tick.
 */
export interface PlayerPositionUpdate {
  guildId: string;
  /** Current playback position, in seconds. */
  position: number;
}

export type WebSocketMessage =
  | { type: 'bot_status'; payload: BotStatusUpdate }
  | { type: 'player_state'; payload: PlayerState }
  | { type: 'player_position'; payload: PlayerPositionUpdate }
  | { type: 'queue_update'; payload: QueueUpdate }
  | { type: 'track_started'; payload: TrackStartedUpdate }
  | { type: 'log_entry'; payload: LogEntry }
  | { type: 'command_result'; payload: CommandExecution }
  | { type: 'connection_update'; payload: ConnectionInfo[] }
  | { type: 'stream_status'; payload: StreamStatusUpdate };

export interface StreamStatusUpdate {
  videoId: string;
  status: 'resolving' | 'fallback' | 'streaming' | 'error';
  client: 'ANDROID' | 'WEB' | 'yt-dlp';
  message?: string;
}

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

// Playlist Types
export interface PlaylistSummary {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  userId: string;
  trackCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistTrackItem {
  id: string;
  title: string;
  artist: string | null;
  duration: number;
  url: string;
  thumbnail: string | null;
  platform: TrackPlatform;
  position: number;
}

export interface PlaylistDetail {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  trackCount: number;
  tracks: PlaylistTrackItem[];
}

export interface CreatePlaylistRequest {
  name: string;
  description?: string;
  isPublic?: boolean;
}

export interface AddTrackToPlaylistRequest {
  title: string;
  artist?: string;
  duration?: number;
  url: string;
  thumbnail?: string;
  platform?: TrackPlatform;
  filePath?: string;
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
