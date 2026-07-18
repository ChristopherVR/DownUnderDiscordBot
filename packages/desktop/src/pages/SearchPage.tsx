import { useState, useCallback } from 'react';
import { useBotStore, type Track } from '@/stores/useBotStore';
import { formatTime } from '@/lib/utils';
import {
  Search,
  Plus,
  Loader2,
  Music,
  ListPlus,
  Headphones,
  HardDrive,
  Square,
  ChevronDown,
  PlaySquare,
  Music2,
  Cloud,
  Apple,
  Play,
} from 'lucide-react';
import AddToPlaylistModal from '@/components/AddToPlaylistModal';

const platforms = [
  { value: 'auto', label: 'All Platforms' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'spotify', label: 'Spotify' },
  { value: 'soundcloud', label: 'SoundCloud' },
  { value: 'applemusic', label: 'Apple Music' },
  { value: 'local', label: 'Local Files' },
];

/** Platform badge config: label, background color, text color, icon */
const platformBadgeConfig: Record<
  string,
  { label: string; bg: string; text: string; icon: React.ComponentType<{ size?: number }> }
> = {
  youtube: { label: 'YouTube', bg: 'bg-red-600', text: 'text-white', icon: PlaySquare },
  spotify: { label: 'Spotify', bg: 'bg-green-600', text: 'text-white', icon: Music2 },
  soundcloud: { label: 'SoundCloud', bg: 'bg-orange-500', text: 'text-white', icon: Cloud },
  applemusic: { label: 'Apple Music', bg: 'bg-pink-500', text: 'text-white', icon: Apple },
  local: { label: 'Local', bg: 'bg-emerald-600', text: 'text-white', icon: HardDrive },
};

