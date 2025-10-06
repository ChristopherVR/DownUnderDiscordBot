import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useBotStore } from '@/stores/useBotStore';
import { Music, Play, Pause, Square } from 'lucide-react';

export default function CurrentSongDisplay() {
  const player = useBotStore((state) => state.player);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = () => {
    switch (player.status) {
      case 'playing':
        return <Play className="h-4 w-4 text-green-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'stopped':
        return <Square className="h-4 w-4 text-gray-500" />;
      default:
        return <Music className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (player.status) {
      case 'playing':
        return 'default';
      case 'paused':
        return 'secondary';
      case 'stopped':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const progressPercentage = player.track?.duration ? (player.position / player.track.duration) * 100 : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Music className="h-5 w-5" />
          Now Playing
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {player.track ? (
          <>
            <div className="flex items-start gap-3">
              {player.track.cover && (
                <img
                  src={player.track.cover}
                  alt="Album cover"
                  className="w-16 h-16 rounded-md object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">{player.track.title}</h3>
                <p className="text-muted-foreground truncate">{player.track.artist}</p>
                <div className="flex items-center gap-2 mt-2">
                  {getStatusIcon()}
                  <Badge variant={getStatusColor()}>
                    {player.status.charAt(0).toUpperCase() + player.status.slice(1)}
                  </Badge>
                  <Badge variant="outline">{player.track.source}</Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Progress value={progressPercentage} className="h-2" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{formatTime(player.position)}</span>
                <span>{formatTime(player.track.duration)}</span>
              </div>
            </div>

            {player.queue.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground mb-2">Queue ({player.queue.length} tracks)</p>
                <div className="space-y-1">
                  {player.queue.slice(0, 3).map((track, index) => (
                    <div key={track.id} className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground w-4">{player.currentIndex + index + 1}</span>
                      <span className="truncate">{track.title}</span>
                      <span className="text-muted-foreground">-</span>
                      <span className="text-muted-foreground truncate">{track.artist}</span>
                    </div>
                  ))}
                  {player.queue.length > 3 && (
                    <p className="text-xs text-muted-foreground">+{player.queue.length - 3} more tracks</p>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Music className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No track currently playing</p>
            <p className="text-sm">Start playing music to see it here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
