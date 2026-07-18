import { isTauri } from './detect';

export type BotRunStatus =
  | { state: 'stopped' }
  | { state: 'starting' }
  | { state: 'running'; port: number }
  | { state: 'crashed'; message: string };

export interface LocalBotConfig {
  clientToken: string;
  guildId?: string;
  port: number;
  spotifyClientId?: string;
  spotifyClientSecret?: string;
}

export interface BotLogLine {
  stream: 'stdout' | 'stderr';
  line: string;
}

/** Controls the bundled bot sidecar. Web mode has no local process to
 *  control - every function is a no-op / resolves null. */
export const botProcess = {
  /** Reads the persisted local-bot settings (Rust-side config.json), or
   *  `null` outside Tauri / if never configured. */
  async getConfig(): Promise<LocalBotConfig | null> {
    if (!isTauri()) return null;
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<LocalBotConfig | null>('get_local_bot_config');
  },

  async saveConfig(config: LocalBotConfig): Promise<void> {
    if (!isTauri()) return;
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('save_local_bot_config', { config });
  },

  /** Starts the bundled bot using whatever config was last saved. */
  async start(): Promise<BotRunStatus | null> {
    if (!isTauri()) return null;
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<BotRunStatus>('start_local_bot');
  },

  async stop(): Promise<void> {
    if (!isTauri()) return;
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('stop_local_bot');
  },

  async status(): Promise<BotRunStatus | null> {
    if (!isTauri()) return null;
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<BotRunStatus>('get_local_bot_status');
  },

  /** Subscribe to streamed stdout/stderr lines. Returns an unlisten
   *  function, or `null` outside Tauri. */
  async onLog(handler: (line: BotLogLine) => void): Promise<(() => void) | null> {
    if (!isTauri()) return null;
    const { listen } = await import('@tauri-apps/api/event');
    return listen<BotLogLine>('bot-log', (e) => handler(e.payload));
  },

  async onCrash(handler: (message: string) => void): Promise<(() => void) | null> {
    if (!isTauri()) return null;
    const { listen } = await import('@tauri-apps/api/event');
    return listen<{ message: string }>('bot-crashed', (e) => handler(e.payload.message));
  },
};
