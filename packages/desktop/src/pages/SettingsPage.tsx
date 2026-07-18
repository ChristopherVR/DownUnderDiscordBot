import { useState, useEffect } from 'react';
import { useBotStore } from '@/stores/useBotStore';
import ThemeSelector from '@/components/ThemeSelector';
import BotProcessLogPanel from '@/components/BotProcessLogPanel';
import { platform, updaterPlatform, botProcess } from '@/platform';
import { toast } from '@/stores/useToastStore';
import {
  Save,
  RefreshCw,
  Server,
  Bot,
  LogIn,
  LogOut,
  Loader2,
  Crown,
  Palette,
  DownloadCloud,
  Play,
  Square,
  HardDrive,
} from 'lucide-react';

interface Guild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  botPresent: boolean;
}

export default function SettingsPage() {
  const connection = useBotStore((s) => s.connection);
  const setConnection = useBotStore((s) => s.setConnection);
  const connect = useBotStore((s) => s.connect);
  const disconnect = useBotStore((s) => s.disconnect);

  // Bot integration
  const botUser = useBotStore((s) => s.botUser);
  const botConnecting = useBotStore((s) => s.botConnecting);
  const botError = useBotStore((s) => s.botError);
  const connectToBot = useBotStore((s) => s.connectToBot);
  const disconnectBot = useBotStore((s) => s.disconnectBot);
  const guilds = useBotStore((s) => s.guilds);
  const guildsLoading = useBotStore((s) => s.guildsLoading);
  const fetchGuilds = useBotStore((s) => s.fetchGuilds);

  const [host, setHost] = useState(connection.host);
  const [port, setPort] = useState(connection.port.toString());
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  // Local bot sidecar
  const localBotStatus = useBotStore((s) => s.localBotStatus);
  const localBotLogs = useBotStore((s) => s.localBotLogs);
  const startLocalBot = useBotStore((s) => s.startLocalBot);
  const stopLocalBot = useBotStore((s) => s.stopLocalBot);
  const [clientToken, setClientToken] = useState('');
  const [guildId, setGuildId] = useState('');
  const [localPort, setLocalPort] = useState('3000');
  const [spotifyClientId, setSpotifyClientId] = useState('');
  const [spotifyClientSecret, setSpotifyClientSecret] = useState('');

  // Fetch guilds when bot connects
  useEffect(() => {
    if (botUser) fetchGuilds();
  }, [botUser, fetchGuilds]);

  // Load any previously-saved local bot settings
  useEffect(() => {
    if (!platform.canRunBotLocally) return;
    botProcess.getConfig().then((saved) => {
      if (!saved) return;
      setClientToken(saved.clientToken);
      setGuildId(saved.guildId ?? '');
      setLocalPort(saved.port.toString());
      setSpotifyClientId(saved.spotifyClientId ?? '');
      setSpotifyClientSecret(saved.spotifyClientSecret ?? '');
    });
  }, []);

  const handleSaveConnection = () => {
    setConnection(host, parseInt(port, 10) || 3001);
    disconnect();
    setTimeout(() => connect(), 200);
  };

  const handleStartLocalBot = () => {
    if (!clientToken.trim()) {
      toast.error('A Discord bot token is required');
      return;
    }
    startLocalBot({
      clientToken: clientToken.trim(),
      guildId: guildId.trim() || undefined,
      port: parseInt(localPort, 10) || 3000,
      spotifyClientId: spotifyClientId.trim() || undefined,
      spotifyClientSecret: spotifyClientSecret.trim() || undefined,
    });
  };

  const handleCheckForUpdates = async () => {
    setCheckingUpdate(true);
    try {
      const update = await updaterPlatform.checkForUpdate();
      if (!update) {
        toast.success("You're up to date");
        return;
      }
      toast.info(`Update v${update.version} available`, {
        label: 'Install & Restart',
        onClick: async () => {
          await updaterPlatform.downloadAndInstall();
          await updaterPlatform.relaunch();
        },
      });
    } finally {
      setCheckingUpdate(false);
    }
  };

  return (
    <div data-testid="settings-page">
      <h1 className="mb-6 text-2xl font-bold text-t-primary">Settings</h1>

      {/* Appearance / Theme */}
      <section className="card-glass mb-6 rounded-xl !p-6">
        <div className="mb-5 flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))', opacity: 0.2 }}
          >
            <Palette size={18} style={{ color: 'var(--accent)' }} />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-t-primary">Appearance</h2>
            <p className="text-[11px] text-t-faint">Customize the look and feel</p>
          </div>
        </div>
        <ThemeSelector />
      </section>

      {/* Bot Integration */}
      <section className="card-glass mb-6 rounded-xl !p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/20 to-violet-400/10">
            <Bot size={18} className="text-purple-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-t-primary">Bot Integration</h2>
            <p className="text-[11px] text-t-faint">
              Optionally connect to your Discord bot to play music in voice channels
            </p>
          </div>
          {botUser && (
            <div className="flex items-center gap-2">
              {connection.connected ? (
                <>
                  <div className="h-2 w-2 animate-pulse rounded-full" style={{ background: 'var(--accent)' }} />
                  <span className="text-[11px] font-medium" style={{ color: 'var(--accent)' }}>
                    Connected
                  </span>
                </>
              ) : (
                <>
                  <div className="h-2 w-2 rounded-full bg-yellow-400" />
                  <span className="text-[11px] font-medium text-yellow-400/70">Authenticated</span>
                </>
              )}
            </div>
          )}
        </div>

        {botUser ? (
          <div className="flex flex-col gap-4">
            {/* Connected user display */}
            <div className="flex items-center justify-between rounded-xl p-3" style={{ background: 'var(--glass-bg)' }}>
              <div className="flex items-center gap-3">
                {botUser.avatar ? (
                  <img
                    src={botUser.avatar}
                    alt=""
                    className="h-8 w-8 rounded-full"
                    style={{ border: '1px solid var(--border)' }}
                  />
                ) : (
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full"
                    style={{ background: 'var(--glass-bg-md)' }}
                  >
                    <Bot size={14} className="text-t-tertiary" />
                  </div>
                )}
                <span className="text-sm font-medium text-t-secondary">{botUser.username}</span>
              </div>
              <button
                onClick={disconnectBot}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-red-400/60 transition-colors hover:bg-red-500/10 hover:text-red-400"
              >
                <LogOut size={12} />
                Disconnect
              </button>
            </div>

            {/* Connected servers list */}
            {guildsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 size={18} className="animate-spin text-t-ghost" />
              </div>
            ) : guilds.length > 0 ? (
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-t-faint">
                  Connected Servers
                </label>
                <div
                  className="flex flex-col gap-1 rounded-xl p-1.5"
                  style={{ border: '1px solid var(--glass-border)', background: 'var(--glass-bg)' }}
                >
                  {guilds.map((guild: Guild) => (
                    <div key={guild.id} className="flex items-center gap-3 rounded-lg px-3 py-2">
                      {guild.icon ? (
                        <img src={guild.icon} alt="" className="h-8 w-8 rounded-lg object-cover" />
                      ) : (
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-lg"
                          style={{ background: 'var(--glass-bg-md)' }}
                        >
                          <Server size={14} className="text-t-faint" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-medium text-t-primary">{guild.name}</p>
                        <div className="flex items-center gap-2">
                          {guild.owner && (
                            <span className="flex items-center gap-0.5 text-[10px] text-yellow-500/60">
                              <Crown size={9} /> Owner
                            </span>
                          )}
                          {guild.botPresent ? (
                            <span className="flex items-center gap-0.5 text-[10px] text-spotify-green/60">
                              <Bot size={9} /> Active
                            </span>
                          ) : (
                            <span className="text-[10px] text-t-ghost">Bot not installed</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="py-2 text-center text-[12px] text-t-faint">No servers found with the bot installed.</p>
            )}

            {/* Connection settings */}
            <div className="pt-4" style={{ borderTop: '1px solid var(--glass-border)' }}>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-t-faint">
                Bot Server Address
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    placeholder="localhost"
                    className="input-glass"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    placeholder="3000"
                    className="input-glass"
                  />
                </div>
              </div>
              <div className="mt-3 flex gap-3">
                <button data-testid="settings-save" onClick={handleSaveConnection} className="btn-primary text-xs">
                  <Save size={12} /> Save & Reconnect
                </button>
                <button
                  onClick={() => {
                    disconnect();
                    setTimeout(() => connect(), 200);
                  }}
                  className="btn-glass text-xs"
                >
                  <RefreshCw size={12} /> Reconnect
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <button
              onClick={() => connectToBot()}
              disabled={botConnecting}
              className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all disabled:opacity-50"
            >
              {botConnecting ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
              {botConnecting ? 'Connecting...' : 'Connect to Bot'}
            </button>

            {botError && <p className="text-center text-xs text-red-400">{botError}</p>}

            <p className="text-center text-[11px] text-t-ghost">
              The bot must be running to connect. Bot integration is optional.
            </p>
          </div>
        )}
      </section>

      {/* Run Bot Locally (Tauri only - bundled sidecar) */}
      {platform.canRunBotLocally && (
        <section className="card-glass mb-6 rounded-xl !p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-400/10">
              <HardDrive size={18} className="text-emerald-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-t-primary">Run Bot Locally</h2>
              <p className="text-[11px] text-t-faint">
                Run a bundled copy of the bot on this machine instead of connecting to a separately-hosted one. No
                yt-dlp fallback in this mode.
              </p>
            </div>
            {localBotStatus.state === 'running' && (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                <span className="text-[11px] font-medium text-emerald-400">Running on :{localBotStatus.port}</span>
              </div>
            )}
            {localBotStatus.state === 'crashed' && (
              <span className="text-[11px] font-medium text-red-400">Crashed</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-t-faint">
                Discord Bot Token
              </label>
              <input
                type="password"
                value={clientToken}
                onChange={(e) => setClientToken(e.target.value)}
                placeholder="Required"
                className="input-glass"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-t-faint">
                Guild ID (optional)
              </label>
              <input
                type="text"
                value={guildId}
                onChange={(e) => setGuildId(e.target.value)}
                placeholder="Optional"
                className="input-glass"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-t-faint">Port</label>
              <input
                type="text"
                value={localPort}
                onChange={(e) => setLocalPort(e.target.value)}
                placeholder="3000"
                className="input-glass"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-t-faint">
                Spotify Client ID (optional)
              </label>
              <input
                type="text"
                value={spotifyClientId}
                onChange={(e) => setSpotifyClientId(e.target.value)}
                placeholder="Optional"
                className="input-glass"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-t-faint">
                Spotify Client Secret (optional)
              </label>
              <input
                type="password"
                value={spotifyClientSecret}
                onChange={(e) => setSpotifyClientSecret(e.target.value)}
                placeholder="Optional"
                className="input-glass"
              />
            </div>
          </div>

          <div className="mt-3 flex gap-3">
            {localBotStatus.state === 'running' || localBotStatus.state === 'starting' ? (
              <button
                onClick={() => stopLocalBot()}
                disabled={localBotStatus.state === 'starting'}
                className="btn-glass flex items-center gap-2 text-xs disabled:opacity-50"
              >
                {localBotStatus.state === 'starting' ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Square size={12} />
                )}
                {localBotStatus.state === 'starting' ? 'Starting...' : 'Stop Local Bot'}
              </button>
            ) : (
              <button onClick={handleStartLocalBot} className="btn-primary flex items-center gap-2 text-xs">
                <Play size={12} />
                Start Local Bot
              </button>
            )}
          </div>

          {localBotStatus.state === 'crashed' && <p className="mt-3 text-xs text-red-400">{localBotStatus.message}</p>}

          <div className="mt-4">
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-t-faint">Output</label>
            <BotProcessLogPanel logs={localBotLogs} />
          </div>
        </section>
      )}

      {/* Application / Updates */}
      {platform.canCheckForUpdates && (
        <section className="card-glass mb-6 rounded-xl !p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500/20 to-blue-400/10">
              <DownloadCloud size={18} className="text-sky-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-t-primary">Application</h2>
              <p className="text-[11px] text-t-faint">Check for a newer version of the app</p>
            </div>
          </div>
          <button
            onClick={handleCheckForUpdates}
            disabled={checkingUpdate}
            className="btn-glass flex items-center gap-2 text-xs disabled:opacity-50"
          >
            {checkingUpdate ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            Check for Updates
          </button>
        </section>
      )}
    </div>
  );
}
