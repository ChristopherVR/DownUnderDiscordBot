import { Request, Response } from 'express';
import { upload, processUploadedFile, validateFile, deleteUploadedFile, getUploadDirInfo } from '../helpers/fileUpload';
import { fileManager } from '../helpers/fileManager';
import type { UploadedFile } from 'discord-dashboard-shared';
import { ValidationError, NotFoundError } from '../helpers/errorHandler';
import { expressRouter } from '../helpers/expressRouter';
import { tErrors } from 'discord-dashboard-shared/localization';

const router = expressRouter();

/**
 * Upload single audio file
 */
router.post('/single', upload.single('audio'), async (req: Request, res: Response) => {
  if (!req.file) {
    throw new ValidationError('errors.upload.failed', {
      component: 'FileUploader',
      action: 'upload',
    });
  }

  // Validate file
  const validation = validateFile(req.file);
  if (!validation.valid) {
    // Clean up uploaded file
    await deleteUploadedFile(req.file.path);

    // Use specific error message based on validation error
    let errorKey = 'errors.upload.failed';
    if (validation.error?.includes('size') || validation.error?.includes('large')) {
      errorKey = 'errors.upload.fileTooBig';
    } else if (validation.error?.includes('format') || validation.error?.includes('type')) {
      errorKey = 'errors.upload.invalidFormat';
    }

    throw new ValidationError(errorKey, {
      component: 'FileUploader',
      action: 'upload',
    });
  }

  // Process uploaded file
  const uploadedFile = await processUploadedFile(req.file);

  // Add to file manager
  await fileManager.addFile(uploadedFile);

  res.json({
    success: true,
    file: uploadedFile,
  });
});

/**
 * Upload multiple audio files
 */
router.post('/multiple', upload.array('audio', 10), async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    throw new ValidationError('errors.upload.failed', {
      component: 'FileUploader',
      action: 'multipleUpload',
    });
  }

  const results: {
    success: UploadedFile[];
    errors: { file: string; error: string }[];
  } = {
    success: [],
    errors: [],
  };

  // Process each file
  for (const file of files) {
    try {
      // Validate file
      const validation = validateFile(file);
      if (!validation.valid) {
        await deleteUploadedFile(file.path);
        results.errors.push({
          file: file.originalname,
          error: validation.error!,
        });
        continue;
      }

      // Process uploaded file
      const uploadedFile = await processUploadedFile(file);

      // Add to file manager
      await fileManager.addFile(uploadedFile);

      results.success.push(uploadedFile);
    } catch (error) {
      await deleteUploadedFile(file.path);
      results.errors.push({
        file: file.originalname,
        error: error instanceof Error ? error.message : tErrors('upload.processing.failed'),
      });
    }
  }

  res.json(results);
});

/**
 * Get all uploaded files
 */
router.get('/files', async (req: Request, res: Response) => {
  const files = fileManager.getAllFiles();
  res.json({ files });
});

/**
 * Get file by ID
 */
router.get('/files/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const file = fileManager.getFile(id);

  if (!file) {
    throw new NotFoundError('errors.api.notFound', {
      component: 'FileUploader',
      action: 'getFile',
    });
  }

  // Check if file still exists on disk
  const exists = await fileManager.fileExists(id);
  if (!exists) {
    throw new NotFoundError('errors.api.notFound', {
      component: 'FileUploader',
      action: 'getFile',
    });
  }

  res.json({ file });
});

/**
 * Delete file by ID
 */
router.delete('/files/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const success = await fileManager.removeFile(id);

  if (!success) {
    return res.status(404).json({ error: tErrors('upload.fileNotFound') });
  }

  res.json({ success: true });
});

/**
 * Search files
 */
router.get('/search', async (req: Request, res: Response) => {
  const { q } = req.query;

  if (!q || typeof q !== 'string') {
    return res.status(400).json({ error: tErrors('command.validation.required') });
  }

  const files = fileManager.searchFiles(q);
  res.json({ files });
});

/**
 * Get upload statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  const storageStats = fileManager.getStorageStats();
  const uploadDirInfo = await getUploadDirInfo();

  res.json({
    storage: storageStats,
    directory: uploadDirInfo,
  });
});

/**
 * Clean up files
 */
router.post('/cleanup', async (req: Request, res: Response) => {
  const { type } = req.body;

  let result = 0;

  switch (type) {
    case 'orphaned': {
      const path = await import('path');
      result = await fileManager.cleanupOrphanedFiles(path.join(process.cwd(), 'uploads', 'audio'));
      break;
    }
    case 'missing':
      result = await fileManager.cleanupMissingFiles();
      break;
    default:
      return res.status(400).json({ error: tErrors('command.validation.invalidChoice') });
  }

  res.json({
    success: true,
    cleaned: result,
    message: `Cleaned up ${result} files`,
  });
});

/**
 * Serve uploaded files
 */
router.get('/serve/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const file = fileManager.getFile(id);

  if (!file) {
    return res.status(404).json({ error: tErrors('upload.fileNotFound') });
  }

  // Check if file exists on disk
  const exists = await fileManager.fileExists(id);
  if (!exists) {
    return res.status(404).json({ error: tErrors('upload.fileNotFound') });
  }

  // Set appropriate headers
  res.setHeader('Content-Type', file.mimeType);
  res.setHeader('Content-Length', file.size);
  res.setHeader('Content-Disposition', `inline; filename="${file.originalName}"`);

  // Stream the file
  res.sendFile(file.filePath);
});

export default router.getRouter();
