import { useEffect, useCallback, useState } from 'react';
import { useBotStore } from '@/stores/useBotStore';
import type { DashboardGuild, DashboardInstance } from '@/stores/useBotStore';
import { formatTime } from '@/lib/utils';
import {
  Activity,
  AlertTriangle,
  Bot,
  Clock,
  Cpu,
  Globe,
  Hash,
  Headphones,
  LogIn,
  Loader2,
  Monitor,
  Music,
  OctagonX,
  Play,
  Pause,
  Radio,
  RefreshCw,
  Server,
  Trash2,
  Users,
  WifiOff,
  Zap,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { motion } from 'framer-motion';

// ---------------------------------------------------------------------------
// Small reusable pieces
// ---------------------------------------------------------------------------

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = 'text-t-secondary',
  pulse,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  pulse?: boolean;
}) {
  return (
    <div className="relative flex flex-col gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-md transition-colors hover:border-white/[0.1]">
      <div className="flex items-center gap-2">
        <div className="relative">
          <Icon size={16} className={color} />
          {pulse && (
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-spotify-green animate-pulse" />
          )}
        </div>
        <span className="text-[11px] font-medium uppercase tracking-wider text-t-faint">{label}</span>
      </div>
      <p className="text-2xl font-bold tracking-tight text-t-primary">{value}</p>
      {sub && <p className="text-[11px] text-t-faint">{sub}</p>}
    </div>
  );
}

function formatUptime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// ---------------------------------------------------------------------------
// Heartbeat status badge configuration
// ---------------------------------------------------------------------------

