import { useEffect, useState } from 'react';
import { Api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ConnectionsPanel() {
  const [items, setItems] = useState<unknown[]>([]);
  const load = async () => {
    const r = await Api.getConnections();
    setItems(r.items);
  };
  useEffect(() => {
    load();
  }, []);
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="font-semibold">Connections</div>
        <div className="grid md:grid-cols-2 gap-2">
          {items.map((c) => (
            <div key={c.id} className="flex items-center justify-between border rounded px-3 py-2">
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.type?.toUpperCase()}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={c.connected ? 'default' : 'secondary'}>{c.connected ? 'connected' : 'idle'}</Badge>
                {c.connected ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await Api.disconnect(c.id);
                      await load();
                    }}
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={async () => {
                      await Api.connect(c.id);
                      await load();
                    }}
                  >
                    Connect
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
