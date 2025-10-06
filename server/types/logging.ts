export enum LogCategory {
  SYSTEM = 'system',
  AUDIT = 'audit',
}

export enum LogLevel {
  FATAL = 'fatal',
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  TRACE = 'trace',
}

export type ErrorInfo = {
  name?: string;
  message?: string;
  stack?: string;
  code?: string | number | undefined;
};

export type LogMetadata = {
  id?: string;
  timestamp?: string;
  level?: LogLevel;
  category?: LogCategory;
  [key: string]: unknown;
};

export type LogRotationConfig = {
  maxFileSize: number;
  maxFiles: number;
  rotateDaily: boolean;
  compressionEnabled: boolean;
};

export type AuditMetadata = LogMetadata & {
  userId?: string;
  username?: string;
  guildId?: string;
  channelId?: string;
  action?: string;
  auditEventId?: string;
};

export enum AuditEventType {
  COMMAND_EXECUTED = 'COMMAND_EXECUTED',
  TRACK_PLAYED = 'TRACK_PLAYED',
  TRACK_ADDED = 'TRACK_ADDED',
  VOICE_JOINED = 'VOICE_JOINED',
  VOICE_LEFT = 'VOICE_LEFT',
  BUTTON_CLICKED = 'BUTTON_CLICKED',
  PLAYER_STATE_CHANGED = 'PLAYER_STATE_CHANGED',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
}

export enum AuditResult {
  SUCCESS = 'success',
  FAILURE = 'failure',
}

export type AuditEvent = {
  id: string;
  timestamp: string;
  type: AuditEventType;
  userId: string;
  username?: string;
  guildId: string;
  guildName?: string;
  channelId?: string;
  details: Record<string, unknown>;
  result?: AuditResult;
  duration?: number;
};

export type LogEntry = {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  metadata: LogMetadata;
};
