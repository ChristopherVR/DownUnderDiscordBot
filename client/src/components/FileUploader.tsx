import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, X, CheckCircle, AlertCircle, File, Music, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { FileUploadProgress, UploadedFile } from 'discord-dashboard-shared';
import { useErrorHandling } from '@/hooks/useErrorHandling';
import { ErrorDisplay } from '@/components/ui/error-display';

interface FileUploadItem extends FileUploadProgress {
  file: File;
}

interface FileUploaderProps {
  className?: string;
  onUploadComplete?: (files: UploadedFile[]) => void;
  maxFileSize?: number; // in MB
  acceptedFormats?: string[];
}

const DEFAULT_ACCEPTED_FORMATS = ['.mp3', '.wav', '.flac', '.ogg', '.m4a'];
const DEFAULT_MAX_FILE_SIZE = 50; // 50MB
const API_BASE_URL = ((typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL)
  ? String(import.meta.env.VITE_API_URL)
  : typeof window !== 'undefined' && window.location
    ? window.location.origin
    : 'http://localhost:3000').replace(/\/$/, '');

export default function FileUploader({
  className,
  onUploadComplete,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  acceptedFormats = DEFAULT_ACCEPTED_FORMATS,
}: FileUploaderProps) {
  const { t } = useTranslation();
  const { error, isRetrying, retry, clearError, withErrorHandling } = useErrorHandling({
    component: 'FileUploader',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploads, setUploads] = useState<FileUploadItem[]>([]);

  // File validation
  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file size
      const maxSizeBytes = maxFileSize * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        return t('errors.upload.fileTooBig', { maxSize: maxFileSize });
      }

      // Check file format
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!acceptedFormats.includes(fileExtension)) {
        return t('errors.upload.invalidFormat', { formats: acceptedFormats.join(', ') });
      }

      return null;
    },
    [maxFileSize, acceptedFormats, t],
  );

  // Format file size
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // Upload file to server
  const uploadFile = useCallback(
    async (file: File, uploadId: string) => {
      await withErrorHandling(
        async () => {
          const formData = new FormData();
          formData.append('audio', file);

          // Update status to uploading
          setUploads((prev) =>
            prev.map((upload) =>
              upload.fileId === uploadId ? { ...upload, status: 'uploading', progress: 0 } : upload,
            ),
          );

          const xhr = new XMLHttpRequest();

          // Track upload progress
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const progress = Math.round((e.loaded / e.total) * 100);
              setUploads((prev) =>
                prev.map((upload) => (upload.fileId === uploadId ? { ...upload, progress } : upload)),
              );
            }
          });

          // Handle completion
          xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
              try {
                const response = JSON.parse(xhr.responseText) as { file?: UploadedFile; data?: UploadedFile };
                const uploaded = response.file ?? response.data;

                if (!uploaded) {
                  setUploads((prev) =>
                    prev.map((upload) =>
                      upload.fileId === uploadId
                        ? { ...upload, status: 'error', error: 'Invalid server response' }
                        : upload,
                    ),
                  );
                  return;
                }

                setUploads((prev) =>
                  prev.map((upload) =>
                    upload.fileId === uploadId ? { ...upload, status: 'complete', progress: 100 } : upload,
                  ),
                );

                onUploadComplete?.([uploaded]);
              } catch {
                setUploads((prev) =>
                  prev.map((upload) =>
                    upload.fileId === uploadId
                      ? { ...upload, status: 'error', error: 'Invalid server response' }
                      : upload,
                  ),
                );
              }
            } else {
              let message = `Upload failed: ${xhr.statusText}`;

              try {
                const response = JSON.parse(xhr.responseText) as { error?: unknown };
                if (response && typeof response === 'object' && 'error' in response) {
                  message = String(response.error ?? message);
                }
              } catch {
                // ignore parse errors
              }

              setUploads((prev) =>
                prev.map((upload) =>
                  upload.fileId === uploadId
                    ? { ...upload, status: 'error', error: message }
                    : upload,
                ),
              );
            }
          });

          // Handle errors
          xhr.addEventListener('error', () => {
            setUploads((prev) =>
              prev.map((upload) =>
                upload.fileId === uploadId ? { ...upload, status: 'error', error: 'Network error' } : upload,
              ),
            );
          });

          xhr.open('POST', `${API_BASE_URL}/api/upload/single`);
          xhr.send(formData);
        },
        { action: 'uploadFile', metadata: { fileName: file.name } },
      );
    },
    [onUploadComplete, withErrorHandling],
  );

  // Handle file selection
  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const newUploads: FileUploadItem[] = [];

      fileArray.forEach((file) => {
        const validationError = validateFile(file);
        const uploadId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        if (validationError) {
          newUploads.push({
            fileId: uploadId,
            file,
            progress: 0,
            status: 'error',
            error: validationError,
          });
        } else {
          newUploads.push({
            fileId: uploadId,
            file,
            progress: 0,
            status: 'uploading',
          });
        }
      });

      setUploads((prev) => [...prev, ...newUploads]);

      // Start uploads for valid files
      newUploads.forEach((upload) => {
        if (upload.status === 'uploading') {
          uploadFile(upload.file, upload.fileId);
        }
      });
    },
    [validateFile, uploadFile],
  );

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFiles(files);
      }
    },
    [handleFiles],
  );

  // File input handler
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFiles(files);
      }
      // Reset input value to allow selecting the same file again
      e.target.value = '';
    },
    [handleFiles],
  );

  // Remove upload item
  const removeUpload = useCallback((uploadId: string) => {
    setUploads((prev) => prev.filter((upload) => upload.fileId !== uploadId));
  }, []);

  // Retry upload
  const retryUpload = useCallback(
    (uploadId: string) => {
      const upload = uploads.find((u) => u.fileId === uploadId);
      if (upload) {
        uploadFile(upload.file, uploadId);
      }
    },
    [uploads, uploadFile],
  );

  // Clear completed uploads
  const clearCompleted = useCallback(() => {
    setUploads((prev) => prev.filter((upload) => upload.status !== 'complete'));
  }, []);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {t('musicPlayer.upload.title')}
          {uploads.some((u) => u.status === 'complete') && (
            <Button variant="outline" size="sm" onClick={clearCompleted}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Clear Completed
            </Button>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error Display */}
        {error && (
          <ErrorDisplay
            error={error}
            onRetry={() => retry()}
            onDismiss={clearError}
            isRetrying={isRetrying}
            variant="inline"
            context={{ component: 'FileUploader' }}
          />
        )}

        {/* Drop Zone */}
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
            isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50',
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <div className="space-y-2">
            <p className="text-lg font-medium">{t('musicPlayer.dragDrop')}</p>
            <p className="text-sm text-muted-foreground">{t('musicPlayer.supportedFormats')}</p>
            <p className="text-xs text-muted-foreground">{t('musicPlayer.upload.maxSize', { size: maxFileSize })}</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedFormats.join(',')}
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>

        {/* Upload List */}
        {uploads.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">
              {t('musicPlayer.upload.progress')} ({uploads.length})
            </h4>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {uploads.map((upload) => (
                <div key={upload.fileId} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0">
                    {upload.status === 'complete' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : upload.status === 'error' ? (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <Music className="h-5 w-5 text-blue-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">{upload.file.name}</p>
                      <span className="text-xs text-muted-foreground">{formatFileSize(upload.file.size)}</span>
                    </div>

                    {upload.status === 'uploading' && (
                      <div className="mt-1">
                        <Progress value={upload.progress} className="h-1" />
                        <p className="text-xs text-muted-foreground mt-1">{upload.progress}% uploaded</p>
                      </div>
                    )}

                    {upload.status === 'error' && upload.error && (
                      <p className="text-xs text-red-500 mt-1">{upload.error}</p>
                    )}

                    {upload.status === 'complete' && (
                      <p className="text-xs text-green-500 mt-1">{t('musicPlayer.upload.complete')}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {upload.status === 'error' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => retryUpload(upload.fileId)}
                        title={t('musicPlayer.upload.retry')}
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeUpload(upload.fileId)}
                      title={upload.status === 'uploading' ? t('musicPlayer.upload.cancel') : t('common.delete')}
                    >
                      {upload.status === 'uploading' ? <X className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}



