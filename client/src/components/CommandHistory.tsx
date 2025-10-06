import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Api } from '@/lib/api';
import { useCommandSync } from '@/hooks/useCommandSync';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Search, Filter, Play, Copy, Eye, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { CommandExecution } from 'discord-dashboard-shared';

interface CommandHistoryProps {
  onRerunCommand?: (command: string, arguments_: Record<string, unknown>) => void;
}

export function CommandHistory({ onRerunCommand }: CommandHistoryProps) {
  const { t } = useTranslation();
  const { commandHistory } = useCommandSync();
  const [history, setHistory] = useState<CommandExecution[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<CommandExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedExecution, setSelectedExecution] = useState<CommandExecution | null>(null);
  const commandHistoryRef = useRef(commandHistory);

  useEffect(() => {
    commandHistoryRef.current = commandHistory;
  }, [commandHistory]);

  // Load command history and sync with WebSocket updates
  useEffect(() => {
    const loadHistory = async () => {
      try {
        setIsLoading(true);
        const response = await Api.getCommandHistory();
        const serverHistory = response.history || [];

        // Merge server history with WebSocket history, avoiding duplicates
        const mergedHistory = [...commandHistoryRef.current];
        serverHistory.forEach((serverExecution) => {
          if (!mergedHistory.find((exec) => exec.id === serverExecution.id)) {
            mergedHistory.push(serverExecution);
          }
        });

        setHistory(mergedHistory);
      } catch (error) {
        console.error('Failed to load command history:', error);
        // Fallback to WebSocket history only
        setHistory(commandHistoryRef.current);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, []);

  // Update history when WebSocket receives new executions
  useEffect(() => {
    setHistory((prev) => {
      const merged = [...commandHistory];
      prev.forEach((prevExecution) => {
        if (!merged.find((exec) => exec.id === prevExecution.id)) {
          merged.push(prevExecution);
        }
      });
      return merged;
    });
  }, [commandHistory]);

  // Filter and search history
  useEffect(() => {
    let filtered = [...history];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (execution) =>
          execution.command.toLowerCase().includes(searchLower) ||
          JSON.stringify(execution.arguments).toLowerCase().includes(searchLower) ||
          (execution.error && execution.error.toLowerCase().includes(searchLower)),
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((execution) => execution.status === statusFilter);
    }

    // Sort by most recent first
    filtered.sort((a, b) => b.timestamp - a.timestamp);

    setFilteredHistory(filtered);
  }, [history, searchTerm, statusFilter]);

  const handleRerunCommand = (execution: CommandExecution) => {
    onRerunCommand?.(execution.command, execution.arguments);
  };

  const handleCopyCommand = (execution: CommandExecution) => {
    const commandText = `/${execution.command} ${Object.entries(execution.arguments)
      .map(([key, value]) => `${key}:${value}`)
      .join(' ')}`;
    navigator.clipboard.writeText(commandText);
  };

  const handleClearHistory = async () => {
    try {
      await Api.clearCommandHistory();
      setHistory([]);
    } catch (error) {
      console.error('Failed to clear command history:', error);
    }
  };

  const getStatusIcon = (status: CommandExecution['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: CommandExecution['status']) => {
    const variants = {
      success: 'default',
      error: 'destructive',
      pending: 'secondary',
    } as const;

    return (
      <Badge variant={variants[status] || 'outline'} className="flex items-center space-x-1">
        {getStatusIcon(status)}
        <span>{t(`commandInvocation.status.${status}`)}</span>
      </Badge>
    );
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return t('time.now');
    if (diffMins < 60) return t('time.minutes', { count: diffMins }) + ' ' + t('time.ago', { time: '' }).trim();
    if (diffHours < 24) return t('time.hours', { count: diffHours }) + ' ' + t('time.ago', { time: '' }).trim();
    if (diffDays < 7) return t('time.days', { count: diffDays }) + ' ' + t('time.ago', { time: '' }).trim();

    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">{t('common.loading')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="search" className="sr-only">
            {t('commandInvocation.history.search')}
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              type="text"
              placeholder={t('commandInvocation.history.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('commandInvocation.categories.all')}</SelectItem>
              <SelectItem value="success">{t('commandInvocation.status.success')}</SelectItem>
              <SelectItem value="error">{t('commandInvocation.status.error')}</SelectItem>
              <SelectItem value="pending">{t('commandInvocation.status.pending')}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleClearHistory} size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            {t('commandInvocation.history.clear')}
          </Button>
        </div>
      </div>

      {/* History Table */}
      {filteredHistory.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold text-muted-foreground">
              {history.length === 0 ? t('commandInvocation.history.empty') : 'No commands match your search criteria'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('commandInvocation.form.selectCommand')}</TableHead>
                  <TableHead>{t('commandInvocation.arguments')}</TableHead>
                  <TableHead>{t('commandInvocation.status.success')}</TableHead>
                  <TableHead>{t('auditLogs.timestamp')}</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.map((execution) => (
                  <TableRow key={execution.id}>
                    <TableCell className="font-medium">/{execution.command}</TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate text-sm text-muted-foreground">
                        {Object.keys(execution.arguments).length > 0
                          ? Object.entries(execution.arguments)
                              .map(([key, value]) => `${key}:${value}`)
                              .join(', ')
                          : 'No arguments'}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(execution.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatTimestamp(execution.timestamp)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRerunCommand(execution)}
                          title={t('commandInvocation.history.rerun')}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyCommand(execution)}
                          title={t('commandInvocation.history.copy')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedExecution(execution)}
                              title={t('commandInvocation.history.details')}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Command Execution Details</DialogTitle>
                            </DialogHeader>
                            {selectedExecution && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm font-semibold">Command</Label>
                                    <p className="text-sm">/{selectedExecution.command}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-semibold">Status</Label>
                                    <div className="mt-1">{getStatusBadge(selectedExecution.status)}</div>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-semibold">Timestamp</Label>
                                    <p className="text-sm">{new Date(selectedExecution.timestamp).toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-semibold">Execution ID</Label>
                                    <p className="text-sm font-mono">{selectedExecution.id}</p>
                                  </div>
                                </div>

                                {Object.keys(selectedExecution.arguments).length > 0 && (
                                  <div>
                                    <Label className="text-sm font-semibold">Arguments</Label>
                                    <pre className="mt-1 bg-muted rounded p-3 text-xs overflow-auto">
                                      {JSON.stringify(selectedExecution.arguments, null, 2)}
                                    </pre>
                                  </div>
                                )}

                                {selectedExecution.result && (
                                  <div>
                                    <Label className="text-sm font-semibold">Result</Label>
                                    <pre className="mt-1 bg-muted rounded p-3 text-xs overflow-auto max-h-40">
                                      {typeof selectedExecution.result === 'string'
                                        ? selectedExecution.result
                                        : JSON.stringify(selectedExecution.result, null, 2)}
                                    </pre>
                                  </div>
                                )}

                                {selectedExecution.error && (
                                  <div>
                                    <Label className="text-sm font-semibold text-red-600">Error</Label>
                                    <p className="mt-1 text-sm text-red-600 bg-red-50 rounded p-3">
                                      {selectedExecution.error}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
