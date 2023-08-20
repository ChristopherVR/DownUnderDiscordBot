import pino from 'pino';
import { DefaultLoggerMessage } from '../../enums/logger';

const pinoLogger = pino({
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: ['name', 'password', 'profile.address', 'profile.phone'],
    remove: true,
  },
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});

/** Creates an instance of a pipo logger.
 * @example
 * logger('Hello world!').info(); // Outputs pipo log
 */
export const logger = (message: string | DefaultLoggerMessage | Error, ...optionalParams: unknown[]) => {
  return {
    trace: () => {
      pinoLogger.level = 'trace';
      if (typeof message === 'object') {
        pinoLogger.trace(message);
      } else {
        pinoLogger.trace(message, optionalParams);
      }
    },
    debug: () => {
      pinoLogger.level = 'debug';
      if (typeof message === 'object') {
        pinoLogger.debug(message);
      } else {
        pinoLogger.debug(message, optionalParams);
      }
    },
    warning: () => {
      pinoLogger.level = 'warn';
      if (typeof message === 'object') {
        pinoLogger.warn(message);
      } else {
        pinoLogger.warn(message, optionalParams);
      }
    },
    info: () => {
      pinoLogger.level = 'info';
      if (typeof message === 'object') {
        pinoLogger.info(message);
      } else {
        pinoLogger.info(message, optionalParams);
      }
    },
    error: () => {
      pinoLogger.level = 'error';
      if (typeof message === 'object') {
        pinoLogger.error(message);
      } else {
        pinoLogger.error(message, optionalParams);
      }
    },
    fatal: () => {
      pinoLogger.level = 'fatal';
      if (typeof message === 'object') {
        pinoLogger.fatal(message);
      } else {
        pinoLogger.fatal(message, optionalParams);
      }
    },
  };
};
