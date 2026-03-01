import { useEffect, useState, useCallback, useMemo } from 'react';
import { api, CommandExecutionResult } from '@/lib/api';
import { useBotStore } from '@/stores/useBotStore';
import { cn } from '@/lib/utils';
import {
  Clock,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
  Filter,
  Trash2,
  ChevronDown,
  ChevronRight,
  Terminal,
  Activity,
  AlertTriangle,
  Search,
  BarChart3,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CommandStats {
  totalCommands: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  mostUsedCommands: Array<{ command: string; count: number }>;
}

type StatusFilter = 'all' | 'success' | 'error' | 'pending';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(ts).toLocaleDateString();
}

function fullTimestamp(ts: number): string {
  return new Date(ts).toLocaleString();
}

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  success: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: CheckCircle2 },
  error: { bg: 'bg-red-500/10', text: 'text-red-400', icon: XCircle },
  pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', icon: Loader2 },
};

// ---------------------------------------------------------------------------
// StatCard
// ---------------------------------------------------------------------------

function StatCard({
  icon: Icon,
  label,
  value,
  color = 'text-t-secondary',
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-md transition-colors hover:border-white/[0.1]">
      <div className="flex items-center gap-2">
        <Icon size={16} className={color} />
        <span className="text-[11px] font-medium uppercase tracking-wider text-t-faint">{label}</span>
      </div>
      <p className="text-2xl font-bold tracking-tight text-t-primary">{value}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Execution row (expandable)
// ---------------------------------------------------------------------------

function ExecutionRow({ execution }: { execution: CommandExecutionResult }) {
  const [expanded, setExpanded] = useState(false);
  const statusStyle = STATUS_COLORS[execution.status] ?? STATUS_COLORS.pending;
  const StatusIcon = statusStyle.icon;

  return (
    <div
      className="group border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]"
    >
      {/* Summary row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <div className="flex w-5 items-center justify-center text-t-faint">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>

        {/* Status badge */}
        <div className={cn('flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium', statusStyle.bg, statusStyle.text)}>
          <StatusIcon size={12} className={execution.status === 'pending' ? 'animate-spin' : ''} />
          {execution.status}
        </div>

        {/* Command name */}
        <span className="font-mono text-sm font-semibold text-t-primary">/{execution.command}</span>

        {/* Argument summary */}
        {Object.keys(execution.arguments).length > 0 && (
          <span className="truncate text-xs text-t-faint">
            {Object.entries(execution.arguments)
              .map(([k, v]) => `${k}: ${String(v)}`)
              .join(', ')}
          </span>
        )}

        {/* Timestamp */}
        <span className="ml-auto shrink-0 text-[11px] text-t-faint" title={fullTimestamp(execution.timestamp)}>
          {timeAgo(execution.timestamp)}
        </span>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-white/[0.04] bg-white/[0.01] px-12 py-4">
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-t-faint">ID</dt>
            <dd className="font-mono text-xs text-t-tertiary">{execution.id}</dd>

            <dt className="text-t-faint">Time</dt>
            <dd className="text-t-secondary">{fullTimestamp(execution.timestamp)}</dd>

            <dt className="text-t-faint">Status</dt>
            <dd className={statusStyle.text}>{execution.status}</dd>

            {Object.entries(execution.arguments).length > 0 && (
              <>
                <dt className="text-t-faint">Arguments</dt>
                <dd>
                  <pre className="whitespace-pre-wrap rounded-lg bg-black/20 p-3 font-mono text-xs text-t-secondary">
                    {JSON.stringify(execution.arguments, null, 2)}
                  </pre>
                </dd>
              </>
            )}

            {execution.error && (
              <>
                <dt className="text-red-400">Error</dt>
                <dd className="text-red-300">{execution.error}</dd>
              </>
            )}

            {execution.result !== undefined && (
              <>
                <dt className="text-t-faint">Result</dt>
                <dd>
                  <pre className="max-h-60 overflow-auto whitespace-pre-wrap rounded-lg bg-black/20 p-3 font-mono text-xs text-t-secondary">
                    {typeof execution.result === 'string'
                      ? execution.result
                      : JSON.stringify(execution.result, null, 2)}
                  </pre>
                </dd>
              </>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function CommandLogsPage() {
  const connected = useBotStore((s) => s.connection.connected);
  const [history, setHistory] = useState<CommandExecutionResult[]>([]);
  const [stats, setStats] = useState<CommandStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [commandFilter, setCommandFilter] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchData = useCallback(async () => {
    if (!connected) return;
    setLoading(true);
    try {
      const [histRes, statsRes] = await Promise.all([
        api.getCommandHistory(500),
        api.getCommandStats(),
      ]);
      setHistory(histRes.history);
      setStats(statsRes.stats);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, [connected]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !connected) return;
    const id = setInterval(fetchData, 5000);
    return () => clearInterval(id);
  }, [autoRefresh, connected, fetchData]);

  // Unique command names for filter dropdown
  const commandNames = useMemo(() => {
    const names = new Set(history.map((e) => e.command));
    return Array.from(names).sort();
  }, [history]);

  // Filtered list
  const filtered = useMemo(() => {
    return history.filter((e) => {
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      if (commandFilter !== 'all' && e.command !== commandFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchCmd = e.command.toLowerCase().includes(q);
        const matchArgs = JSON.stringify(e.arguments).toLowerCase().includes(q);
        const matchErr = e.error?.toLowerCase().includes(q);
        if (!matchCmd && !matchArgs && !matchErr) return false;
      }
      return true;
    });
  }, [history, statusFilter, commandFilter, searchQuery]);

  const handleClearHistory = async () => {
    try {
      await api.clearCommandHistory();
      setHistory([]);
    } catch {
      // ignore
    }
  };

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32 text-t-faint">
        <AlertTriangle size={40} />
        <p className="text-sm">Connect to the bot to view command logs</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-t-primary">Command Logs</h1>
          <p className="text-sm text-t-faint">Command execution history &amp; statistics</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Auto-refresh toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
              autoRefresh
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-white/[0.04] text-t-faint hover:text-t-secondary',
            )}
          >
            <Activity size={13} className={autoRefresh ? 'animate-pulse' : ''} />
            Live
          </button>

          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-t-faint transition-colors hover:text-t-secondary"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>

          <button
            onClick={handleClearHistory}
            className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20"
          >
            <Trash2 size={13} />
            Clear
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={Terminal} label="Total Commands" value={stats.totalCommands} color="text-blue-400" />
          <StatCard icon={BarChart3} label="Executions" value={stats.totalExecutions} color="text-purple-400" />
          <StatCard icon={CheckCircle2} label="Successful" value={stats.successfulExecutions} color="text-emerald-400" />
          <StatCard icon={XCircle} label="Failed" value={stats.failedExecutions} color="text-red-400" />
        </div>
      )}

      {/* Most-used commands bar */}
      {stats && stats.mostUsedCommands.length > 0 && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-t-faint">Most Used Commands</h2>
          <div className="space-y-2">
            {stats.mostUsedCommands.slice(0, 8).map((cmd) => {
              const maxCount = stats.mostUsedCommands[0].count;
              const pct = maxCount > 0 ? (cmd.count / maxCount) * 100 : 0;
              return (
                <div key={cmd.command} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-right font-mono text-xs text-t-secondary">/{cmd.command}</span>
                  <div className="relative h-5 flex-1 overflow-hidden rounded-full bg-white/[0.04]">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: 'var(--gradient-accent)',
                        opacity: 0.8,
                      }}
                    />
                  </div>
                  <span className="w-10 text-right text-xs font-medium text-t-tertiary">{cmd.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-t-faint" />
          <input
            type="text"
            placeholder="Search commands, arguments, errors…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] py-2 pl-9 pr-3 text-sm text-t-primary placeholder:text-t-faint focus:border-white/[0.12] focus:outline-none"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1.5">
          <Filter size={13} className="text-t-faint" />
          {(['all', 'success', 'error', 'pending'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors',
                statusFilter === s
                  ? 'bg-white/[0.1] text-t-primary'
                  : 'text-t-faint hover:text-t-secondary',
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Command filter */}
        <select
          value={commandFilter}
          onChange={(e) => setCommandFilter(e.target.value)}
          className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-xs text-t-secondary focus:outline-none"
        >
          <option value="all">All commands</option>
          {commandNames.map((name) => (
            <option key={name} value={name}>
              /{name}
            </option>
          ))}
        </select>

        <span className="text-xs text-t-faint">
          {filtered.length} / {history.length}
        </span>
      </div>

      {/* History list */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
        {loading && history.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-16 text-t-faint">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Loading command logs…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-t-faint">
            <Clock size={24} />
            <span className="text-sm">No command executions found</span>
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto">
            {filtered.map((exec) => (
              <ExecutionRow key={exec.id} execution={exec} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