function SearchResult({
  track,
  index,
  isPreviewingThis,
  onPlay,
  onQueue,
  onAddToPlaylist,
  onPreview,
  onStopPreview,
}: {
  track: Track;
  index: number;
  isPreviewingThis: boolean;
  onPlay: () => void;
  onQueue: () => void;
  onAddToPlaylist: () => void;
  onPreview: () => void;
  onStopPreview: () => void;
}) {
  const isLocal = track.platform === 'local';

  return (
    <div
      data-testid="search-result-row"
      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all"
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--nav-hover-bg)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Index / preview toggle */}
      <span className="w-7 text-center text-xs tabular-nums text-t-ghost group-hover:hidden">{index + 1}</span>
      <button
        onClick={isPreviewingThis ? onStopPreview : onPreview}
        className="hidden h-7 w-7 items-center justify-center group-hover:flex"
        style={{ color: isPreviewingThis ? 'var(--accent)' : 'var(--text-primary)' }}
        title={isPreviewingThis ? 'Stop preview' : 'Preview'}
      >
        {isPreviewingThis ? <Square size={12} fill="currentColor" /> : <Headphones size={14} />}
      </button>

      {/* Thumbnail */}
      <div className="relative shrink-0">
        {track.thumbnail ? (
          <img src={track.thumbnail} alt="" className="h-10 w-10 rounded-lg object-cover" />
        ) : (
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ background: 'var(--glass-bg-md)' }}
          >
            {isLocal ? <HardDrive size={16} className="text-t-ghost" /> : <Music size={16} className="text-t-ghost" />}
          </div>
        )}
        {track.platform &&
          platformBadgeConfig[track.platform] &&
          (() => {
            const badge = platformBadgeConfig[track.platform!];
            const Icon = badge.icon;
            return (
              <div
                className={`absolute -bottom-0.5 -right-0.5 flex items-center gap-0.5 rounded px-1 py-px text-[8px] font-bold ${badge.bg} ${badge.text}`}
              >
                <Icon size={8} />
                {badge.label}
              </div>
            );
          })()}
        {!track.platform && isLocal && (
          <div className="absolute -bottom-0.5 -right-0.5 rounded bg-emerald-600 px-1 py-px text-[8px] font-bold text-white">
            LOCAL
          </div>
        )}
      </div>

      {/* Track info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-t-primary">{track.title}</p>
        <p className="truncate text-[11px] text-t-faint">{track.artist ?? 'Unknown'}</p>
      </div>

      {/* Duration */}
      <span className="text-[11px] tabular-nums text-t-ghost">{track.duration ? formatTime(track.duration) : ''}</span>

      {/* Action buttons — visible on hover */}
      <div className="flex items-center gap-0.5 opacity-0 transition-all group-hover:opacity-100">
        {/* Play */}
        <button
          onClick={onPlay}
          className="rounded-full p-1.5 text-t-ghost transition-colors hover:text-spotify-green"
          title="Play"
        >
          <Play size={14} />
        </button>

        {/* Add to playlist */}
        <button
          onClick={onAddToPlaylist}
          className="rounded-full p-1.5 text-t-ghost transition-colors hover:text-t-secondary"
          title="Add to playlist"
        >
          <Plus size={14} />
        </button>

        {/* Add to queue */}
        <button
          onClick={onQueue}
          className="rounded-full p-1.5 text-t-ghost transition-colors hover:text-t-secondary"
          title="Add to queue"
        >
          <ListPlus size={14} />
        </button>
      </div>
    </div>
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState('auto');
  const results = useBotStore((s) => s.searchResults);
  const loading = useBotStore((s) => s.searchLoading);
  const search = useBotStore((s) => s.search);
  const playLocally = useBotStore((s) => s.playLocally);
  const playOnBot = useBotStore((s) => s.playOnBot);
  const queueOnBot = useBotStore((s) => s.queueOnBot);
  const queueLocally = useBotStore((s) => s.queueLocally);
  const playbackMode = useBotStore((s) => s.playbackMode);
  const startPreview = useBotStore((s) => s.startPreview);
  const stopPreview = useBotStore((s) => s.stopPreview);
  const previewTrack = useBotStore((s) => s.previewTrack);

  // Add-to-playlist modal
  const [playlistModalTrack, setPlaylistModalTrack] = useState<Track | null>(null);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        stopPreview();
        search(query.trim(), platform);
      }
    },
    [query, platform, search, stopPreview],
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-t-primary">Search</h1>
        <p className="mt-1 text-[12px] text-t-faint">Find tracks across platforms and your local library</p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} className="mb-8 flex gap-3">
        {/* Platform dropdown */}
        <div className="relative shrink-0">
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="h-full appearance-none rounded-xl border py-2 pl-3 pr-8 text-[12px] font-medium text-t-secondary outline-none transition-colors focus:ring-1"
            style={{
              background: 'var(--glass-bg)',
              borderColor: 'var(--glass-border)',
            }}
          >
            {platforms.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={12}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-t-ghost"
          />
        </div>

        {/* Search input */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-t-faint" />
          <input
            type="text"
            data-testid="search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What do you want to listen to?"
            className="input-glass !rounded-xl !pl-10"
          />
        </div>

        <button
          type="submit"
          data-testid="search-submit"
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
          <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent)' }} />
        </div>
      )}

      {!loading && results.length > 0 && (
        <div data-testid="search-results" className="card-glass rounded-xl p-2">
          <div className="mb-1 flex items-center justify-between px-3 py-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-t-faint">
              Results ({results.length})
            </h2>
            <div className="flex gap-3 text-[10px] text-t-ghost">
              <span className="flex items-center gap-1">
                <Headphones size={10} /> Preview
              </span>
            </div>
          </div>
          {results.map((track, i) => (
            <SearchResult
              key={`${track.url ?? track.filePath ?? track.title}-${i}`}
              track={track}
              index={i}
              isPreviewingThis={
                previewTrack !== null &&
                previewTrack.title === track.title &&
                (previewTrack.url === track.url || previewTrack.filePath === track.filePath)
              }
              onPlay={() => {
                if (playbackMode === 'local') playLocally(track);
                else if (playbackMode === 'bot') playOnBot(track);
                else {
                  playLocally(track);
                  playOnBot(track);
                }
              }}
              onQueue={() => {
                if (playbackMode === 'local') queueLocally(track);
                else if (playbackMode === 'bot') queueOnBot(track);
                else {
                  queueLocally(track);
                  queueOnBot(track);
                }
              }}
              onAddToPlaylist={() => setPlaylistModalTrack(track)}
              onPreview={() => startPreview(track)}
              onStopPreview={() => stopPreview()}
            />
          ))}
        </div>
      )}

      {!loading && results.length === 0 && query && (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <Search size={40} className="text-t-ghost" />
          <p className="text-sm text-t-faint">No results found</p>
        </div>
      )}

      {!query && results.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <Search size={40} className="text-t-ghost" />
          <p className="text-sm text-t-faint">Search for tracks across platforms and your local library</p>
        </div>
      )}

      <AddToPlaylistModal
        track={playlistModalTrack}
        open={!!playlistModalTrack}
        onClose={() => setPlaylistModalTrack(null)}
      />
    </div>
  );
}
