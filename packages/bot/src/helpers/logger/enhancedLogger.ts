import pino from 'pino';
import { randomUUID } from 'crypto';
import {
  LogCategory,
  LogLevel,
  LogMetadata,
  AuditMetadata,
  AuditEvent,
  AuditEventType,
  AuditResult,
  ErrorInfo,
  LogEntry,
} from '../../types/logging.js';

type LogStreamCallback = (entry: {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  metadata: Record<string, unknown>;
}) => void;

export class EnhancedLogger {
  private pinoLogger: pino.Logger;
  private systemLogger: pino.Logger;
  private auditLogger: pino.Logger;
  private logStreamCallback?: LogStreamCallback;

  constructor(pinoLogger: pino.Logger) {
    this.pinoLogger = pinoLogger;

    this.systemLogger = pinoLogger.child({ category: LogCategory.SYSTEM });
    this.auditLogger = pinoLogger.child({ category: LogCategory.AUDIT });
  }

  setLogStreamCallback(callback: LogStreamCallback): void {
    this.logStreamCallback = callback;
  }

  removeLogStreamCallback(): void {
    this.logStreamCallback = undefined;
  }

  system(level: LogLevel, message: string, metadata?: Partial<LogMetadata>): void {
    const enrichedMetadata = this.enrichMetadata({
      ...metadata,
      category: LogCategory.SYSTEM,
      timestamp: new Date().toISOString(),
      level,
    });

    this.systemLogger[level](enrichedMetadata, message);

    if (this.logStreamCallback) {
      this.logStreamCallback({
        id: enrichedMetadata.id!,
        timestamp: enrichedMetadata.timestamp ?? new Date().toISOString(),
        level: enrichedMetadata.level ?? LogLevel.INFO,
        category: LogCategory.SYSTEM,
        message,
        metadata: enrichedMetadata,
      });
    }
  }

  audit(level: LogLevel, message: string, metadata: AuditMetadata): void {
    const enrichedMetadata = this.enrichMetadata({
      ...metadata,
      category: LogCategory.AUDIT,
      timestamp: new Date().toISOString(),
      level,
    });

    this.auditLogger[level](enrichedMetadata, message);

    if (this.logStreamCallback) {
      this.logStreamCallback({
        id: enrichedMetadata.id!,
        timestamp: enrichedMetadata.timestamp ?? new Date().toISOString(),
        level: enrichedMetadata.level ?? LogLevel.INFO,
        category: LogCategory.AUDIT,
        message,
        metadata: enrichedMetadata,
      });
    }
  }

  auditEvent(
    type: AuditEventType,
    userId: string,
    guildId: string,
    details: AuditEvent['details'],
    result: AuditResult = AuditResult.SUCCESS,
    options?: {
      username?: string;
      guildName?: string;
      channelId?: string;
      duration?: number;
    },
  ): void {
    const auditEvent: AuditEvent = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      type,
      userId,
      username: options?.username || 'Unknown',
      guildId,
      guildName: options?.guildName || 'Unknown',
      channelId: options?.channelId,
      details,
      result,
      duration: options?.duration,
    };

    const message = this.formatAuditEventMessage(auditEvent);

