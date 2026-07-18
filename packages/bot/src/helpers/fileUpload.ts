import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';
import type { UploadedFile } from 'discord-dashboard-shared';

// Supported audio formats
const SUPPORTED_AUDIO_FORMATS = [
  'audio/mpeg', // MP3
  'audio/wav', // WAV
  'audio/flac', // FLAC
  'audio/ogg', // OGG
  'audio/mp4', // M4A
  'audio/aac', // AAC
  'audio/webm', // WebM Audio
];

// Supported video formats (audio will be extracted for Discord playback)
const SUPPORTED_VIDEO_FORMATS = [
  'video/mp4', // MP4
  'video/webm', // WebM
  'video/x-matroska', // MKV
  'video/x-msvideo', // AVI
  'video/quicktime', // MOV
  'video/x-flv', // FLV
  'video/ogg', // OGV
  'video/3gpp', // 3GP
];

// All supported media formats (audio + video)
const SUPPORTED_MEDIA_FORMATS = [...SUPPORTED_AUDIO_FORMATS, ...SUPPORTED_VIDEO_FORMATS];

// File size limits (200MB - video files can be large)
const MAX_FILE_SIZE = 200 * 1024 * 1024;

// Upload directories
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'audio');
const VIDEO_UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'video');

/**
 * Check if a MIME type is a video format
 */
export function isVideoMimeType(mimeType: string): boolean {
  return SUPPORTED_VIDEO_FORMATS.includes(mimeType);
}

/**
 * Check if a MIME type is an audio format
 */
export function isAudioMimeType(mimeType: string): boolean {
  return SUPPORTED_AUDIO_FORMATS.includes(mimeType);
}

/**
 * Check if a file extension is a video format
 */
export function isVideoExtension(ext: string): boolean {
  const videoExts = new Set(['.mp4', '.webm', '.mkv', '.avi', '.mov', '.flv', '.ogv', '.3gp']);
  return videoExts.has(ext.toLowerCase());
}

/**
 * Check if a file extension is a supported media format (audio or video)
 */
export function isMediaExtension(ext: string): boolean {
  const mediaExts = new Set([
    '.mp3',
    '.flac',
    '.wav',
    '.ogg',
    '.m4a',
    '.aac',
    '.wma',
    '.opus',
    '.webm',
    '.mp4',
    '.mkv',
    '.avi',
    '.mov',
    '.flv',
    '.ogv',
    '.3gp',
  ]);
  return mediaExts.has(ext.toLowerCase());
}

/**
 * Ensure upload directories exist
 */
export async function ensureUploadDir(): Promise<void> {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
  try {
    await fs.access(VIDEO_UPLOAD_DIR);
  } catch {
    await fs.mkdir(VIDEO_UPLOAD_DIR, { recursive: true });
  }
}

/**
 * File filter for audio and video files
 */
function fileFilter(_req: unknown, file: Express.Multer.File, cb: multer.FileFilterCallback): void {
  if (SUPPORTED_MEDIA_FORMATS.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file format. Supported formats: ${SUPPORTED_MEDIA_FORMATS.join(', ')}`));
  }
}

/**
 * Generate unique filename while preserving extension
 */
function generateFileName(originalName: string): string {
  const ext = path.extname(originalName);
  const uuid = randomUUID();
  return `${uuid}${ext}`;
}

/**
 * Multer storage configuration
 */
const storage = multer.diskStorage({
  destination: async (_req, file, cb) => {
    try {
      await ensureUploadDir();
      // Route video files to the video upload directory
      const dest = isVideoMimeType(file.mimetype) ? VIDEO_UPLOAD_DIR : UPLOAD_DIR;
      cb(null, dest);
    } catch (error) {
      cb(error as Error, '');
    }
  },
  filename: (_req, file, cb) => {
    const fileName = generateFileName(file.originalname);
    cb(null, fileName);
  },
});

/**
 * Multer upload middleware configuration
 */
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 50, // Maximum 50 files per request (supports folder uploads)
  },
});

/**
 * Extract audio metadata from file
 */
export async function extractAudioMetadata(filePath: string): Promise<{
  duration?: number;
  bitrate?: number;
  artist?: string;
  title?: string;
  album?: string;
}> {
  try {
    // For now, return empty metadata
    // In a real implementation, you would use a library like node-ffmpeg or music-metadata
    // to extract actual metadata from the audio file
    await fs.stat(filePath); // Verify file exists

    return {
      // Placeholder values - would be extracted from actual audio file
      duration: undefined,
      bitrate: undefined,
      artist: undefined,
      title: path.basename(filePath, path.extname(filePath)),
      album: undefined,
    };
  } catch (error) {
    console.error('Error extracting audio metadata:', error);
    return {};
  }
}

/**
 * Process uploaded file and create UploadedFile record
 */
export async function processUploadedFile(file: Express.Multer.File): Promise<UploadedFile> {
  const metadata = await extractAudioMetadata(file.path);
  const isVideo = isVideoMimeType(file.mimetype);

  const uploadedFile: UploadedFile = {
    id: randomUUID(),
    originalName: file.originalname,
    fileName: file.filename,
    filePath: file.path,
    mimeType: file.mimetype,
    size: file.size,
    uploadedAt: Date.now(),
    metadata,
    mediaType: isVideo ? 'video' : 'audio',
  };

  return uploadedFile;
}

/**
 * Validate file before processing
 */
export function validateFile(file: Express.Multer.File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    };
  }

  // Check file format
  if (!SUPPORTED_MEDIA_FORMATS.includes(file.mimetype)) {
    return {
      valid: false,
      error: `Unsupported file format. Supported formats: ${SUPPORTED_MEDIA_FORMATS.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Delete uploaded file
 */
export async function deleteUploadedFile(filePath: string): Promise<boolean> {
  try {
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

/**
 * Get file info by path
 */
export async function getFileInfo(filePath: string): Promise<{
  exists: boolean;
  size?: number;
  mtime?: Date;
}> {
  try {
    const stats = await fs.stat(filePath);
    return {
      exists: true,
      size: stats.size,
      mtime: stats.mtime,
    };
  } catch {
    return { exists: false };
  }
}

/**
 * Clean up old uploaded files (older than 30 days)
 */
export async function cleanupOldFiles(): Promise<number> {
  try {
    const files = await fs.readdir(UPLOAD_DIR);
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(UPLOAD_DIR, file);
      const stats = await fs.stat(filePath);

      if (stats.mtime.getTime() < thirtyDaysAgo) {
        await fs.unlink(filePath);
        deletedCount++;
      }
    }

    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up old files:', error);
    return 0;
  }
}

/**
 * Get upload directory info
 */
export async function getUploadDirInfo(): Promise<{
  totalFiles: number;
  totalSize: number;
  availableSpace?: number;
}> {
  try {
    const files = await fs.readdir(UPLOAD_DIR);
    let totalSize = 0;

    for (const file of files) {
      const filePath = path.join(UPLOAD_DIR, file);
      const stats = await fs.stat(filePath);
      totalSize += stats.size;
    }

    return {
      totalFiles: files.length,
      totalSize,
    };
  } catch (error) {
    console.error('Error getting upload directory info:', error);
    return {
      totalFiles: 0,
      totalSize: 0,
    };
  }
}
