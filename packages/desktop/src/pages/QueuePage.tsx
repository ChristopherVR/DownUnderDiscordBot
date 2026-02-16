import { useBotStore, type Track } from '@/stores/useBotStore';
import { formatTime } from '@/lib/utils';
import { Trash2, Shuffle, ListX, Music, Play } from 'lucide-react';

function TrackRow({
  track,
  index,
  onRemove,
}: {
  track: Track;
  index: number;
  onRemove: () => void;
}) {
  return (
    <div className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all hover:bg-white/[0.04]">
      <span className="w-7 text-center text-xs tabular-nums text-white/20">
        {index + 1}
      </span>
      {track.thumbnail ? (
        <img src={track.thumbnail} alt="" className="h-10 w-10 rounded-lg object-cover" />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.05]">
          <Music size={16} className="text-white/20" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-white/90">{track.title}</p>
        <p className="truncate text-[11px] text-white/30">{track.artist ?? 'Unknown'}</p>
      </div>
      <span className="text-[11px] tabular-nums text-white/20">
        {track.duration ? formatTime(track.duration) : '--:--'}
      </span>
      <button
        onClick={onRemove}
        className="rounded-full p-1.5 text-white/15 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

export default function QueuePage() {
  const queue = useBotStore((s) => s.player.queue);
  const currentTrack = useBotStore((s) => s.player.currentTrack);
  const removeFromQueue = useBotStore((s) => s.removeFromQueue);
  const clearQueue = useBotStore((s) => s.clearQueue);
  const shuffleQueue = useBotStore((s) => s.shuffleQueue);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Queue</h1>
          <p className="mt-1 text-sm text-white/30">
            {queue.length} track{queue.length !== 1 ? 's' : ''} up next
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={shuffleQueue}
            disabled={queue.length < 2}
            className="btn-glass disabled:opacity-30"
          >
            <Shuffle size={14} /> Shuffle
          </button>
          <button
            onClick={clearQueue}
            disabled={queue.length === 0}
            className="btn-glass disabled:opacity-30"
          >
            <ListX size={14} /> Clear
          </button>
        </div>
      </div>

      {/* Currently playing */}
      {currentTrack && (
        <div className="mb-6">
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-white/25">
            Now Playing
          </h2>
          <div className="card-glass flex items-center gap-3 rounded-xl !p-3">
            {currentTrack.thumbnail ? (
              <img src={currentTrack.thumbnail} alt="" className="h-12 w-12 rounded-lg object-cover shadow-lg shadow-black/30" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-spotify-green/10">
                <Music size={20} className="text-spotify-green" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-gradient-green">{currentTrack.title}</p>
              <p className="truncate text-[11px] text-white/30">{currentTrack.artist ?? 'Unknown'}</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-spotify-green/20">
              <Play size={12} fill="#1DB954" className="ml-0.5 text-spotify-green" />
            </div>
          </div>
        </div>
      )}

      {/* Queue list */}
      {queue.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <Music size={40} className="text-white/10" />
          <p className="text-sm text-white/30">Queue is empty</p>
          <p className="text-xs text-white/15">Search for tracks to add</p>
        </div>
      ) : (
        <div className="card-glass rounded-xl p-2">
          <h2 className="mb-1 px-3 py-2 text-[11px] font-semibold uppercase tracking-widest text-white/25">
            Up Next
          </h2>
          {queue.map((track, i) => (
            <TrackRow
              key={`${track.url ?? track.title}-${i}`}
              track={track}
              index={i}
              onRemove={() => removeFromQueue(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
