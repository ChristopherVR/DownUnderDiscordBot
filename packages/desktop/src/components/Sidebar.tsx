import { NavLink } from 'react-router-dom';
import { useBotStore } from '@/stores/useBotStore';
import {
  Music,
  ListMusic,
  Search,
  Library,
  Settings,
  ChevronLeft,
  ChevronRight,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', label: 'Now Playing', icon: Music },
  { to: '/queue', label: 'Queue', icon: ListMusic },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/library', label: 'Library', icon: Library },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const collapsed = useBotStore((s) => s.sidebarCollapsed);
  const toggle = useBotStore((s) => s.toggleSidebar);
  const connected = useBotStore((s) => s.connection.connected);

  return (
    <aside
      className={cn(
        'fixed left-0 top-9 z-30 flex flex-col border-r border-white/[0.04] bg-[#0a0a0f]/95 backdrop-blur-2xl transition-all duration-300 ease-out',
        collapsed ? 'w-[68px]' : 'w-[220px]',
      )}
      style={{ height: 'calc(100vh - 2.25rem - 5rem)' }}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 py-5', collapsed && 'justify-center px-0')}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-spotify-green to-emerald-400 shadow-glow-green">
          <Music size={16} className="text-black" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <span className="text-sm font-bold tracking-tight text-white">Down Under</span>
            <p className="text-[10px] font-medium uppercase tracking-widest text-white/30">Music Bot</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="mt-1 flex flex-1 flex-col gap-0.5 px-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-200',
                isActive
                  ? 'bg-white/[0.08] text-white'
                  : 'text-white/40 hover:bg-white/[0.04] hover:text-white/70',
                collapsed && 'justify-center px-0',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-spotify-green to-emerald-400" />
                )}
                <Icon size={18} className={cn(isActive && 'text-spotify-green')} />
                {!collapsed && <span>{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Connection status */}
      <div className="border-t border-white/[0.04] px-3 py-3">
        <div className={cn('flex items-center gap-2', collapsed && 'justify-center')}>
          {connected ? (
            <>
              <div className="relative">
                <Wifi size={14} className="text-spotify-green" />
                <div className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse rounded-full bg-spotify-green" />
              </div>
              {!collapsed && <span className="text-[11px] font-medium text-white/30">Connected</span>}
            </>
          ) : (
            <>
              <WifiOff size={14} className="text-red-400/70" />
              {!collapsed && <span className="text-[11px] font-medium text-red-400/50">Disconnected</span>}
            </>
          )}
        </div>
      </div>

      <button
        onClick={toggle}
        className="flex h-9 items-center justify-center border-t border-white/[0.04] text-white/20 transition-colors hover:bg-white/[0.04] hover:text-white/50"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
}
