import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Wifi, WifiOff } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useBotStore } from '@/stores/useBotStore';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function Topbar() {
  const { t } = useTranslation('ui');
  const status = useBotStore((state) => state.status);
  const wsConnected = useBotStore((state) => state.wsConnected);
  const wsReconnecting = useBotStore((state) => state.wsReconnecting);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const navItems = [
    { to: '/', label: t('navigation.dashboard', 'Dashboard') },
    { to: '/player', label: t('navigation.musicPlayer', 'Music Player') },
    { to: '/commands', label: t('navigation.commandInvocation', 'Commands') },
    { to: '/logs', label: t('navigation.auditLogs', 'Audit Logs') },
    { to: '/instances', label: t('navigation.botManagement', 'Bot Management') },
  ];

  const connectionLabel = wsReconnecting
    ? t('websocket.reconnecting', 'Reconnecting...')
    : wsConnected
      ? t('websocket.connected', 'Connected')
      : t('websocket.disconnected', 'Disconnected');

  const handleSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    navigate('/player', { state: { searchQuery: trimmed } });
    setSearchTerm('');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span
              className={cn(
                'inline-flex h-3 w-3 flex-shrink-0 rounded-full transition-colors',
                wsConnected ? 'bg-primary shadow-[0_0_12px_rgba(29,185,84,0.75)]' : 'bg-destructive shadow-[0_0_12px_rgba(244,63,94,0.55)]',
              )}
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {status?.serverName || t('dashboard.title', 'Dashboard Overview')}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {status?.channelName || t('musicPlayer.queue.empty', 'Queue is empty')}
              </p>
            </div>
            <Badge
              variant={wsConnected ? 'default' : 'destructive'}
              className="ml-auto flex items-center gap-1 whitespace-nowrap bg-white/10 text-foreground"
            >
              {wsConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {connectionLabel}
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('common.search', { defaultValue: 'Search' })}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleSearch(searchTerm);
                }
              }}
              className="w-full rounded-full border-white/10 bg-white/5 pl-10 text-sm text-foreground placeholder:text-muted-foreground/70"
            />
          </div>

          <nav className="flex flex-wrap gap-2 md:hidden">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-foreground/80 backdrop-blur transition hover:border-primary/50 hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}



