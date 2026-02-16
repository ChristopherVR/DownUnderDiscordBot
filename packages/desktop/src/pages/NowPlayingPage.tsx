import { useBotStore } from '@/stores/useBotStore';
import { formatTime } from '@/lib/utils';
import { Music, Play, Pause, SkipForward, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NowPlayingPage() {
  const player = useBotStore((s) => s.player);
  const pause = useBotStore((s) => s.pause);
  const resume = useBotStore((s) => s.resume);
  const skip = useBotStore((s) => s.skip);
  const connected = useBotStore((s) => s.connection.connected);

  if (!connected) {
    return (
      <div className="flex h-[calc(100vh-10rem)] flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 animate-pulse rounded-full bg-red-500/10 blur-2xl" />
          <Music size={56} className="relative text-white/10" />
        </div>
        <p className="text-base font-medium text-white/40">Not connected to bot</p>
        <p className="text-sm text-white/20">Go to Settings to configure the connection</p>
      </div>
    );
  }

  if (!player.currentTrack) {
    return (
      <div className="flex h-[calc(100vh-10rem)] flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 animate-float rounded-full bg-spotify-green/5 blur-3xl" />
          <Music size={56} className="relative text-white/10" />
        </div>
        <p className="text-base font-medium text-white/40">Nothing playing</p>
        <p className="text-sm text-white/20">Search for a track or use a slash command</p>
      </div>
    );
  }

  const track = player.currentTrack;
  const progressPct = player.duration > 0 ? (player.position / player.duration) * 100 : 0;

  return (
    <div className="relative flex h-[calc(100vh-10rem)] flex-col items-center justify-center overflow-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-72 w-72 animate-float rounded-full bg-spotify-green/[0.08] blur-[100px]" />
        <div
          className="absolute -bottom-32 -right-32 h-80 w-80 animate-float-delayed rounded-full bg-purple-500/[0.06] blur-[120px]"
        />
        <div className="absolute left-1/2 top-1/3 h-48 w-48 animate-pulse-slow rounded-full bg-cyan-500/[0.04] blur-[80px]" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={track.url ?? track.title}
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.98 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="relative flex flex-col items-center gap-8"
        >
          {/* Album art */}
          <div className="relative">
            {track.thumbnail ? (
              <>
                <div className="absolute inset-0 scale-110 rounded-2xl opacity-50 blur-3xl">
                  <img src={track.thumbnail} alt="" className="h-full w-full rounded-2xl object-cover" />
                </div>
                <motion.img
                  src={track.thumbnail}
                  alt={track.title}
                  className="relative h-72 w-72 rounded-2xl object-cover shadow-2xl shadow-black/50 lg:h-80 lg:w-80"
                  animate={player.isPlaying ? { scale: [1, 1.02, 1] } : {}}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                />
              </>
            ) : (
              <div className="flex h-72 w-72 items-center justify-center rounded-2xl bg-white/[0.04] shadow-2xl lg:h-80 lg:w-80">
                <Music size={64} className="text-white/10" />
              </div>
            )}
          </div>

          {/* Track info */}
          <div className="text-center">
            <h1 className="max-w-lg truncate text-2xl font-bold text-white lg:text-3xl">
              {track.title}
            </h1>
            <p className="mt-2 text-base text-white/40">
              {track.artist ?? 'Unknown Artist'}
            </p>
          </div>

          {/* Progress */}
          <div className="flex w-80 flex-col gap-2 lg:w-96">
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.08]">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-spotify-green to-emerald-400"
                style={{ width: `${progressPct}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-medium tabular-nums text-white/30">
              <span>{formatTime(player.position)}</span>
              <span>{formatTime(player.duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-10">
            <button className="text-white/25 transition-all hover:scale-110 hover:text-white/60">
              <Heart size={22} />
            </button>
            <button
              onClick={() => (player.isPlaying ? pause() : resume())}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-spotify-green to-emerald-400 text-black shadow-glow-green-lg transition-all hover:scale-105 active:scale-95"
            >
              {player.isPlaying ? (
                <Pause size={26} fill="black" />
              ) : (
                <Play size={26} fill="black" className="ml-1" />
              )}
            </button>
            <button
              onClick={skip}
              className="text-white/25 transition-all hover:scale-110 hover:text-white/60"
            >
              <SkipForward size={22} />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
