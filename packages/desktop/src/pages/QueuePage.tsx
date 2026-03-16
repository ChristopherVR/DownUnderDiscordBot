import { useBotStore, type Track } from '@/stores/useBotStore';
import { formatTime } from '@/lib/utils';
import { Trash2, Shuffle, ListX, Music, Pause, GripVertical } from 'lucide-react';
import { Reorder, useDragControls } from 'framer-motion';

/** Animated equalizer bars shown when a track is actively playing. */
function PlayingIndicator() {
  return (
    <div className="flex items-end gap-[3px]" style={{ height: 14 }}>
      {[0, 0.2, 0.4].map((delay) => (
        <span
          key={delay}
          className="w-[3px] rounded-full"
          style={{
            background: 'var(--accent)',
            animation: 'var(--animate-now-playing-bar)',
            animationDelay: `${delay}s`,
          }}
        />
      ))}
    </div>
  );
}

function TrackRow({ track, index, onRemove }: { track: Track; index: number; onRemove: () => void }) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={track}
      dragListener={false}
      dragControls={dragControls}
      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors"
      style={{ background: 'transparent' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--nav-hover-bg)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      whileDrag={{
        scale: 1.02,
        boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
        background: 'var(--glass-bg-md)',
        zIndex: 50,
      }}
    >
      <button
        className="cursor-grab touch-none rounded p-0.5 text-t-ghost opacity-0 transition-opacity hover:text-t-faint group-hover:opacity-100 active:cursor-grabbing"
        onPointerDown={(e) => dragControls.start(e)}
      >
        <GripVertical size={14} />
      </button>
      <span className="w-7 text-center text-xs tabular-nums text-t-ghost">{index + 1}</span>
      {track.thumbnail ? (
        <img src={track.thumbnail} alt="" className="h-10 w-10 rounded-lg object-cover" />
      ) : (
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ background: 'var(--glass-bg-md)' }}
        >
          <Music size={16} className="text-t-ghost" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-t-primary">{track.title}</p>
        <p className="truncate text-[11px] text-t-faint">{track.artist ?? 'Unknown'}</p>
      </div>
      <span className="text-[11px] tabular-nums text-t-ghost">
        {track.duration ? formatTime(track.duration) : '--:--'}
      </span>
      <button
        onClick={onRemove}
        className="rounded-full p-1.5 text-t-ghost opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
      >
        <Trash2 size={14} />
      </button>
    </Reorder.Item>
  );
}

export default function QueuePage() {
  const queue = useBotStore((s) => s.player.queue);
  const currentTrack = useBotStore((s) => s.player.currentTrack);
  const isPlaying = useBotStore((s) => s.player.isPlaying);
  const removeFromQueue = useBotStore((s) => s.removeFromQueue);
  const moveQueueTrack = useBotStore((s) => s.moveQueueTrack);
  const clearQueue = useBotStore((s) => s.clearQueue);
  const shuffleQueue = useBotStore((s) => s.shuffleQueue);

  /** Called by framer-motion when the user finishes dragging to a new order */
  const handleReorder = (newOrder: Track[]) => {
    // Find the item that changed position
    for (let i = 0; i < queue.length; i++) {
      if (queue[i] !== newOrder[i]) {
        // Find where the old item at position i went
        const from = i;
        const movedTrack = queue[from];
        const to = newOrder.indexOf(movedTrack);
        if (to !== -1 && from !== to) {
          moveQueueTrack(from, to);
        }
        return;
      }
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-t-primary">Queue</h1>
          <p className="mt-1 text-sm text-t-faint">
            {queue.length} track{queue.length !== 1 ? 's' : ''} up next
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={shuffleQueue} disabled={queue.length < 2} className="btn-glass disabled:opacity-30">
            <Shuffle size={14} /> Shuffle
          </button>
          <button onClick={clearQueue} disabled={queue.length === 0} className="btn-glass disabled:opacity-30">
            <ListX size={14} /> Clear
          </button>
        </div>
      </div>

      {/* Currently playing */}
      {currentTrack && (
        <div className="mb-6">
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-t-faint">Now Playing</h2>
          <div className="card-glass flex items-center gap-3 rounded-xl !p-3">
            {currentTrack.thumbnail ? (
              <img src={currentTrack.thumbnail} alt="" className="h-12 w-12 rounded-lg object-cover shadow-lg" />
            ) : (
              <div
                className="flex h-12 w-12 items-center justify-center rounded-lg"
                style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)' }}
              >
                <Music size={20} style={{ color: 'var(--accent)' }} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-gradient-accent">{currentTrack.title}</p>
              <p className="truncate text-[11px] text-t-faint">{currentTrack.artist ?? 'Unknown'}</p>
            </div>
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{ background: 'color-mix(in srgb, var(--accent) 20%, transparent)' }}
            >
              {isPlaying ? (
                <PlayingIndicator />
              ) : (
                <Pause size={12} fill="var(--accent)" style={{ color: 'var(--accent)' }} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Queue list */}
      {queue.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <Music size={40} className="text-t-ghost" />
          <p className="text-sm text-t-faint">Queue is empty</p>
          <p className="text-xs text-t-ghost">Search for tracks to add</p>
        </div>
      ) : (
        <div className="card-glass rounded-xl p-2">
          <h2 className="mb-1 px-3 py-2 text-[11px] font-semibold uppercase tracking-widest text-t-faint">Up Next</h2>
          <Reorder.Group axis="y" values={queue} onReorder={handleReorder} className="flex flex-col">
            {queue.map((track, i) => (
              <TrackRow
                key={`${track.url ?? track.title}-${i}`}
                track={track}
                index={i}
                onRemove={() => removeFromQueue(i)}
              />
            ))}
          </Reorder.Group>
        </div>
      )}
    </div>
  );
}
