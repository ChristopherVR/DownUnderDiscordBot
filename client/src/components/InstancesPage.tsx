import { useCallback, useEffect, useState } from 'react';
import { Api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { InstanceInfo } from 'discord-dashboard-shared';

interface InstancesData {
  guildId: string;
  instances: Record<string, InstanceInfo>;
}

export default function InstancesPage() {
  const [guildId, setGuildId] = useState<string>('');
  const [data, setData] = useState<InstancesData | null>(null);
  const load = useCallback(async (targetGuildId: string = guildId) => {
    const instances = await Api.listInstances(targetGuildId);
    setData(instances);
  }, [guildId]);
  useEffect(() => {
    if (guildId) {
      void load();
    }
  }, [guildId, load]);

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex gap-2">
          <Input placeholder="Guild ID" value={guildId} onChange={(e) => setGuildId(e.target.value)} className="w-72" />
          <Button onClick={() => load()}>Load</Button>
        </div>
        {!data ? (
          <div className="text-sm">Enter a Guild ID and Load.</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.values(data.instances ?? {}).map((instance: InstanceInfo) => (
              <div key={instance.instanceId} className="border rounded p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{instance.instanceId}</div>
                  <Badge variant={instance.online ? 'default' : 'destructive'}>
                    {instance.online ? 'online' : 'offline'}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  last: {new Date(instance.lastHeartbeat).toLocaleString()}
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant={instance.isActive ? 'secondary' : 'default'}
                    onClick={async () => {
                      await Api.makeActive(data.guildId, instance.instanceId);
                      await load();
                    }}
                  >
                    {instance.isActive ? 'Active' : 'Make Active'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await Api.ping(instance.instanceId);
                    }}
                  >
                    Ping
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={async () => {
                      await Api.shutdown(data.guildId, instance.instanceId);
                      await load();
                    }}
                  >
                    Shutdown
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
