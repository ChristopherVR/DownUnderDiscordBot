import path from "path";
import fs from "fs";
import { promises as fsp } from "fs";
import { randomUUID } from "crypto";
import type { Express } from "express";
import type { UploadedFile } from "../../shared/src/types/index";

const DEFAULT_UPLOAD_DIR = path.join(process.cwd(), "uploads", "audio");
const METADATA_FILE = "metadata.json";
const SUPPORTED_AUDIO_TYPES = new Set([
  "audio/mp3",
  "audio/mpeg",
  "audio/wav",
  "audio/flac",
  "audio/ogg",
  "audio/aac",
  "audio/webm",
  "audio/mp4",
]);
const DEFAULT_MAX_SIZE = 50 * 1024 * 1024; // 50MB

type MetadataMap = Record<string, UploadedFile>;

function ensureDirectory(uploadDir: string): void {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
}

function resolveMetadataPath(uploadDir: string): string {
  return path.join(uploadDir, METADATA_FILE);
}

function normaliseMetadata(raw: unknown): MetadataMap {
  if (!raw) return {};

  if (Array.isArray(raw)) {
    const map: MetadataMap = {};
    for (const item of raw) {
      if (item && typeof item === "object" && "id" in item && typeof (item as UploadedFile).id === "string") {
        map[(item as UploadedFile).id] = item as UploadedFile;
      }
    }
    return map;
  }

  if (typeof raw === "object") {
    const entries = raw as Record<string, unknown>;
    const map: MetadataMap = {};
    for (const [key, value] of Object.entries(entries)) {
      if (value && typeof value === "object") {
        map[key] = value as UploadedFile;
      }
    }
    return map;
  }

  return {};
}

function readMetadata(uploadDir: string): MetadataMap {
  const metadataPath = resolveMetadataPath(uploadDir);

  try {
    if (!fs.existsSync(metadataPath)) {
      return {};
    }

    const raw = fs.readFileSync(metadataPath, "utf-8");
    if (typeof raw !== "string" || !raw.trim()) {
      return {};
    }

    const parsed = JSON.parse(raw);
    return normaliseMetadata(parsed);
  } catch (error) {
    console.warn("Failed to read metadata file, returning empty set:", error);
    return {};
  }
}

function writeMetadata(uploadDir: string, metadata: MetadataMap): void {
  ensureDirectory(uploadDir);
  const metadataPath = resolveMetadataPath(uploadDir);
  fs.writeFileSync(metadataPath, JSON.stringify(metadata));
}

function createRecord(uploadDir: string, file: Express.Multer.File, overrides: Partial<UploadedFile> = {}): UploadedFile {
  const ext = path.extname(file.originalname);
  const fileName = file.filename ?? `${randomUUID()}${ext}`;
  const destinationPath = overrides.filePath ?? path.join(uploadDir, fileName);

  return {
    id: overrides.id ?? randomUUID(),
    originalName: overrides.originalName ?? file.originalname,
    fileName,
    filePath: destinationPath,
    mimeType: overrides.mimeType ?? file.mimetype,
    size: overrides.size ?? file.size,
    uploadedAt: overrides.uploadedAt ?? Date.now(),
    metadata: overrides.metadata,
  };
}

class FileManagerService {
  constructor(private readonly uploadDir: string = DEFAULT_UPLOAD_DIR) {
    ensureDirectory(this.uploadDir);
  }

  private getMetadata(): MetadataMap {
    return readMetadata(this.uploadDir);
  }

  private persistMetadata(metadata: MetadataMap): void {
    writeMetadata(this.uploadDir, metadata);
  }

  async saveUploadedFile(file: Express.Multer.File): Promise<UploadedFile> {
    ensureDirectory(this.uploadDir);
    const metadata = this.getMetadata();

    const record = createRecord(this.uploadDir, file);

    try {
      if (file.path && fs.existsSync(file.path) && file.path !== record.filePath) {
        fs.copyFileSync(file.path, record.filePath);
      }
    } catch (error) {
      console.warn("Failed to copy uploaded file into uploads directory:", error);
    }

    metadata[record.id] = record;
    this.persistMetadata(metadata);
    return record;
  }

  async getUploadedFiles(): Promise<UploadedFile[]> {
    const metadata = this.getMetadata();
    return Object.values(metadata);
  }

  async deleteUploadedFile(id: string): Promise<boolean> {
    const metadata = this.getMetadata();
    const record = metadata[id];
    if (!record) {
      return false;
    }

    if (record.filePath && fs.existsSync(record.filePath)) {
      try {
        fs.unlinkSync(record.filePath);
      } catch (error) {
        console.warn(`Failed to delete file on disk for ${id}:`, error);
      }
    }

    delete metadata[id];
    this.persistMetadata(metadata);
    return true;
  }

