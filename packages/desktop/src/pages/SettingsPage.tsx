import { useState } from 'react';
import { useBotStore } from '@/stores/useBotStore';
import { Save, RefreshCw, Wifi, WifiOff, Server, Info } from 'lucide-react';

export default function SettingsPage() {
  const connection = useBotStore((s) => s.connection);
  const setConnection = useBotStore((s) => s.setConnection);
  const setGuildId = useBotStore((s) => s.setGuildId);
  const connect = useBotStore((s) => s.connect);
  const disconnect = useBotStore((s) => s.disconnect);

  const [host, setHost] = useState(connection.host);
  const [port, setPort] = useState(connection.port.toString());
  const [guildId, setGuild] = useState(connection.guildId);

  const handleSave = () => {
    setConnection(host, parseInt(port, 10) || 3001);
    setGuildId(guildId);
    disconnect();
    setTimeout(() => connect(), 200);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-white">Settings</h1>

      {/* Bot Connection */}
      <section className="card-glass mb-6 rounded-xl !p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-spotify-green/20 to-emerald-400/10">
            <Server size={18} className="text-spotify-green" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-white">Bot Connection</h2>
            <p className="text-[11px] text-white/25">Configure how the dashboard connects to your bot</p>
          </div>
          <div className="flex items-center gap-2">
            {connection.connected ? (
              <>
                <div className="h-2 w-2 animate-pulse rounded-full bg-spotify-green" />
                <span className="text-[11px] font-medium text-spotify-green">Connected</span>
              </>
            ) : (
              <>
                <div className="h-2 w-2 rounded-full bg-red-400" />
                <span className="text-[11px] font-medium text-red-400/70">Disconnected</span>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/25">
              Host
            </label>
            <input
              type="text"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              className="input-glass"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/25">
              Port
            </label>
            <input
              type="text"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              className="input-glass"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/25">
            Guild ID
          </label>
          <input
            type="text"
            value={guildId}
            onChange={(e) => setGuild(e.target.value)}
            placeholder="Enter your Discord server ID"
            className="input-glass"
          />
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={handleSave} className="btn-primary">
            <Save size={14} /> Save & Reconnect
          </button>
          <button
            onClick={() => {
              disconnect();
              setTimeout(() => connect(), 200);
            }}
            className="btn-glass"
          >
            <RefreshCw size={14} /> Reconnect
          </button>
        </div>
      </section>

      {/* About */}
      <section className="card-glass rounded-xl !p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04]">
            <Info size={18} className="text-white/40" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">About</h2>
            <p className="text-[11px] text-white/25">Down Under Discord Bot v2.0.0</p>
          </div>
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-white/25">
          A multi-platform music bot with Tauri desktop dashboard.
          Supports YouTube, Spotify, SoundCloud, and local files.
        </p>
      </section>
    </div>
  );
}
