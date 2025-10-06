import { promises as fs } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { createReadStream, createWriteStream } from 'fs';
import { LogRotationConfig } from '../../types/logging';

export class LogRotationManager {
  private config: LogRotationConfig;
  private rotationTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: LogRotationConfig) {
    this.config = config;
  }

  async initializeRotation(logFilePath: string): Promise<void> {
    await this.ensureLogDirectory(logFilePath);
    await this.checkAndRotateIfNeeded(logFilePath);

    const timer = setInterval(async () => {
      await this.checkAndRotateIfNeeded(logFilePath);
    }, 60000);

    this.rotationTimers.set(logFilePath, timer);

    if (this.config.rotateDaily) {
      this.scheduleDailyRotation(logFilePath);
    }
  }

  stopRotation(logFilePath: string): void {
    const timer = this.rotationTimers.get(logFilePath);
    if (timer) {
      clearInterval(timer);
      this.rotationTimers.delete(logFilePath);
    }
  }

  async rotateLog(logFilePath: string): Promise<void> {
    try {
      const rotatedPath = await this.generateRotatedFileName(logFilePath);
      await fs.rename(logFilePath, rotatedPath);

      if (this.config.compressionEnabled) {
        await this.compressLogFile(rotatedPath);
      }

      await this.cleanupOldLogs(logFilePath);

      console.log(`Log rotated: ${logFilePath} -> ${rotatedPath}`);
    } catch (error) {
      console.error(`Failed to rotate log ${logFilePath}:`, error);
    }
  }

  async cleanupOldLogs(logFilePath: string): Promise<void> {
    try {
      const logDir = dirname(logFilePath);
      const logBaseName = this.getLogBaseName(logFilePath);

      const files = await fs.readdir(logDir);
      const logFiles = files
        .filter((file) => file.startsWith(logBaseName) && file !== basename(logFilePath))
        .map((file) => ({
          name: file,
          path: join(logDir, file),
        }));

      const fileStats = await Promise.all(
        logFiles.map(async (file) => ({
          ...file,
          stats: await fs.stat(file.path),
        })),
      );

      fileStats.sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());

      const filesToDelete = fileStats.slice(this.config.maxFiles);

      for (const file of filesToDelete) {
        await fs.unlink(file.path);
        console.log(`Deleted old log file: ${file.name}`);
      }
    } catch (error) {
      console.error(`Failed to cleanup old logs for ${logFilePath}:`, error);
    }
  }

  async getLogFileSize(logFilePath: string): Promise<number> {
    try {
      const stats = await fs.stat(logFilePath);
      return stats.size;
    } catch {
      return 0;
    }
  }

  private async checkAndRotateIfNeeded(logFilePath: string): Promise<void> {
    try {
      const fileSize = await this.getLogFileSize(logFilePath);

      if (fileSize >= this.config.maxFileSize) {
        await this.rotateLog(logFilePath);
      }
    } catch (error) {
      console.error(`Failed to check rotation for ${logFilePath}:`, error);
    }
  }

  private scheduleDailyRotation(logFilePath: string): void {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    setTimeout(() => {
      this.rotateLog(logFilePath);

      setInterval(
        () => {
          this.rotateLog(logFilePath);
        },
        24 * 60 * 60 * 1000,
      );
    }, msUntilMidnight);
  }

  private async generateRotatedFileName(logFilePath: string): Promise<string> {
    const dir = dirname(logFilePath);
    const ext = extname(logFilePath);
    const baseName = basename(logFilePath, ext);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    return join(dir, `${baseName}.${timestamp}${ext}`);
  }

  private async compressLogFile(filePath: string): Promise<void> {
    const compressedPath = `${filePath}.gz`;

    try {
      await pipeline(createReadStream(filePath), createGzip(), createWriteStream(compressedPath));

      await fs.unlink(filePath);
      console.log(`Compressed log file: ${filePath} -> ${compressedPath}`);
    } catch (error) {
      console.error(`Failed to compress log file ${filePath}:`, error);
      try {
        await fs.unlink(compressedPath);
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  private async ensureLogDirectory(logFilePath: string): Promise<void> {
    const logDir = dirname(logFilePath);
    try {
      await fs.mkdir(logDir, { recursive: true });
    } catch (error) {
      console.error(`Failed to create log directory ${logDir}:`, error);
    }
  }

  private getLogBaseName(logFilePath: string): string {
    const fileName = basename(logFilePath);
    const ext = extname(fileName);
    return fileName.replace(ext, '');
  }

  async getRotationStats(logFilePath: string): Promise<{
    currentSize: number;
    rotatedFiles: number;
    oldestRotatedFile?: Date;
    newestRotatedFile?: Date;
  }> {
    try {
      const currentSize = await this.getLogFileSize(logFilePath);
      const logDir = dirname(logFilePath);
      const logBaseName = this.getLogBaseName(logFilePath);

      const files = await fs.readdir(logDir);
      const rotatedFiles = files.filter((file) => file.startsWith(logBaseName) && file !== basename(logFilePath));

      let oldestDate: Date | undefined;
      let newestDate: Date | undefined;

      if (rotatedFiles.length > 0) {
        const fileStats = await Promise.all(
          rotatedFiles.map(async (file) => {
            const stats = await fs.stat(join(logDir, file));
            return stats.mtime;
          }),
        );

        fileStats.sort((a, b) => a.getTime() - b.getTime());
        oldestDate = fileStats[0];
        newestDate = fileStats[fileStats.length - 1];
      }

      return {
        currentSize,
        rotatedFiles: rotatedFiles.length,
        oldestRotatedFile: oldestDate,
        newestRotatedFile: newestDate,
      };
    } catch (error) {
      console.error(`Failed to get rotation stats for ${logFilePath}:`, error);
      return {
        currentSize: 0,
        rotatedFiles: 0,
      };
    }
  }
}

export const DEFAULT_ROTATION_CONFIG: LogRotationConfig = {
  maxFileSize: 10 * 1024 * 1024,
  maxFiles: 10,
  rotateDaily: true,
  compressionEnabled: true,
};

export function createLogRotationManager(config?: Partial<LogRotationConfig>): LogRotationManager {
  const finalConfig = {
    ...DEFAULT_ROTATION_CONFIG,
    ...config,
  };

  return new LogRotationManager(finalConfig);
}
