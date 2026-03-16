import { useEffect, useRef, useState } from 'react';
import { useBotStore } from '@/stores/useBotStore';
import type { PlaybackMode } from '@/stores/useBotStore';
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
  Film,
  Music,
  ChevronLeft,
  ChevronRight,
  Upload,
  Monitor,
  Radio,
  Link2,
  Loader2,
} from 'lucide-react';

/** Animated equalizer bars for the track-info thumbnail placeholder. */
function PlayingBars() {
  return (
    <div className="flex items-end gap-[3px]" style={{ height: 14 }}>
      {[0, 0.15, 0.3].map((delay) => (
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

export default function PlayerBar() {
  const player = useBotStore((s) => s.player);
  const pause = useBotStore((s) => s.pause);
  const resume = useBotStore((s) => s.resume);
  const skip = useBotStore((s) => s.skip);
  const playPrevious = useBotStore((s) => s.playPrevious);
  const seek = useBotStore((s) => s.seek);
  const setVolume = useBotStore((s) => s.setVolume);
  const setLoop = useBotStore((s) => s.setLoop);
  const shuffleQueue = useBotStore((s) => s.shuffleQueue);
  const connected = useBotStore((s) => s.connection.connected);
  const playbackMode = useBotStore((s) => s.playbackMode);
  const setPlaybackMode = useBotStore((s) => s.setPlaybackMode);
  const botUser = useBotStore((s) => s.botUser);
  const showVideoPreview = useBotStore((s) => s.showVideoPreview);
  const setShowVideoPreview = useBotStore((s) => s.setShowVideoPreview);
  const localHistory = useBotStore((s) => s.localHistory);
  const localQueue = useBotStore((s) => s.localQueue);
  const streamStatus = useBotStore((s) => s.streamStatus);

  // Multi-guild player cycling
  const guildPlayers = useBotStore((s) => s.guildPlayers);
  const activePlayerGuildId = useBotStore((s) => s.activePlayerGuildId);
  const cycleActivePlayer = useBotStore((s) => s.cycleActivePlayer);
  const getActiveGuildIds = useBotStore((s) => s.getActiveGuildIds);
  const transferToBot = useBotStore((s) => s.transferToBot);
  const guilds = useBotStore((s) => s.guilds);

  // Compute active guild info for the cycling indicator
  const activeGuildIds = getActiveGuildIds();
  const activeGuildCount = activeGuildIds.length;
  const activeGuildPlayer = activePlayerGuildId ? guildPlayers[activePlayerGuildId] : null;
  const activeGuildInfo = activePlayerGuildId ? guilds.find((g) => g.id === activePlayerGuildId) : null;
  const activeGuildIndex = activePlayerGuildId ? activeGuildIds.indexOf(activePlayerGuildId) : -1;

  const isVideoTrack = player.currentTrack?.mediaType === 'video';

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
  const hasTrack = !!player.currentTrack;
  const hasQueuedTracks =
    playbackMode === 'local' || playbackMode === 'sync' ? localQueue.length > 0 : player.queue.length > 0;
  // Allow controls whenever there's something to control. The action handlers
  // already branch on playbackMode and gracefully handle a disconnected bot
  // (API calls are wrapped in try/catch), so gating on `connected` here only
  // causes buttons to appear disabled while a track is visibly playing.
  const canControl = hasTrack || hasQueuedTracks;

  // Determine if prev / next are available for visual indicator
  const hasPrevious = playbackMode === 'local' || playbackMode === 'sync' ? localHistory.length > 0 : hasTrack;
  const hasNext = hasQueuedTracks;

  const loopModes: Array<'off' | 'track' | 'queue'> = ['off', 'track', 'queue'];
  const nextLoop = () => {
    const idx = loopModes.indexOf(player.loop);
    setLoop(loopModes[(idx + 1) % loopModes.length]);
  };

  const LoopIcon = player.loop === 'track' ? Repeat1 : Repeat;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 flex h-20 items-center px-4 backdrop-blur-2xl"
      style={{
        borderTop: '1px solid var(--playerbar-border)',
        background: 'var(--playerbar-bg)',
      }}
    >
      {/* Track info + guild cycling */}
      <div className="flex w-72 items-center gap-3">
        {(playbackMode === 'bot' || playbackMode === 'sync') && activeGuildCount > 1 && (
          <button
            onClick={() => cycleActivePlayer('prev')}
            className="text-t-faint transition-all hover:scale-110 hover:text-t-secondary"
            title="Previous server"
          >
            <ChevronLeft size={16} />
          </button>
        )}

        {player.currentTrack?.thumbnail ? (
          <img
            src={player.currentTrack.thumbnail}
            alt=""
            className="h-12 w-12 flex-shrink-0 rounded-lg object-cover shadow-lg"
          />
        ) : (
          <div
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg"
            style={{ background: 'var(--glass-bg)' }}
          >
            {hasTrack && player.isPlaying ? (
              <PlayingBars />
            ) : hasTrack ? (
              <Pause size={18} className="text-t-ghost" />
            ) : (
              <Music size={18} className="text-t-ghost" />
            )}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-t-primary">
            {player.currentTrack?.title ?? 'No track playing'}
          </p>
          <p className="truncate text-[11px] text-t-faint">{player.currentTrack?.artist ?? '\u00A0'}</p>
          {/* Stream status indicator (resolving / fallback) */}
          {streamStatus && (streamStatus.status === 'resolving' || streamStatus.status === 'fallback') && (
            <p className="flex items-center gap-1 truncate text-[10px] font-medium text-amber-400">
              <Loader2 size={10} className="animate-spin" />
              {streamStatus.status === 'resolving'
                ? `Connecting via ${streamStatus.client}…`
                : `${streamStatus.client} failed, trying next…`}
            </p>
          )}
          {streamStatus?.status === 'error' && (
            <p className="truncate text-[10px] font-medium text-red-400">Stream failed</p>
          )}
          {/* Guild indicator in bot / sync mode */}
          {!streamStatus && (playbackMode === 'bot' || playbackMode === 'sync') && activeGuildPlayer && (
            <p className="truncate text-[10px] font-medium" style={{ color: 'var(--accent)' }}>
              {activeGuildInfo?.name ?? activeGuildPlayer.guildName ?? 'Server'}
              {activeGuildCount > 1 && (
                <span className="ml-1 text-t-ghost">
                  ({activeGuildIndex + 1}/{activeGuildCount})
                </span>
              )}
            </p>
          )}
        </div>

        {/* Guild cycling next */}
        {(playbackMode === 'bot' || playbackMode === 'sync') && activeGuildCount > 1 && (
          <button
            onClick={() => cycleActivePlayer('next')}
            className="text-t-faint transition-all hover:scale-110 hover:text-t-secondary"
            title="Next server"
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      {/* Center controls */}
      <div className="flex flex-1 flex-col items-center gap-1.5">
        <div className="flex items-center gap-5">
          <button
            onClick={shuffleQueue}
            disabled={!canControl}
            className="text-t-faint transition-all hover:scale-110 hover:text-t-secondary disabled:opacity-30 disabled:hover:scale-100"
          >
            <Shuffle size={15} />
          </button>
          <button
            onClick={playPrevious}
            disabled={!canControl}
            className={`transition-all hover:scale-110 disabled:opacity-30 disabled:hover:scale-100 ${
              hasPrevious ? 'text-t-secondary hover:text-t-primary' : 'text-t-faint hover:text-t-secondary'
            }`}
          >
            <SkipBack size={17} />
          </button>
          <button
            onClick={() => {
              if (!canControl) return;
              if (player.isPlaying) {
                pause();
              } else if (hasTrack) {
                resume();
              } else if (hasQueuedTracks && (playbackMode === 'local' || playbackMode === 'sync')) {
                // No current track but queue has items — start the first one
                const next = localQueue[0];
                if (next) {
                  useBotStore.getState().skip();
                }
              }
            }}
            disabled={!canControl}
            className="flex h-9 w-9 items-center justify-center rounded-full shadow-glow-green transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:shadow-none disabled:hover:scale-100"
            style={{ background: 'var(--gradient-accent)', color: 'var(--btn-primary-fg)' }}
          >
            {player.isPlaying ? (
              <Pause size={15} fill="currentColor" />
            ) : (
              <Play size={15} fill="currentColor" className="ml-0.5" />
            )}
          </button>
          <button
            onClick={skip}
            disabled={!canControl}
            className={`transition-all hover:scale-110 disabled:opacity-30 disabled:hover:scale-100 ${
              hasNext ? 'text-t-secondary hover:text-t-primary' : 'text-t-faint hover:text-t-secondary'
            }`}
          >
            <SkipForward size={17} />
          </button>
          <button
            onClick={nextLoop}
            disabled={!canControl}
            className={`transition-all hover:scale-110 disabled:opacity-30 disabled:hover:scale-100 ${
              player.loop !== 'off' ? '' : 'text-t-faint hover:text-t-secondary'
            }`}
            style={player.loop !== 'off' ? { color: 'var(--accent)' } : undefined}
          >
            <LoopIcon size={15} />
          </button>
        </div>

        {/* Seek bar */}
        <div className="flex w-full max-w-md items-center gap-2">
          <span className="w-9 text-right text-[10px] font-medium tabular-nums text-t-faint">
            {formatTime(localPos)}
          </span>
          <div
            className="group relative h-1 flex-1 cursor-pointer rounded-full bg-white/[0.08]"
            onMouseDown={(e) => {
              if (!canControl) return;
              setDragging(true);
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              setLocalPos(Math.floor(pct * player.duration));
            }}
            onMouseUp={(e) => {
              if (!canControl) return;
              setDragging(false);
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              const pos = Math.floor(pct * player.duration);
              setLocalPos(pos);
              seek(pos);
            }}
            onClick={(e) => {
              if (!canControl) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              const pos = Math.floor(pct * player.duration);
              setLocalPos(pos);
              seek(pos);
            }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{ background: 'var(--gradient-accent)', width: `${progressPct}%` }}
            />
            <div
              className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
              style={{ left: `calc(${progressPct}% - 6px)` }}
            />
          </div>
          <span className="w-9 text-[10px] font-medium tabular-nums text-t-faint">{formatTime(player.duration)}</span>
        </div>
      </div>

      {/* Right controls: audio mode + transfer + video preview + volume */}
      <div className="flex w-72 items-center justify-end gap-2">
        {/* Audio mode switcher: Local / Bot / Sync */}
        <div
          className="flex items-center gap-0.5 rounded-lg p-0.5"
          style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
        >
          {[
            { mode: 'local' as PlaybackMode, icon: Monitor, label: 'Local', color: 'var(--accent)' },
            { mode: 'bot' as PlaybackMode, icon: Radio, label: 'Bot', color: '#a78bfa' },
            { mode: 'sync' as PlaybackMode, icon: Link2, label: 'Sync', color: '#f59e0b' },
          ].map(({ mode, icon: Icon, label, color }) => (
            <button
              key={mode}
              onClick={() => setPlaybackMode(mode)}
              disabled={mode !== 'local' && !botUser}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wider transition-all disabled:cursor-not-allowed disabled:opacity-30 ${
                playbackMode === mode ? 'shadow-sm' : 'hover:bg-white/[0.04]'
              }`}
              style={
                playbackMode === mode
                  ? { background: `color-mix(in srgb, ${color} 15%, transparent)`, color }
                  : { color: 'var(--text-faint)' }
              }
              title={
                mode === 'local'
                  ? 'Play through your speakers'
                  : mode === 'bot'
                    ? botUser
                      ? 'Play through Discord voice'
                      : 'Connect bot first'
                    : botUser
                      ? 'Play on both local + bot simultaneously'
                      : 'Connect bot first'
              }
            >
              <Icon size={11} />
              {label}
            </button>
          ))}
        </div>

        {/* Transfer to Bot — visible in local mode when there's a track */}
        {playbackMode === 'local' && hasTrack && connected && (
          <button
            onClick={() => transferToBot()}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium transition-all hover:scale-105"
            style={{
              background: 'var(--glass-bg)',
              color: 'var(--accent)',
              border: '1px solid var(--accent-muted, rgba(255,255,255,0.1))',
            }}
            title="Transfer current track to bot"
          >
            <Upload size={11} />
            <span>To Bot</span>
          </button>
        )}

        {/* Video preview toggle (only visible when current track is a video) */}
        {isVideoTrack && (
          <button
            onClick={() => setShowVideoPreview(!showVideoPreview)}
            className={`rounded-lg p-1.5 transition-all ${
              showVideoPreview ? 'bg-purple-500/15 text-purple-400' : 'text-white/25 hover:text-white/50'
            }`}
            title={showVideoPreview ? 'Hide video' : 'Show video'}
          >
            <Film size={15} />
          </button>
        )}

        {/* Volume */}
        <button
          onClick={() => setVolume(player.volume > 0 ? 0 : 50)}
          className="text-t-faint transition-colors hover:text-t-secondary"
        >
          {player.volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        <div
          className="group relative h-1 w-20 cursor-pointer rounded-full"
          style={{ background: 'var(--glass-bg-md)' }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${player.volume}%`,
              background: 'var(--text-tertiary)',
            }}
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
