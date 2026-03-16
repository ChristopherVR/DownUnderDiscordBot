import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBotStore, type Track } from '@/stores/useBotStore';
import { api, type PlaylistSummary } from '@/lib/api';
import LocalLibraryView from '@/components/LocalLibraryView';
import DropZone from '@/components/DropZone';
import { Music, FolderOpen, FolderPlus, ListMusic, Play, Plus, Loader2, X, Monitor, Radio, Link2 } from 'lucide-react';

type Tab = 'playlists' | 'local';

export default function LibraryPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('playlists');
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [localFiles, setLocalFiles] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const playbackMode = useBotStore((s) => s.playbackMode);
  const setPlaybackMode = useBotStore((s) => s.setPlaybackMode);
  const botUser = useBotStore((s) => s.botUser);
  const musicFolders = useBotStore((s) => s.musicFolders);
  const addMusicFolder = useBotStore((s) => s.addMusicFolder);
  const removeMusicFolder = useBotStore((s) => s.removeMusicFolder);

  // Create playlist form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);

  // Scan local music folders via Tauri command
  const scanLocalFolders = async (folders: string[]): Promise<Track[]> => {
    if (folders.length === 0) return [];
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const allTracks: Track[] = [];
      for (const folder of folders) {
        try {
          const tracks = await invoke<
            Array<{
              file_path: string;
              file_name: string;
              title: string;
              artist: string;
              album?: string;
              duration?: number;
              size: number;
              media_type?: string;
            }>
          >('scan_music_folder', { path: folder });
          for (const t of tracks) {
            allTracks.push({
              title: t.title,
              artist: t.artist,
              album: t.album ?? undefined,
              duration: t.duration,
              filePath: t.file_path,
              fileName: t.file_name,
              platform: 'local',
              mediaType: (t.media_type as 'audio' | 'video') ?? 'audio',
            });
          }
        } catch {
          // Individual folder scan failed, continue with others
        }
      }
      return allTracks;
    } catch {
      // Not running in Tauri — cannot scan local files
      return [];
    }
  };

  const scanRef = useRef(scanLocalFolders);
  scanRef.current = scanLocalFolders;

  // Rescan helper that can be called from the watcher callback
  const rescanLocal = useCallback(async () => {
    const tracks = await scanRef.current(musicFolders);
    setLocalFiles(tracks);
  }, [musicFolders]);

  // Main tab-loading effect
  useEffect(() => {
    setLoading(true);
    const load = async () => {
      try {
        if (tab === 'playlists') {
          const data = await api.getPlaylists();
          setPlaylists(data.data ?? []);
        } else {
          // Scan local folders via Tauri
          const tracks = await scanLocalFolders(musicFolders);
          setLocalFiles(tracks);
        }
      } catch {
        // API may not be connected
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tab, musicFolders]);

  // Probe durations for local files that don't have one (e.g. video files or
  // formats lofty can't parse). We create a temporary Audio element per file,
  // wait for loadedmetadata, then patch the duration into state.
  useEffect(() => {
    const missing = localFiles.filter((f) => !f.duration && f.filePath);
    if (missing.length === 0) return;

    let cancelled = false;
    const probeDuration = (track: Track): Promise<{ filePath: string; duration: number } | null> =>
      new Promise((resolve) => {
        const url =
          track.platform === 'local' ? api.getLocalStreamUrl(track.filePath!) : api.getUploadStreamUrl(track.filePath!);
        const el = new Audio();
        const cleanup = () => {
          el.removeAttribute('src');
          el.load();
        };
        el.preload = 'metadata';
        const onMeta = () => {
          if (Number.isFinite(el.duration) && el.duration > 0) {
            resolve({ filePath: track.filePath!, duration: Math.floor(el.duration) });
          } else {
            resolve(null);
          }
          cleanup();
        };
        el.addEventListener('loadedmetadata', onMeta, { once: true });
        el.addEventListener(
          'error',
          () => {
            resolve(null);
            cleanup();
          },
          { once: true },
        );
        // Timeout so we don't hang forever on broken files
        setTimeout(() => {
          resolve(null);
          cleanup();
        }, 8000);
        el.src = url;
      });

    (async () => {
      // Probe in small batches to avoid overwhelming the browser/server
      const BATCH = 4;
      const patches = new Map<string, number>();
      for (let i = 0; i < missing.length; i += BATCH) {
        if (cancelled) return;
        const batch = missing.slice(i, i + BATCH);
        const results = await Promise.all(batch.map(probeDuration));
        for (const r of results) {
          if (r) patches.set(r.filePath, r.duration);
        }
      }
      if (cancelled || patches.size === 0) return;
      setLocalFiles((prev) =>
        prev.map((f) => (f.filePath && patches.has(f.filePath) ? { ...f, duration: patches.get(f.filePath) } : f)),
      );
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localFiles.length]); // re-run only when file count changes, not every render

  // File watcher: watch music folders and auto-refresh on changes
  useEffect(() => {
    if (musicFolders.length === 0) return;

    let unlisten: (() => void) | null = null;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const setup = async () => {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const { listen } = await import('@tauri-apps/api/event');

        // Start watching all music folders
        for (const folder of musicFolders) {
          try {
            await invoke('watch_folder', { path: folder });
          } catch {
            // Folder may not exist or already watched
          }
        }

        // Listen for change events with debounce
        unlisten = await listen<{
          kind: string;
          path: string;
          file_name: string;
          folder: string;
        }>('music-folder-changed', () => {
          // Debounce rapid changes (e.g. bulk file copies)
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            rescanLocal();
          }, 500);
        });
      } catch {
        // Not running in Tauri
      }
    };

    setup();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      if (unlisten) unlisten();

      // Unwatch all on cleanup
      (async () => {
        try {
          const { invoke } = await import('@tauri-apps/api/core');
          await invoke('unwatch_all');
        } catch {
          // Ignore
        }
      })();
    };
  }, [musicFolders, rescanLocal]);

  const handleAddFolder = async () => {
    try {
      // Try Tauri dialog first
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Music Folder',
      });
      if (selected && typeof selected === 'string') {
        addMusicFolder(selected);
      }
    } catch {
      // Fallback: prompt for path
      const path = window.prompt('Enter the full path to your music folder:');
      if (path?.trim()) {
        addMusicFolder(path.trim());
      }
    }
  };

  const tabs: { id: Tab; label: string; icon: typeof Music }[] = [
    { id: 'playlists', label: 'Playlists', icon: ListMusic },
    { id: 'local', label: 'Local Files', icon: FolderOpen },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-t-primary">Library</h1>

        {/* Playback target toggle */}
        <div className="flex items-center gap-0.5 rounded-xl border border-white/[0.06] bg-white/[0.03] p-1">
          <button
            onClick={() => setPlaybackMode('local')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-all ${
              playbackMode === 'local'
                ? 'bg-gradient-to-r from-spotify-green to-emerald-400 text-black shadow-lg shadow-spotify-green/20'
                : 'text-t-faint hover:text-t-secondary'
            }`}
          >
            <Monitor size={12} />
            Local
          </button>
          <button
            onClick={() => setPlaybackMode('bot')}
            disabled={!botUser}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-all disabled:cursor-not-allowed disabled:opacity-30 ${
              playbackMode === 'bot'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20'
                : 'text-t-faint hover:text-t-secondary'
            }`}
          >
            <Radio size={12} />
            Bot
          </button>
          <button
            onClick={() => setPlaybackMode('sync')}
            disabled={!botUser}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-all disabled:cursor-not-allowed disabled:opacity-30 ${
              playbackMode === 'sync'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-lg shadow-amber-500/20'
                : 'text-t-faint hover:text-t-secondary'
            }`}
          >
            <Link2 size={12} />
            Sync
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-semibold uppercase tracking-wider transition-all ${
              tab === id
                ? 'bg-gradient-to-r from-spotify-green to-emerald-400 text-black shadow-glow-green'
                : 'border border-white/[0.06] bg-white/[0.03] text-t-tertiary hover:bg-white/[0.06] hover:text-t-secondary'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-spotify-green" />
        </div>
      )}

      {/* Playlists */}
      {!loading && tab === 'playlists' && (
        <div>
          {/* Create playlist button / form */}
          <div className="mb-4">
            {showCreateForm ? (
              <div className="card-glass rounded-xl p-4">
                <h3 className="mb-3 text-sm font-semibold text-t-secondary">New Playlist</h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newName.trim() || creating) return;
                    setCreating(true);
                    try {
                      await api.createPlaylist(newName.trim(), newDescription.trim() || undefined);
                      const data = await api.getPlaylists();
                      setPlaylists(data.data ?? []);
                      setShowCreateForm(false);
                      setNewName('');
                      setNewDescription('');
                    } finally {
                      setCreating(false);
                    }
                  }}
                  className="flex flex-col gap-2"
                >
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Playlist name"
                    className="input-glass"
                    autoFocus
                  />
                  <input
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Description (optional)"
                    className="input-glass"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={!newName.trim() || creating}
                      className="btn-glass flex items-center gap-1.5 text-xs text-spotify-green disabled:opacity-40"
                    >
                      {creating ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateForm(false);
                        setNewName('');
                        setNewDescription('');
                      }}
                      className="btn-glass text-xs text-t-tertiary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <button onClick={() => setShowCreateForm(true)} className="btn-glass flex items-center gap-2 text-xs">
                <Plus size={14} /> Create Playlist
              </button>
            )}
          </div>

          {playlists.length === 0 && !showCreateForm ? (
            <EmptyState
              icon={ListMusic}
              text="No playlists yet"
              sub="Create one above or use /playlist create in Discord"
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {playlists.map((pl) => (
                <div
                  key={pl.id}
                  className="card-glass-hover group flex cursor-pointer flex-col gap-3 rounded-xl !p-4"
                  onClick={() => navigate(`/library/playlist/${pl.id}`)}
                >
                  <div className="relative flex h-28 w-full items-center justify-center rounded-lg bg-gradient-to-br from-spotify-green/10 to-emerald-600/5">
                    <ListMusic size={36} className="text-spotify-green/50" />
                    <div className="absolute bottom-2 right-2 flex h-9 w-9 translate-y-2 items-center justify-center rounded-full bg-gradient-to-r from-spotify-green to-emerald-400 opacity-0 shadow-glow-green transition-all group-hover:translate-y-0 group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          api.playPlaylist(pl.id);
                        }}
                        className="flex h-full w-full items-center justify-center"
                      >
                        <Play size={16} fill="black" className="ml-0.5 text-black" />
                      </button>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="truncate text-[13px] font-semibold text-t-primary">{pl.name}</p>
                    {pl.description && <p className="truncate text-[11px] text-t-ghost">{pl.description}</p>}
                    <p className="text-[11px] text-t-faint">{pl.trackCount ?? 0} tracks</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Local Files */}
      {!loading && tab === 'local' && (
        <DropZone
          onDrop={async (paths) => {
            // Separate folders from individual files
            // Folders get added to musicFolders; individual files
            // are resolved and merged into localFiles.
            try {
              const { invoke } = await import('@tauri-apps/api/core');

              const folders: string[] = [];
              const files: string[] = [];

              for (const p of paths) {
                // Ask Rust if the path is a directory
                try {
                  const isDir = await invoke<boolean>('is_directory', { path: p });
                  if (isDir) {
                    folders.push(p);
                  } else {
                    files.push(p);
                  }
                } catch {
                  files.push(p);
                }
              }

              // Add folders to the music folders list (triggers rescan)
              for (const folder of folders) {
                addMusicFolder(folder);
              }

              // Resolve individual files and merge into localFiles
              if (files.length > 0) {
                const resolved = await invoke<
                  Array<{
                    file_path: string;
                    file_name: string;
                    title: string;
                    artist: string;
                    album?: string;
                    duration?: number;
                    size: number;
                    media_type?: string;
                  }>
                >('resolve_dropped_paths', { paths: files });

                if (resolved.length > 0) {
                  const newTracks: Track[] = resolved.map((t) => ({
                    title: t.title,
                    artist: t.artist,
                    album: t.album ?? undefined,
                    duration: t.duration,
                    filePath: t.file_path,
                    fileName: t.file_name,
                    platform: 'local',
                    mediaType: (t.media_type as 'audio' | 'video') ?? 'audio',
                  }));

                  // Merge without duplicates
                  setLocalFiles((prev) => {
                    const existing = new Set(prev.map((f) => f.filePath));
                    const unique = newTracks.filter((t) => !existing.has(t.filePath));
                    return [...prev, ...unique];
                  });
                }
              }
            } catch {
              // Not in Tauri or invoke failed
            }
          }}
        >
          {/* Folder management */}
          <div className="mb-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[11px] font-semibold uppercase tracking-widest text-t-faint">Music Folders</h2>
              <button
                onClick={handleAddFolder}
                className="btn-glass flex items-center gap-1.5 !py-1.5 !px-3 text-[11px]"
              >
                <FolderPlus size={13} />
                Add Folder
              </button>
            </div>

            {musicFolders.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {musicFolders.map((folder) => (
                  <div
                    key={folder}
                    className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5"
                  >
                    <FolderOpen size={12} className="shrink-0 text-accent/60" />
                    <span className="max-w-[200px] truncate text-[11px] text-t-tertiary" title={folder}>
                      {folder.split(/[\\/]/).pop() || folder}
                    </span>
                    <button
                      onClick={() => removeMusicFolder(folder)}
                      className="shrink-0 text-t-faint transition-colors hover:text-red-400"
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Categorized library view */}
          <LocalLibraryView localFiles={localFiles} playbackMode={playbackMode} />
        </DropZone>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, text, sub }: { icon: typeof Music; text: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20">
      <Icon size={40} className="text-t-ghost" />
      <p className="text-sm text-t-faint">{text}</p>
      <p className="text-xs text-t-ghost">{sub}</p>
    </div>
  );
}