  validateFileType(mimeType: string): boolean {
    return SUPPORTED_AUDIO_TYPES.has(mimeType);
  }

  validateFileSize(size: number, maxSize: number = DEFAULT_MAX_SIZE): boolean {
    return size <= maxSize;
  }

  async getFileMetadata(file: Express.Multer.File): Promise<{
    duration?: number;
    bitrate?: number;
    artist?: string;
    title?: string;
    album?: string;
  }> {
    const parsed = path.parse(file.originalname);
    return {
      duration: undefined,
      bitrate: undefined,
      artist: undefined,
      title: parsed.name || undefined,
      album: undefined,
    };
  }

  async addFile(file: UploadedFile): Promise<void> {
    const metadata = this.getMetadata();
    metadata[file.id] = file;
    this.persistMetadata(metadata);
  }

  getFile(id: string): UploadedFile | undefined {
    const metadata = this.getMetadata();
    return metadata[id];
  }

  getAllFiles(): UploadedFile[] {
    const metadata = this.getMetadata();
    return Object.values(metadata);
  }

  async removeFile(id: string): Promise<boolean> {
    return this.deleteUploadedFile(id);
  }

  async fileExists(id: string): Promise<boolean> {
    const file = this.getFile(id);
    if (!file) return false;
    try {
      fs.accessSync(file.filePath);
      return true;
    } catch {
      return false;
    }
  }

  searchFiles(query: string): UploadedFile[] {
    const metadata = this.getMetadata();
    const lower = query.toLowerCase();
    return Object.values(metadata).filter((file) => {
      if (file.originalName.toLowerCase().includes(lower)) return true;
      const meta = file.metadata;
      if (meta?.title && meta.title.toLowerCase().includes(lower)) return true;
      if (meta?.artist && meta.artist.toLowerCase().includes(lower)) return true;
      if (meta?.album && meta.album.toLowerCase().includes(lower)) return true;
      return false;
    });
  }

  getStorageStats(): {
    totalFiles: number;
    totalSize: number;
    averageSize: number;
    oldestFile?: Date;
    newestFile?: Date;
  } {
    const files = this.getAllFiles();
    const totalFiles = files.length;
    const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);
    const averageSize = totalFiles > 0 ? totalSize / totalFiles : 0;

    const timestamps = files
      .map((file) => file.uploadedAt)
      .filter((value): value is number => typeof value === "number");

    const oldestFile = timestamps.length ? new Date(Math.min(...timestamps)) : undefined;
    const newestFile = timestamps.length ? new Date(Math.max(...timestamps)) : undefined;

    return {
      totalFiles,
      totalSize,
      averageSize,
      oldestFile,
      newestFile,
    };
  }

  async cleanupOrphanedFiles(uploadDir: string = this.uploadDir): Promise<number> {
    try {
      const metadata = this.getMetadata();
      const metadataFiles = new Set(Object.values(metadata).map((file) => path.basename(file.filePath)));
      const filesOnDisk = await fsp.readdir(uploadDir);
      let deleted = 0;

      for (const file of filesOnDisk) {
        if (file === METADATA_FILE) continue;
        if (!metadataFiles.has(file)) {
          try {
            await fsp.unlink(path.join(uploadDir, file));
            deleted++;
          } catch (error) {
            console.warn(`Failed to delete orphaned file ${file}:`, error);
          }
        }
      }

      return deleted;
    } catch (error) {
      console.error("Error cleaning orphaned files:", error);
      return 0;
    }
  }

  async cleanupMissingFiles(): Promise<number> {
    const metadata = this.getMetadata();
    let removed = 0;

    for (const [id, file] of Object.entries(metadata)) {
      if (!file.filePath || !fs.existsSync(file.filePath)) {
        delete metadata[id];
        removed++;
      }
    }

    if (removed > 0) {
      this.persistMetadata(metadata);
    }

    return removed;
  }
}

const service = new FileManagerService();

export const FileManager = {
  saveUploadedFile: (file: Express.Multer.File) => service.saveUploadedFile(file),
  getUploadedFiles: () => service.getUploadedFiles(),
  deleteUploadedFile: (id: string) => service.deleteUploadedFile(id),
  validateFileType: (mimeType: string) => service.validateFileType(mimeType),
  validateFileSize: (size: number, maxSize?: number) => service.validateFileSize(size, maxSize),
  getFileMetadata: (file: Express.Multer.File) => service.getFileMetadata(file),
};

export { FileManagerService };
export const fileManager = service;



