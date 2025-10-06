import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useBotStore } from '@/stores/useBotStore';
import BotInstanceCard from '@/components/BotInstanceCard';
import CurrentSongDisplay from '@/components/CurrentSongDisplay';
import ConnectionStatusMonitor from '@/components/ConnectionStatusMonitor';
import { Server, Users, Activity, RefreshCw, Sparkles, Radio, HeartPulse } from 'lucide-react';
import type { GlobalState, GuildState, InstanceInfo } from 'discord-dashboard-shared';

type MetricAction = 'guilds' | 'instances' | 'online' | 'active';

export default function Dashboard() {
  const { t } = useTranslation('ui');
  const [globalState, setGlobalState] = useState<GlobalState | null>(null);
  const [selectedGuildId, setSelectedGuildId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const wsConnected = useBotStore((state) => state.wsConnected);
  const navigate = useNavigate();

  const loadGlobalState = async () => {
    setLoading(true);
    try {
      const state = await Api.getGlobalState();
      setGlobalState(state);

      if (!selectedGuildId && state.guilds && Object.keys(state.guilds).length > 0) {
        setSelectedGuildId(Object.keys(state.guilds)[0]);
      }
    } catch (error) {
      console.error('Failed to load global state:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGlobalState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedGuild = selectedGuildId && globalState?.guilds[selectedGuildId];

  const metrics = useMemo(() => {
    if (!globalState) {
      return {
        guildCount: 0,
        totalInstances: 0,
        onlineInstances: 0,
        activeInstances: 0,
      };
    }

    const guilds = Object.values(globalState.guilds);
    const totalInstances = guilds.reduce(
      (total: number, guild: GuildState) => total + Object.keys(guild.instances).length,
      0,
    );
    const onlineInstances = guilds.reduce(
      (total: number, guild: GuildState) =>
        total + Object.values(guild.instances).filter((instance) => instance.online).length,
      0,
    );
    const activeInstances = guilds.reduce(
      (total: number, guild: GuildState) =>
        total + Object.values(guild.instances).filter((instance) => instance.isActive).length,
      0,
    );

    return {
      guildCount: Object.keys(globalState.guilds).length,
      totalInstances,
      onlineInstances,
      activeInstances,
    };
  }, [globalState]);

  const handleMetricClick = (action?: MetricAction) => {
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

  const metricCards = [
    {
      icon: Server,
      label: t('dashboard.metrics.guilds', 'Total Guilds'),
      value: metrics.guildCount,
      accent: 'from-primary/30 to-primary/5 text-primary-foreground',
      action: 'guilds' as const,
    },
    {
      icon: Users,
      label: t('dashboard.metrics.instances', 'Bot Instances'),
      value: metrics.totalInstances,
      accent: 'from-emerald-400/30 to-emerald-500/10 text-emerald-100',
      action: 'instances' as const,
    },
    {
      icon: Activity,
      label: t('dashboard.metrics.online', 'Online'),
      value: metrics.onlineInstances,
      accent: 'from-sky-400/30 to-sky-500/10 text-sky-100',
      action: 'online' as const,
    },
    {
      icon: HeartPulse,
      label: t('dashboard.metrics.active', 'Active'),
      value: metrics.activeInstances,
      accent: 'from-fuchsia-500/30 to-fuchsia-600/10 text-fuchsia-100',
      action: 'active' as const,
    },
  ];

  return (
    <div className="space-y-10">
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/10 backdrop-blur-xl">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              {t('dashboard.title', 'Dashboard Overview')}
            </div>
            <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
              {t('dashboard.welcome', 'Welcome to Discord Bot Dashboard')}
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              {t(
                'dashboard.subtitle',
                'Monitor every instance, track the beats, and keep your community in sync with a Spotify-inspired control center.',
              )}
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Badge variant={wsConnected ? 'default' : 'destructive'} className="rounded-full bg-white/20">
              <span className="flex items-center gap-2">
                <Radio className="h-3 w-3" />
                {wsConnected ? t('websocket.connected', 'Connected') : t('websocket.disconnected', 'Disconnected')}
              </span>
            </Badge>
            <Button variant="outline" size="sm" onClick={loadGlobalState} disabled={loading} className="rounded-full border-white/40">
              <RefreshCw className={loading ? 'mr-2 h-4 w-4 animate-spin' : 'mr-2 h-4 w-4'} />
              {t('common.refresh', 'Refresh')}
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => (
          <div
            key={metric.label}
            role={metric.action ? 'button' : undefined}
            tabIndex={metric.action ? 0 : -1}
            onClick={() => handleMetricClick(metric.action)}
            onKeyDown={(event) => {
              if (!metric.action) return;
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleMetricClick(metric.action);
              }
            }}
            className={cn(
              'overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-[1px] shadow-lg shadow-black/10',
              metric.action && 'cursor-pointer transition-transform duration-200 hover:scale-[1.02] hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
            )}
          >
            <div
              className={cn(
                'rounded-[calc(1.5rem-1px)] bg-gradient-to-br p-6',
                metric.accent,
              )}
            >
              <div className="flex items-center justify-between">
                <metric.icon className="h-10 w-10" />
                <span className="text-3xl font-semibold">{metric.value}</span>
              </div>
              <p className="mt-4 text-sm font-medium uppercase tracking-[0.3em] opacity-80">{metric.label}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="backdrop-soft border-white/10">
            <CardHeader className="flex flex-col gap-3 pb-0">
              <CardTitle className="text-xl text-foreground">
                {t('dashboard.guildManagement.title', 'Guild Management')}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {t(
                  'dashboard.guildManagement.subtitle',
                  'Select a guild to manage active bot instances, current playback, and connection health.',
                )}
              </p>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Input
                  placeholder={t('dashboard.guildManagement.placeholder', 'Enter Guild ID to manage')}
                  value={selectedGuildId}
                  onChange={(event) => setSelectedGuildId(event.target.value)}
                  className="w-full rounded-full border-white/20 bg-white/5 sm:max-w-sm"
                />
                <Button onClick={loadGlobalState} disabled={loading} className="rounded-full">
                  {t('common.load', 'Load')}
                </Button>
              </div>

              {globalState && Object.keys(globalState.guilds).length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    {t('dashboard.guildManagement.available', 'Available Guilds')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(globalState.guilds).map((guildId) => (
                      <Button
                        key={guildId}
                        size="sm"
                        variant={selectedGuildId === guildId ? 'default' : 'outline'}
                        onClick={() => setSelectedGuildId(guildId)}
                        className="rounded-full"
                      >
                        {guildId}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedGuild ? (
            <>
              <Card className="backdrop-soft border-white/10">
                <CardHeader className="pb-0">
                  <CardTitle className="text-xl text-foreground">
                  {t('dashboard.botInstancesSection.title', 'Bot Instances')} - {selectedGuildId}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {Object.keys(selectedGuild.instances).length === 0 ? (
                    <div className="px-6 py-10 text-center text-muted-foreground">
                      <Server className="mx-auto mb-4 h-12 w-12 opacity-30" />
                      <p>{t('botManagement.noInstances', 'No bot instances found')}</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {Object.values(selectedGuild.instances).map((instance: InstanceInfo) => (
                        <React.Fragment key={instance.instanceId}>
                          {React.createElement(BotInstanceCard, {
                            guildId: selectedGuildId,
                            instance,
                            onUpdate: loadGlobalState,
                          })}
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <CurrentSongDisplay />
            </>
          ) : (
            <Card className="backdrop-soft border-white/10">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Server className="mx-auto mb-5 h-16 w-16 opacity-30" />
                <h3 className="text-lg font-semibold mb-2 text-foreground">
                  {t('dashboard.emptyState.title', 'Select a Guild')}
                </h3>
                <p>{t('dashboard.emptyState.subtitle', 'Enter a guild ID above to begin orchestrating your bots.')}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <ConnectionStatusMonitor />
        </div>
      </section>
    </div>
  );
}






