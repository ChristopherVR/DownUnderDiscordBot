import pino, { type LoggerOptions, type Bindings, type Logger } from 'pino';

const isDev = process.env.NODE_ENV !== 'production';
const baseOptions: LoggerOptions = {
  level: process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'info'),
  base: {
    service: 'discord-dashboard-server',
  },
  formatters: {
    level(label) {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
};

const logger: Logger = pino({
  ...baseOptions,
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});

export function createLogger(bindings: string | Bindings): Logger {
  if (typeof bindings === 'string') {
    return logger.child({ context: bindings });
  }

  return logger.child(bindings);
}

export { logger };
export default logger;
