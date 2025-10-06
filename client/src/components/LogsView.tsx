import { useEffect, useMemo, useState, ReactNode } from 'react';
import { useBotStore } from '@/stores/useBotStore';
import { Api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Info,
  AlertTriangle,
  OctagonX,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  X,
  Trash2,
  BarChart3,
} from 'lucide-react';
import type { LogEntry } from 'discord-dashboard-shared';

type SortField = 'timestamp' | 'category' | 'level' | 'message';
type SortDirection = 'asc' | 'desc';

interface LogFilters {
  search: string;
  level?: 'info' | 'warn' | 'error';
  category?: 'audit' | 'command' | 'system';
}

function LevelIcon({ level }: { level: string }) {
  if (level === 'error') return <OctagonX className="h-4 w-4 text-red-500" />;
  if (level === 'warn') return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  return <Info className="h-4 w-4 text-blue-500" />;
}

function LevelBadge({ level }: { level: string }) {
  const variants = {
    error: 'destructive',
    warn: 'secondary',
    info: 'default',
    debug: 'outline',
  } as const;

  return (
    <Badge variant={variants[level as keyof typeof variants] || 'default'} className="text-xs">
      {level.toUpperCase()}
    </Badge>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const colors = {
    audit: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    command: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    system: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  } as const;

  return (
    <Badge className={`text-xs ${colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
      {category}
    </Badge>
  );
}

function SortButton({
  field,
  currentField,
  direction,
  onSort,
  children,
}: {
  field: SortField;
  currentField: SortField;
  direction: SortDirection;
  onSort: (field: SortField) => void;
  children: ReactNode;
}) {
  const isActive = currentField === field;

  return (
    <Button variant="ghost" size="sm" className="h-8 px-2 font-medium" onClick={() => onSort(field)}>
      {children}
      {isActive ? (
        direction === 'asc' ? (
          <ArrowUp className="ml-1 h-3 w-3" />
        ) : (
          <ArrowDown className="ml-1 h-3 w-3" />
        )
      ) : (
        <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />
      )}
    </Button>
  );
}

export default function LogsView() {
  const [activeTab, setActiveTab] = useState<'audit' | 'command'>('audit');
  const [filters, setFilters] = useState<LogFilters>({ search: '' });
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [fetched, setFetched] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [logStats, setLogStats] = useState<{
    total: number;
    byCategory: Record<string, number>;
    byLevel: Record<string, number>;
    recent: { lastHour: number; lastDay: number };
  } | null>(null);
  const [showStats, setShowStats] = useState(false);

  // Get live logs from store
  const auditLogs = useBotStore((s) => s.auditLogs);
  const commandLogs = useBotStore((s) => s.commandLogs);

  // Fetch log statistics
  useEffect(() => {
    if (showStats) {
      Api.getLogStats()
        .then(setLogStats)
        .catch(() => setLogStats(null));
    }
  }, [showStats]);

  // Fetch logs from API when filters change
  useEffect(() => {
    setIsLoading(true);
    Api.getLogs(activeTab, filters.search, filters.level, filters.category)
      .then((r) => setFetched(r.items || []))
      .catch(() => setFetched([]))
      .finally(() => setIsLoading(false));
  }, [activeTab, filters.search, filters.level, filters.category]);

  // Merge live and fetched logs
  const mergedLogs = useMemo(() => {
    const liveLogs = activeTab === 'audit' ? auditLogs : commandLogs;
    const seen = new Set<string>();
    const items: LogEntry[] = [];

    // Add live logs first (they're more recent)
    for (const log of liveLogs) {
      if (!seen.has(log.id)) {
        seen.add(log.id);
        items.push(log);
      }
    }

    // Add fetched logs that aren't already in live logs
    for (const log of fetched) {
      if (!seen.has(log.id)) {
        seen.add(log.id);
        items.push(log);
      }
    }

    return items;
  }, [auditLogs, commandLogs, fetched, activeTab]);

  // Apply filters and sorting
  const filteredAndSortedLogs = useMemo(() => {
    let filtered = mergedLogs;

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.message.toLowerCase().includes(searchLower) ||
          log.category.toLowerCase().includes(searchLower) ||
          log.level.toLowerCase().includes(searchLower) ||
          (log.source && log.source.toLowerCase().includes(searchLower)),
      );
    }

    // Apply level filter
    if (filters.level) {
      filtered = filtered.filter((log) => log.level === filters.level);
    }

    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter((log) => log.category === filters.category);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'timestamp':
          aValue = a.timestamp || (a as LogEntry & { ts?: number }).ts || 0;
          bValue = b.timestamp || (b as LogEntry & { ts?: number }).ts || 0;
          break;
        case 'category':
          aValue = a.category;
          bValue = b.category;
          break;
        case 'level':
          aValue = a.level;
          bValue = b.level;
          break;
        case 'message':
          aValue = a.message;
          bValue = b.message;
          break;
        default:
          aValue = a.timestamp;
          bValue = b.timestamp;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [mergedLogs, filters, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc'); // Default to desc for new fields
    }
  };

  const clearFilters = () => {
    setFilters({ search: '' });
  };

  const clearLogs = async () => {
    if (confirm('Are you sure you want to clear logs? This action cannot be undone.')) {
      try {
        await Api.clearLogs(activeTab, filters.level, filters.category);
        // Refresh the logs
        setFetched([]);
        // The live logs will be cleared via WebSocket updates
      } catch (error) {
        console.error('Failed to clear logs:', error);
      }
    }
  };

  const hasActiveFilters = filters.search || filters.level || filters.category;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Audit Logs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-64"
              />
            </div>

            <Select
              value={filters.level || ''}
              onValueChange={(value) => setFilters({ ...filters, level: (value as LogEntry['level']) || undefined })}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Levels</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warn">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.category || ''}
              onValueChange={(value) =>
                setFilters({ ...filters, category: (value as LogEntry['category']) || undefined })
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                <SelectItem value="audit">Audit</SelectItem>
                <SelectItem value="command">Command</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            )}

            <Button variant="outline" size="sm" onClick={() => setShowStats(!showStats)}>
              <BarChart3 className="h-4 w-4 mr-1" />
              Stats
            </Button>

            <Button variant="outline" size="sm" onClick={clearLogs}>
              <Trash2 className="h-4 w-4 mr-1" />
              Clear Logs
            </Button>

            <div className="text-sm text-muted-foreground ml-auto">
              {filteredAndSortedLogs.length} logs
              {isLoading && ' (loading...)'}
            </div>
          </div>

          {/* Log Statistics */}
          {showStats && logStats && (
            <Card className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-medium text-muted-foreground">Total Logs</div>
                  <div className="text-2xl font-bold">{logStats.total}</div>
                </div>
                <div>
                  <div className="font-medium text-muted-foreground">Last Hour</div>
                  <div className="text-2xl font-bold">{logStats.recent.lastHour}</div>
                </div>
                <div>
                  <div className="font-medium text-muted-foreground">Errors</div>
                  <div className="text-2xl font-bold text-red-500">{logStats.byLevel.error || 0}</div>
                </div>
                <div>
                  <div className="font-medium text-muted-foreground">Warnings</div>
                  <div className="text-2xl font-bold text-yellow-500">{logStats.byLevel.warn || 0}</div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-medium text-muted-foreground mb-2">By Category</div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Audit:</span>
                      <span>{logStats.byCategory.audit || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Command:</span>
                      <span>{logStats.byCategory.command || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>System:</span>
                      <span>{logStats.byCategory.system || 0}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="font-medium text-muted-foreground mb-2">By Level</div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Info:</span>
                      <span>{logStats.byLevel.info || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Warning:</span>
                      <span>{logStats.byLevel.warn || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Error:</span>
                      <span>{logStats.byLevel.error || 0}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="font-medium text-muted-foreground mb-2">Recent Activity</div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Last Hour:</span>
                      <span>{logStats.recent.lastHour}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Day:</span>
                      <span>{logStats.recent.lastDay}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Tabs for log types */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'audit' | 'command')}>
            <TabsList>
              <TabsTrigger value="audit">Console Logs</TabsTrigger>
              <TabsTrigger value="command">Command Logs</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">
                        <SortButton
                          field="timestamp"
                          currentField={sortField}
                          direction={sortDirection}
                          onSort={handleSort}
                        >
                          Timestamp
                        </SortButton>
                      </TableHead>
                      <TableHead className="w-[100px]">
                        <SortButton
                          field="category"
                          currentField={sortField}
                          direction={sortDirection}
                          onSort={handleSort}
                        >
                          Category
                        </SortButton>
                      </TableHead>
                      <TableHead className="w-[80px]">
                        <SortButton
                          field="level"
                          currentField={sortField}
                          direction={sortDirection}
                          onSort={handleSort}
                        >
                          Level
                        </SortButton>
                      </TableHead>
                      <TableHead>
                        <SortButton
                          field="message"
                          currentField={sortField}
                          direction={sortDirection}
                          onSort={handleSort}
                        >
                          Message
                        </SortButton>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                </Table>

                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableBody>
                      {filteredAndSortedLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            {isLoading ? 'Loading logs...' : 'No logs found'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAndSortedLogs.map((log) => (
                          <TableRow key={log.id} className="hover:bg-muted/50">
                            <TableCell className="font-mono text-xs">
                              {new Date(log.timestamp || (log as LogEntry & { ts?: number }).ts || 0).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <CategoryBadge category={log.category} />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <LevelIcon level={log.level} />
                                <LevelBadge level={log.level} />
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
                                  {log.message}
                                </pre>
                                {log.source && (
                                  <div className="text-xs text-muted-foreground">Source: {log.source}</div>
                                )}
                                {log.metadata && Object.keys(log.metadata).length > 0 && (
                                  <details className="text-xs">
                                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                      Metadata
                                    </summary>
                                    <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                                      {JSON.stringify(log.metadata, null, 2)}
                                    </pre>
                                  </details>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
