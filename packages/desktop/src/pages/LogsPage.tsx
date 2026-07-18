import { useEffect, useState, useCallback, useRef, useMemo, memo } from 'react';
import { api } from '@/lib/api';
import { useBotStore } from '@/stores/useBotStore';
import { wsService } from '@/lib/ws';
import { onAppLog, getAppLogs, clearAppLogs, type AppLogEntry, appLog } from '@/lib/appLogger';
import { cn } from '@/lib/utils';
import {
  RefreshCw,
  Trash2,
  Search,
  AlertTriangle,
  Loader2,
  Info,
  AlertCircle,
  Bug,
  ChevronDown,
  ChevronRight,
  Activity,
  Clock,
  BarChart3,
  Bot,
  Monitor,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Unified log item – can come from the bot API or local app. */
interface LogItem {
  id: string;
  /** Top-level origin */
  origin: 'bot' | 'app';
  /** Sub-category inside the origin, e.g. 'command', 'system', 'audit', 'ui', 'store' … */
  category: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  ts: number;
  source?: string;
  guildId?: string;
  metadata?: Record<string, unknown>;
}

interface LogStats {
  total: number;
  byCategory: Record<string, number>;
  byLevel: Record<string, number>;
  recent: { lastHour: number; lastDay: number };
}

type OriginFilter = 'all' | 'bot' | 'app';
type LogLevel = 'all' | 'info' | 'warn' | 'error' | 'debug';
type SortOrder = 'asc' | 'desc';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString();
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(ts).toLocaleDateString();
}

const LEVEL_STYLE: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  info: { bg: 'bg-blue-500/10', text: 'text-blue-400', icon: Info },
  warn: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', icon: AlertTriangle },
  error: { bg: 'bg-red-500/10', text: 'text-red-400', icon: AlertCircle },
  debug: { bg: 'bg-zinc-500/10', text: 'text-zinc-400', icon: Bug },
};

// ---------------------------------------------------------------------------
// LogRow
// ---------------------------------------------------------------------------

const LogRow = memo(function LogRow({ item }: { item: LogItem }) {
  const [expanded, setExpanded] = useState(false);
  const lvl = LEVEL_STYLE[item.level] ?? LEVEL_STYLE.info;
  const LvlIcon = lvl.icon;
  const isBot = item.origin === 'bot';

  return (
    <div className="group border-b border-white/[0.04] transition-colors hover:bg-white/[0.015]">
      <button onClick={() => setExpanded(!expanded)} className="flex w-full items-center gap-2.5 px-4 py-2 text-left">
        {/* Level badge */}
        <div
          className={cn(
            'flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
            lvl.bg,
            lvl.text,
          )}
        >
          <LvlIcon size={10} />
          {item.level}
        </div>

        {/* Origin pill */}
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
            isBot ? 'bg-indigo-500/10 text-indigo-400' : 'bg-cyan-500/10 text-cyan-400',
          )}
        >
          {item.origin}
        </span>

        {/* Category tag */}
        <span className="rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-medium text-t-faint">
          {item.category}
        </span>

        {/* Source tag */}
        {item.source && (
          <span className="rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-medium text-t-faint">
            {item.source}
          </span>
        )}

        {/* Message */}
        <span className="flex-1 truncate text-xs text-t-secondary">{item.message}</span>

        {/* Timestamp */}
        <span className="shrink-0 text-[10px] text-t-faint" title={formatTimestamp(item.ts)}>
          {timeAgo(item.ts)}
        </span>

        {/* Expand indicator */}
        <div className="flex w-4 items-center justify-center text-t-faint">
          {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-white/[0.04] bg-white/[0.01] px-12 py-3 text-xs">
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5">
            <dt className="text-t-faint">ID</dt>
            <dd className="font-mono text-t-tertiary">{item.id}</dd>
            <dt className="text-t-faint">Timestamp</dt>
            <dd className="text-t-secondary">{formatTimestamp(item.ts)}</dd>
            <dt className="text-t-faint">Origin</dt>
            <dd className="text-t-secondary capitalize">{item.origin}</dd>
            <dt className="text-t-faint">Category</dt>
            <dd className="text-t-secondary">{item.category}</dd>
            <dt className="text-t-faint">Level</dt>
            <dd className={lvl.text}>{item.level}</dd>
            {item.source && (
              <>
                <dt className="text-t-faint">Source</dt>
                <dd className="text-t-secondary">{item.source}</dd>
              </>
            )}
            <dt className="text-t-faint">Message</dt>
            <dd className="whitespace-pre-wrap text-t-primary">{item.message}</dd>
            {item.metadata && Object.keys(item.metadata).length > 0 && (
              <>
                <dt className="text-t-faint">Metadata</dt>
                <dd>
                  <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-black/20 p-3 font-mono text-t-secondary">
                    {JSON.stringify(item.metadata, null, 2)}
                  </pre>
                </dd>
              </>
            )}
          </dl>
        </div>
      )}
    </div>
  );
});

