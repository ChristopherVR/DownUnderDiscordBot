import pino, { type LoggerOptions, type Bindings, type Logger } from 'pino';
import { Writable } from 'stream';
import { createRequire } from 'module';

const esmRequire = createRequire(import.meta.url);

const isDev = process.env.NODE_ENV !== 'production';

// ---------------------------------------------------------------------------
// Log sink registry – lets consumers (e.g. index.ts) receive every pino entry
// ---------------------------------------------------------------------------
export interface LogSinkEntry {
  level: string;
  msg: string;
  context?: string;
  service?: string;
  time?: string;
  [key: string]: unknown;
}

type LogSink = (entry: LogSinkEntry) => void;
const logSinks: LogSink[] = [];

/** Register a callback invoked for every log line. Returns an unsubscribe fn. */
export function onLogEntry(sink: LogSink): () => void {
  logSinks.push(sink);
  return () => {
    const idx = logSinks.indexOf(sink);
    if (idx >= 0) logSinks.splice(idx, 1);
  };
}

// ---------------------------------------------------------------------------
// Pino options
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Build a destination that:
//   1. Writes to stdout (pretty-printed in dev, raw JSON in prod)
//   2. Feeds every structured log entry to registered sinks
// ---------------------------------------------------------------------------
function buildDestination(): Writable {
  let outputStream: NodeJS.WritableStream;

  if (isDev) {
    // pino-pretty is a devDependency
    const pinoPretty = esmRequire('pino-pretty') as (opts: Record<string, unknown>) => NodeJS.WritableStream;
    outputStream = pinoPretty({
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
    });
  } else {
    outputStream = process.stdout;
  }

  return new Writable({
    write(chunk: Buffer, _encoding, callback) {
      // Forward to console / pretty output
      outputStream.write(chunk);
      // Feed to registered sinks
      if (logSinks.length > 0) {
        try {
          const entry = JSON.parse(chunk.toString()) as LogSinkEntry;
          for (const sink of logSinks) {
            try {
              sink(entry);
            } catch {
              // never let a sink crash the logger
            }
          }
        } catch {
          // ignore malformed lines
        }
      }
      callback();
    },
  });
}

const logger: Logger = pino(baseOptions, buildDestination());

export function createLogger(bindings: string | Bindings): Logger {
  if (typeof bindings === 'string') {
    return logger.child({ context: bindings });
  }

  return logger.child(bindings);
}

export { logger };
export default logger;
