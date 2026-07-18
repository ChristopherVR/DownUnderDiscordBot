import { isTauri } from './detect';

export interface UpdateInfo {
  version: string;
  date?: string;
  body?: string;
}

export type UpdateProgress = (downloaded: number, total: number | null) => void;

/** Auto-update via Tauri's official updater plugin.
 *  Web mode has no concept of an update check - every function is a no-op. */
export const updaterPlatform = {
  async checkForUpdate(): Promise<UpdateInfo | null> {
    if (!isTauri()) return null;

    const { check } = await import('@tauri-apps/plugin-updater');
    const update = await check();
    if (!update) return null;

    return { version: update.version, date: update.date, body: update.body };
  },

  async downloadAndInstall(onProgress?: UpdateProgress): Promise<void> {
    if (!isTauri()) return;

    const { check } = await import('@tauri-apps/plugin-updater');
    const update = await check();
    if (!update) return;

    let downloaded = 0;
    let total: number | null = null;
    await update.downloadAndInstall((event) => {
      if (event.event === 'Started') total = event.data.contentLength ?? null;
      if (event.event === 'Progress') downloaded += event.data.chunkLength;
      onProgress?.(downloaded, total);
    });
  },

  async relaunch(): Promise<void> {
    if (!isTauri()) return;

    const { relaunch } = await import('@tauri-apps/plugin-process');
    await relaunch();
  },
};