// ---------------------------------------------------------------------------
// Helpers to convert API / WS / App entries into unified LogItem
// ---------------------------------------------------------------------------

function botEntryToLogItem(raw: Record<string, unknown>): LogItem {
  const metadata = raw.metadata as Record<string, unknown> | undefined;
  const topGuildId = typeof raw.guildId === 'string' ? (raw.guildId as string) : undefined;
  const metaGuildId = metadata && typeof metadata.guildId === 'string' ? (metadata.guildId as string) : undefined;
  return {
    id: (raw.id as string) ?? crypto.randomUUID(),
    origin: 'bot',
    category: (raw.category as string) ?? 'system',
    level: (raw.level as LogItem['level']) ?? 'info',
    message: (raw.message as string) ?? '',
    ts: (raw.ts as number) ?? (raw.timestamp as number) ?? Date.now(),
    source: raw.source as string | undefined,
    guildId: topGuildId ?? metaGuildId,
    metadata,
  };
}

function appEntryToLogItem(entry: AppLogEntry): LogItem {
  return {
    id: entry.id,
    origin: 'app',
    category: entry.category,
    level: entry.level,
    message: entry.message,
    ts: entry.ts,
    source: entry.source,
    metadata: entry.metadata,
  };
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function LogsPage() {
  const connected = useBotStore((s) => s.connection.connected);
  const guilds = useBotStore((s) => s.guilds);

  const [logs, setLogs] = useState<LogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [originFilter, setOriginFilter] = useState<OriginFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState<LogLevel>('all');
  const [guildFilter, setGuildFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const LIMIT = 300;
  const scrollRef = useRef<HTMLDivElement>(null);

  // Log an app-level entry when the page mounts
  useEffect(() => {
    appLog.info('system', 'Logs page opened');
  }, []);

  // Fetch bot logs from the REST API (only when connected)
  const fetchBotLogs = useCallback(async (): Promise<{
    items: LogItem[];
    total: number;
    hasMore: boolean;
    stats: LogStats | null;
  }> => {
    if (!connected) return { items: [], total: 0, hasMore: false, stats: null };
    const params = new URLSearchParams();
    if (levelFilter !== 'all') params.set('level', levelFilter);
    if (searchQuery) params.set('q', searchQuery);
    if (guildFilter !== 'all') params.set('guildId', guildFilter);
    params.set('sortBy', 'timestamp');
    params.set('sortOrder', sortOrder);
    params.set('limit', String(LIMIT));

    const [logsRes, statsRes] = await Promise.all([api.getLogs(params.toString()), api.getLogStats()]);

    const items: LogItem[] = logsRes.items.map((raw: Record<string, unknown>) => botEntryToLogItem(raw));
    return { items, total: logsRes.total, hasMore: logsRes.hasMore, stats: statsRes };
  }, [connected, levelFilter, searchQuery, sortOrder, guildFilter]);

  // Merge bot + app logs into a single sorted list
  const fetchAllLogs = useCallback(async () => {
    setLoading(true);
    try {
      const botResult = await fetchBotLogs();

      // App logs are always available
      const appItems = getAppLogs().map(appEntryToLogItem);

      const merged = [...botResult.items, ...appItems].sort((a, b) =>
        sortOrder === 'desc' ? b.ts - a.ts : a.ts - b.ts,
      );

      setLogs(merged);
      setTotal(botResult.total + appItems.length);
      setHasMore(botResult.hasMore);
      setStats(botResult.stats);
    } catch {
      // Bot unreachable – fall back to app-only logs
      const appItems = getAppLogs().map(appEntryToLogItem);
      setLogs(appItems.sort((a, b) => (sortOrder === 'desc' ? b.ts - a.ts : a.ts - b.ts)));
      setTotal(appItems.length);
      setHasMore(false);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [fetchBotLogs, sortOrder]);

  // Initial fetch + re-fetch when filters change
  useEffect(() => {
    fetchAllLogs();
  }, [fetchAllLogs]);

  // Real-time tailing via WebSocket (bot) + appLog listener (app).
  //
  // The bot can emit many log lines per second (every HTTP request, player
  // event, heartbeat...). Committing a setLogs() + full re-render of up to
  // 1000 unwindowed rows per individual message is what made "Live" mode on
  // this page extremely slow - dozens of full-list re-renders per second
  // under normal load. Queue incoming entries in a ref and flush them into
  // state in one batched update on a fixed cadence instead.
  useEffect(() => {
    if (!autoRefresh) return;

    let pending: LogItem[] = [];

    const flush = () => {
      if (pending.length === 0) return;
      const batch = pending;
      pending = [];

      setLogs((prev) => {
        const next = sortOrder === 'desc' ? [...batch.slice().reverse(), ...prev] : [...prev, ...batch];
        return next.slice(0, 1000);
      });
      setTotal((t) => t + batch.length);

      requestAnimationFrame(() => {
        const el = scrollRef.current;
        if (!el) return;
        if (sortOrder === 'desc') el.scrollTop = 0;
        else el.scrollTop = el.scrollHeight;
      });
    };
    const flushInterval = setInterval(flush, 300);

    const queueLogItem = (logItem: LogItem) => {
      pending.push(logItem);
    };

    // Subscribe to app logs
    const unsubApp = onAppLog((entry) => {
      queueLogItem(appEntryToLogItem(entry));
    });

    // Subscribe to bot logs (only when connected)
    let unsubBot: (() => void) | undefined;
    if (connected) {
      const rawUnsub = wsService.on('log_entry', (payload: unknown) => {
        const logItem = botEntryToLogItem(payload as Record<string, unknown>);
        queueLogItem(logItem);
      });
      unsubBot = () => {
        rawUnsub();
      };
    }

    return () => {
      clearInterval(flushInterval);
      unsubApp();
      unsubBot?.();
    };
  }, [autoRefresh, connected, sortOrder]);

  // Load more bot logs (app logs are all in-memory already)
  const loadMore = useCallback(async () => {
    if (!connected || !hasMore) return;
    setLoading(true);
    try {
      const botCount = logs.filter((l) => l.origin === 'bot').length;
      const params = new URLSearchParams();
      if (levelFilter !== 'all') params.set('level', levelFilter);
      if (searchQuery) params.set('q', searchQuery);
      if (guildFilter !== 'all') params.set('guildId', guildFilter);
      params.set('sortBy', 'timestamp');
      params.set('sortOrder', sortOrder);
      params.set('limit', String(LIMIT));
      params.set('offset', String(botCount));

      const res = await api.getLogs(params.toString());
      const newItems: LogItem[] = res.items.map((raw: Record<string, unknown>) => botEntryToLogItem(raw));
      setLogs((prev) => [...prev, ...newItems]);
      setHasMore(res.hasMore);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [connected, hasMore, levelFilter, searchQuery, sortOrder, logs, guildFilter]);

  const handleClearLogs = async () => {
    try {
      if (connected) {
        const level = levelFilter !== 'all' ? levelFilter : undefined;
        await api.clearLogs(undefined, level);
      }
      clearAppLogs();
      await fetchAllLogs();
    } catch {
      // ignore
    }
  };

  // Derived: filtered logs
  const filteredLogs = useMemo(() => {
    let result = logs;
    if (originFilter !== 'all') result = result.filter((l) => l.origin === originFilter);
    if (categoryFilter !== 'all') result = result.filter((l) => l.category === categoryFilter);
    if (levelFilter !== 'all') result = result.filter((l) => l.level === levelFilter);
    if (guildFilter !== 'all') {
      // Only filter bot logs by guild; app logs don't carry a guildId.
      result = result.filter((l) => (l.origin === 'bot' ? l.guildId === guildFilter : true));
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.message.toLowerCase().includes(q) ||
          l.category.toLowerCase().includes(q) ||
          l.level.toLowerCase().includes(q) ||
          (l.source?.toLowerCase().includes(q) ?? false),
      );
    }
    return result;
  }, [logs, originFilter, categoryFilter, levelFilter, searchQuery, guildFilter]);

  // Derive available categories from current logs for the drill-down select
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    for (const l of logs) cats.add(l.category);
    return Array.from(cats).sort();
  }, [logs]);

  // -----------------------------------------------------------------------
  // Render - always shown, even if the bot is offline
  // -----------------------------------------------------------------------
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-t-primary">Logs</h1>
          <p className="text-sm text-t-faint">
            {connected ? 'Bot & application logs' : 'Bot offline - showing app logs only'}
          </p>
        </div>
        <div className="flex items-center gap-2">
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
            onClick={fetchAllLogs}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-t-faint transition-colors hover:text-t-secondary"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={handleClearLogs}
            className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20"
          >
            <Trash2 size={13} />
            Clear
          </button>
        </div>
      </div>

      {/* Stats strip */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <MiniStat label="Total" value={stats.total} color="text-t-secondary" />
          <MiniStat label="Info" value={stats.byLevel.info ?? 0} color="text-blue-400" />
          <MiniStat label="Warn" value={stats.byLevel.warn ?? 0} color="text-yellow-400" />
          <MiniStat label="Error" value={stats.byLevel.error ?? 0} color="text-red-400" />
          <MiniStat label="Last hour" value={stats.recent.lastHour} color="text-emerald-400" />
        </div>
      )}

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative min-w-[200px] flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-t-faint" />
          <input
            type="text"
            placeholder="Search messages, sources…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] py-2 pl-9 pr-3 text-sm text-t-primary placeholder:text-t-faint focus:border-white/[0.12] focus:outline-none"
          />
        </div>

        {/* Origin filter (Bot / App) */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-t-faint">Origin</span>
          {(['all', 'bot', 'app'] as OriginFilter[]).map((o) => (
            <button
              key={o}
              onClick={() => setOriginFilter(o)}
              className={cn(
                'flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors',
                originFilter === o ? 'bg-white/[0.1] text-t-primary' : 'text-t-faint hover:text-t-secondary',
              )}
            >
              {o === 'bot' && <Bot size={11} />}
              {o === 'app' && <Monitor size={11} />}
              {o}
            </button>
          ))}
        </div>

        {/* Category drill-down */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-1.5 text-xs text-t-secondary capitalize focus:outline-none"
        >
          <option value="all">All categories</option>
          {availableCategories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* Level dropdown */}
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value as LogLevel)}
          className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-1.5 text-xs text-t-secondary capitalize focus:outline-none"
        >
          <option value="all">All levels</option>
          <option value="debug">Debug</option>
          <option value="info">Info</option>
          <option value="warn">Warn</option>
          <option value="error">Error</option>
        </select>

        {/* Guild dropdown */}
        <select
          value={guildFilter}
          onChange={(e) => setGuildFilter(e.target.value)}
          className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-1.5 text-xs text-t-secondary focus:outline-none"
        >
          <option value="all">All guilds</option>
          {guilds.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>

        {/* Sort order toggle */}
        <button
          onClick={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
          className="rounded-md bg-white/[0.04] px-2 py-1 text-xs text-t-faint hover:text-t-secondary"
        >
          {sortOrder === 'desc' ? '↓ Newest' : '↑ Oldest'}
        </button>

        <span className="text-xs text-t-faint">
          {filteredLogs.length} / {total}
        </span>
      </div>

      {/* Log list */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
        {loading && logs.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-16 text-t-faint">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Loading logs…</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-t-faint">
            <Clock size={24} />
            <span className="text-sm">No logs to display</span>
          </div>
        ) : (
          <>
            <div ref={scrollRef} className="max-h-[60vh] overflow-y-auto">
              {filteredLogs.map((item) => (
                <LogRow key={item.id} item={item} />
              ))}
            </div>
            {hasMore && (
              <button
                onClick={loadMore}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 border-t border-white/[0.04] py-3 text-xs font-medium text-t-faint transition-colors hover:bg-white/[0.02] hover:text-t-secondary"
              >
                {loading ? <Loader2 size={13} className="animate-spin" /> : null}
                Load more
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mini stat block
// ---------------------------------------------------------------------------

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
      <BarChart3 size={14} className={color} />
      <div>
        <p className="text-base font-bold text-t-primary">{value}</p>
        <p className="text-[10px] font-medium uppercase tracking-wider text-t-faint">{label}</p>
      </div>
    </div>
  );
}
