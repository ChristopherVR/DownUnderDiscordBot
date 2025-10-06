import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useBotStore } from '@/stores/useBotStore';
import { Server, Activity, Clock, Cpu, HardDrive, RefreshCw, Search, Filter, Users, Zap } from 'lucide-react';
import type { GlobalState, GuildState, InstanceInfo } from 'discord-dashboard-shared';

type InstanceSelection = { guildId: string; instance: InstanceInfo } | null;
type LocationState = {
  filter?: 'online' | 'active';
  focus?: 'guilds' | 'instances';
  guildId?: string;
} | null;

export default function BotManagement() {
  const { t } = useTranslation('ui');
  const [globalState, setGlobalState] = useState<GlobalState | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline' | 'active'>('all');
  const [selectedGuildId, setSelectedGuildId] = useState<string>('');
  const [selectedInstance, setSelectedInstance] = useState<InstanceSelection>(null);
  const wsConnected = useBotStore((state) => state.wsConnected);
  const navigate = useNavigate();
  const location = useLocation();

  const loadGlobalState = async () => {
    setLoading(true);
    try {
      const state = await Api.getGlobalState();
      setGlobalState(state);
    } catch (error) {
      console.error('Failed to load global state:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGlobalState();
  }, []);

  useEffect(() => {
    const state = (location.state as LocationState) ?? null;
    if (!state) return;

    if (state.filter === 'online' || state.filter === 'active') {
      setStatusFilter(state.filter);
    }

    if (state.focus === 'guilds') {
      setSelectedGuildId('');
    }

    if (state.guildId) {
      setSelectedGuildId(state.guildId);
    }

    setSelectedInstance(null);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const handleMakeActive = async (guildId: string, instanceId: string) => {
    try {
      await Api.makeActive(guildId, instanceId);
      await loadGlobalState();
    } catch (error) {
      console.error('Failed to make instance active:', error);
    }
  };

  const handlePing = async (instanceId: string) => {
    try {
      await Api.ping(instanceId);
    } catch (error) {
      console.error('Failed to ping instance:', error);
    }
  };

  const handleShutdown = async (guildId: string, instanceId: string) => {
    try {
      await Api.shutdown(guildId, instanceId);
      await loadGlobalState();
    } catch (error) {
      console.error('Failed to shutdown instance:', error);
    }
  };

  const filteredInstances = useMemo(() => {
    if (!globalState) return [];

    const allInstances: Array<{ guildId: string; guild: GuildState; instance: InstanceInfo }> = [];

    Object.keys(globalState.guilds).forEach((guildId) => {
      const guild = globalState.guilds[guildId];
      const instances = Object.values(guild.instances) as InstanceInfo[];
      instances.forEach((instance) => {
        allInstances.push({ guildId, guild, instance });
      });
    });

    return allInstances.filter(({ guildId, instance }) => {
      if (statusFilter === 'online' && !instance.online) return false;
      if (statusFilter === 'offline' && instance.online) return false;
      if (statusFilter === 'active' && !instance.isActive) return false;
      if (selectedGuildId && guildId !== selectedGuildId) return false;

      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          instance.instanceId.toLowerCase().includes(searchLower) ||
          guildId.toLowerCase().includes(searchLower) ||
          instance.hostname?.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [globalState, statusFilter, selectedGuildId, searchTerm]);

  useEffect(() => {
    if (!selectedInstance) return;
    const stillExists = filteredInstances.some(
      ({ guildId, instance }) =>
        guildId === selectedInstance.guildId && instance.instanceId === selectedInstance.instance.instanceId,
    );
    if (!stillExists) {
      setSelectedInstance(null);
    }
  }, [filteredInstances, selectedInstance]);

  const formatLastHeartbeat = (timestamp: number) => {
    const date = new Date(timestamp);
    const diffMinutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
    if (diffMinutes < 1) return t('botManagement.labels.lastHeartbeat.justNow', 'Just now');
    if (diffMinutes < 60) return t('botManagement.labels.lastHeartbeat.minutes', '{{count}}m ago', { count: diffMinutes });
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return t('botManagement.labels.lastHeartbeat.hours', '{{count}}h ago', { count: diffHours });
    return date.toLocaleDateString();
  };

  const totalInstances = filteredInstances.length;
  const onlineInstances = filteredInstances.filter(({ instance }) => instance.online).length;
  const activeInstances = filteredInstances.filter(({ instance }) => instance.isActive).length;

  const metricCards = [
    {
      icon: Server,
      label: t('botManagement.metrics.guilds', 'Total Guilds'),
      value: globalState ? Object.keys(globalState.guilds).length : 0,
      accent: 'from-primary/30 to-primary/5 text-primary-foreground',
      action: 'guilds' as const,
    },
    {
      icon: Users,
      label: t('botManagement.metrics.instances', 'Bot Instances'),
      value: totalInstances,
      accent: 'from-emerald-400/30 to-emerald-500/10 text-emerald-100',
      action: 'instances' as const,
    },
    {
      icon: Activity,
      label: t('botManagement.metrics.online', 'Online'),
      value: onlineInstances,
      accent: 'from-sky-400/30 to-sky-500/10 text-sky-100',
      action: 'online' as const,
    },
    {
      icon: Zap,
      label: t('botManagement.metrics.active', 'Active'),
      value: activeInstances,
      accent: 'from-fuchsia-500/30 to-fuchsia-600/10 text-fuchsia-100',
      action: 'active' as const,
    },
  ];

  const handleMetricNavigate = (action?: 'guilds' | 'instances' | 'online' | 'active') => {
    if (!action) return;
    switch (action) {
      case 'guilds':
        navigate('/instances', { state: { focus: 'guilds' } });
        break;
      case 'instances':
        navigate('/instances', { state: { focus: 'instances' } });
        break;
      case 'online':
        navigate('/instances', { state: { filter: 'online' } });
        break;
      case 'active':
        navigate('/instances', { state: { filter: 'active' } });
        break;
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSelectedGuildId('');
    setSelectedInstance(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              {t('botManagement.title', 'Bot Management')}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={wsConnected ? 'default' : 'destructive'}>
                {wsConnected ? t('botManagement.status.realTime', 'Real-time') : t('botManagement.status.offline', 'Offline')}
              </Badge>
              <Button size="sm" variant="outline" onClick={loadGlobalState} disabled={loading}>
                <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {metricCards.map((metric) => (
              <div
                key={metric.label}
                role="button"
                tabIndex={0}
                onClick={() => handleMetricNavigate(metric.action)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleMetricNavigate(metric.action);
                  }
                }}
                className={cn(
                  'overflow-hidden rounded-2xl border border-white/10 bg-muted/40 p-[1px] shadow-sm transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                )}
              >
                <div className={cn('rounded-2xl bg-gradient-to-br p-4 text-sm', metric.accent)}>
                  <div className="flex items-center gap-3">
                    <metric.icon className="h-8 w-8" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] opacity-80">{metric.label}</p>
                      <p className="text-2xl font-bold">{metric.value}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t('botManagement.filters.title', 'Filters')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('botManagement.filters.searchLabel', 'Search')}</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('common.search', { defaultValue: 'Search' })}
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('botManagement.filters.statusLabel', 'Status')}</label>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('botManagement.filters.statusPlaceholder', 'All Status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('botManagement.filters.statusAll', 'All Status')}</SelectItem>
                  <SelectItem value="online">{t('botManagement.filters.statusOnline', 'Online Only')}</SelectItem>
                  <SelectItem value="offline">{t('botManagement.filters.statusOffline', 'Offline Only')}</SelectItem>
                  <SelectItem value="active">{t('botManagement.filters.statusActive', 'Active Only')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('botManagement.filters.guildLabel', 'Guild')}</label>
              <Select value={selectedGuildId} onValueChange={setSelectedGuildId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('botManagement.filters.guildPlaceholder', 'All Guilds')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('botManagement.filters.guildAll', 'All Guilds')}</SelectItem>
                  {globalState &&
                    Object.keys(globalState.guilds).map((guildId) => (
                      <SelectItem key={guildId} value={guildId}>
                        {guildId}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters} className="w-full">
                {t('botManagement.filters.clear', 'Clear Filters')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {t('botManagement.instances.title', 'Bot Instances')} ({filteredInstances.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredInstances.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Server className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">
                {t('botManagement.instances.emptyTitle', 'No instances found')}
              </h3>
              <p>{t('botManagement.instances.emptyDescription', 'No bot instances match your current filters')}</p>
            </div>
          ) : (
            filteredInstances.map(({ guildId, instance }) => {
              const isSelected =
                selectedInstance?.guildId === guildId &&
                selectedInstance?.instance.instanceId === instance.instanceId;

              return (
                <div
                  key={`${guildId}-${instance.instanceId}`}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedInstance({ guildId, instance })}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedInstance({ guildId, instance });
                    }
                  }}
                  className={cn(
                    'border rounded-lg p-4 transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                    instance.isActive && 'ring-1 ring-primary/60 bg-primary/5',
                    isSelected && 'ring-2 ring-primary/80 bg-primary/10 border-primary/40',
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{instance.instanceId}</h3>
                        <Badge variant={instance.isActive ? 'default' : instance.online ? 'secondary' : 'destructive'}>
                          {instance.isActive
                            ? t('status.active', 'Active')
                            : instance.online
                              ? t('status.online', 'Online')
                              : t('status.offline', 'Offline')}
                        </Badge>
                        <Badge variant="outline">
                          {t('botManagement.labels.guild', 'Guild')}: {guildId}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                        {instance.hostname && (
                          <div className="flex items-center gap-2">
                            <HardDrive className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <span className="text-muted-foreground">
                                {t('botManagement.labels.host', 'Host')}:
                              </span>
                              <div className="font-medium truncate">{instance.hostname}</div>
                            </div>
                          </div>
                        )}
                        {instance.pid && (
                          <div className="flex items-center gap-2">
                            <Cpu className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <span className="text-muted-foreground">
                                {t('botManagement.labels.pid', 'PID')}:
                              </span>
                              <div className="font-medium">{instance.pid}</div>
                            </div>
                          </div>
                        )}
                        {instance.shardId !== undefined && (
                          <div className="flex items-center gap-2">
                            <Server className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <span className="text-muted-foreground">
                                {t('botManagement.labels.shard', 'Shard')}:
                              </span>
                              <div className="font-medium">{instance.shardId}</div>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <span className="text-muted-foreground">{t('botManagement.labels.lastSeen', 'Last seen')}:</span>
                            <div className="font-medium">{formatLastHeartbeat(instance.lastHeartbeat)}</div>
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="border-t pt-4 text-sm">
                          <p className="mb-2 font-semibold">
                            {t('botManagement.instanceDetails.selectedTitle', 'Selected Instance Details')}
                          </p>
                          <div className="grid gap-2 md:grid-cols-2">
                            <div>
                              <p className="text-xs text-muted-foreground">
                                {t('botManagement.labels.instanceId', 'Instance ID')}
                              </p>
                              <p className="font-medium">{instance.instanceId}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">{t('botManagement.labels.guild', 'Guild')}</p>
                              <p className="font-medium">{guildId}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">{t('botManagement.labels.status', 'Status')}</p>
                              <p className="font-medium">{instance.online ? t('status.online', 'Online') : t('status.offline', 'Offline')}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">{t('botManagement.labels.active', 'Active')}</p>
                              <p className="font-medium">{instance.isActive ? t('common.yes', 'Yes') : t('common.no', 'No')}</p>
                            </div>
                            {Object.entries(instance.extra ?? {}).map(([key, value]) => (
                              <div key={key}>
                                <p className="text-xs text-muted-foreground capitalize">{key}</p>
                                <p className="font-medium break-all">{String(value)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant={instance.isActive ? 'secondary' : 'default'}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleMakeActive(guildId, instance.instanceId);
                        }}
                        disabled={instance.isActive || !instance.online}
                      >
                        {instance.isActive
                          ? t('status.active', 'Active')
                          : t('botManagement.actions.makeActive', 'Make Active')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(event) => {
                          event.stopPropagation();
                          handlePing(instance.instanceId);
                        }}
                        disabled={!instance.online}
                      >
                        {t('botManagement.actions.ping', 'Ping')}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleShutdown(guildId, instance.instanceId);
                        }}
                        disabled={!instance.online}
                      >
                        {t('botManagement.actions.shutdown', 'Shutdown')}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
