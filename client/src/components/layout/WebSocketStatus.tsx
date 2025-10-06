import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useBotStore } from '@/stores/useBotStore';
import { getWebSocketStatus } from '@/lib/ws';
import { WifiOff, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export function WebSocketStatus() {
  const { t } = useTranslation('ui');
  const { wsConnected, wsReconnecting } = useBotStore();
  const [status, setStatus] = useState(getWebSocketStatus());

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(getWebSocketStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (wsConnected) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div
        className={cn(
          'flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold shadow-lg shadow-black/20 backdrop-blur-xl transition',
          wsReconnecting
            ? 'border-amber-400/40 bg-amber-300/15 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-100'
            : 'border-red-400/40 bg-red-300/15 text-red-900 dark:border-red-500/40 dark:bg-red-500/20 dark:text-red-100',
        )}
      >
        {wsReconnecting ? (
          <>
            <RotateCcw className="h-4 w-4 animate-spin" />
            <span>{t('websocket.reconnecting', 'Reconnecting...')}</span>
            {status.attempts > 0 && <span className="text-[10px] opacity-75">({status.attempts}/10)</span>}
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span>{t('websocket.disconnected', 'Connection lost')}</span>
          </>
        )}
      </div>
    </div>
  );
}
