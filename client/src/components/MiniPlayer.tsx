import { useMemo, useCallback, useState } from 'react';
import { useBotStore } from '@/stores/useBotStore';
import { Api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, SkipForward, Square, Maximize2, Minimize2, Volume2, VolumeX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

interface MiniPlayerProps {
  className?: string;
  onExpand?: () => void;
  expanded?: boolean;
}

export default function MiniPlayer({ className, onExpand, expanded = false }: MiniPlayerProps) {
  const { t } = useTranslation();
  const player = useBotStore((state) => state.player);
  const [isMuted, setIsMuted] = useState(false);

  // Progress calculation
  const progress = useMemo(() => {
    const duration = player.track?.duration ?? 0;
    const position = player.position ?? 0;
    return duration ? Math.min(100, (position / duration) * 100) : 0;
  }, [player.position, player.track?.duration]);

  // Player control handlers
  const handlePlay = useCallback(async () => {
    try {
      if (player.status === 'paused') {
        await Api.resume();
      } else {
        await Api.play();
      }
    } catch (error) {
      console.error('Failed to play:', error);
    }
  }, [player.status]);

  const handlePause = useCallback(async () => {
    try {
      await Api.pause();
    } catch (error) {
      console.error('Failed to pause:', error);
    }
  }, []);

  const handleStop = useCallback(async () => {
    try {
      await Api.stop();
    } catch (error) {
      console.error('Failed to stop:', error);
    }
  }, []);

  const handleNext = useCallback(async () => {
    try {
      await Api.next();
    } catch (error) {
      console.error('Failed to skip to next:', error);
    }
  }, []);

  const handleMuteToggle = useCallback(async () => {
    try {
      const newVolume = isMuted ? 70 : 0; // Default to 70% when unmuting
      await Api.executeSlash('volume', { amount: newVolume });
      setIsMuted(!isMuted);
    } catch (error) {
      console.error('Failed to toggle mute:', error);
    }
  }, [isMuted]);

  // Don't render if no track is available
  if (!player.track && player.status === 'stopped') {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t shadow-lg z-50',
        'transition-all duration-300 ease-in-out',
        expanded ? 'h-auto' : 'h-16',
        className,
      )}
    >
      <div className="container mx-auto px-4">
        {/* Mini Player Bar */}
        <div className="flex items-center gap-4 h-16">
          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              {player.track?.cover && (
                <img src={player.track.cover} alt="Album cover" className="w-10 h-10 rounded object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm truncate">{player.track?.title || t('musicPlayer.noTrack')}</div>
                <div className="text-xs text-muted-foreground truncate">{player.track?.artist || '—'}</div>
              </div>
            </div>
          </div>

          {/* Basic Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={player.status === 'playing' ? handlePause : handlePlay}
              disabled={!player.track && player.status === 'stopped'}
            >
              {player.status === 'playing' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>

            <Button variant="ghost" size="icon" onClick={handleNext} disabled={player.queue.length === 0}>
              <SkipForward className="h-4 w-4" />
            </Button>

            <Button variant="ghost" size="icon" onClick={handleStop} disabled={player.status === 'stopped'}>
              <Square className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress and Time */}
          <div className="hidden md:flex items-center gap-2 min-w-0 flex-1 max-w-xs">
            <span className="text-xs text-muted-foreground whitespace-nowrap">{formatTime(player.position)}</span>
            <div className="flex-1">
              <Progress value={progress} className="h-1" />
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {player.track ? formatTime(player.track.duration) : '0:00'}
            </span>
          </div>

          {/* Volume Control */}
          <div className="hidden lg:flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleMuteToggle}>
              {isMuted || player.volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <span className="text-xs text-muted-foreground w-8">{isMuted ? 0 : player.volume}%</span>
          </div>

          {/* Expand/Collapse Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onExpand}
            title={expanded ? t('musicPlayer.miniPlayer.collapse') : t('musicPlayer.miniPlayer.expand')}
          >
            {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>

        {/* Expanded Content */}
        {expanded && (
          <div className="pb-4 space-y-4 border-t pt-4">
            {/* Queue Preview */}
            {player.queue.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">
                  {t('musicPlayer.queue.title')} ({player.queue.length})
                </h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {player.queue.slice(0, 5).map((track, index) => (
                    <div
                      key={`${track.id}-${index}`}
                      className="flex items-center gap-2 text-sm p-2 rounded hover:bg-muted/50"
                    >
                      <span className="text-muted-foreground w-6 text-center">{index + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{track.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{track.artist}</div>
                      </div>
                      <span className="text-xs text-muted-foreground">{formatTime(track.duration)}</span>
                    </div>
                  ))}
                  {player.queue.length > 5 && (
                    <div className="text-xs text-muted-foreground text-center py-1">
                      +{player.queue.length - 5} more tracks
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Player Status */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Status: {player.status.charAt(0).toUpperCase() + player.status.slice(1)}</span>
              {player.loop && <span>Repeat: On</span>}
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar for Mobile (always visible) */}
      <div className="md:hidden absolute bottom-0 left-0 right-0">
        <Progress value={progress} className="h-0.5 rounded-none" />
      </div>
    </div>
  );
}
