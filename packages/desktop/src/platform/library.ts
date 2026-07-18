import { isTauri } from './detect';
import { api } from '@/lib/api';

export interface ScannedTrack {
  file_path: string;
  file_name: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  size: number;
  media_type?: string;
}

export interface FolderChangeEvent {
  kind: string;
  path: string;
  file_name: string;
  folder: string;
}

export const libraryPlatform = {
  canWatch: isTauri(),

  async scanFolder(path: string): Promise<ScannedTrack[]> {
    if (isTauri()) {
      const { invoke } = await import('@tauri-apps/api/core');
      return invoke<ScannedTrack[]>('scan_music_folder', { path });
    }
    return api.scanLibraryFolder(path);
  },

  async resolvePaths(paths: string[]): Promise<ScannedTrack[]> {
    if (isTauri()) {
      const { invoke } = await import('@tauri-apps/api/core');
      return invoke<ScannedTrack[]>('resolve_dropped_paths', { paths });
    }
    return api.resolveLibraryPaths(paths);
  },

  async isDirectory(path: string): Promise<boolean> {
    if (isTauri()) {
      const { invoke } = await import('@tauri-apps/api/core');
      return invoke<boolean>('is_directory', { path });
    }
    return api.libraryIsDirectory(path);
  },

  /** Watch a folder for changes. Returns an unlisten function, or `null` in
   *  browser mode (web users must use a manual "rescan" button). */
  async watchFolder(path: string, onChange: (evt: FolderChangeEvent) => void): Promise<(() => void) | null> {
    if (!isTauri()) return null;

    const { invoke } = await import('@tauri-apps/api/core');
    const { listen } = await import('@tauri-apps/api/event');

    await invoke('watch_folder', { path });
    const unlisten = await listen<FolderChangeEvent>('music-folder-changed', (evt) => onChange(evt.payload));
    return unlisten;
  },

  async unwatchAll(): Promise<void> {
    if (!isTauri()) return;
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('unwatch_all');
  },
};
