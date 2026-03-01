import { promises as fs } from 'fs';
import path from 'path';
import { createLogger } from '../helpers/logger.js';

const log = createLogger('local-music');

const AUDIO_EXTENSIONS = new Set(['.mp3', '.flac', '.wav', '.ogg', '.m4a', '.aac', '.wma', '.opus']);
const VIDEO_EXTENSIONS = new Set(['.mp4', '.mkv', '.avi', '.mov', '.flv', '.ogv', '.3gp', '.webm']);
const MEDIA_EXTENSIONS = new Set([...AUDIO_EXTENSIONS, ...VIDEO_EXTENSIONS]);

export interface LocalTrack {
  filePath: string;
  fileName: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  size: number;
  /** 'audio' or 'video' */
  mediaType: 'audio' | 'video';
}

export class LocalMusicService {
  private musicFolders: string[];

  constructor(musicFolders?: string[]) {
    this.musicFolders = musicFolders ?? [];
    if (process.env.MUSIC_FOLDER_PATH) {
      this.musicFolders.push(process.env.MUSIC_FOLDER_PATH);
    }
  }

  addFolder(folderPath: string): void {
    if (!this.musicFolders.includes(folderPath)) {
      this.musicFolders.push(folderPath);
    }
  }

  async scanFolder(folderPath: string): Promise<LocalTrack[]> {
    const tracks: LocalTrack[] = [];

    try {
      const entries = await fs.readdir(folderPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(folderPath, entry.name);

        if (entry.isDirectory()) {
          const subTracks = await this.scanFolder(fullPath);
          tracks.push(...subTracks);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (MEDIA_EXTENSIONS.has(ext)) {
            const mediaType: 'audio' | 'video' = VIDEO_EXTENSIONS.has(ext) ? 'video' : 'audio';
            try {
              const stat = await fs.stat(fullPath);
              const metadata = await this.extractMetadata(fullPath);

              tracks.push({
                filePath: fullPath,
                fileName: entry.name,
                title: metadata?.title ?? path.basename(entry.name, ext),
                artist: metadata?.artist ?? 'Unknown Artist',
                album: metadata?.album,
                duration: metadata?.duration,
                size: stat.size,
                mediaType,
              });
            } catch (err) {
              log.warn({ err, file: fullPath }, 'Failed to process local file');
              // Still add the file with basic info
              tracks.push({
                filePath: fullPath,
                fileName: entry.name,
                title: path.basename(entry.name, ext),
                artist: 'Unknown Artist',
                size: 0,
                mediaType,
              });
            }
          }
        }
      }
    } catch (err) {
      log.error({ err, folder: folderPath }, 'Failed to scan music folder');
    }

    return tracks;
  }

  async scanAllFolders(): Promise<LocalTrack[]> {
    const allTracks: LocalTrack[] = [];

    for (const folder of this.musicFolders) {
      const tracks = await this.scanFolder(folder);
      allTracks.push(...tracks);
    }

    return allTracks;
  }

  async search(query: string, limit = 20): Promise<LocalTrack[]> {
    const allTracks = await this.scanAllFolders();
    const lowerQuery = query.toLowerCase();

    return allTracks
      .filter(
        (t) =>
          t.title.toLowerCase().includes(lowerQuery) ||
          t.artist.toLowerCase().includes(lowerQuery) ||
          t.fileName.toLowerCase().includes(lowerQuery),
      )
      .slice(0, limit);
  }

  private async extractMetadata(
    filePath: string,
  ): Promise<{ title?: string; artist?: string; album?: string; duration?: number } | null> {
    try {
      // Dynamic import for ESM compatibility
      const mm = await import('music-metadata');
      const metadata = await mm.parseFile(filePath);

      return {
        title: metadata.common.title,
        artist: metadata.common.artist,
        album: metadata.common.album,
        duration: metadata.format.duration ? Math.round(metadata.format.duration) : undefined,
      };
    } catch {
      return null;
    }
  }
}
