import { useState } from 'react';
import { useBotStore, type Track } from '@/stores/useBotStore';
import { formatTime } from '@/lib/utils';
import { Search, Play, Plus, Loader2, Music } from 'lucide-react';

const platforms = [
  { value: 'auto', label: 'All' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'spotify', label: 'Spotify' },
  { value: 'soundcloud', label: 'SoundCloud' },
];

function SearchResult({
  track,
  index,
  onPlay,
  onQueue,
}: {
  track: Track;
  index: number;
  onPlay: () => void;
  onQueue: () => void;
}) {
  return (
    <div className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all hover:bg-white/[0.04]">
      <span className="w-7 text-center text-xs tabular-nums text-white/20 group-hover:hidden">
        {index + 1}
      </span>
      <button
        onClick={onPlay}
        className="hidden h-7 w-7 items-center justify-center text-white group-hover:flex"
      >
        <Play size={14} fill="white" />
      </button>
      <div className="relative shrink-0">
        {track.thumbnail ? (
          <img src={track.thumbnail} alt="" className="h-10 w-10 rounded-lg object-cover" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.05]">
            <Music size={16} className="text-white/20" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-white/90">{track.title}</p>
        <p className="truncate text-[11px] text-white/35">{track.artist ?? 'Unknown'}</p>
      </div>
      <span className="text-[11px] tabular-nums text-white/20">
        {track.duration ? formatTime(track.duration) : ''}
      </span>
      <button
        onClick={onQueue}
        className="rounded-full p-1.5 text-white/20 opacity-0 transition-all hover:bg-white/[0.08] hover:text-white/60 group-hover:opacity-100"
        title="Add to queue"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState('auto');
  const results = useBotStore((s) => s.searchResults);
  const loading = useBotStore((s) => s.searchLoading);
  const search = useBotStore((s) => s.search);
  const play = useBotStore((s) => s.play);
  const addToQueue = useBotStore((s) => s.addToQueue);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) search(query.trim(), platform);
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">Search</h1>

      {/* Search form */}
      <form onSubmit={handleSearch} className="mb-8 flex gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What do you want to listen to?"
            className="input-glass !rounded-xl !pl-10"
          />
        </div>
        <div className="flex gap-1 rounded-xl border border-white/[0.06] bg-white/[0.03] p-1">
          {platforms.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPlatform(p.value)}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-all ${
                platform === p.value
                  ? 'bg-gradient-to-r from-spotify-green to-emerald-400 text-black shadow-glow-green'
                  : 'text-white/30 hover:text-white/60'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <button
          type="submit"
          disabled={!query.trim() || loading}
          className="btn-primary disabled:opacity-40 disabled:shadow-none"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          Search
        </button>
      </form>

      {/* Results */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-spotify-green" />
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="card-glass rounded-xl p-2">
          <h2 className="mb-1 px-3 py-2 text-[11px] font-semibold uppercase tracking-widest text-white/30">
            Results ({results.length})
          </h2>
          {results.map((track, i) => (
            <SearchResult
              key={`${track.url ?? track.title}-${i}`}
              track={track}
              index={i}
              onPlay={() => play(track.url ?? track.title, track.platform)}
              onQueue={() => addToQueue(track.url ?? track.title)}
            />
          ))}
        </div>
      )}

      {!loading && results.length === 0 && query && (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <Search size={40} className="text-white/10" />
          <p className="text-sm text-white/30">No results found</p>
        </div>
      )}

      {!query && results.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <Search size={40} className="text-white/10" />
          <p className="text-sm text-white/30">Search for tracks across platforms</p>
        </div>
      )}
    </div>
  );
}