const HEARTBEAT_BADGE: Record<string, { label: string; bg: string; text: string; dot?: string; pulse?: boolean }> = {
  healthy: {
    label: 'Healthy',
    bg: 'bg-spotify-green/10',
    text: 'text-spotify-green',
    dot: 'bg-spotify-green',
    pulse: true,
  },
  missed: { label: 'Missed', bg: 'bg-yellow-500/10', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  late: { label: 'Late', bg: 'bg-orange-500/10', text: 'text-orange-400', dot: 'bg-orange-400' },
  timeout: { label: 'Timeout', bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
  stale: { label: 'Stale', bg: 'bg-zinc-500/10', text: 'text-zinc-400', dot: 'bg-zinc-400' },
  stopped: { label: 'Stopped', bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
};

// ---------------------------------------------------------------------------
// Bot Instance Card
// ---------------------------------------------------------------------------

function InstanceCard({
  instance,
  isThisInstance,
  onForceStop,
  onPing,
}: {
  instance: DashboardInstance;
  isThisInstance: boolean;
  onForceStop?: (instanceId: string) => void;
  onPing?: (instanceId: string) => Promise<{ rttMs: number } | null>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pinging, setPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{ rttMs: number } | 'timeout' | null>(null);
  const shortId = instance.instanceId.slice(0, 8);
  const heartbeatAgo = instance.lastHeartbeat ? Math.round((Date.now() - instance.lastHeartbeat) / 1000) : null;

  const badge = HEARTBEAT_BADGE[instance.heartbeatStatus] ?? HEARTBEAT_BADGE.timeout;
  const canForceStop = !isThisInstance && instance.online && instance.heartbeatStatus !== 'stopped';
  const canPing = instance.online && instance.heartbeatStatus !== 'stopped';

  const handlePing = async () => {
    if (!onPing || pinging) return;
    setPinging(true);
    setPingResult(null);
    try {
      const result = await onPing(instance.instanceId);
      setPingResult(result ?? 'timeout');
    } catch {
      setPingResult('timeout');
    } finally {
      setPinging(false);
      // Auto-clear after 8 seconds
      setTimeout(() => setPingResult(null), 8_000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-md transition-colors hover:border-white/[0.1]"
    >
      {/* Instance header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06]">
          <Cpu size={16} className={instance.online ? 'text-spotify-green' : 'text-t-faint'} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-[13px] font-semibold text-t-primary">{instance.hostname ?? shortId}</p>
            {isThisInstance && (
              <span className="shrink-0 rounded bg-spotify-green/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-spotify-green">
                This
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-t-faint">
            <span className="flex items-center gap-1">
              <Hash size={10} />
              {shortId}
            </span>
            {instance.pid != null && <span>PID {instance.pid}</span>}
            {instance.shardId != null && <span>Shard {instance.shardId}</span>}
          </div>
        </div>
        {/* Heartbeat status badge */}
        <span
          className={`flex items-center gap-1.5 rounded-full ${badge.bg} px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${badge.text}`}
        >
          {badge.dot && (
            <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}${badge.pulse ? ' animate-pulse' : ''}`} />
          )}
          {badge.label}
        </span>
      </div>

      {/* Guilds this instance is connected to */}
      {instance.guilds.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {instance.guilds.map(({ guildId, guildName, isActiveForGuild }) => (
            <div key={guildId} className="flex items-center gap-2 rounded-xl bg-white/[0.03] px-3 py-2">
              <Globe size={12} className="shrink-0 text-t-faint" />
              <span className="min-w-0 flex-1 truncate text-[12px] text-t-tertiary">{guildName}</span>
              {isActiveForGuild ? (
                <span className="shrink-0 rounded bg-spotify-green/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-spotify-green">
                  Active
                </span>
              ) : (
                <span className="shrink-0 rounded bg-white/[0.04] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-t-faint">
                  Standby
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Footer meta + ping + force-stop */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-4 text-[11px] text-t-faint">
          {instance.uptimeSeconds != null && (
            <span className="flex items-center gap-1">
              <Monitor size={11} />
              Up {formatUptime(instance.uptimeSeconds * 1000)}
            </span>
          )}
          {heartbeatAgo != null && (
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {heartbeatAgo < 5 ? 'just now' : `${heartbeatAgo}s ago`}
            </span>
          )}
          {/* Ping result inline */}
          {pingResult && pingResult !== 'timeout' && (
            <span className="flex items-center gap-1 text-spotify-green">
              <Zap size={10} />
              {pingResult.rttMs}ms
            </span>
          )}
          {pingResult === 'timeout' && (
            <span className="flex items-center gap-1 text-red-400">
              <WifiOff size={10} />
              Timeout
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Ping button */}
          {canPing && onPing && (
            <button
              onClick={handlePing}
              disabled={pinging}
              className="flex items-center gap-1 rounded bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold text-t-faint transition-colors hover:bg-cyan-500/10 hover:text-cyan-400 disabled:opacity-40"
              title="Ping this instance"
            >
              {pinging ? <Loader2 size={11} className="animate-spin" /> : <Zap size={11} />}
              {pinging ? 'Pinging...' : 'Ping'}
            </button>
          )}

          {/* Force stop button */}
          {canForceStop &&
            onForceStop &&
            (confirming ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    onForceStop(instance.instanceId);
                    setConfirming(false);
                  }}
                  className="rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-400 transition-colors hover:bg-red-500/30"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="rounded bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold text-t-faint transition-colors hover:bg-white/[0.1]"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirming(true)}
                className="flex items-center gap-1 rounded bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold text-t-faint transition-colors hover:bg-red-500/10 hover:text-red-400"
                title="Force stop this instance"
              >
                <OctagonX size={11} />
                Force Stop
              </button>
            ))}

          {instance.forceStopped && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-red-400">
              <AlertTriangle size={11} />
              Force Stopped
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Guild Player Card
// ---------------------------------------------------------------------------

function GuildCard({
  guild,
  isSelected,
  onSelect,
}: {
  guild: DashboardGuild;
  isSelected: boolean;
  onSelect?: () => void;
}) {
  const { player } = guild;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onSelect}
      className={`flex cursor-pointer flex-col gap-3 rounded-2xl border p-4 backdrop-blur-md transition-colors ${
        isSelected
          ? 'border-spotify-green/30 bg-spotify-green/[0.04] ring-1 ring-spotify-green/10'
          : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]'
      }`}
    >
      {/* Guild header */}
      <div className="flex items-center gap-3">
        {guild.guildIcon ? (
          <img src={guild.guildIcon} alt={guild.guildName} className="h-9 w-9 rounded-xl object-cover" />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06]">
            <Globe size={16} className="text-t-faint" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-[13px] font-semibold text-t-primary">{guild.guildName}</p>
            {isSelected && (
              <span className="shrink-0 rounded bg-spotify-green/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-spotify-green">
                Focused
              </span>
            )}
          </div>
          <p className="text-[11px] text-t-faint">{guild.memberCount.toLocaleString()} members</p>
        </div>
        {player.active ? (
          <span className="flex items-center gap-1.5 rounded-full bg-spotify-green/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-spotify-green">
            <span className="h-1.5 w-1.5 rounded-full bg-spotify-green animate-pulse" />
            {player.isPlaying ? 'Playing' : 'Paused'}
          </span>
        ) : (
          <span className="flex items-center gap-1.5 rounded-full bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-t-faint">
            Idle
          </span>
        )}
      </div>

      {/* Player info */}
      {player.active && player.currentTrack && (
        <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-3">
          {player.currentTrack.thumbnail ? (
            <img
              src={player.currentTrack.thumbnail}
              alt=""
              className="h-10 w-10 rounded-lg object-cover shadow-lg shadow-black/40"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.06]">
              <Music size={14} className="text-t-faint" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold text-t-secondary">{player.currentTrack.title}</p>
            <p className="truncate text-[11px] text-t-faint">{player.currentTrack.artist ?? 'Unknown Artist'}</p>
          </div>
          {player.isPlaying ? (
            <Play size={14} className="shrink-0 text-spotify-green" />
          ) : (
            <Pause size={14} className="shrink-0 text-yellow-400/60" />
          )}
        </div>
      )}

      {/* Footer stats */}
      <div className="flex items-center gap-4 px-1 text-[11px] text-t-faint">
        {player.voiceChannelName && (
          <span className="flex items-center gap-1">
            <Headphones size={11} />
            {player.voiceChannelName}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Music size={11} />
          {player.queueSize} in queue
        </span>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Setup step row
// ---------------------------------------------------------------------------

function SetupStep({
  number,
  title,
  description,
  done,
  active,
  children,
}: {
  number: number;
  title: string;
  description: string;
  done: boolean;
  active: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        done
          ? 'border-spotify-green/20 bg-spotify-green/[0.03]'
          : active
            ? ''
            : 'border-white/[0.04] bg-white/[0.01] opacity-40'
      }`}
      style={
        active && !done
          ? {
              borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)',
              background: 'color-mix(in srgb, var(--accent) 5%, transparent)',
            }
          : undefined
      }
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {done ? (
            <CheckCircle2 size={18} className="text-spotify-green" />
          ) : active ? (
            <Circle size={18} style={{ color: 'var(--accent)' }} />
          ) : (
            <Circle size={18} className="text-t-ghost" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-t-faint">Step {number}</span>
          </div>
          <p
            className={`text-[13px] font-semibold ${done ? 'text-t-tertiary' : active ? 'text-t-primary' : 'text-t-faint'}`}
          >
            {title}
          </p>
          <p className="text-[11px] text-t-faint">{description}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const connected = useBotStore((s) => s.connection.connected);
  const connection = useBotStore((s) => s.connection);
  const player = useBotStore((s) => s.player);
  const dashboard = useBotStore((s) => s.dashboard);
  const dashboardLoading = useBotStore((s) => s.dashboardLoading);
  const fetchDashboard = useBotStore((s) => s.fetchDashboard);
  const forceStopInstance = useBotStore((s) => s.forceStopInstance);
  const clearStaleInstances = useBotStore((s) => s.clearStaleInstances);
  const pingInstance = useBotStore((s) => s.pingInstance);
  const botUser = useBotStore((s) => s.botUser);
  const botConnecting = useBotStore((s) => s.botConnecting);
  const botError = useBotStore((s) => s.botError);
  const connectToBot = useBotStore((s) => s.connectToBot);
  const focusedGuildId = useBotStore((s) => s.focusedGuildId);
  const focusGuild = useBotStore((s) => s.focusGuild);
  const playbackMode = useBotStore((s) => s.playbackMode);
  const fetchGuilds = useBotStore((s) => s.fetchGuilds);
  const setConnection = useBotStore((s) => s.setConnection);
  const connectWs = useBotStore((s) => s.connect);
  const disconnectWs = useBotStore((s) => s.disconnect);

  const [host, setHost] = useState(connection.host);
  const [port, setPort] = useState(connection.port.toString());

  const refresh = useCallback(() => {
    if (connected) fetchDashboard();
  }, [connected, fetchDashboard]);

  /** Ping a specific instance and return the first RTT result (or null on timeout). */
  const handlePing = useCallback(
    async (instanceId: string): Promise<{ rttMs: number } | null> => {
      const result = await pingInstance(instanceId);
      if (result.success && result.responses.length > 0) {
        return { rttMs: result.responses[0].rttMs };
      }
      return null;
    },
    [pingInstance],
  );

  // Fetch guilds when user becomes authenticated
  useEffect(() => {
    if (botUser) fetchGuilds();
  }, [botUser, fetchGuilds]);

  // Auto-fetch dashboard data on mount and every 10s
  useEffect(() => {
    if (!connected) return;
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 10_000);
    return () => clearInterval(interval);
  }, [connected, fetchDashboard]);

  // ---- Determine setup progress ----
  const stepAuth = !!botUser;
  const stepConnected = connected;

  // ---- Not fully connected — show inline setup ----
  if (!connected) {
    return (
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="mt-0.5 text-[13px] text-t-faint">Connect to your bot to see real-time status and controls</p>
        </div>

        {/* ---- Setup Steps Card ---- */}
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-md">
          <div className="relative">
            {/* Progress bar */}
            <div className="mb-6 flex items-center gap-3">
              <Bot size={20} className="text-purple-400" />
              <h2 className="text-[15px] font-bold text-white">Bot Setup</h2>
              <div className="ml-auto flex items-center gap-1.5">
                {[stepAuth, stepConnected].map((done, i) => (
                  <div
                    key={i}
                    className={`h-1.5 w-8 rounded-full transition-colors ${done ? 'bg-spotify-green' : 'bg-white/[0.08]'}`}
                  />
                ))}
              </div>
            </div>

            {/* Step 1 — Authenticate */}
            <div className="flex flex-col gap-4">
              <SetupStep
                number={1}
                title="Authenticate with Bot"
                description="Connect to your running bot instance"
                done={stepAuth}
                active={!stepAuth}
              >
                {!stepAuth && (
                  <div className="mt-3 flex flex-col gap-3">
                    {/* Server address fields */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-t-faint">
                          Host
                        </label>
                        <input
                          type="text"
                          value={host}
                          onChange={(e) => setHost(e.target.value)}
                          placeholder="localhost"
                          className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[12px] text-t-secondary placeholder-white/20 outline-none transition-colors focus:border-white/[0.15]"
                          onBlur={() => setConnection(host, parseInt(port, 10) || 3000)}
                        />
                      </div>
                      <div className="w-24">
                        <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-t-faint">
                          Port
                        </label>
                        <input
                          type="text"
                          value={port}
                          onChange={(e) => setPort(e.target.value)}
                          placeholder="3000"
                          className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[12px] text-t-secondary placeholder-white/20 outline-none transition-colors focus:border-white/[0.15]"
                          onBlur={() => setConnection(host, parseInt(port, 10) || 3000)}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setConnection(host, parseInt(port, 10) || 3000);
                        connectToBot();
                      }}
                      disabled={botConnecting}
                      className="flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-semibold shadow-lg transition-all disabled:opacity-50"
                      style={{ background: 'var(--gradient-accent)', color: 'var(--btn-primary-fg)' }}
                    >
                      {botConnecting ? <Loader2 size={15} className="animate-spin" /> : <LogIn size={15} />}
                      {botConnecting ? 'Connecting...' : 'Connect to Bot'}
                    </button>

                    {botError && <p className="text-[12px] text-red-400/80">{botError}</p>}

                    <p className="text-[11px] text-t-faint">Make sure the bot server is running at the address above</p>
                  </div>
                )}
              </SetupStep>

              {/* Step 2 — Live Connection */}
              <SetupStep
                number={2}
                title="Live Connection"
                description="Real-time data streaming from your bot across all servers"
                done={stepConnected}
                active={stepAuth && !stepConnected}
              >
                {stepAuth && !stepConnected && (
                  <div className="mt-3 flex items-center gap-3">
                    <Loader2 size={14} className="animate-spin text-t-faint" />
                    <span className="text-[12px] text-t-faint">
                      Establishing connection to {connection.host}:{connection.port}...
                    </span>
                    <button
                      onClick={() => {
                        disconnectWs();
                        setTimeout(() => connectWs(), 300);
                      }}
                      className="ml-auto rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-t-tertiary transition-colors hover:border-white/[0.12] hover:text-t-secondary"
                    >
                      Retry
                    </button>
                  </div>
                )}
              </SetupStep>
            </div>
          </div>
        </div>

        {/* Authenticated summary card */}
        {stepAuth && (
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-md">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <div className="flex items-center gap-2.5">
                {botUser?.avatar ? (
                  <img src={botUser.avatar} alt="" className="h-7 w-7 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.06]">
                    <Bot size={13} className="text-t-faint" />
                  </div>
                )}
                <div>
                  <p className="text-[12px] font-semibold text-t-secondary">{botUser?.username}</p>
                  <p className="text-[10px] text-spotify-green/60">Authenticated</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---- Loading state ----
  if (!dashboard && dashboardLoading) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <div
          className="h-6 w-6 animate-spin rounded-full border-2 border-white/10"
          style={{ borderTopColor: 'var(--accent)' }}
        />
      </div>
    );
  }

  const bot = dashboard?.bot;
  const guilds = dashboard?.guilds ?? [];
  const instances = dashboard?.instances;

  const activePlayerCount = guilds.filter((g) => g.player.active).length;
  const playingCount = guilds.filter((g) => g.player.isPlaying).length;
  const totalQueued = guilds.reduce((acc, g) => acc + g.player.queueSize, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-t-primary">Dashboard</h1>
          <p className="mt-0.5 text-[13px] text-t-faint">Real-time overview of your bot and connected servers</p>
        </div>
        <button
          onClick={refresh}
          disabled={dashboardLoading}
          className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2 text-[12px] font-medium text-t-tertiary transition-all hover:border-white/[0.12] hover:bg-white/[0.06] hover:text-t-secondary disabled:opacity-40"
        >
          <RefreshCw size={13} className={dashboardLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ---- Active Session Context ---- */}
      {botUser && (
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-md">
          <div className="relative flex flex-wrap items-center gap-x-6 gap-y-2">
            {/* Bot user */}
            <div className="flex items-center gap-2.5">
              {botUser.avatar ? (
                <img src={botUser.avatar} alt="" className="h-7 w-7 rounded-lg object-cover" />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.06]">
                  <Bot size={13} className="text-t-faint" />
                </div>
              )}
              <div>
                <p className="text-[12px] font-semibold text-t-secondary">{botUser.username}</p>
                <p className="text-[10px] text-t-faint">Authenticated</p>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden h-8 w-px bg-white/[0.06] sm:block" />

            {/* Focused server */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.06]">
                <Globe size={13} className="text-t-faint" />
              </div>
              <div>
                <p className="text-[12px] font-semibold text-t-secondary">
                  {dashboard?.bot.guildCount ?? 0} Server{(dashboard?.bot.guildCount ?? 0) !== 1 ? 's' : ''}
                </p>
                <p className="text-[10px] text-t-faint">Connected</p>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden h-8 w-px bg-white/[0.06] sm:block" />

            {/* Playback mode */}
            <div className="flex items-center gap-2">
              {playbackMode === 'local' ? (
                <Monitor size={14} className="text-spotify-green" />
              ) : playbackMode === 'sync' ? (
                <Monitor size={14} className="text-amber-400" />
              ) : (
                <Radio size={14} className="text-purple-400" />
              )}
              <div>
                <p className="text-[12px] font-semibold text-t-secondary">
                  {playbackMode === 'local' ? 'Local' : playbackMode === 'sync' ? 'Sync' : 'Discord Bot'}
                </p>
                <p className="text-[10px] text-t-faint">Playback Mode</p>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden h-8 w-px bg-white/[0.06] sm:block" />

            {/* Connection status */}
            <div className="flex items-center gap-2">
              {connected ? (
                <Zap size={14} className="text-spotify-green" />
              ) : (
                <WifiOff size={14} className="text-yellow-400/70" />
              )}
              <div>
                <p className="text-[12px] font-semibold text-t-secondary">{connected ? 'Connected' : 'Disconnected'}</p>
                <p className="text-[10px] text-t-faint">
                  {connection.host}:{connection.port}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---- Bot Status Banner ---- */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-md">
        <div className="relative flex items-center gap-4">
          {bot?.avatar ? (
            <img
              src={bot.avatar}
              alt={bot.username ?? ''}
              className="h-14 w-14 rounded-2xl object-cover shadow-lg shadow-black/40"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.06]">
              <Bot size={24} className="text-t-faint" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-t-primary">{bot?.username ?? 'Bot'}</h2>
              {bot?.online ? (
                <span className="flex items-center gap-1 rounded-full bg-spotify-green/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-spotify-green">
                  <span className="h-1.5 w-1.5 rounded-full bg-spotify-green animate-pulse" />
                  Online
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-400">
                  Offline
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[12px] text-t-faint">
              {bot
                ? `Uptime: ${formatUptime(bot.uptime)} · Ping: ${bot.ping}ms · ${bot.guildCount} server${bot.guildCount !== 1 ? 's' : ''}`
                : 'Loading...'}
            </p>
          </div>
        </div>
      </div>

      {/* ---- Quick Stats Grid  ---- */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Server}
          label="Servers"
          value={bot?.guildCount ?? '—'}
          sub={`${activePlayerCount} with active players`}
          color="text-purple-400"
        />
        <StatCard
          icon={Cpu}
          label="Bot Instances"
          value={instances?.health.onlineInstances ?? '—'}
          sub={`${instances?.health.totalInstances ?? 0} total registered`}
          color="text-cyan-400"
          pulse={(instances?.health.onlineInstances ?? 0) > 0}
        />
        <StatCard
          icon={Radio}
          label="Playing Now"
          value={playingCount}
          sub={`${totalQueued} tracks queued`}
          color="text-spotify-green"
          pulse={playingCount > 0}
        />
        <StatCard
          icon={Users}
          label="Total Members"
          value={guilds.reduce((acc, g) => acc + g.memberCount, 0).toLocaleString()}
          sub={`across ${guilds.length} server${guilds.length !== 1 ? 's' : ''}`}
          color="text-pink-400"
        />
      </div>

      {/* ---- Bot Instances ---- */}
      {instances && instances.list.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-t-faint">Bot Instances</h2>
            {instances.list.some((i) => i.heartbeatStatus === 'timeout' || i.heartbeatStatus === 'stale') && (
              <button
                onClick={clearStaleInstances}
                className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-t-faint transition-colors hover:bg-red-500/10 hover:text-red-400"
                title="Remove all timed-out and stale instances"
              >
                <Trash2 size={12} />
                Clear Stale
              </button>
            )}
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {instances.list.map((inst) => (
              <InstanceCard
                key={inst.instanceId}
                instance={inst}
                isThisInstance={inst.instanceId === instances.thisInstanceId}
                onForceStop={forceStopInstance}
                onPing={handlePing}
              />
            ))}
          </div>
        </div>
      )}

      {/* ---- Now Playing (from local WS player state) ---- */}
      {player.currentTrack && (
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-md">
          <div className="relative">
            <div className="mb-3 flex items-center gap-2">
              <Activity size={14} className="text-spotify-green" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-t-faint">
                Now Playing — Current Guild
              </span>
            </div>
            <div className="flex items-center gap-4">
              {player.currentTrack.thumbnail ? (
                <img
                  src={player.currentTrack.thumbnail}
                  alt=""
                  className="h-16 w-16 rounded-xl object-cover shadow-lg shadow-black/40"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/[0.06]">
                  <Music size={22} className="text-t-ghost" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-bold text-t-primary">{player.currentTrack.title}</p>
                <p className="truncate text-[13px] text-t-faint">{player.currentTrack.artist ?? 'Unknown Artist'}</p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-spotify-green to-emerald-400 transition-all"
                      style={{
                        width: `${player.duration > 0 ? (player.position / player.duration) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="shrink-0 text-[10px] font-medium tabular-nums text-t-faint">
                    {formatTime(player.position)} / {formatTime(player.duration)}
                  </span>
                </div>
              </div>
              {player.isPlaying ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-spotify-green/10">
                  <Play size={16} className="text-spotify-green" />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-400/10">
                  <Pause size={16} className="text-yellow-400/60" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---- Guild Players ---- */}
      {guilds.length > 0 && (
        <div>
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-t-faint">Server Players</h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {guilds.map((guild) => (
              <GuildCard
                key={guild.guildId}
                guild={guild}
                isSelected={guild.guildId === focusedGuildId}
                onSelect={() => focusGuild(guild.guildId === focusedGuildId ? null : guild.guildId)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
