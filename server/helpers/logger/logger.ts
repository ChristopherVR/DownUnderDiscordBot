import { enhancedLogger, rotationManager } from './pinoBootstrap';

// Provide a simple logger facade for compatibility
export const logger = {
  info: (msg: string | Record<string, unknown>, meta?: Record<string, unknown>) =>
    enhancedLogger.info(typeof msg === 'string' ? msg : JSON.stringify(msg), meta),
  warn: (msg: string | Record<string, unknown>, meta?: Record<string, unknown>) =>
    enhancedLogger.warn(typeof msg === 'string' ? msg : JSON.stringify(msg), meta),
  error: (msg: string | Record<string, unknown>, err?: Error, meta?: Record<string, unknown>) =>
    enhancedLogger.error(typeof msg === 'string' ? msg : JSON.stringify(msg), err, meta),
  debug: (msg: string | Record<string, unknown>, meta?: Record<string, unknown>) =>
    enhancedLogger.debug(typeof msg === 'string' ? msg : JSON.stringify(msg), meta),
};

export { enhancedLogger, rotationManager };
export default logger;
