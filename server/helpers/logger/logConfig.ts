import { LogRotationConfig } from '../../types/logging';

export interface LoggingConfig {
  rotation: LogRotationConfig;
  levels: {
    system: string;
    audit: string;
    console: string;
  };
  files: {
    system: string;
    audit: string;
    combined: string;
  };
  realtime: {
    enabled: boolean;
    bufferSize: number;
    maxClients: number;
  };
}

export const DEFAULT_LOGGING_CONFIG: LoggingConfig = {
  rotation: {
    maxFileSize: 10 * 1024 * 1024,
    maxFiles: 10,
    rotateDaily: true,
    compressionEnabled: true,
  },
  levels: {
    system: process.env.PINO_LOG_LEVEL || 'info',
    audit: process.env.AUDIT_LOG_LEVEL || 'info',
    console: process.env.CONSOLE_LOG_LEVEL || 'info',
  },
  files: {
    system: './logs/system.log',
    audit: './logs/audit.log',
    combined: './logs/all.log',
  },
  realtime: {
    enabled: true,
    bufferSize: 1000,
    maxClients: 10,
  },
};

export function getLoggingConfig(): LoggingConfig {
  const config = { ...DEFAULT_LOGGING_CONFIG };

  if (process.env.LOG_MAX_FILE_SIZE) {
    config.rotation.maxFileSize = parseInt(process.env.LOG_MAX_FILE_SIZE, 10);
  }

  if (process.env.LOG_MAX_FILES) {
    config.rotation.maxFiles = parseInt(process.env.LOG_MAX_FILES, 10);
  }

  if (process.env.LOG_ROTATE_DAILY !== undefined) {
    config.rotation.rotateDaily = process.env.LOG_ROTATE_DAILY === 'true';
  }

  if (process.env.LOG_COMPRESSION !== undefined) {
    config.rotation.compressionEnabled = process.env.LOG_COMPRESSION === 'true';
  }

  if (process.env.SYSTEM_LOG_FILE) {
    config.files.system = process.env.SYSTEM_LOG_FILE;
  }

  if (process.env.AUDIT_LOG_FILE) {
    config.files.audit = process.env.AUDIT_LOG_FILE;
  }

  if (process.env.COMBINED_LOG_FILE) {
    config.files.combined = process.env.COMBINED_LOG_FILE;
  }

  if (process.env.REALTIME_LOGGING !== undefined) {
    config.realtime.enabled = process.env.REALTIME_LOGGING === 'true';
  }

  if (process.env.LOG_BUFFER_SIZE) {
    config.realtime.bufferSize = parseInt(process.env.LOG_BUFFER_SIZE, 10);
  }

  if (process.env.MAX_LOG_CLIENTS) {
    config.realtime.maxClients = parseInt(process.env.MAX_LOG_CLIENTS, 10);
  }

  return config;
}

export function validateLoggingConfig(config: LoggingConfig): string[] {
  const errors: string[] = [];

  if (config.rotation.maxFileSize <= 0) {
    errors.push('maxFileSize must be greater than 0');
  }

  if (config.rotation.maxFiles <= 0) {
    errors.push('maxFiles must be greater than 0');
  }

  const validLevels = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'];

  if (!validLevels.includes(config.levels.system)) {
    errors.push(`Invalid system log level: ${config.levels.system}`);
  }

  if (!validLevels.includes(config.levels.audit)) {
    errors.push(`Invalid audit log level: ${config.levels.audit}`);
  }

  if (!validLevels.includes(config.levels.console)) {
    errors.push(`Invalid console log level: ${config.levels.console}`);
  }

  if (config.realtime.bufferSize <= 0) {
    errors.push('realtime.bufferSize must be greater than 0');
  }

  if (config.realtime.maxClients <= 0) {
    errors.push('realtime.maxClients must be greater than 0');
  }

  return errors;
}

interface PinoTarget {
  target: string;
  level?: string;
  options?: Record<string, unknown>;
}

export function createPinoTransportConfig(config: LoggingConfig) {
  const targets: PinoTarget[] = [];

  targets.push({
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname',
      translateTime: 'SYS:standard',
    },
    level: config.levels.console,
  });

  targets.push({
    target: 'pino/file',
    options: {
      destination: config.files.combined,
      mkdir: true,
    },
    level: 'trace',
  });

  targets.push({
    target: 'pino/file',
    options: {
      destination: config.files.system,
      mkdir: true,
    },
    level: config.levels.system,
  });

  targets.push({
    target: 'pino/file',
    options: {
      destination: config.files.audit,
      mkdir: true,
    },
    level: config.levels.audit,
  });

  return {
    targets,
  };
}
