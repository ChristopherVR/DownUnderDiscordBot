import { DefaultLoggerMessage } from '../../constants/logger';

export const logger = (message: string | DefaultLoggerMessage, ...optionalParams: unknown[]) => {
  // TODO: Replace console logging with a proper logger.
  return {
    trace: () => false && process.env.NODE_ENV === 'development' && console.trace(message, optionalParams),
    debug: () => false && process.env.NODE_ENV === 'development' && console.debug(message, optionalParams),
    warning: () => console.warn(message, optionalParams),
    info: () => console.info(message, optionalParams),
    error: () => console.error(message, optionalParams),
  };
};
