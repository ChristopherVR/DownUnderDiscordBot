import { useEffect, useRef, useState } from 'react';
import { useBotStore } from '@/stores/useBotStore';
import { formatTime } from '@/lib/utils';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Repeat,
  Repeat1,
  Shuffle,
  Volume2,
  VolumeX,
} from 'lucide-react';

export default function PlayerBar() {
  const player = useBotStore((s) => s.player);
  const pause = useBotStore((s) => s.pause);
  const resume = useBotStore((s) => s.resume);
  const skip = useBotStore((s) => s.skip);
  const seek = useBotStore((s) => s.seek);
  const setVolume = useBotStore((s) => s.setVolume);
  const setLoop = useBotStore((s) => s.setLoop);
  const shuffleQueue = useBotStore((s) => s.shuffleQueue);

  const [localPos, setLocalPos] = useState(0);
  const [dragging, setDragging] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    if (player.isPlaying && !dragging) {
      setLocalPos(player.position);
      intervalRef.current = setInterval(() => {
        setLocalPos((p) => Math.min(p + 1, player.duration));
      }, 1000);
    } else {
      setLocalPos(player.position);
    }
    return () => clearInterval(intervalRef.current);
  }, [player.isPlaying, player.position, player.duration, dragging]);

  const progressPct = player.duration > 0 ? (localPos / player.duration) * 100 : 0;

  const loopModes: Array<'off' | 'track' | 'queue'> = ['off', 'track', 'queue'];
  const nextLoop = () => {
    const idx = loopModes.indexOf(player.loop);
    setLoop(loopModes[(idx + 1) % loopModes.length]);
  };

  const LoopIcon = player.loop === 'track' ? Repeat1 : Repeat;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex h-20 items-center border-t border-white/[0.04] bg-[#08080c]/95 px-4 backdrop-blur-2xl">
      {/* Track info */}
      <div className="flex w-64 items-center gap-3">
        {player.currentTrack?.thumbnail ? (
          <img
            src={player.currentTrack.thumbnail}
            alt=""
            className="h-12 w-12 rounded-lg object-cover shadow-lg shadow-black/40"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/[0.05]">
            <Play size={18} className="text-white/20" />
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-white/90">
            {player.currentTrack?.title ?? 'No track playing'}
          </p>
          <p className="truncate text-[11px] text-white/30">
            {player.currentTrack?.artist ?? '\u00A0'}
          </p>
        </div>
      </div>

      {/* Center controls */}
      <div className="flex flex-1 flex-col items-center gap-1.5">
        <div className="flex items-center gap-5">
          <button
            onClick={shuffleQueue}
            className="text-white/25 transition-all hover:scale-110 hover:text-white/60"
          >
            <Shuffle size={15} />
          </button>
          <button className="text-white/30 transition-all hover:scale-110 hover:text-white/70">
            <SkipBack size={17} />
          </button>
          <button
            onClick={() => (player.isPlaying ? pause() : resume())}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-spotify-green to-emerald-400 text-black shadow-glow-green transition-all hover:scale-105 active:scale-95"
          >
            {player.isPlaying ? (
              <Pause size={15} fill="black" />
            ) : (
              <Play size={15} fill="black" className="ml-0.5" />
            )}
          </button>
          <button
            onClick={skip}
            className="text-white/30 transition-all hover:scale-110 hover:text-white/70"
          >
            <SkipForward size={17} />
          </button>
          <button
            onClick={nextLoop}
            className={`transition-all hover:scale-110 ${
              player.loop !== 'off'
                ? 'text-spotify-green'
                : 'text-white/25 hover:text-white/60'
            }`}
          >
            <LoopIcon size={15} />
          </button>
        </div>

        {/* Seek bar */}
        <div className="flex w-full max-w-md items-center gap-2">
          <span className="w-9 text-right text-[10px] font-medium tabular-nums text-white/30">
            {formatTime(localPos)}
          </span>
          <div
            className="group relative h-1 flex-1 cursor-pointer rounded-full bg-white/[0.08]"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              const pos = Math.floor(pct * player.duration);
              setLocalPos(pos);
              seek(pos);
            }}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-spotify-green to-emerald-400 transition-all"
              style={{ width: `${progressPct}%` }}
            />
            <div
              className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
              style={{ left: `calc(${progressPct}% - 6px)` }}
            />
          </div>
          <span className="w-9 text-[10px] font-medium tabular-nums text-white/30">
            {formatTime(player.duration)}
          </span>
        </div>
      </div>

      {/* Volume */}
      <div className="flex w-36 items-center justify-end gap-2">
        <button
          onClick={() => setVolume(player.volume > 0 ? 0 : 50)}
          className="text-white/30 transition-colors hover:text-white/60"
        >
          {player.volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        <div className="group relative h-1 w-20 cursor-pointer rounded-full bg-white/[0.08]">
          <div
            className="h-full rounded-full bg-white/40 transition-all group-hover:bg-spotify-green"
            style={{ width: `${player.volume}%` }}
          />
          <input
            type="range"
            min={0}
            max={100}
            value={player.volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </div>
      </div>
    </div>
  );
}
