import { useBotStore } from '@/stores/useBotStore';
import { formatTime } from '@/lib/utils';
import { Music, Play, Pause, SkipForward, Heart, Monitor, Radio, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EqBars from '@/components/EqBars';

export default function NowPlayingPage() {
  const player = useBotStore((s) => s.player);
  const pause = useBotStore((s) => s.pause);
  const resume = useBotStore((s) => s.resume);
  const skip = useBotStore((s) => s.skip);
  const connected = useBotStore((s) => s.connection.connected);
  const playbackMode = useBotStore((s) => s.playbackMode);
  const streamStatus = useBotStore((s) => s.streamStatus);

  const isAvailable = connected || playbackMode === 'local';

  if (!isAvailable) {
    return (
      <div className="flex h-[calc(100vh-10rem)] flex-col items-center justify-center gap-4">
        <Music size={56} className="text-t-ghost" />
        <p className="text-base font-medium text-t-tertiary">Not connected to bot</p>
        <p className="text-sm text-t-faint">Go to Settings to configure the connection</p>
      </div>
    );
  }

  if (!player.currentTrack) {
    return (
      <div className="flex h-[calc(100vh-10rem)] flex-col items-center justify-center gap-4">
        <Music size={56} className="text-t-ghost" />
        <p className="text-base font-medium text-t-tertiary">Nothing playing</p>
        <p className="text-sm text-t-faint">Search for a track or use a slash command</p>
      </div>
    );
  }

  const track = player.currentTrack;
  const progressPct = player.duration > 0 ? (player.position / player.duration) * 100 : 0;

  return (
    <div className="relative flex h-[calc(100vh-10rem)] flex-col items-center justify-center overflow-hidden">
      {/* Ambient backdrop: an oversized, near-invisible level meter behind the
          album art — the page's signature motif at rest, not a generic
          gradient blob. */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden opacity-[0.05]">
        <div className="flex items-end gap-6">
          {[120, 220, 160, 260, 140, 200].map((h, i) => (
            <span key={i} className="w-6 rounded-full" style={{ height: h, background: 'var(--accent)' }} />
          ))}
        </div>
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
                <Music size={64} className="text-t-ghost" />
              </div>
            )}
          </div>

          {/* Track info */}
          <div className="text-center">
            <h1 className="flex max-w-lg items-center justify-center gap-3 truncate text-2xl font-bold text-t-primary lg:text-3xl">
              {player.isPlaying && <EqBars playing size="md" />}
              <span className="truncate">{track.title}</span>
            </h1>
            <p className="mt-2 text-base text-t-tertiary">{track.artist ?? 'Unknown Artist'}</p>
            {/* Playback mode badge */}
            <div
              className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium ${
                playbackMode === 'local' ? 'bg-spotify-green/10 text-spotify-green' : 'bg-indigo-500/10 text-indigo-400'
              }`}
            >
              {playbackMode === 'local' ? <Monitor size={12} /> : <Radio size={12} />}
              {playbackMode === 'local' ? 'Playing locally' : 'Playing via bot'}
            </div>
            {/* Stream status indicator */}
            {streamStatus && (streamStatus.status === 'resolving' || streamStatus.status === 'fallback') && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-medium text-amber-400">
                <Loader2 size={12} className="animate-spin" />
                {streamStatus.status === 'resolving'
                  ? `Connecting via ${streamStatus.client}…`
                  : `${streamStatus.client} failed, trying next…`}
              </div>
            )}
            {streamStatus?.status === 'error' && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-[11px] font-medium text-red-400">
                Stream failed
              </div>
            )}
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
            <div className="flex justify-between text-[11px] font-medium tabular-nums text-t-faint">
              <span>{formatTime(player.position)}</span>
              <span>{formatTime(player.duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-10">
            <button className="text-t-faint transition-all hover:scale-110 hover:text-t-secondary">
              <Heart size={22} />
            </button>
            <button
              onClick={() => (player.isPlaying ? pause() : resume())}
              className="flex h-16 w-16 items-center justify-center rounded-full shadow-glow-green-lg transition-all hover:scale-105 active:scale-95"
              style={{ background: 'var(--gradient-accent)', color: 'var(--btn-primary-fg)' }}
            >
              {player.isPlaying ? (
                <Pause size={26} fill="currentColor" />
              ) : (
                <Play size={26} fill="currentColor" className="ml-1" />
              )}
            </button>
            <button onClick={skip} className="text-t-faint transition-all hover:scale-110 hover:text-t-secondary">
              <SkipForward size={22} />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
