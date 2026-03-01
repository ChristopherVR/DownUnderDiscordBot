import { BaseExtractor, Track, ExtractorSearchContext } from 'discord-player';
import { promises as fs, createReadStream } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createLogger } from '../helpers/logger.js';

const log = createLogger('local-extractor');

const AUDIO_EXTENSIONS = new Set([
  '.mp3', '.flac', '.wav', '.ogg', '.m4a', '.aac', '.wma', '.opus', '.webm',
]);

const VIDEO_EXTENSIONS = new Set([
  '.mp4', '.mkv', '.avi', '.mov', '.flv', '.ogv', '.3gp',
]);

const MEDIA_EXTENSIONS = new Set([...AUDIO_EXTENSIONS, ...VIDEO_EXTENSIONS]);

interface LocalExtractorOptions {
  musicFolders?: string[];
}

interface AudioMetadata {
  title?: string;
  artist?: string;
  album?: string;
  duration?: number;
  thumbnail?: string;
}

/**
 * Local file extractor for playing audio files from configured directories.
 * Supports metadata extraction via music-metadata when available.
 */
export class LocalExtractor extends BaseExtractor<LocalExtractorOptions> {
  static identifier = 'com.downunder.local' as const;

  private musicFolders: string[] = [];

  async activate(): Promise<void> {
    this.musicFolders = [...(this.options.musicFolders ?? [])];

    if (process.env.MUSIC_FOLDER_PATH) {
      this.musicFolders.push(process.env.MUSIC_FOLDER_PATH);
    }

    // Also include the uploads directory
    const uploadsDir = path.resolve('uploads/audio');
    try {
      await fs.access(uploadsDir);
      this.musicFolders.push(uploadsDir);
    } catch {
      // uploads dir doesn't exist yet, that's fine
    }

    log.info({ folders: this.musicFolders }, 'LocalExtractor activated');
  }

  async deactivate(): Promise<void> {
    this.musicFolders = [];
    log.info('LocalExtractor deactivated');
  }

  async validate(query: string): Promise<boolean> {
    // Accept absolute file paths or file:// protocol
    if (query.startsWith('file://')) return true;

    try {
      let normalized = decodeURIComponent(query);
      // Strip leading slash from Windows paths like /D:/Music/...
      if (process.platform === 'win32' && /^\/[a-zA-Z]:/.test(normalized)) {
        normalized = normalized.slice(1);
      }
      const ext = path.extname(normalized).toLowerCase();
      if (MEDIA_EXTENSIONS.has(ext)) {
        await fs.access(normalized);
        return true;
      }
    } catch {
      // Not a valid file path
    }

    return false;
  }

  async handle(query: string, context: ExtractorSearchContext) {
    // Direct file path — use fileURLToPath for file:// URLs so Windows
    // drive-letter paths are resolved correctly (avoids /D:/... issues).
    let filePath: string;
    if (query.startsWith('file://')) {
      filePath = fileURLToPath(query);
    } else {
      filePath = decodeURIComponent(query);
      // Strip leading slash from Windows paths like /D:/Music/...
      if (process.platform === 'win32' && /^\/[a-zA-Z]:/.test(filePath)) {
        filePath = filePath.slice(1);
      }
    }

    try {
      await fs.access(filePath);
      const metadata = await this.extractMetadata(filePath);

      const track = new Track(this.context.player, {
        title: metadata.title ?? path.basename(filePath, path.extname(filePath)),
        author: metadata.artist ?? 'Local File',
        url: filePath,
        thumbnail: metadata.thumbnail ?? '',
        duration: metadata.duration ? this.formatDuration(metadata.duration) : '0:00',
        requestedBy: context.requestedBy,
        source: 'arbitrary',
        queryType: 'file',
      });

      track.extractor = this;
      return this.createResponse(null, [track]);
    } catch (err) {
      log.error({ err, filePath }, 'Failed to handle local file');
      return this.createResponse(null, []);
    }
  }

  async stream(track: Track) {
    // Return a ReadStream instead of the file path string. When discord-player
    // receives a string, it uses FFMPEG_ARGS_STRING which adds -reconnect flags.
    // These flags are only valid for network protocols and cause FFmpeg to error
    // on local files ("Option reconnect not found"), silently killing playback.
    return createReadStream(track.url);
  }

  /**
   * Search local music folders for matching files.
   */
  async searchLocal(query: string, limit = 20): Promise<Track[]> {
    const lowerQuery = query.toLowerCase();
    const results: Track[] = [];

    for (const folder of this.musicFolders) {
      const files = await this.scanFolder(folder);

      for (const file of files) {
        const basename = path.basename(file, path.extname(file)).toLowerCase();
        if (basename.includes(lowerQuery)) {
          const metadata = await this.extractMetadata(file);

          const track = new Track(this.context.player, {
            title: metadata.title ?? path.basename(file, path.extname(file)),
            author: metadata.artist ?? 'Local File',
            url: file,
            thumbnail: metadata.thumbnail ?? '',
            duration: metadata.duration ? this.formatDuration(metadata.duration) : '0:00',
            source: 'arbitrary',
            queryType: 'file',
          });

          track.extractor = this;
          results.push(track);

          if (results.length >= limit) return results;
        }
      }
    }

    return results;
  }

  private async scanFolder(folderPath: string): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await fs.readdir(folderPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(folderPath, entry.name);

        if (entry.isDirectory()) {
          const subFiles = await this.scanFolder(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (MEDIA_EXTENSIONS.has(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (err) {
      log.warn({ err, folder: folderPath }, 'Failed to scan folder');
    }

    return files;
  }

  private async extractMetadata(filePath: string): Promise<AudioMetadata> {
    try {
      // Dynamic import for ESM compatibility
      const mm = await import('music-metadata');
      const metadata = await mm.parseFile(filePath);

      // Extract embedded album art if available
      let thumbnail: string | undefined;
      if (metadata.common.picture?.[0]) {
        const pic = metadata.common.picture[0];
        thumbnail = `data:${pic.format};base64,${Buffer.from(pic.data).toString('base64')}`;
      }

      return {
        title: metadata.common.title,
        artist: metadata.common.artist,
        album: metadata.common.album,
        duration: metadata.format.duration ? Math.round(metadata.format.duration) : undefined,
        thumbnail,
      };
    } catch {
      return {};
    }
  }

  private formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }
}
