import { useState, useEffect, useRef, useCallback, type DragEvent, type ReactNode } from 'react';
import { Upload, FileAudio, FileVideo, FolderOpen } from 'lucide-react';
import { registerDragDropHandler } from '@/platform';

/** Accepted audio + video extensions */
const AUDIO_EXTENSIONS = new Set(['.mp3', '.flac', '.wav', '.ogg', '.m4a', '.aac', '.wma', '.opus', '.webm']);
const VIDEO_EXTENSIONS = new Set(['.mp4', '.mkv', '.avi', '.mov', '.flv', '.ogv', '.3gp']);
const ALL_MEDIA_EXTENSIONS = new Set([...AUDIO_EXTENSIONS, ...VIDEO_EXTENSIONS]);

function getExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot).toLowerCase() : '';
}

function isMediaFile(name: string): boolean {
  return ALL_MEDIA_EXTENSIONS.has(getExtension(name));
}

interface DropZoneProps {
  children: ReactNode;
  className?: string;
  /**
   * Called with the list of dropped filesystem paths (files and/or folders).
   * The parent component decides what to do with them (e.g. add to library).
   */
  onDrop: (paths: string[]) => void;
}

/**
 * Scoped drag-and-drop zone for the Local Files section.
 * Shows an overlay only when external files/folders are dragged over this area.
 *
 * Primary path:  Tauri's native `onDragDropEvent` (Tauri v2)
 * Fallback path: Browser drag-and-drop events (dev mode / non-Tauri)
 */
export default function DropZone({ children, className, onDrop }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounter = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Stable ref so the Tauri listener always calls the latest callback
  const onDropRef = useRef(onDrop);
  onDropRef.current = onDrop;

  // Track whether the current Tauri drag contains real files
  const hasFilePaths = useRef(false);

  /** Check whether a screen-level position is inside the DropZone element */
  const isInsideBounds = useCallback((x: number, y: number): boolean => {
    const el = containerRef.current;
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }, []);

  // ──────────────────────────────────────────────────────────────
  //  PRIMARY: Tauri native drag-and-drop (window-level)
  // ──────────────────────────────────────────────────────────────
  const [usingTauriDnd, setUsingTauriDnd] = useState(false);

  useEffect(() => {
    let sub: { tauri: boolean; unlisten: () => void } | null = null;

    (async () => {
      sub = await registerDragDropHandler((payload) => {
        if (payload.kind === 'enter') {
          hasFilePaths.current = payload.paths.length > 0;
          if (hasFilePaths.current) {
            setIsDragOver(payload.position ? isInsideBounds(payload.position.x, payload.position.y) : true);
          }
        } else if (payload.kind === 'over') {
          if (hasFilePaths.current) {
            setIsDragOver(payload.position ? isInsideBounds(payload.position.x, payload.position.y) : true);
          }
        } else if (payload.kind === 'leave') {
          hasFilePaths.current = false;
          setIsDragOver(false);
        } else if (payload.kind === 'drop') {
          hasFilePaths.current = false;
          setIsDragOver(false);
          if (payload.paths.length > 0) onDropRef.current(payload.paths);
        }
      });
      setUsingTauriDnd(sub.tauri);
    })();

    return () => {
      sub?.unlisten();
    };
  }, [isInsideBounds]);

  // ──────────────────────────────────────────────────────────────
  //  FALLBACK: Browser drag-and-drop (non-Tauri / dev mode)
  //  Only activates for external file drops (checks dataTransfer types).
  // ──────────────────────────────────────────────────────────────
  const hasFiles = (e: DragEvent) => e.dataTransfer?.types?.includes('Files') ?? false;

  const handleDragEnter = useCallback(
    (e: DragEvent) => {
      if (usingTauriDnd || !hasFiles(e)) return;
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current++;
      if (dragCounter.current === 1) setIsDragOver(true);
    },
    [usingTauriDnd],
  );

  const handleDragLeave = useCallback(
    (e: DragEvent) => {
      if (usingTauriDnd) return;
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current--;
      if (dragCounter.current <= 0) {
        dragCounter.current = 0;
        setIsDragOver(false);
      }
    },
    [usingTauriDnd],
  );

  const handleDragOver = useCallback(
    (e: DragEvent) => {
      if (usingTauriDnd || !hasFiles(e)) return;
      e.preventDefault();
      e.stopPropagation();
    },
    [usingTauriDnd],
  );

  const handleDrop = useCallback(
    async (e: DragEvent) => {
      if (usingTauriDnd) return;
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
      setIsDragOver(false);

      // Collect paths from dropped items
      const paths: string[] = [];

      if (e.dataTransfer.items) {
        const entries: FileSystemEntry[] = [];
        for (let i = 0; i < e.dataTransfer.items.length; i++) {
          const item = e.dataTransfer.items[i];
          const entry = item.webkitGetAsEntry?.();
          if (entry) entries.push(entry);
        }
        // For directories, pass the directory path (name) directly
        // For files, collect their paths
        for (const entry of entries) {
          if (entry.isDirectory) {
            // In browser context, we only have the name, not real path
            // but Tauri's File objects have a .path property
            const file = e.dataTransfer.files[0];
            const filePath = (file as File & { path?: string }).path;
            if (filePath) {
              // Derive parent dir from first file
              paths.push(entry.fullPath || entry.name);
            }
          }
        }

        // Also collect individual file paths
        for (let i = 0; i < e.dataTransfer.files.length; i++) {
          const file = e.dataTransfer.files[i];
          const filePath = (file as File & { path?: string }).path ?? file.name;
          if (isMediaFile(file.name)) {
            paths.push(filePath);
          }
        }
      } else {
        for (let i = 0; i < e.dataTransfer.files.length; i++) {
          const file = e.dataTransfer.files[i];
          const filePath = (file as File & { path?: string }).path ?? file.name;
          if (isMediaFile(file.name)) {
            paths.push(filePath);
          }
        }
      }

      if (paths.length > 0) {
        onDropRef.current(paths);
      }
    },
    [usingTauriDnd],
  );

  return (
    <div
      ref={containerRef}
      className={`relative ${className ?? ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}

      {/* Overlay shown while dragging external files over this area */}
      {isDragOver && (
        <div className="pointer-events-none absolute inset-0 z-[100] flex items-center justify-center rounded-xl border-2 border-dashed border-spotify-green/50 bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 animate-pulse rounded-full bg-spotify-green/20 blur-2xl" />
              <Upload size={40} className="relative text-spotify-green" />
            </div>
            <p className="text-base font-semibold text-t-primary">Drop to add to library</p>
            <div className="flex items-center gap-4 text-[12px] text-t-tertiary">
              <span className="flex items-center gap-1.5">
                <FileAudio size={13} />
                Audio
              </span>
              <span className="flex items-center gap-1.5">
                <FileVideo size={13} />
                Video
              </span>
              <span className="flex items-center gap-1.5">
                <FolderOpen size={13} />
                Folders
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
