import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Api } from '@/lib/api';
import type { InstanceInfo } from 'discord-dashboard-shared';

export interface BotInstanceCardProps {
  guildId: string;
  instance: InstanceInfo;
  onUpdate: () => void;
}

export default function BotInstanceCard({ guildId, instance, onUpdate }: BotInstanceCardProps) {
  const handleMakeActive = async () => {
    try {
      await Api.makeActive(guildId, instance.instanceId);
      onUpdate();
    } catch (error) {
      console.error('Failed to make instance active:', error);
    }
  };

  const handlePing = async () => {
    try {
      await Api.ping(instance.instanceId);
    } catch (error) {
      console.error('Failed to ping instance:', error);
    }
  };

  const handleShutdown = async () => {
    try {
      await Api.shutdown(guildId, instance.instanceId);
      onUpdate();
    } catch (error) {
      console.error('Failed to shutdown instance:', error);
    }
  };

  const formatLastHeartbeat = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString();
  };

  return (
    <Card className={`transition-all ${instance.isActive ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold truncate">{instance.instanceId}</CardTitle>
          <div className="flex items-center gap-2">
            {instance.isActive && (
              <Badge variant="secondary" className="text-xs">
                Active
              </Badge>
            )}
            <Badge variant={instance.online ? 'default' : 'destructive'}>
              {instance.online ? 'Online' : 'Offline'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          {instance.hostname && (
            <div>
              <span className="text-muted-foreground">Host:</span>
              <div className="font-medium truncate">{instance.hostname}</div>
            </div>
          )}
          {instance.pid && (
            <div>
              <span className="text-muted-foreground">PID:</span>
              <div className="font-medium">{instance.pid}</div>
            </div>
          )}
          {instance.shardId !== undefined && (
            <div>
              <span className="text-muted-foreground">Shard:</span>
              <div className="font-medium">{instance.shardId}</div>
            </div>
          )}
          <div>
            <span className="text-muted-foreground">Last seen:</span>
            <div className="font-medium">{formatLastHeartbeat(instance.lastHeartbeat)}</div>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant={instance.isActive ? 'secondary' : 'default'}
            onClick={handleMakeActive}
            disabled={instance.isActive || !instance.online}
          >
            {instance.isActive ? 'Active' : 'Make Active'}
          </Button>

          <Button size="sm" variant="outline" onClick={handlePing} disabled={!instance.online}>
            Ping
          </Button>

          <Button size="sm" variant="destructive" onClick={handleShutdown} disabled={!instance.online}>
            Shutdown
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