    this.audit(LogLevel.INFO, message, {
      level: LogLevel.INFO,
      timestamp: auditEvent.timestamp,
      userId: auditEvent.userId,
      guildId: auditEvent.guildId,
      channelId: auditEvent.channelId,
      action: type,
      auditEventId: auditEvent.id,
      auditEventType: auditEvent.type,
      auditResult: auditEvent.result,
      duration: auditEvent.duration,
    });
  }

  info(message: string, metadata?: Partial<LogMetadata>): void {
    this.system(LogLevel.INFO, message, metadata);
  }

  warn(message: string, metadata?: Partial<LogMetadata>): void {
    this.system(LogLevel.WARN, message, metadata);
  }

  error(message: string, error?: Error, metadata?: Partial<LogMetadata>): void {
    const errorInfo: ErrorInfo | undefined = error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
          code: (error as { code?: string }).code,
        }
      : undefined;

    this.system(LogLevel.ERROR, message, {
      ...metadata,
      error: errorInfo,
    });
  }

  fatal(message: string, error?: Error, metadata?: Partial<LogMetadata>): void {
    const errorInfo: ErrorInfo | undefined = error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
          code: (error as { code?: string }).code,
        }
      : undefined;

    this.system(LogLevel.FATAL, message, {
      ...metadata,
      error: errorInfo,
    });
  }

  debug(message: string, metadata?: Partial<LogMetadata>): void {
    this.system(LogLevel.DEBUG, message, metadata);
  }

  trace(message: string, metadata?: Partial<LogMetadata>): void {
    this.system(LogLevel.TRACE, message, metadata);
  }

  auditCommand(
    command: string,
    userId: string,
    guildId: string,
    parameters?: Record<string, unknown>,
    result: AuditResult = AuditResult.SUCCESS,
    options?: {
      username?: string;
      guildName?: string;
      channelId?: string;
      duration?: number;
      error?: Error;
    },
  ): void {
    this.auditEvent(
      AuditEventType.COMMAND_EXECUTED,
      userId,
      guildId,
      {
        command,
        parameters,
        error: options?.error
          ? {
              name: options.error.name,
              message: options.error.message,
              stack: options.error.stack,
              code: (options.error as { code?: string }).code,
            }
          : undefined,
      },
      result,
      options,
    );
  }

  auditTrack(
    type: AuditEventType.TRACK_PLAYED | AuditEventType.TRACK_ADDED,
    userId: string,
    guildId: string,
    track: {
      title: string;
      url: string;
      duration?: string;
      author?: string;
      thumbnail?: string;
    },
    options?: {
      username?: string;
      guildName?: string;
      channelId?: string;
    },
  ): void {
    this.auditEvent(type, userId, guildId, { track }, AuditResult.SUCCESS, options);
  }

  auditPlayerState(
    userId: string,
    guildId: string,
    previousState: Record<string, unknown>,
    newState: Record<string, unknown>,
    options?: {
      username?: string;
      guildName?: string;
      channelId?: string;
    },
  ): void {
    this.auditEvent(
      AuditEventType.PLAYER_STATE_CHANGED,
      userId,
      guildId,
      { previousState, newState },
      AuditResult.SUCCESS,
      options,
    );
  }

  getPinoLogger(): pino.Logger {
    return this.pinoLogger;
  }

  child(bindings: Record<string, unknown>): EnhancedLogger {
    const childPino = this.pinoLogger.child(bindings);
    return new EnhancedLogger(childPino);
  }

  private enrichMetadata(metadata: LogMetadata): LogMetadata {
    return {
      ...metadata,
      id: randomUUID(),
      timestamp: metadata.timestamp ?? new Date().toISOString(),
      level: metadata.level ?? LogLevel.INFO,
    };
  }

  private formatAuditEventMessage(event: AuditEvent): string {
    const { type, userId, guildId, details } = event;

    switch (type) {
      case AuditEventType.COMMAND_EXECUTED:
        return `User ${userId} executed command "${details.command}" in guild ${guildId}`;
      case AuditEventType.TRACK_PLAYED:
        return `User ${userId} played track "${(details as { track?: { title?: string } }).track?.title}" in guild ${guildId}`;
      case AuditEventType.TRACK_ADDED:
        return `User ${userId} added track "${(details as { track?: { title?: string } }).track?.title}" to queue in guild ${guildId}`;
      case AuditEventType.VOICE_JOINED:
        return `User ${userId} joined voice channel in guild ${guildId}`;
      case AuditEventType.VOICE_LEFT:
        return `User ${userId} left voice channel in guild ${guildId}`;
      case AuditEventType.BUTTON_CLICKED:
        return `User ${userId} clicked button in guild ${guildId}`;
      case AuditEventType.PLAYER_STATE_CHANGED:
        return `Player state changed for guild ${guildId} by user ${userId}`;
      case AuditEventType.ERROR_OCCURRED: {
        const errorDetails = details as { error?: ErrorInfo };
        const errorMessage = errorDetails.error?.message ?? 'Unknown error';
        return `Error occurred for user ${userId} in guild ${guildId}: ${errorMessage}`;
      }
      default:
        return `Audit event ${type} for user ${userId} in guild ${guildId}`;
    }
  }
}

export function formatMetadata(metadata: Partial<LogMetadata>): LogMetadata {
  return {
    category: LogCategory.SYSTEM,
    timestamp: new Date().toISOString(),
    level: LogLevel.INFO,
    ...metadata,
  } as LogMetadata;
}

export function createLogEntry(message: string, metadata: LogMetadata): LogEntry {
  return {
    id: randomUUID(),
    timestamp: metadata.timestamp ?? new Date().toISOString(),
    level: metadata.level ?? LogLevel.INFO,
    category: metadata.category ?? LogCategory.SYSTEM,
    message,
    metadata,
  };
}

export function sanitizeMetadata(metadata: LogMetadata): LogMetadata {
  const sanitized: LogMetadata = { ...metadata };
  const errorInfo = sanitized.error as ErrorInfo | undefined;

  if (errorInfo?.stack) {
    const stackLines = errorInfo.stack.split('\n');
    sanitized.error = {
      ...errorInfo,
      stack: stackLines.slice(0, 5).join('\n'),
    };
  }

  return sanitized;
}

export function extractUserContext(interaction: {
  user?: { id?: string; username?: string };
  guild?: { id?: string };
  guildId?: string;
  channel?: { id?: string };
}): Pick<AuditMetadata, 'userId' | 'guildId' | 'channelId' | 'username'> {
  const guildId = interaction?.guildId ?? interaction?.guild?.id ?? 'unknown';

  return {
    userId: interaction?.user?.id ?? 'unknown',
    guildId,
    channelId: interaction?.channel?.id,
    username: interaction?.user?.username ?? 'unknown',
  };
}
