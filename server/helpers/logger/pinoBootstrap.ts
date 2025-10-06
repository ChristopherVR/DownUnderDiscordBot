import pino from 'pino';
import { DEFAULT_LOGGING_CONFIG, getLoggingConfig } from './logConfig';
import { EnhancedLogger } from './enhancedLogger';
import { createLogRotationManager } from './logRotationManager';

const config = getLoggingConfig() || DEFAULT_LOGGING_CONFIG;

let pinoLogger: pino.Logger;
try {
  // Create a basic pino logger; advanced transport config may be wired later
  pinoLogger = pino({ level: config.levels.system });
} catch (error) {
  // Fallback to a simple pino instance

  console.error('Failed to create pino logger, falling back', error);
  pinoLogger = pino({ level: 'info' });
}

export const enhancedLogger = new EnhancedLogger(pinoLogger);
export const rotationManager = createLogRotationManager(config.rotation);

export default pinoLogger;
