import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, type PlaylistDetail, type PlaylistTrackItem } from '@/lib/api';
import { useBotStore, type Track } from '@/stores/useBotStore';
import { formatTime } from '@/lib/utils';
import {
  ArrowLeft,
  Play,
  Trash2,
  Music,
  Loader2,
  Pencil,
  Check,
  X,
  Plus,
  Globe,
  Lock,
} from 'lucide-react';

function platformLabel(platform: string) {
  switch (platform) {
    case 'youtube': return 'YouTube';
    case 'spotify': return 'Spotify';
    case 'soundcloud': return 'SoundCloud';
    case 'local': return 'Local';
    default: return platform;
  }
}

function platformColor(platform: string) {
  switch (platform) {
    case 'youtube': return 'text-red-400';
    case 'spotify': return 'text-spotify-green';
    case 'soundcloud': return 'text-orange-400';
    case 'local': return 'text-blue-400';
    default: return 'text-t-faint';
  }
}

export default function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const play = useBotStore((s) => s.play);
  const addToQueue = useBotStore((s) => s.addToQueue);

  const [playlist, setPlaylist] = useState<PlaylistDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [saving, setSaving] = useState(false);

  // Track search for adding tracks
  const [showAddTrack, setShowAddTrack] = useState(false);
  const [addQuery, setAddQuery] = useState('');
  const [addSearchResults, setAddSearchResults] = useState<Track[]>([]);
  const [addSearching, setAddSearching] = useState(false);

  const fetchPlaylist = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api.getPlaylist(id);
      setPlaylist(res.data);
    } catch {
      // Failed to load
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPlaylist();
  }, [fetchPlaylist]);

  const handlePlayAll = async () => {
    if (!id) return;
    await api.playPlaylist(id);
  };

  const handlePlayTrack = async (track: PlaylistTrackItem) => {
    await play(track.url, track.platform === 'local' ? 'local' : undefined);
  };

  const handleRemoveTrack = async (trackId: string) => {
    if (!id) return;
    await api.removeTrackFromPlaylist(id, trackId);
    await fetchPlaylist();
  };

  const handleSaveEdit = async () => {
    if (!id || !editName.trim()) return;
    setSaving(true);
    try {
      await api.updatePlaylist(id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      });
      await fetchPlaylist();
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = () => {
    if (!playlist) return;
    setEditName(playlist.name);
    setEditDescription(playlist.description ?? '');
    setEditing(true);
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm('Delete this playlist? This cannot be undone.')) return;
    await api.deletePlaylist(id);
    navigate('/library');
  };

  const handleSearchToAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addQuery.trim()) return;
    setAddSearching(true);
    try {
      const res = await api.search(addQuery.trim());
      const tracks = (res.data?.tracks ?? []) as Track[];
      setAddSearchResults(tracks);
    } catch {
      setAddSearchResults([]);
    } finally {
      setAddSearching(false);
    }
  };

  const handleAddTrackFromSearch = async (track: Track) => {
    if (!id) return;
    const url = track.url ?? track.filePath ?? '';
    if (!url) return;

    let platform = track.platform ?? 'unknown';
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) platform = 'youtube';
    else if (lowerUrl.includes('spotify.com')) platform = 'spotify';
    else if (lowerUrl.includes('soundcloud.com')) platform = 'soundcloud';

    await api.addTrackToPlaylist(id, {
      title: track.title,
      artist: track.artist,
      duration: track.duration,
      url,
      thumbnail: track.thumbnail,
      platform,
      filePath: track.filePath,
    });
    await fetchPlaylist();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-spotify-green" />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="py-20 text-center">
        <p className="text-t-faint">Playlist not found</p>
        <button onClick={() => navigate('/library')} className="btn-glass mt-4 text-sm">
          Back to Library
        </button>
      </div>
    );
  }

  const totalDuration = playlist.tracks.reduce((acc, t) => acc + t.duration, 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start gap-4">
        <button
          onClick={() => navigate('/library')}
          className="mt-1 rounded-lg p-2 text-t-faint transition-colors hover:bg-white/[0.06] hover:text-t-secondary"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex-1">
          {editing ? (
            <div className="flex flex-col gap-2">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="input-glass text-xl font-bold"
                placeholder="Playlist name"
              />
              <input
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="input-glass text-sm"
                placeholder="Description (optional)"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="btn-glass flex items-center gap-1.5 text-xs text-spotify-green"
                >
                  <Check size={12} /> Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="btn-glass flex items-center gap-1.5 text-xs text-t-tertiary"
                >
                  <X size={12} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-t-primary">{playlist.name}</h1>
                <button onClick={startEdit} className="text-t-faint hover:text-t-tertiary">
                  <Pencil size={14} />
                </button>
                {playlist.isPublic ? (
                  <span className="text-t-faint" aria-label="Public"><Globe size={14} /></span>
                ) : (
                  <span className="text-t-faint" aria-label="Private"><Lock size={14} /></span>
                )}
              </div>
              {playlist.description && (
                <p className="mt-1 text-sm text-t-tertiary">{playlist.description}</p>
              )}
              <p className="mt-1 text-xs text-t-faint">
                {playlist.trackCount} track{playlist.trackCount !== 1 ? 's' : ''}
                {totalDuration > 0 && ` \u00B7 ${formatTime(totalDuration)}`}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={handlePlayAll}
          disabled={playlist.tracks.length === 0}
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-spotify-green to-emerald-400 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-black shadow-glow-green transition-all hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
        >
          <Play size={14} fill="black" /> Play All
        </button>
        <button
          onClick={() => setShowAddTrack(!showAddTrack)}
          className="btn-glass flex items-center gap-2 text-xs"
        >
          <Plus size={14} /> Add Tracks
        </button>
        <button
          onClick={handleDelete}
          className="btn-glass flex items-center gap-2 text-xs text-red-400/70 hover:text-red-400"
        >
          <Trash2 size={14} /> Delete
        </button>
      </div>

      {/* Add Track Panel */}
      {showAddTrack && (
        <div className="card-glass mb-6 rounded-xl p-4">
          <h3 className="mb-3 text-sm font-semibold text-t-secondary">Add Tracks</h3>
          <form onSubmit={handleSearchToAdd} className="mb-3 flex gap-2">
            <input
              value={addQuery}
              onChange={(e) => setAddQuery(e.target.value)}
              placeholder="Search for a song or paste a URL..."
              className="input-glass flex-1"
            />
            <button
              type="submit"
              disabled={addSearching}
              className="btn-glass flex items-center gap-1.5 text-xs"
            >
              {addSearching ? <Loader2 size={12} className="animate-spin" /> : 'Search'}
            </button>
          </form>
          {addSearchResults.length > 0 && (
            <div className="max-h-60 space-y-1 overflow-y-auto">
              {addSearchResults.map((track, i) => (
                <div
                  key={`${track.url}-${i}`}
                  className="group flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-white/[0.04]"
                >
                  <div className="relative shrink-0">
                    {track.thumbnail ? (
                      <img src={track.thumbnail} alt="" className="h-8 w-8 rounded object-cover" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-white/[0.05]">
                        <Music size={12} className="text-t-faint" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-medium text-t-secondary">{track.title}</p>
                    <p className="truncate text-[10px] text-t-faint">{track.artist ?? 'Unknown'}</p>
                  </div>
                  <span className="text-[10px] text-t-faint">
                    {track.duration ? formatTime(track.duration) : ''}
                  </span>
                  <button
                    onClick={() => handleAddTrackFromSearch(track)}
                    className="rounded-full p-1.5 text-t-faint transition-colors hover:bg-white/[0.08] hover:text-spotify-green"
                    title="Add to playlist"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Track List */}
      {playlist.tracks.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <Music size={40} className="text-t-ghost" />
          <p className="text-sm text-t-faint">No tracks yet</p>
          <p className="text-xs text-t-ghost">
            Use the Add Tracks button above or <code>/playlist add</code> in Discord
          </p>
        </div>
      ) : (
        <div className="card-glass rounded-xl p-2">
          {/* Column headers */}
          <div className="flex items-center gap-3 border-b border-white/[0.04] px-3 py-2 text-[10px] font-medium uppercase tracking-widest text-t-faint">
            <span className="w-7 text-center">#</span>
            <span className="w-10" />
            <span className="flex-1">Title</span>
            <span className="w-20">Platform</span>
            <span className="w-14 text-right">Duration</span>
            <span className="w-16" />
          </div>

          {playlist.tracks.map((track, i) => (
            <div
              key={track.id}
              className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all hover:bg-white/[0.04]"
            >
              <span className="w-7 text-center text-xs tabular-nums text-t-faint group-hover:hidden">
                {i + 1}
              </span>
              <button
                onClick={() => handlePlayTrack(track)}
                className="hidden h-7 w-7 items-center justify-center text-t-primary group-hover:flex"
              >
                <Play size={14} fill="currentColor" />
              </button>

              <div className="relative shrink-0">
                {track.thumbnail ? (
                  <img src={track.thumbnail} alt="" className="h-10 w-10 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.05]">
                    <Music size={16} className="text-t-faint" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-t-primary">{track.title}</p>
                <p className="truncate text-[11px] text-t-faint">{track.artist ?? 'Unknown'}</p>
              </div>

              <span className={`w-20 text-[11px] font-medium ${platformColor(track.platform)}`}>
                {platformLabel(track.platform)}
              </span>

              <span className="w-14 text-right text-[11px] tabular-nums text-t-faint">
                {formatTime(track.duration)}
              </span>

              <div className="flex w-16 items-center justify-end gap-1">
                <button
                  onClick={() => addToQueue(track.url)}
                  className="rounded-full p-1.5 text-t-faint opacity-0 transition-all hover:text-t-secondary group-hover:opacity-100"
                  title="Add to queue"
                >
                  <Plus size={14} />
                </button>
                <button
                  onClick={() => handleRemoveTrack(track.id)}
                  className="rounded-full p-1.5 text-t-faint opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
                  title="Remove from playlist"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
