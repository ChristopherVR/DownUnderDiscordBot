import { useState, useEffect, useRef } from 'react';
import { Minus, Square, X, Monitor, Radio, Wifi, WifiOff, Server, Clock, Activity } from 'lucide-react';
import AppIcon from '@/components/AppIcon';
import type { Window } from '@tauri-apps/api/window';
import { useBotStore } from '@/stores/useBotStore';

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function StatusPopover({ onClose }: { onClose: () => void }) {
  const connected = useBotStore((s) => s.connection.connected);
  const botUser = useBotStore((s) => s.botUser);
  const playbackMode = useBotStore((s) => s.playbackMode);
  const connection = useBotStore((s) => s.connection);
  const dashboard = useBotStore((s) => s.dashboard);
  const focusedGuildId = useBotStore((s) => s.focusedGuildId);
  const guilds = useBotStore((s) => s.guilds);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const focusedGuild = guilds.find((g) => g.id === focusedGuildId);

  return (
    <div
      ref={popoverRef}
      className="absolute right-[134px] top-9 z-[60] w-72 overflow-hidden rounded-lg border shadow-xl animate-in fade-in slide-in-from-top-1 duration-150"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--playerbar-border)',
      }}
    >
      {/* Playback Mode */}
      <div className="px-4 pt-3 pb-2">
        <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-t-faint">
          <Activity size={11} />
          Playback
        </div>
        <div className="flex items-center gap-2.5">
          {playbackMode === 'local' ? (
            <div
              className="flex h-7 w-7 items-center justify-center rounded-md"
              style={{ background: 'var(--accent)', opacity: 0.15 }}
            >
              <Monitor size={14} style={{ color: 'var(--accent)' }} />
            </div>
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-purple-500/15">
              <Radio size={14} className="text-purple-400" />
            </div>
          )}
          <div>
            <p className="text-[12px] font-medium text-t-primary">
              {playbackMode === 'local' ? 'Local Playback' : 'Bot Playback'}
            </p>
            <p className="text-[10px] text-t-faint">
              {playbackMode === 'local' ? 'Audio plays through your speakers' : 'Audio plays through Discord voice'}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-3 border-t" style={{ borderColor: 'var(--playerbar-border)' }} />

      {/* Bot Connection */}
      <div className="px-4 pt-2 pb-2">
        <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-t-faint">
          <Server size={11} />
          Bot Connection
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-t-faint">Status</span>
            <div className="flex items-center gap-1.5">
              {connected ? (
                <>
                  <div className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
                  <span className="text-[11px] font-medium" style={{ color: 'var(--accent)' }}>
                    Online
                  </span>
                </>
              ) : botUser ? (
                <>
                  <div className="h-1.5 w-1.5 rounded-full bg-red-400" />
                  <span className="text-[11px] font-medium text-red-400">Offline</span>
                </>
              ) : (
                <>
                  <div className="h-1.5 w-1.5 rounded-full bg-neutral-500" />
                  <span className="text-[11px] font-medium text-t-faint">Not configured</span>
                </>
              )}
            </div>
          </div>
          {botUser && (
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-t-faint">Bot</span>
              <span className="text-[11px] font-medium text-t-secondary">{botUser.username}</span>
            </div>
          )}
          {connected && (
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-t-faint">Server</span>
              <span className="text-[11px] font-medium text-t-secondary">
                {connection.host}:{connection.port}
              </span>
            </div>
          )}
          {focusedGuild && (
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-t-faint">Guild</span>
              <span className="text-[11px] font-medium text-t-secondary truncate max-w-[140px]">
                {focusedGuild.name}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Dashboard stats (if available) */}
      {dashboard && (
        <>
          <div className="mx-3 border-t" style={{ borderColor: 'var(--playerbar-border)' }} />
          <div className="px-4 pt-2 pb-3">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-t-faint">
              <Clock size={11} />
              Stats
            </div>
            <div className="space-y-1.5">
              {dashboard.bot.uptime > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-t-faint">Uptime</span>
                  <span className="text-[11px] font-medium text-t-secondary">{formatUptime(dashboard.bot.uptime)}</span>
                </div>
              )}
              {dashboard.bot.ping > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-t-faint">Ping</span>
                  <span className="text-[11px] font-medium text-t-secondary">{dashboard.bot.ping}ms</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-t-faint">Guilds</span>
                <span className="text-[11px] font-medium text-t-secondary">{dashboard.bot.guildCount}</span>
              </div>
              {dashboard.websocket && (
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-t-faint">WS Clients</span>
                  <span className="text-[11px] font-medium text-t-secondary">
                    {dashboard.websocket.activeClients}/{dashboard.websocket.totalClients}
                  </span>
                </div>
              )}
              {dashboard.instances && (
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-t-faint">Instances</span>
                  <span className="text-[11px] font-medium text-t-secondary">
                    {dashboard.instances.health.onlineInstances}/{dashboard.instances.health.totalInstances} online
                  </span>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function TitleBar() {
  const [appWindow, setAppWindow] = useState<Window | null>(null);
  const [showStatus, setShowStatus] = useState(false);
  const connected = useBotStore((s) => s.connection.connected);
  const botUser = useBotStore((s) => s.botUser);
  const playbackMode = useBotStore((s) => s.playbackMode);

  useEffect(() => {
    // Only import when running inside Tauri
    if ('__TAURI_INTERNALS__' in window) {
      import('@tauri-apps/api/window').then((mod) => {
        setAppWindow(mod.getCurrentWindow());
      });
    }
  }, []);

  const handleMinimize = () => {
    // Hide the window to the system tray instead of minimizing to taskbar
    appWindow?.hide();
  };

  return (
    <div
      data-tauri-drag-region
      className="fixed left-0 right-0 top-0 z-50 flex h-9 select-none items-center justify-between backdrop-blur-xl"
      style={{
        borderBottom: '1px solid var(--playerbar-border)',
        background: 'var(--titlebar-bg)',
      }}
    >
      <div data-tauri-drag-region className="flex flex-1 items-center gap-2 pl-4">
        <div
          className="flex h-5 w-5 items-center justify-center rounded"
          style={{ background: 'var(--gradient-accent)' }}
        >
          <AppIcon size={10} style={{ color: 'var(--btn-primary-fg)' }} />
        </div>
        <span className="text-[11px] font-medium tracking-wide text-t-tertiary">Down Under</span>
      </div>

      {/* Status indicators — clickable */}
      <div className="relative flex items-center">
        <button
          onClick={() => setShowStatus((v) => !v)}
          className="flex h-9 items-center gap-3 px-3 text-t-tertiary transition-colors hover:text-t-primary"
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--nav-hover-bg)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          title="System status"
        >
          {/* Playback mode pill */}
          <div className="flex items-center gap-1.5">
            {playbackMode === 'local' ? (
              <Monitor size={12} style={{ color: 'var(--accent)' }} />
            ) : (
              <Radio size={12} className="text-purple-400" />
            )}
            <span className="text-[10px] font-medium text-t-faint">{playbackMode === 'local' ? 'Local' : 'Bot'}</span>
          </div>

          {/* Separator */}
          <div className="h-3 w-px" style={{ background: 'var(--playerbar-border)' }} />

          {/* Connection indicator */}
          <div className="flex items-center gap-1.5">
            {connected ? (
              <>
                <div className="relative">
                  <Wifi size={12} style={{ color: 'var(--accent)' }} />
                  <div
                    className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full"
                    style={{ background: 'var(--accent)' }}
                  />
                </div>
                <span className="text-[10px] font-medium" style={{ color: 'var(--accent)' }}>
                  Online
                </span>
              </>
            ) : botUser ? (
              <>
                <WifiOff size={12} className="text-red-400/70" />
                <span className="text-[10px] font-medium text-red-400/60">Offline</span>
              </>
            ) : (
              <>
                <WifiOff size={12} className="text-t-faint opacity-50" />
                <span className="text-[10px] font-medium text-t-faint opacity-50">No bot</span>
              </>
            )}
          </div>
        </button>

        {showStatus && <StatusPopover onClose={() => setShowStatus(false)} />}
      </div>

      <div className="flex">
        <button
          onClick={handleMinimize}
          title="Minimize to tray"
          className="flex h-9 w-11 items-center justify-center text-t-tertiary transition-colors hover:text-t-primary"
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--nav-hover-bg)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <Minus size={14} />
        </button>
        <button
          onClick={() => appWindow?.toggleMaximize()}
          className="flex h-9 w-11 items-center justify-center text-t-tertiary transition-colors hover:text-t-primary"
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--nav-hover-bg)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <Square size={11} />
        </button>
        <button
          onClick={() => appWindow?.close()}
          title="Close to tray"
          className="flex h-9 w-11 items-center justify-center text-t-tertiary transition-colors hover:bg-red-500/80 hover:text-white"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
