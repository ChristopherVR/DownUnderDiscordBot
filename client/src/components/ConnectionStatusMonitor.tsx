import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Api } from '@/lib/api';
import { useBotStore } from '@/stores/useBotStore';
import { Wifi, WifiOff, Volume2, Hash, RefreshCw } from 'lucide-react';
import type { ConnectionInfo } from 'discord-dashboard-shared';

export default function ConnectionStatusMonitor() {
  const [connections, setConnections] = useState<ConnectionInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const wsConnected = useBotStore((state) => state.wsConnected);
  const wsReconnecting = useBotStore((state) => state.wsReconnecting);

  const loadConnections = async () => {
    setLoading(true);
    try {
      const response = await Api.getConnections();
      setConnections(response.items);
    } catch (error) {
      console.error('Failed to load connections:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConnections();
  }, []);

  const handleConnect = async (connection: ConnectionInfo) => {
    if (connection.type !== 'voice') return;
    try {
      await Api.connect(connection.id);
      await loadConnections();
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  const handleDisconnect = async (connection: ConnectionInfo) => {
    if (connection.type !== 'voice') return;
    try {
      await Api.disconnect(connection.id);
      await loadConnections();
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  const getConnectionIcon = (type: string) => {
    return type === 'voice' ? <Volume2 className="h-4 w-4" /> : <Hash className="h-4 w-4" />;
  };

  const connectedCount = connections.filter((c) => c.connected).length;
  const totalCount = connections.length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {wsConnected ? <Wifi className="h-5 w-5 text-green-500" /> : <WifiOff className="h-5 w-5 text-red-500" />}
            Connection Status
          </CardTitle>
          <Button size="sm" variant="outline" onClick={loadConnections} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* WebSocket Status */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium">Dashboard Connection</div>
            {wsReconnecting && <RefreshCw className="h-3 w-3 animate-spin text-yellow-500" />}
          </div>
          <Badge variant={wsConnected ? 'default' : 'destructive'}>
            {wsReconnecting ? 'Reconnecting' : wsConnected ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>

        {/* Connection Summary */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="text-sm font-medium">Bot Connections</div>
          <Badge variant={connectedCount > 0 ? 'default' : 'secondary'}>
            {connectedCount}/{totalCount} Connected
          </Badge>
        </div>

        {/* Individual Connections */}
        <div className="space-y-2">
          {connections.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <WifiOff className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No connections configured</p>
            </div>
          ) : (
            connections.map((connection) => {
              const isVoice = connection.type === 'voice';
              return (
                <div key={connection.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getConnectionIcon(connection.type)}
                    <div>
                      <div className="font-medium">{connection.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {connection.type.toUpperCase()} • Guild: {connection.guildId ?? '—'}
                      </div>
                      {!isVoice && (
                        <p className="text-[11px] text-muted-foreground mt-1">Voice control unavailable for text channels</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={connection.connected ? 'default' : 'secondary'}>
                      {connection.connected ? 'Connected' : 'Idle'}
                    </Badge>

                    {connection.connected ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDisconnect(connection)}
                        disabled={!isVoice}
                      >
                        Disconnect
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => handleConnect(connection)} disabled={!isVoice}>
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
