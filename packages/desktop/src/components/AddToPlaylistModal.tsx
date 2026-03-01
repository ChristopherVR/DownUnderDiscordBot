import { useState, useEffect } from 'react';
import { api, type PlaylistSummary } from '@/lib/api';
import { ListMusic, Plus, Loader2, X, Check } from 'lucide-react';
import type { Track } from '@/stores/useBotStore';

interface Props {
  track: Track | null;
  open: boolean;
  onClose: () => void;
}

export default function AddToPlaylistModal({ track, open, onClose }: Props) {
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchPlaylists = async () => {
    setLoading(true);
    try {
      const res = await api.getPlaylists();
      setPlaylists(res.data ?? []);
    } catch {
      setPlaylists([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) {
      setAdded(new Set());
      setShowCreate(false);
      setNewName('');
      return;
    }
    fetchPlaylists();
  }, [open]);

  if (!open || !track) return null;

  const handleAdd = async (playlistId: string) => {
    if (!track) return;
    setAdding(playlistId);
    try {
      const url = track.url ?? track.filePath ?? '';
      if (!url) return;

      let platform = track.platform ?? 'unknown';
      const lowerUrl = url.toLowerCase();
      if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) platform = 'youtube';
      else if (lowerUrl.includes('spotify.com')) platform = 'spotify';
      else if (lowerUrl.includes('soundcloud.com')) platform = 'soundcloud';
      else if (track.filePath) platform = 'local';

      await api.addTrackToPlaylist(playlistId, {
        title: track.title,
        artist: track.artist,
        duration: track.duration,
        url,
        thumbnail: track.thumbnail,
        platform,
        filePath: track.filePath,
      });
      setAdded((prev) => new Set(prev).add(playlistId));
    } finally {
      setAdding(null);
    }
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const res = await api.createPlaylist(name);
      if (res.data?.id) {
        // Auto-add the track to the freshly created playlist
        await handleAdd(res.data.id);
        setNewName('');
        setShowCreate(false);
        await fetchPlaylists();
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border p-5 shadow-2xl"
        style={{ borderColor: 'var(--glass-border)', background: 'var(--surface)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-t-primary">Add to Playlist</h2>
          <button onClick={onClose} className="text-t-faint hover:text-t-secondary">
            <X size={16} />
          </button>
        </div>

        <div className="mb-3 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2">
          <p className="truncate text-[13px] font-medium text-t-secondary">{track.title}</p>
          <p className="truncate text-[11px] text-t-faint">{track.artist ?? 'Unknown'}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={20} className="animate-spin text-spotify-green" />
          </div>
        ) : playlists.length === 0 && !showCreate ? (
          <div className="py-6 text-center">
            <ListMusic size={28} className="mx-auto mb-2 text-t-ghost" />
            <p className="text-sm text-t-faint">No playlists yet</p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-spotify-green transition-colors hover:bg-spotify-green/10"
            >
              <Plus size={14} />
              Create a playlist
            </button>
          </div>
        ) : (
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {playlists.map((pl) => {
              const isAdded = added.has(pl.id);
              const isAdding = adding === pl.id;
              return (
                <button
                  key={pl.id}
                  onClick={() => !isAdded && handleAdd(pl.id)}
                  disabled={isAdding || isAdded}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all hover:bg-white/[0.04] disabled:opacity-50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-spotify-green/10 to-emerald-600/5">
                    <ListMusic size={16} className="text-spotify-green/50" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-t-secondary">{pl.name}</p>
                    <p className="text-[11px] text-t-faint">{pl.trackCount} tracks</p>
                  </div>
                  {isAdding ? (
                    <Loader2 size={14} className="animate-spin text-spotify-green" />
                  ) : isAdded ? (
                    <span className="text-[11px] font-medium text-spotify-green">Added</span>
                  ) : (
                    <Plus size={14} className="text-t-faint" />
                  )}
                </button>
              );
            })}

            {/* Inline create form or button */}
            {showCreate ? (
              <div className="flex items-center gap-2 px-3 py-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  placeholder="Playlist name..."
                  autoFocus
                  className="flex-1 rounded-lg border bg-transparent px-2.5 py-1.5 text-[13px] text-t-secondary outline-none placeholder:text-t-ghost focus:ring-1"
                  style={{ borderColor: 'var(--glass-border)', focusRingColor: 'var(--accent)' } as React.CSSProperties}
                />
                <button
                  onClick={handleCreate}
                  disabled={!newName.trim() || creating}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-spotify-green transition-colors hover:bg-spotify-green/10 disabled:opacity-40"
                >
                  {creating ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                </button>
                <button
                  onClick={() => { setShowCreate(false); setNewName(''); }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-t-faint transition-colors hover:text-t-secondary"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowCreate(true)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-t-faint transition-all hover:bg-white/[0.04] hover:text-t-secondary"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-dashed"
                  style={{ borderColor: 'var(--glass-border)' }}>
                  <Plus size={14} />
                </div>
                <span className="text-[13px] font-medium">New Playlist</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
