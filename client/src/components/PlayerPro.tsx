import { useMemo, useState } from 'react';
import { useBotStore } from '@/stores/useBotStore';
import { Api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipForward, Square, Search, Volume2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { SearchResult } from 'discord-dashboard-shared';

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${sec}`;
}

export default function PlayerPro() {
  const player = useBotStore((s) => s.player);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<unknown[]>([]);

  const progress = useMemo(() => {
    const d = player.track?.duration ?? 0;
    const p = player.position ?? 0;
    return d ? Math.min(100, (p / d) * 100) : 0;
  }, [player.position, player.track?.duration]);

  return (
    <Card className="overflow-hidden border-none shadow-lg">
      <div className="relative h-56 w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-[shimmer_14s_ease_infinite] opacity-70"
          style={{ backgroundSize: '200% 200%' }}
        />
        <div className="absolute inset-0 backdrop-blur-sm" />
        <div className="absolute bottom-4 left-4 text-white drop-shadow">
          <div className="text-2xl font-bold">{player.track?.title ?? 'Nothing playing'}</div>
          <div className="text-sm opacity-90">{player.track?.artist ?? '—'}</div>
        </div>
      </div>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
            </div>
            <div className="text-xs text-muted-foreground w-20 text-right">
              {fmt(player.position)} / {player.track ? fmt(player.track.duration) : '0:00'}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {player.status !== 'playing' ? (
              <Button size="lg" onClick={() => Api.resume()}>
                <Play className="h-5 w-5 mr-2" />
                Play
              </Button>
            ) : (
              <Button size="lg" variant="secondary" onClick={() => Api.pause()}>
                <Pause className="h-5 w-5 mr-2" />
                Pause
              </Button>
            )}
            <Button variant="secondary" onClick={() => Api.stop()}>
              <Square className="h-5 w-5 mr-2" />
              Stop
            </Button>
            <Button variant="secondary" onClick={() => Api.next()}>
              <SkipForward className="h-5 w-5 mr-2" />
              Next
            </Button>
            <div className="flex items-center gap-2 ml-auto">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <Slider
                className="w-44"
                defaultValue={[player.volume]}
                max={100}
                step={1}
                onValueCommit={(v) => Api.executeSlash('volume', { amount: v[0] })}
              />
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Search tracks</DialogTitle>
                </DialogHeader>
                <div className="flex gap-2">
                  <Input
                    placeholder="search..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter') {
                        const r = await Api.search(q);
                        setResults(r.items);
                      }
                    }}
                  />
                  <Button
                    onClick={async () => {
                      const r = await Api.search(q);
                      setResults(r.items);
                    }}
                  >
                    Go
                  </Button>
                </div>
                <div className="mt-4 space-y-2 max-h-80 overflow-auto">
                  {results.map((track: SearchResult) => (
                    <div key={track.id} className="flex items-center justify-between gap-3 border rounded-md p-2">
                      <div>
                        <div className="font-medium">{track.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {track.artist} • {fmt(track.duration || 0)}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={async () => {
                          await Api.play(track.id);
                          setOpen(false);
                        }}
                      >
                        Play
                      </Button>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
