import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Headphones, TerminalSquare, ListMusic, Users, CirclePlay } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBotStore } from '@/stores/useBotStore';

export function Sidebar() {
  const { t } = useTranslation('ui');
  const { pathname } = useLocation();
  const player = useBotStore((state) => state.player);
  const status = useBotStore((state) => state.status);

  const navItems = [
    {
      to: '/',
      label: t('navigation.dashboard', 'Dashboard'),
      icon: LayoutDashboard,
    },
    {
      to: '/player',
      label: t('navigation.musicPlayer', 'Music Player'),
      icon: Headphones,
    },
    {
      to: '/commands',
      label: t('navigation.commandInvocation', 'Commands'),
      icon: TerminalSquare,
    },
    {
      to: '/logs',
      label: t('navigation.auditLogs', 'Audit Logs'),
      icon: ListMusic,
    },
    {
      to: '/instances',
      label: t('navigation.botManagement', 'Bot Management'),
      icon: Users,
    },
  ];

  const currentTrack = player.track;

  return (
    <aside className="sidebar hidden w-72 flex-col border-r border-white/5 bg-sidebar/80 p-6 text-sidebar-foreground shadow-2xl shadow-black/20 backdrop-blur-2xl md:flex">
      <div className="sidebar-gradient pointer-events-none absolute inset-0 -z-10 opacity-95" aria-hidden="true" />

      <div className="flex items-center gap-3 text-white/90">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-semibold">
          <span>DB</span>
        </div>
        <div>
          <p className="text-lg font-semibold leading-none">{t('app.title', 'Discord Bot Dashboard')}</p>
          <p className="text-xs text-white/60">{t('dashboard.welcome', 'Control every beat')}</p>
        </div>
      </div>

      <nav className="mt-8 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white/70 transition-all duration-200 hover:bg-white/10 hover:text-white',
                isActive && 'bg-white/15 text-white shadow-lg shadow-black/30 backdrop-blur',
              )}
            >
              <item.icon className={cn('h-5 w-5 transition-colors duration-200', isActive ? 'text-primary' : 'text-white/60 group-hover:text-primary')} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-10 rounded-3xl border border-white/5 bg-white/5 p-5 text-white/80 shadow-inner">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary">
            <CirclePlay className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">
              {t('musicPlayer.currentTrack', 'Now Playing')}
            </p>
            <p className="truncate text-sm font-semibold text-white">
              {currentTrack?.title ?? t('musicPlayer.noTrack', 'No track selected')}
            </p>
            <p className="truncate text-xs text-white/60">
              {currentTrack?.artist ?? status?.serverName ?? t('botManagement.noInstances', 'No bot instances found')}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-auto space-y-4 pt-8 text-white/60">
        <div className="rounded-3xl border border-white/5 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-white/40">{t('status.connected', 'Connected to')}</p>
          <p className="mt-2 text-sm font-semibold text-white">
            {status?.serverName || t('dashboard.title', 'Dashboard Overview')}
          </p>
          <p className="text-xs text-white/50">{status?.channelName || t('musicPlayer.queue.empty', 'Queue is empty')}</p>
        </div>
        <p className="text-xs">{t('app.version', 'v3 - React + shadcn')}</p>
      </div>
    </aside>
  );
}
