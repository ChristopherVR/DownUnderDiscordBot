import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, List, Play, Music, Globe, FolderOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Api } from '@/lib/api';
import { useErrorHandling } from '@/hooks/useErrorHandling';
import type { PlaybackOptions } from 'discord-dashboard-shared';
import { ErrorDisplay } from '@/components/ui/error-display';

type PlaybackSource = 'search' | 'playlist' | 'local';

interface PlaybackSourceSelectorProps {
  className?: string;
  onPlay?: (source: PlaybackSource, value: string, options?: PlaybackOptions) => void;
  defaultSource?: PlaybackSource;
  initialSearchQuery?: string;
}

interface LocalFile {
  id: string;
  originalName: string;
  fileName: string;
  filePath: string;
  metadata?: {
    duration?: number;
    artist?: string;
    title?: string;
    album?: string;
  };
}

export default function PlaybackSourceSelector({
  className,
  onPlay,
  defaultSource = 'search',
  initialSearchQuery,
}: PlaybackSourceSelectorProps) {
  const { t } = useTranslation();
  const { error, handleError, clearError } = useErrorHandling({
    component: 'PlaybackSourceSelector',
  });
  const [selectedSource, setSelectedSource] = useState<PlaybackSource>(defaultSource);
  const [searchQuery, setSearchQuery] = useState('');
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState('');
  const [localFiles, setLocalFiles] = useState<LocalFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadLocalFiles = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await Api.getLocalFiles();
      setLocalFiles(response.files || []);
    } catch (error) {
      handleError(error, { action: 'loadLocalFiles' });
      setLocalFiles([]);
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  // Load local files when local source is selected
  useEffect(() => {
    if (selectedSource === 'local') {
      loadLocalFiles();
    }
  }, [selectedSource, loadLocalFiles]);

  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSelectedSource('search');
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  const formatDuration = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  const handlePlay = useCallback(async () => {
    let value = '';
    let options = {};

    switch (selectedSource) {
      case 'search':
        if (!searchQuery.trim()) return;
        value = searchQuery.trim();
        options = { type: 'search' };
        break;

      case 'playlist':
        if (!playlistUrl.trim()) return;
        value = playlistUrl.trim();
        options = { type: 'playlist' };
        break;

      case 'local': {
        if (!selectedFile) return;
        const file = localFiles.find((f) => f.id === selectedFile);
        if (!file) return;
        value = file.filePath;
        options = { type: 'local', fileName: file.originalName };
        break;
      }
    }

    try {
      setIsLoading(true);

      // Call the play API with appropriate parameters
      if (selectedSource === 'search') {
        await Api.executeSlash('play', { query: value });
      } else if (selectedSource === 'playlist') {
        await Api.executeSlash('play', { playlist: value });
      } else if (selectedSource === 'local') {
        await Api.executeSlash('play', { file: value });
      }

      // Call the callback if provided
      if (onPlay) {
        onPlay(selectedSource, value, options);
      }
    } catch (error) {
      handleError(error, { action: 'play' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedSource, searchQuery, playlistUrl, selectedFile, localFiles, onPlay, handleError]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handlePlay();
      }
    },
    [handlePlay],
  );

  const canPlay = useCallback(() => {
    switch (selectedSource) {
      case 'search':
        return searchQuery.trim().length > 0;
      case 'playlist':
        return playlistUrl.trim().length > 0;
      case 'local':
        return selectedFile.length > 0;
      default:
        return false;
    }
  }, [selectedSource, searchQuery, playlistUrl, selectedFile]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="h-5 w-5" />
          {t('musicPlayer.sources.title')}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error Display */}
        {error && (
          <ErrorDisplay
            error={error}
            onDismiss={clearError}
            variant="inline"
            context={{ component: 'PlaybackSourceSelector' }}
          />
        )}

        {/* Source Type Selector */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={selectedSource === 'search' ? 'default' : 'outline'}
            onClick={() => setSelectedSource('search')}
            className="flex items-center gap-2"
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">{t('musicPlayer.sources.search')}</span>
          </Button>

          <Button
            variant={selectedSource === 'playlist' ? 'default' : 'outline'}
            onClick={() => setSelectedSource('playlist')}
            className="flex items-center gap-2"
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">{t('musicPlayer.sources.playlist')}</span>
          </Button>

          <Button
            variant={selectedSource === 'local' ? 'default' : 'outline'}
            onClick={() => setSelectedSource('local')}
            className="flex items-center gap-2"
          >
            <FolderOpen className="h-4 w-4" />
            <span className="hidden sm:inline">{t('musicPlayer.sources.localFiles')}</span>
          </Button>
        </div>

        {/* Dynamic Input Fields */}
        <div className="space-y-3">
          {selectedSource === 'search' && (
            <div className="space-y-2">
              <Label htmlFor="search-input">{t('musicPlayer.sources.search')}</Label>
              <div className="flex gap-2">
                <Input
                  id="search-input"
                  placeholder={t('musicPlayer.sources.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1"
                />
                <Button onClick={handlePlay} disabled={!canPlay() || isLoading} size="icon">
                  {isLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Search for music on YouTube, Spotify, or other sources</p>
            </div>
          )}

          {selectedSource === 'playlist' && (
            <div className="space-y-2">
              <Label htmlFor="playlist-input">{t('musicPlayer.sources.playlist')}</Label>
              <div className="flex gap-2">
                <Input
                  id="playlist-input"
                  placeholder={t('musicPlayer.sources.playlistPlaceholder')}
                  value={playlistUrl}
                  onChange={(e) => setPlaylistUrl(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1"
                />
                <Button onClick={handlePlay} disabled={!canPlay() || isLoading} size="icon">
                  {isLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter a playlist URL from YouTube, Spotify, or other platforms
              </p>
            </div>
          )}

          {selectedSource === 'local' && (
            <div className="space-y-2">
              <Label htmlFor="file-select">{t('musicPlayer.sources.localFiles')}</Label>
              <div className="flex gap-2">
                <Select value={selectedFile} onValueChange={setSelectedFile}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={t('musicPlayer.sources.selectFile')} />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoading ? (
                      <SelectItem value="loading" disabled>
                        Loading files...
                      </SelectItem>
                    ) : localFiles.length === 0 ? (
                      <SelectItem value="empty" disabled>
                        No local files available
                      </SelectItem>
                    ) : (
                      localFiles.map((file) => (
                        <SelectItem key={file.id} value={file.id}>
                          <div className="flex items-center gap-2">
                            <Music className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{file.metadata?.title || file.originalName}</div>
                              {file.metadata?.artist && (
                                <div className="text-xs text-muted-foreground">
                                  {file.metadata.artist}
                                  {file.metadata.duration && <span> • {formatDuration(file.metadata.duration)}</span>}
                                </div>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

                <Button onClick={handlePlay} disabled={!canPlay() || isLoading} size="icon">
                  {isLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {localFiles.length} local file{localFiles.length !== 1 ? 's' : ''} available
                </p>
                <Button variant="ghost" size="sm" onClick={loadLocalFiles} disabled={isLoading}>
                  {t('common.refresh')}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Play Button (Alternative Layout) */}
        <div className="pt-2">
          <Button onClick={handlePlay} disabled={!canPlay() || isLoading} className="w-full" size="lg">
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                Loading...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                {t('musicPlayer.controls.play')}{' '}
                {selectedSource === 'search' ? 'Search' : selectedSource === 'playlist' ? 'Playlist' : 'Local File'}
              </>
            )}
          </Button>
        </div>

        {/* Source Information */}
        <div className="text-xs text-muted-foreground space-y-1">
          {selectedSource === 'search' && <p>• Search across multiple music platforms</p>}
          {selectedSource === 'playlist' && <p>• Supports YouTube, Spotify, and other playlist URLs</p>}
          {selectedSource === 'local' && <p>• Play from uploaded audio files (MP3, WAV, FLAC, OGG)</p>}
        </div>
      </CardContent>
    </Card>
  );
}
