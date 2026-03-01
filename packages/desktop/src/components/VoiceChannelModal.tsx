import { useEffect, useState } from 'react';
import { useBotStore } from '@/stores/useBotStore';
import { api } from '@/lib/api';
import { Loader2, Hash, Users, X, ChevronLeft, Server } from 'lucide-react';

interface VoiceChannel {
  id: string;
  name: string;
  userCount: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (channelId: string) => void;
}

export default function VoiceChannelModal({ open, onClose, onSelect }: Props) {
  const focusedGuildId = useBotStore((s) => s.focusedGuildId);
  const focusGuild = useBotStore((s) => s.focusGuild);
  const guilds = useBotStore((s) => s.guilds);
  const [channels, setChannels] = useState<VoiceChannel[]>([]);
  const [loading, setLoading] = useState(false);

  // Which guild is selected inside this modal (may differ from the global focusedGuildId)
  const [selectedGuildId, setSelectedGuildId] = useState<string | null>(null);

  // If there's only one guild, auto-select it; otherwise require explicit pick
  const needsGuildPick = guilds.length > 1 && !selectedGuildId;
  const effectiveGuildId = selectedGuildId ?? (guilds.length === 1 ? guilds[0].id : focusedGuildId);

  // Reset state when modal opens / closes
  useEffect(() => {
    if (open) {
      setSelectedGuildId(null);
      setChannels([]);
    }
  }, [open]);

  // Fetch voice channels once we have a guild
  useEffect(() => {
    if (!open || !effectiveGuildId || needsGuildPick) return;

    setLoading(true);
    api
      .getVoiceChannels(effectiveGuildId)
      .then((data) => setChannels(data.channels))
      .catch(() => setChannels([]))
      .finally(() => setLoading(false));
  }, [open, effectiveGuildId, needsGuildPick]);

  if (!open) return null;

  const handleSelectGuild = (guildId: string) => {
    setSelectedGuildId(guildId);
    focusGuild(guildId);
  };

  const handleBack = () => {
    setSelectedGuildId(null);
    setChannels([]);
  };

  const handleSelectChannel = (channelId: string) => {
    onSelect(channelId);
    onClose();
  };

  // --- Guild picker step ---
  if (needsGuildPick) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="card-glass w-full max-w-sm rounded-2xl !p-0 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <h2 className="text-sm font-semibold text-t-primary">Select Server</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-t-faint transition-colors hover:bg-white/[0.06] hover:text-t-secondary"
            >
              <X size={16} />
            </button>
          </div>

          {/* Guild list */}
          <div className="max-h-64 overflow-y-auto p-2">
            {guilds.length === 0 ? (
              <div className="py-10 text-center text-sm text-t-faint">
                No servers available
              </div>
            ) : (
              guilds.map((g) => (
                <button
                  key={g.id}
                  onClick={() => handleSelectGuild(g.id)}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all hover:bg-white/[0.06]"
                >
                  {g.icon ? (
                    <img
                      src={`https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=32`}
                      alt=""
                      className="h-6 w-6 rounded-full"
                    />
                  ) : (
                    <Server size={16} className="text-t-faint" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-t-secondary">{g.name}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- Voice channel picker step ---
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="card-glass w-full max-w-sm rounded-2xl !p-0 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div className="flex items-center gap-2">
            {guilds.length > 1 && (
              <button
                onClick={handleBack}
                className="rounded-lg p-1 text-t-faint transition-colors hover:bg-white/[0.06] hover:text-t-secondary"
                title="Back to server list"
              >
                <ChevronLeft size={16} />
              </button>
            )}
            <h2 className="text-sm font-semibold text-t-primary">Select Voice Channel</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-t-faint transition-colors hover:bg-white/[0.06] hover:text-t-secondary"
          >
            <X size={16} />
          </button>
        </div>

        {/* Channel list */}
        <div className="max-h-64 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={24} className="animate-spin text-t-faint" />
            </div>
          ) : channels.length === 0 ? (
            <div className="py-10 text-center text-sm text-t-faint">
              No voice channels found
            </div>
          ) : (
            channels.map((ch) => (
              <button
                key={ch.id}
                onClick={() => handleSelectChannel(ch.id)}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all hover:bg-white/[0.06]"
              >
                <Hash size={16} className="text-t-faint" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-t-secondary">{ch.name}</p>
                </div>
                {ch.userCount > 0 && (
                  <span className="flex items-center gap-1 text-[11px] text-t-faint">
                    <Users size={12} />
                    {ch.userCount}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
