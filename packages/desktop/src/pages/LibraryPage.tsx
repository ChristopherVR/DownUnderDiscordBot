import { useState, useEffect } from 'react';
import { useBotStore, type Track } from '@/stores/useBotStore';
import { api } from '@/lib/api';
import { formatTime } from '@/lib/utils';
import { Music, FolderOpen, ListMusic, Clock, Play, Plus, Loader2 } from 'lucide-react';

type Tab = 'playlists' | 'history' | 'local';

interface Playlist {
  id: string;
  name: string;
  trackCount?: number;
}

interface HistoryEntry {
  title: string;
  artist?: string;
  url?: string;
  platform?: string;
  thumbnail?: string;
  playCount?: number;
}

export default function LibraryPage() {
  const [tab, setTab] = useState<Tab>('playlists');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [localFiles, setLocalFiles] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const play = useBotStore((s) => s.play);
  const addToQueue = useBotStore((s) => s.addToQueue);

  useEffect(() => {
    setLoading(true);
    const load = async () => {
      try {
        if (tab === 'playlists') {
          const data = (await api.getPlaylists()) as { data?: Playlist[] };
          setPlaylists(data.data ?? []);
        } else if (tab === 'history') {
          const data = (await api.getHistory()) as { data?: HistoryEntry[] };
          setHistory(data.data ?? []);
        } else {
          const data = (await api.getLocalFiles()) as { data?: Track[] };
          setLocalFiles(data.data ?? []);
        }
      } catch {
        // API may not be connected
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tab]);

  const tabs: { id: Tab; label: string; icon: typeof Music }[] = [
    { id: 'playlists', label: 'Playlists', icon: ListMusic },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'local', label: 'Local Files', icon: FolderOpen },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">Library</h1>

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-semibold uppercase tracking-wider transition-all ${
              tab === id
                ? 'bg-gradient-to-r from-spotify-green to-emerald-400 text-black shadow-glow-green'
                : 'border border-white/[0.06] bg-white/[0.03] text-white/40 hover:bg-white/[0.06] hover:text-white/60'
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
        playlists.length === 0 ? (
          <EmptyState icon={ListMusic} text="No playlists yet" sub="Use /playlist create in Discord" />
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {playlists.map((pl) => (
              <button
                key={pl.id}
                onClick={() => api.playPlaylist(pl.id)}
                className="card-glass-hover group flex flex-col gap-3 rounded-xl !p-4"
              >
                <div className="relative flex h-28 w-full items-center justify-center rounded-lg bg-gradient-to-br from-spotify-green/10 to-emerald-600/5">
                  <ListMusic size={36} className="text-spotify-green/50" />
                  <div className="absolute bottom-2 right-2 flex h-9 w-9 translate-y-2 items-center justify-center rounded-full bg-gradient-to-r from-spotify-green to-emerald-400 opacity-0 shadow-glow-green transition-all group-hover:translate-y-0 group-hover:opacity-100">
                    <Play size={16} fill="black" className="ml-0.5 text-black" />
                  </div>
                </div>
                <div className="text-left">
                  <p className="truncate text-[13px] font-semibold text-white/90">{pl.name}</p>
                  <p className="text-[11px] text-white/25">{pl.trackCount ?? 0} tracks</p>
                </div>
              </button>
            ))}
          </div>
        )
      )}

      {/* History */}
      {!loading && tab === 'history' && (
        history.length === 0 ? (
          <EmptyState icon={Clock} text="No play history" sub="Start playing some music!" />
        ) : (
          <div className="card-glass rounded-xl p-2">
            {history.map((entry, i) => (
              <div
                key={`${entry.url}-${i}`}
                className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all hover:bg-white/[0.04]"
              >
                {entry.thumbnail ? (
                  <img src={entry.thumbnail} alt="" className="h-10 w-10 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.05]">
                    <Music size={16} className="text-white/20" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-white/90">{entry.title}</p>
                  <p className="truncate text-[11px] text-white/30">{entry.artist ?? 'Unknown'}</p>
                </div>
                {entry.playCount && entry.playCount > 1 && (
                  <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] font-medium text-white/30">
                    {entry.playCount}x
                  </span>
                )}
                <button
                  onClick={() => play(entry.url ?? entry.title, entry.platform)}
                  className="rounded-full p-1.5 text-white/20 opacity-0 hover:text-white/60 group-hover:opacity-100"
                >
                  <Play size={14} />
                </button>
                <button
                  onClick={() => addToQueue(entry.url ?? entry.title)}
                  className="rounded-full p-1.5 text-white/20 opacity-0 hover:text-white/60 group-hover:opacity-100"
                >
                  <Plus size={14} />
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {/* Local Files */}
      {!loading && tab === 'local' && (
        localFiles.length === 0 ? (
          <EmptyState icon={FolderOpen} text="No local files found" sub="Configure music folders in Settings" />
        ) : (
          <div className="card-glass rounded-xl p-2">
            {localFiles.map((file, i) => (
              <div
                key={`${file.filePath}-${i}`}
                className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all hover:bg-white/[0.04]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.05]">
                  <Music size={16} className="text-white/20" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-white/90">{file.title}</p>
                  <p className="truncate text-[11px] text-white/30">{file.artist ?? 'Unknown'}</p>
                </div>
                <span className="text-[11px] tabular-nums text-white/20">
                  {file.duration ? formatTime(file.duration) : ''}
                </span>
                <button
                  onClick={() => play(file.filePath ?? file.title, 'local')}
                  className="rounded-full p-1.5 text-white/20 opacity-0 hover:text-white/60 group-hover:opacity-100"
                >
                  <Play size={14} />
                </button>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  text,
  sub,
}: {
  icon: typeof Music;
  text: string;
  sub: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20">
      <Icon size={40} className="text-white/10" />
      <p className="text-sm text-white/30">{text}</p>
      <p className="text-xs text-white/15">{sub}</p>
    </div>
  );
}
