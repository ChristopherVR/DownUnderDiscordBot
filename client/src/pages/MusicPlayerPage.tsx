import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import MusicPlayer from '@/components/MusicPlayer';
import MiniPlayer from '@/components/MiniPlayer';
import FileUploader from '@/components/FileUploader';
import PlaybackSourceSelector from '@/components/PlaybackSourceSelector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { UploadedFile, PlaybackOptions } from 'discord-dashboard-shared';
import { Music, List, Upload, Settings, Wifi, WifiOff, RefreshCw, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { usePlayerSync, useDiscordStatusSync, usePlayerControlBuilder } from '@/hooks/usePlayerSync';
import { useBotStore } from '@/stores/useBotStore';
import { cn } from '@/lib/utils';

export default function MusicPlayerPage() {
  const { t } = useTranslation();
  const [showMiniPlayer, setShowMiniPlayer] = useState(false);
  const [activeTab, setActiveTab] = useState<'player' | 'queue' | 'upload' | 'source'>('player');
  const location = useLocation();
  const navigate = useNavigate();
  const [initialSearchQuery, setInitialSearchQuery] = useState<string | undefined>();

  // Player synchronization hooks
  const { player, syncStatus } = usePlayerSync({
    enableAutoSync: true,
    syncInterval: 1000,
    onStateChange: (state) => {
      // Handle real-time state changes
      console.log('Player state updated:', state);
    },
  });

  const { requestDiscordStatus } = useDiscordStatusSync();
  const { controlBuilder } = usePlayerControlBuilder();

  // WebSocket connection status
  const wsConnected = useBotStore((state) => state.wsConnected);
  const wsReconnecting = useBotStore((state) => state.wsReconnecting);

  // Handle mini player toggle
  const handleMiniPlayerToggle = useCallback(() => {
    setShowMiniPlayer(!showMiniPlayer);
  }, [showMiniPlayer]);

  // Handle file upload completion
  const handleUploadComplete = useCallback((files: UploadedFile[]) => {
    console.log('Files uploaded:', files);
    // Optionally refresh local files or show success message
  }, []);

  // Handle playback source selection
  const handleSourcePlay = useCallback(
    (source: 'search' | 'playlist' | 'local', value: string, options: PlaybackOptions) => {
      console.log('Playing from source:', source, value, options);
      // The PlaybackSourceSelector component handles the actual play command
    },
    [],
  );

  // Queue management functions
  const handleRemoveFromQueue = useCallback(
    async (index: number) => {
      try {
        const controls = controlBuilder();
        await controls.removeFromQueue(index);
      } catch (error) {
        console.error('Failed to remove from queue:', error);
      }
    },
    [controlBuilder],
  );

  const handleMoveQueueItem = useCallback(
    async (fromIndex: number, direction: 'up' | 'down') => {
      try {
        const controls = controlBuilder();
        const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
        await controls.moveQueueItem(fromIndex, toIndex);
      } catch (error) {
        console.error('Failed to move queue item:', error);
      }
    },
    [controlBuilder],
  );

  const handleClearQueue = useCallback(async () => {
    try {
      const controls = controlBuilder();
      await controls.clearQueue();
    } catch (error) {
      console.error('Failed to clear queue:', error);
    }
  }, [controlBuilder]);

  // Format time helper
  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  // Auto-request Discord status on mount
  useEffect(() => {
    if (wsConnected) {
      requestDiscordStatus();
    }
  }, [wsConnected, requestDiscordStatus]);

  useEffect(() => {
    const state = location.state as { searchQuery?: string } | null;
    if (state?.searchQuery) {
      setActiveTab('source');
      setInitialSearchQuery(state.searchQuery);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  return (
    <div className="space-y-10">
      {/* Header with Connection Status */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('musicPlayer.title')}</h1>
          <p className="text-muted-foreground">Control your Discord bot's music playback</p>
        </div>

        <div className="flex items-center gap-2">
          {/* WebSocket Status */}
          <Badge variant={wsConnected ? 'default' : 'destructive'} className="flex items-center gap-1">
            {wsConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {wsReconnecting
              ? t('websocket.reconnecting')
              : wsConnected
                ? t('websocket.connected')
                : t('websocket.disconnected')}
          </Badge>

          {/* Sync Status */}
          <Badge variant={syncStatus.isAutoSyncing ? 'default' : 'secondary'} className="flex items-center gap-1">
            <RefreshCw className={cn('h-3 w-3', syncStatus.isAutoSyncing && 'animate-spin')} />
            Real-time Sync
          </Badge>

          {/* Mini Player Toggle */}
          <Button variant="outline" size="sm" onClick={handleMiniPlayerToggle}>
            {showMiniPlayer ? 'Hide' : 'Show'} Mini Player
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === 'player' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('player')}
          className="flex items-center gap-2"
        >
          <Music className="h-4 w-4" />
          Player
        </Button>
        <Button
          variant={activeTab === 'source' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('source')}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          Source
        </Button>
        <Button
          variant={activeTab === 'queue' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('queue')}
          className="flex items-center gap-2"
        >
          <List className="h-4 w-4" />
          Queue ({player.queue.length})
        </Button>
        <Button
          variant={activeTab === 'upload' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('upload')}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload
        </Button>
      </div>

      {/* Tab Content */}
      <div className="grid gap-6">
        {activeTab === 'player' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <MusicPlayer />

            {/* Discord Status Mirror */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5" />
                  Discord Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center space-y-2">
                  <div className="text-lg font-semibold">{player.track?.title || 'No track playing'}</div>
                  {player.track?.artist && <div className="text-muted-foreground">by {player.track.artist}</div>}
                  <Badge
                    variant={
                      player.status === 'playing' ? 'default' : player.status === 'paused' ? 'secondary' : 'outline'
                    }
                  >
                    {player.status.charAt(0).toUpperCase() + player.status.slice(1)}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Position:</span>
                    <span>
                      {formatTime(player.position)} / {player.track ? formatTime(player.track.duration) : '0:00'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Volume:</span>
                    <span>{player.volume}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Loop:</span>
                    <span>{player.loop ? 'On' : 'Off'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Queue:</span>
                    <span>
                      {player.queue.length} track{player.queue.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <Button variant="outline" onClick={requestDiscordStatus} className="w-full" disabled={!wsConnected}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Discord Status
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'source' && (
          <div className="max-w-2xl mx-auto">
            <PlaybackSourceSelector onPlay={handleSourcePlay} initialSearchQuery={initialSearchQuery} />
          </div>
        )}

        {activeTab === 'queue' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <List className="h-5 w-5" />
                  {t('musicPlayer.queue.title')} ({player.queue.length})
                </div>
                {player.queue.length > 0 && (
                  <Button variant="outline" size="sm" onClick={handleClearQueue}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('musicPlayer.queue.clear')}
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {player.queue.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <List className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('musicPlayer.queue.empty')}</p>
                </div>
              ) : (
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {player.queue.map((track, index) => (
                      <div
                        key={`${track.id}-${index}`}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg border',
                          index === player.currentIndex && 'bg-primary/10 border-primary',
                        )}
                      >
                        <div className="flex-shrink-0 w-8 text-center text-sm text-muted-foreground">{index + 1}</div>

                        {track.cover && (
                          <img src={track.cover} alt="Track cover" className="w-10 h-10 rounded object-cover" />
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{track.title}</div>
                          <div className="text-sm text-muted-foreground truncate">
                            {track.artist} • {formatTime(track.duration)}
                          </div>
                          <div className="text-xs text-muted-foreground">Source: {track.source}</div>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMoveQueueItem(index, 'up')}
                            disabled={index === 0}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMoveQueueItem(index, 'down')}
                            disabled={index === player.queue.length - 1}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveFromQueue(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'upload' && (
          <div className="max-w-2xl mx-auto">
            <FileUploader onUploadComplete={handleUploadComplete} />
          </div>
        )}
      </div>

      {/* Mini Player */}
      {showMiniPlayer && <MiniPlayer onExpand={handleMiniPlayerToggle} expanded={false} />}
    </div>
  );
}
