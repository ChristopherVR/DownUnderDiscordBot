import { describe, it, expect, vi, beforeEach } from 'vitest';
// import path from 'path';
import fs from 'fs';

// Mock fs module
vi.mock('fs');

// Import after mocking
import { FileManager } from '../../../src/helpers/fileManager';

describe('FileManager', () => {
  let fileManager: typeof FileManager;

  beforeEach(() => {
    vi.clearAllMocks();
    fileManager = FileManager;
  });

  describe('saveUploadedFile', () => {
    it('should save file with metadata', async () => {
      const mockFile = {
        originalname: 'test.mp3',
        filename: 'uploaded-file.mp3',
        path: '/tmp/uploaded-file.mp3',
        size: 1024000,
        mimetype: 'audio/mp3',
      };

      vi.mocked(fs.existsSync).mockReturnValue(false);
      vi.mocked(fs.mkdirSync).mockImplementation(() => '');
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});

      const result = await fileManager.saveUploadedFile(mockFile);

      expect(result).toEqual({
        id: expect.any(String),
        originalName: 'test.mp3',
        fileName: 'uploaded-file.mp3',
        filePath: expect.stringContaining('uploaded-file.mp3'),
        mimeType: 'audio/mp3',
        size: 1024000,
        uploadedAt: expect.any(Number),
      });

      expect(fs.mkdirSync).toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should create upload directory if not exists', async () => {
      const mockFile = {
        originalname: 'test.mp3',
        filename: 'uploaded-file.mp3',
        path: '/tmp/uploaded-file.mp3',
        size: 1024000,
        mimetype: 'audio/mp3',
      };

      vi.mocked(fs.existsSync).mockReturnValue(false);
      vi.mocked(fs.mkdirSync).mockImplementation(() => '');
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});

      await fileManager.saveUploadedFile(mockFile);

      expect(fs.mkdirSync).toHaveBeenCalledWith(expect.stringContaining('uploads'), { recursive: true });
    });

    it('should not create directory if it exists', async () => {
      const mockFile = {
        originalname: 'test.mp3',
        filename: 'uploaded-file.mp3',
        path: '/tmp/uploaded-file.mp3',
        size: 1024000,
        mimetype: 'audio/mp3',
      };

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});

      await fileManager.saveUploadedFile(mockFile);

      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });
  });

  describe('getUploadedFiles', () => {
    it('should return list of uploaded files', async () => {
      const mockMetadata = {
        'file-1': {
          id: 'file-1',
          originalName: 'song1.mp3',
          fileName: 'file1.mp3',
          filePath: '/uploads/file1.mp3',
          mimeType: 'audio/mp3',
          size: 1024000,
          uploadedAt: Date.now(),
        },
        'file-2': {
          id: 'file-2',
          originalName: 'song2.mp3',
          fileName: 'file2.mp3',
          filePath: '/uploads/file2.mp3',
          mimeType: 'audio/mp3',
          size: 2048000,
          uploadedAt: Date.now(),
        },
      };

      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockMetadata));
      vi.mocked(fs.existsSync).mockReturnValue(true);

      const files = await fileManager.getUploadedFiles();

      expect(files).toHaveLength(2);
      expect(files[0].originalName).toBe('song1.mp3');
      expect(files[1].originalName).toBe('song2.mp3');
    });

    it('should return empty array if no metadata file', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const files = await fileManager.getUploadedFiles();

      expect(files).toEqual([]);
    });

    it('should handle corrupted metadata file', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('invalid json');

      const files = await fileManager.getUploadedFiles();

      expect(files).toEqual([]);
    });
  });

  describe('deleteUploadedFile', () => {
    it('should delete file and update metadata', async () => {
      const mockMetadata = {
        'file-1': {
          id: 'file-1',
          originalName: 'song1.mp3',
          fileName: 'file1.mp3',
          filePath: '/uploads/file1.mp3',
          mimeType: 'audio/mp3',
          size: 1024000,
          uploadedAt: Date.now(),
        },
      };

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockMetadata));
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});

      const result = await fileManager.deleteUploadedFile('file-1');

      expect(result).toBe(true);
      expect(fs.writeFileSync).toHaveBeenCalledWith(expect.stringContaining('metadata.json'), JSON.stringify({}));
    });

    it('should return false for non-existent file', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue('{}');

      const result = await fileManager.deleteUploadedFile('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('validateFileType', () => {
    it('should accept valid audio file types', () => {
      const validTypes = ['audio/mp3', 'audio/wav', 'audio/flac', 'audio/ogg'];

      validTypes.forEach((type) => {
        expect(fileManager.validateFileType(type)).toBe(true);
      });
    });

    it('should reject invalid file types', () => {
      const invalidTypes = ['image/jpeg', 'text/plain', 'video/mp4', 'application/pdf'];

      invalidTypes.forEach((type) => {
        expect(fileManager.validateFileType(type)).toBe(false);
      });
    });
  });

  describe('validateFileSize', () => {
    it('should accept files within size limit', () => {
      const maxSize = 50 * 1024 * 1024; // 50MB
      const validSizes = [1024, 1024 * 1024, 25 * 1024 * 1024];

      validSizes.forEach((size) => {
        expect(fileManager.validateFileSize(size, maxSize)).toBe(true);
      });
    });

    it('should reject files exceeding size limit', () => {
      const maxSize = 50 * 1024 * 1024; // 50MB
      const invalidSizes = [60 * 1024 * 1024, 100 * 1024 * 1024];

      invalidSizes.forEach((size) => {
        expect(fileManager.validateFileSize(size, maxSize)).toBe(false);
      });
    });
  });

  describe('getFileMetadata', () => {
    it('should extract basic metadata from file', async () => {
      const mockFile = {
        originalname: 'test-song.mp3',
        filename: 'uploaded.mp3',
        path: '/tmp/uploaded.mp3',
        size: 1024000,
        mimetype: 'audio/mp3',
      };

      const metadata = await fileManager.getFileMetadata(mockFile);

      expect(metadata).toEqual({
        duration: undefined,
        bitrate: undefined,
        artist: undefined,
        title: 'test-song',
        album: undefined,
      });
    });
  });
});
