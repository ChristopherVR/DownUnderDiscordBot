/**
 * App-level (Tauri / desktop) logger.
 * Stores recent log entries in-memory and notifies subscribers so the
 * LogsPage can display them independently of the bot connection.
 */

export interface AppLogEntry {
  id: string;
  origin: 'app'; // always 'app' - distinguishes from bot logs
  category: string; // e.g. 'ui', 'store', 'network', 'system'
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  ts: number;
  source?: string;
  metadata?: Record<string, unknown>;
}

type Listener = (entry: AppLogEntry) => void;

const MAX_ENTRIES = 500;
const entries: AppLogEntry[] = [];
const listeners = new Set<Listener>();

function push(entry: AppLogEntry) {
  entries.unshift(entry);
  if (entries.length > MAX_ENTRIES) entries.length = MAX_ENTRIES;
  listeners.forEach((fn) => {
    try {
      fn(entry);
    } catch {
      /* never crash the logger */
    }
  });
}

/** Subscribe to new app log entries. Returns unsubscribe function. */
export function onAppLog(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Get all buffered app log entries (newest first). */
export function getAppLogs(): AppLogEntry[] {
  return [...entries];
}

/** Clear all buffered app log entries. */
export function clearAppLogs(): void {
  entries.length = 0;
}

/** Public log helpers ---------------------------------------------------- */

function makeEntry(
  level: AppLogEntry['level'],
  category: string,
  message: string,
  source?: string,
  metadata?: Record<string, unknown>,
): AppLogEntry {
  return {
    id: crypto.randomUUID(),
    origin: 'app',
    category,
    level,
    message,
    ts: Date.now(),
    source,
    metadata,
  };
}

export const appLog = {
  info: (category: string, message: string, source?: string, meta?: Record<string, unknown>) =>
    push(makeEntry('info', category, message, source, meta)),
  warn: (category: string, message: string, source?: string, meta?: Record<string, unknown>) =>
    push(makeEntry('warn', category, message, source, meta)),
  error: (category: string, message: string, source?: string, meta?: Record<string, unknown>) =>
    push(makeEntry('error', category, message, source, meta)),
  debug: (category: string, message: string, source?: string, meta?: Record<string, unknown>) =>
    push(makeEntry('debug', category, message, source, meta)),
};
