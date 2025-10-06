import React, { useMemo, useState, useCallback } from 'react';
import { useBotStore } from '@/stores/useBotStore';
import { Api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import type { SearchResult } from 'discord-dashboard-shared';

import { Play, Pause, SkipForward, Square, Search, Volume2, VolumeX, Repeat, Repeat1, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { useErrorHandling } from '@/hooks/useErrorHandling';
import { ErrorDisplay } from '@/components/ui/error-display';

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

interface MusicPlayerProps {
  className?: string;
}

export default function MusicPlayer({ className }: MusicPlayerProps) {
  const { t } = useTranslation();
  const player = useBotStore((state) => state.player);
  const { error, isRetrying, retry, clearError, withErrorHandling } = useErrorHandling({
    component: 'MusicPlayer',
  });

  // Search dialog state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Volume state
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(player.volume);

  // Progress calculation
  const progress = useMemo(() => {
    const duration = player.track?.duration ?? 0;
    const position = player.position ?? 0;
    return duration ? Math.min(100, (position / duration) * 100) : 0;
  }, [player.position, player.track?.duration]);

  // Player control handlers
  const handlePlay = useCallback(async () => {
    await withErrorHandling(
      async () => {
        if (player.status === 'paused') {
          await Api.resume();
        } else {
          await Api.play();
        }
      },
      { action: 'play' },
    );
  }, [player.status, withErrorHandling]);

  const handlePause = useCallback(async () => {
    await withErrorHandling(
      async () => {
        await Api.pause();
      },
      { action: 'pause' },
    );
  }, [withErrorHandling]);

  const handleStop = useCallback(async () => {
    await withErrorHandling(
      async () => {
        await Api.stop();
      },
      { action: 'stop' },
    );
  }, [withErrorHandling]);

  const handleNext = useCallback(async () => {
    await withErrorHandling(
      async () => {
        await Api.next();
      },
      { action: 'next' },
    );
  }, [withErrorHandling]);

  const handleSeek = useCallback(
    async (value: number[]) => {
      const duration = player.track?.duration ?? 0;
      const seekTime = (value[0] / 100) * duration;
      await withErrorHandling(
        async () => {
          await Api.seek(seekTime);
        },
        { action: 'seek' },
      );
    },
    [player.track?.duration, withErrorHandling],
  );

  const handleVolumeChange = useCallback(
    async (value: number[]) => {
      const newVolume = value[0];
      await withErrorHandling(
        async () => {
          await Api.executeSlash('volume', { amount: newVolume });
          if (newVolume > 0 && isMuted) {
            setIsMuted(false);
          }
        },
        { action: 'volume' },
      );
    },
    [isMuted, withErrorHandling],
  );

  const handleMuteToggle = useCallback(async () => {
    try {
      if (isMuted) {
        // Unmute: restore previous volume
        await Api.executeSlash('volume', { amount: previousVolume });
        setIsMuted(false);
      } else {
        // Mute: set volume to 0 and remember current volume
        setPreviousVolume(player.volume);
        await Api.executeSlash('volume', { amount: 0 });
        setIsMuted(true);
      }
    } catch (error) {
      console.error('Failed to toggle mute:', error);
    }
  }, [isMuted, previousVolume, player.volume]);

  const handleLoopToggle = useCallback(async () => {
    try {
      await Api.executeSlash('loop', { enabled: !player.loop });
    } catch (error) {
      console.error('Failed to toggle loop:', error);
    }
  }, [player.loop]);

  // Search functionality
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const result = await Api.search(searchQuery);
      setSearchResults(result.items || []);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handlePlayTrack = useCallback(async (trackId: string) => {
    try {
      await Api.play(trackId);
      setSearchOpen(false);
    } catch (error) {
      console.error('Failed to play track:', error);
    }
  }, []);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSearch();
      }
    },
    [handleSearch],
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {t('musicPlayer.title')}
          <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Search className="h-4 w-4 mr-2" />
                {t('common.search')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{t('musicPlayer.sources.search')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder={t('musicPlayer.sources.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    className="flex-1"
                  />
                  <Button onClick={handleSearch} disabled={isSearching}>
                    {isSearching ? t('common.loading') : t('common.search')}
                  </Button>
                </div>

                <div className="max-h-96 overflow-auto space-y-2">
                  {searchResults.length === 0 && !isSearching && searchQuery && (
                    <p className="text-center text-muted-foreground py-8">No results found</p>
                  )}

                  {searchResults.map((track: SearchResult) => (
                    <div
                      key={track.id}
                      className="flex items-center justify-between gap-3 border rounded-lg p-3 hover:bg-muted/50"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{track.title}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {track.artist} • {formatTime(track.duration)}
                        </div>
                      </div>
                      <Button size="sm" onClick={() => handlePlayTrack(track.id)}>
                        <Play className="h-4 w-4 mr-1" />
                        {t('musicPlayer.controls.play')}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Error Display */}
        {error && (
          <ErrorDisplay
            error={error}
            onRetry={() => retry()}
            onDismiss={clearError}
            isRetrying={isRetrying}
            variant="inline"
            context={{ component: 'MusicPlayer' }}
          />
        )}

        {/* Current Track Display */}
        <div className="text-center space-y-2">
          <div className="text-xl font-semibold">{player.track?.title || t('musicPlayer.noTrack')}</div>
          {player.track?.artist && <div className="text-muted-foreground">{player.track.artist}</div>}
        </div>

        {/* Progress Bar with Seek */}
        <div className="space-y-2">
          <Slider
            value={[progress]}
            max={100}
            step={0.1}
            onValueCommit={handleSeek}
            className="w-full"
            disabled={!player.track}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(player.position)}</span>
            <span>{player.track ? formatTime(player.track.duration) : '0:00'}</span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleLoopToggle}
            className={player.loop ? 'bg-primary text-primary-foreground' : ''}
          >
            {player.loop ? <Repeat1 className="h-4 w-4" /> : <Repeat className="h-4 w-4" />}
          </Button>

          <Button variant="outline" size="icon" onClick={handleStop} disabled={player.status === 'stopped'}>
            <Square className="h-4 w-4" />
          </Button>

          <Button
            size="lg"
            onClick={player.status === 'playing' ? handlePause : handlePlay}
            disabled={!player.track && player.status === 'stopped'}
          >
            {player.status === 'playing' ? (
              <>
                <Pause className="h-5 w-5 mr-2" />
                {t('musicPlayer.controls.pause')}
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                {t('musicPlayer.controls.play')}
              </>
            )}
          </Button>

          <Button variant="outline" size="icon" onClick={handleNext} disabled={player.queue.length === 0}>
            <SkipForward className="h-4 w-4" />
          </Button>

          <Button variant="outline" size="icon" onClick={() => globalThis.location.reload()} title="Restart/Refresh">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleMuteToggle}>
            {isMuted || player.volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>

          <div className="flex-1">
            <Slider
              value={[isMuted ? 0 : player.volume]}
              max={100}
              step={1}
              onValueCommit={handleVolumeChange}
              className="w-full"
            />
          </div>

          <span className="text-sm text-muted-foreground w-12 text-right">{isMuted ? 0 : player.volume}%</span>
        </div>

        {/* Player Status */}
        <div className="text-center text-sm text-muted-foreground">
          Status: {player.status.charAt(0).toUpperCase() + player.status.slice(1)}
          {player.queue.length > 0 && <span className="ml-2">• {player.queue.length} in queue</span>}
        </div>
      </CardContent>
    </Card>
  );
}
