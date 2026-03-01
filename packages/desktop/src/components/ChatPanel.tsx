import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  X,
  Send,
  Hash,
  ChevronDown,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Slash,
  ArrowUp,
  Image,
  Bot,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import DiscordMarkdown from '@/components/DiscordMarkdown';
import { useLayoutStore, type LocalMessage } from '@/stores/useLayoutStore';
import { useBotStore } from '@/stores/useBotStore';
import {
  api,
  type CommandRegistryItem,
  type CommandOptionItem,
  type DiscordMessage,
  type DiscordEmbed,
  type DiscordAttachment,
} from '@/lib/api';
import { wsService } from '@/lib/ws';

// ── Helpers ─────────────────────────────────────────────────────────

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `Today at ${time}`;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear()
  )
    return `Yesterday at ${time}`;
  return `${d.toLocaleDateString([], { month: '2-digit', day: '2-digit', year: 'numeric' })} ${time}`;
}

/** True if this message should show its full header (avatar, name, timestamp) vs compact inline. */
function shouldShowHeader(msg: DiscordMessage, prev: DiscordMessage | null): boolean {
  if (!prev) return true;
  if (prev.author.id !== msg.author.id) return true;
  if (msg.timestamp - prev.timestamp > 5 * 60 * 1000) return true;
  return false;
}

function embedColorToCSS(color: number | null): string {
  if (color === null || color === undefined) return 'var(--accent)';
  return `#${color.toString(16).padStart(6, '0')}`;
}

function formatExecutionResult(execution: {
  status: string;
  result?: unknown;
  error?: string;
  command: string;
}): string {
  if (execution.status === 'error') return execution.error ?? 'Command failed';
  if (execution.result) {
    if (typeof execution.result === 'string') return execution.result;
    if (typeof execution.result === 'object') {
      const r = execution.result as Record<string, unknown>;
      if (r.message && typeof r.message === 'string') return r.message;
      if (r.content && typeof r.content === 'string') return r.content;
      return JSON.stringify(execution.result, null, 2);
    }
  }
  return `✓ /${execution.command} executed successfully`;
}

// ── Main component ──────────────────────────────────────────────────

export default function ChatPanel() {
  // Layout store
  const chatOpen = useLayoutStore((s) => s.chatOpen);
  const setChatOpen = useLayoutStore((s) => s.setChatOpen);
  const selectedChannelId = useLayoutStore((s) => s.selectedChannelId);
  const setSelectedChannelId = useLayoutStore((s) => s.setSelectedChannelId);
  const textChannels = useLayoutStore((s) => s.textChannels);
  const setTextChannels = useLayoutStore((s) => s.setTextChannels);
  const channelMessages = useLayoutStore((s) => s.channelMessages);
  const setChannelMessages = useLayoutStore((s) => s.setChannelMessages);
  const prependChannelMessages = useLayoutStore((s) => s.prependChannelMessages);
  const appendChannelMessage = useLayoutStore((s) => s.appendChannelMessage);
  const messagesLoading = useLayoutStore((s) => s.messagesLoading);
  const setMessagesLoading = useLayoutStore((s) => s.setMessagesLoading);
  const hasMoreMessages = useLayoutStore((s) => s.hasMoreMessages);
  const setHasMoreMessages = useLayoutStore((s) => s.setHasMoreMessages);
  const localEntries = useLayoutStore((s) => s.localEntries);
  const addLocalEntry = useLayoutStore((s) => s.addLocalEntry);
  const activeCommand = useLayoutStore((s) => s.activeCommand);
  const setActiveCommand = useLayoutStore((s) => s.setActiveCommand);
  const commandArgs = useLayoutStore((s) => s.commandArgs);
  const setCommandArg = useLayoutStore((s) => s.setCommandArg);
  const resetCommandArgs = useLayoutStore((s) => s.resetCommandArgs);

  // Bot store
  const connected = useBotStore((s) => s.connection.connected);
  const focusedGuildId = useBotStore((s) => s.focusedGuildId);

  // Local state
  const [input, setInput] = useState('');
  const [commands, setCommands] = useState<CommandRegistryItem[]>([]);
  const [showCommandPicker, setShowCommandPicker] = useState(false);
  const [commandFilter, setCommandFilter] = useState('');
  const [sending, setSending] = useState(false);
  const [channelDropdownOpen, setChannelDropdownOpen] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [selectedCmdIndex, setSelectedCmdIndex] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const channelDropdownRef = useRef<HTMLDivElement>(null);
  const initialFetchDone = useRef(false);

  // ── Fetch channels when guild changes ──
  useEffect(() => {
    if (!connected || !focusedGuildId) {
      setTextChannels([]);
      return;
    }
    const fetchChannels = async () => {
      try {
        const res = await api.getCommandChannels(focusedGuildId);
        if (res.success) {
          const text = res.channels.filter((c: { type: string }) => c.type === 'text');
          setTextChannels(text);
          if (!selectedChannelId && text.length > 0) {
            setSelectedChannelId(text[0].id);
          }
        }
      } catch {
        /* silently fail */
      }
    };
    fetchChannels();
  }, [connected, focusedGuildId, selectedChannelId, setTextChannels, setSelectedChannelId]);

  // ── Fetch command registry ──
  useEffect(() => {
    if (!connected) return;
    const fetchCommands = async () => {
      try {
        const res = await api.getCommandRegistry();
        if (res.success) setCommands(res.commands);
      } catch {
        /* silently fail */
      }
    };
    fetchCommands();
  }, [connected]);

  // ── Fetch messages when channel changes ──
  useEffect(() => {
    if (!selectedChannelId || !connected) return;
    initialFetchDone.current = false;
    const fetchMessages = async () => {
      setMessagesLoading(true);
      try {
        const res = await api.getChannelMessages(selectedChannelId, 50);
        if (res.success) {
          setChannelMessages(res.messages);
          setHasMoreMessages(res.messages.length >= 50);
          initialFetchDone.current = true;
          // Scroll to bottom after initial load
          requestAnimationFrame(() => {
            messagesEndRef.current?.scrollIntoView();
          });
        }
      } catch {
        /* silently fail */
      } finally {
        setMessagesLoading(false);
      }
    };
    fetchMessages();
  }, [selectedChannelId, connected, setChannelMessages, setMessagesLoading, setHasMoreMessages]);

  // ── Subscribe to real-time channel messages via WebSocket ──
  useEffect(() => {
    const unsub = wsService.on('channel_message', (data: unknown) => {
      const payload = data as { channelId: string; message: DiscordMessage };
      if (payload.channelId === selectedChannelId) {
        appendChannelMessage(payload.message);
        // Auto-scroll if near bottom
        const container = messagesContainerRef.current;
        if (container) {
          const isNearBottom =
            container.scrollHeight - container.scrollTop - container.clientHeight < 120;
          if (isNearBottom) {
            requestAnimationFrame(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }));
          }
        }
      }
    });
    return () => { unsub(); };
  }, [selectedChannelId, appendChannelMessage]);

  // ── Load older messages on scroll to top ──
  const loadOlderMessages = useCallback(async () => {
    if (loadingOlder || !hasMoreMessages || !selectedChannelId || channelMessages.length === 0) return;
    setLoadingOlder(true);
    try {
      const oldest = channelMessages[0];
      const res = await api.getChannelMessages(selectedChannelId, 50, oldest.id);
      if (res.success) {
        if (res.messages.length === 0) {
          setHasMoreMessages(false);
        } else {
          prependChannelMessages(res.messages);
          setHasMoreMessages(res.messages.length >= 50);
        }
      }
    } catch {
      /* silently fail */
    } finally {
      setLoadingOlder(false);
    }
  }, [loadingOlder, hasMoreMessages, selectedChannelId, channelMessages, prependChannelMessages, setHasMoreMessages]);

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    if (container.scrollTop < 60 && !loadingOlder && hasMoreMessages && initialFetchDone.current) {
      loadOlderMessages();
    }
  }, [loadOlderMessages, loadingOlder, hasMoreMessages]);

  // ── Close channel dropdown on outside click ──
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (channelDropdownRef.current && !channelDropdownRef.current.contains(e.target as Node)) {
        setChannelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Slash-command input handling ──
  const handleInputChange = useCallback(
    (value: string) => {
      setInput(value);
      if (value.startsWith('/')) {
        const filter = value.slice(1).split(/\s/)[0]?.toLowerCase() ?? '';
        // If the user already fully typed a command name and is filling args, don't keep showing picker
        const hasSpace = value.indexOf(' ') > 0;
        const matchedCmd = commands.find((c) => c.name === filter);
        if (hasSpace && matchedCmd) {
          setShowCommandPicker(false);
          // Auto-activate the command for arg input
          if (!activeCommand) setActiveCommand(matchedCmd.name);
        } else {
          setShowCommandPicker(true);
          setCommandFilter(filter);
          setSelectedCmdIndex(0);
        }
      } else {
        setShowCommandPicker(false);
        setCommandFilter('');
        if (activeCommand) resetCommandArgs();
      }
    },
    [commands, activeCommand, setActiveCommand, resetCommandArgs],
  );

  const filteredCommands = useMemo(
    () =>
      commandFilter
        ? commands.filter(
            (c) =>
              c.name.toLowerCase().includes(commandFilter) ||
              c.description.toLowerCase().includes(commandFilter),
          )
        : commands,
    [commands, commandFilter],
  );

  /** Get the active command's definition. */
  const activeCommandDef = useMemo(
    () => (activeCommand ? commands.find((c) => c.name === activeCommand) : null),
    [activeCommand, commands],
  );

  // ── Send ──
  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || sending || !connected) return;

    setInput('');
    setShowCommandPicker(false);

    // Is it a slash command?
    if (trimmed.startsWith('/')) {
      const parts = trimmed.slice(1).trim().split(/\s+/);
      const cmdName = parts[0];
      const cmd = commands.find((c) => c.name === cmdName);
      if (!cmd) {
        addLocalEntry({
          id: `local-${Date.now()}`,
          type: 'error',
          content: `Unknown command: /${cmdName}`,
          timestamp: Date.now(),
        });
        resetCommandArgs();
        return;
      }

      // Parse arguments from the input text
      const args: Record<string, string> = { ...commandArgs };
      for (let i = 1; i < parts.length; i++) {
        const p = parts[i];
        if (p.includes(':')) {
          const [key, ...val] = p.split(':');
          args[key] = val.join(':');
        } else if (cmd.options && cmd.options.length > i - 1) {
          args[cmd.options[i - 1].name] = p;
        }
      }

      setSending(true);
      const entryId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      addLocalEntry({
        id: entryId,
        type: 'command_pending',
        content: `Executing /${cmdName}...`,
        commandName: cmdName,
        timestamp: Date.now(),
        status: 'pending',
      });

      try {
        const res = await api.executeCommand(
          cmdName,
          args,
          focusedGuildId ?? undefined,
          selectedChannelId ?? undefined,
        );
        addLocalEntry({
          id: `${entryId}-result`,
          type: 'command_result',
          content: res.success
            ? formatExecutionResult(res.execution)
            : `Failed: ${res.execution?.error ?? 'Unknown error'}`,
          commandName: cmdName,
          timestamp: Date.now(),
          status: res.execution?.status === 'error' ? 'error' : 'success',
        });
      } catch (err) {
        addLocalEntry({
          id: `${entryId}-err`,
          type: 'error',
          content: err instanceof Error ? err.message : 'Failed to execute command',
          commandName: cmdName,
          timestamp: Date.now(),
          status: 'error',
        });
      } finally {
        setSending(false);
        resetCommandArgs();
      }
    } else {
      // Regular text message — send to channel
      if (!selectedChannelId) return;
      setSending(true);
      try {
        const res = await api.sendChannelMessage(selectedChannelId, trimmed);
        if (res.success && res.message) {
          appendChannelMessage(res.message);
          requestAnimationFrame(() =>
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }),
          );
        }
      } catch (err) {
        addLocalEntry({
          id: `local-${Date.now()}`,
          type: 'error',
          content: err instanceof Error ? err.message : 'Failed to send message',
          timestamp: Date.now(),
        });
      } finally {
        setSending(false);
      }
    }

    inputRef.current?.focus();
  }, [
    input,
    sending,
    connected,
    commands,
    commandArgs,
    focusedGuildId,
    selectedChannelId,
    addLocalEntry,
    appendChannelMessage,
    resetCommandArgs,
  ]);

  // ── Select a command from the picker ──
  const selectCommand = useCallback(
    (cmd: CommandRegistryItem) => {
      setActiveCommand(cmd.name);
      if (cmd.options && cmd.options.length > 0) {
        setInput(`/${cmd.name} `);
      } else {
        setInput(`/${cmd.name}`);
      }
      setShowCommandPicker(false);
      inputRef.current?.focus();
    },
    [setActiveCommand],
  );

  // ── Keyboard navigation in command picker ──
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (showCommandPicker && filteredCommands.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedCmdIndex((i) => Math.min(i + 1, filteredCommands.length - 1));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedCmdIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === 'Tab' || e.key === 'Enter') {
          if (showCommandPicker) {
            e.preventDefault();
            selectCommand(filteredCommands[selectedCmdIndex]);
            return;
          }
        }
      }
      if (e.key === 'Enter' && !e.shiftKey && !showCommandPicker) {
        e.preventDefault();
        handleSend();
      }
      if (e.key === 'Escape') {
        if (showCommandPicker) setShowCommandPicker(false);
        else if (activeCommand) resetCommandArgs();
      }
    },
    [showCommandPicker, filteredCommands, selectedCmdIndex, selectCommand, handleSend, activeCommand, resetCommandArgs],
  );

  const selectedChannel = textChannels.find((c) => c.id === selectedChannelId);

  // ── Render ──
  return (
    <div
      className={cn(
        'fixed right-0 top-9 z-40 flex flex-col backdrop-blur-2xl transition-all duration-300 ease-in-out',
        chatOpen ? 'w-[360px] translate-x-0' : 'w-[360px] translate-x-full',
      )}
      style={{
        height: 'calc(100vh - 2.25rem - 5rem)',
        borderLeft: '1px solid var(--playerbar-border)',
        background: 'var(--sidebar-bg)',
      }}
    >
      {/* ── Header ── */}
      <div
        className="flex shrink-0 items-center justify-between px-4 py-2.5"
        style={{ borderBottom: '1px solid var(--playerbar-border)' }}
      >
        <div className="flex items-center gap-2">
          <Hash size={16} style={{ color: 'var(--accent)' }} />
          <span className="text-sm font-semibold text-t-primary">
            {selectedChannel?.name ?? 'Chat'}
          </span>
        </div>
        <button
          onClick={() => setChatOpen(false)}
          title="Close chat"
          className="flex h-7 w-7 items-center justify-center rounded-md text-t-faint transition-colors hover:text-t-secondary"
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--nav-hover-bg)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <X size={14} />
        </button>
      </div>

      {/* ── Channel selector ── */}
      <div className="relative shrink-0 px-3 py-2" style={{ borderBottom: '1px solid var(--playerbar-border)' }}>
        <div ref={channelDropdownRef}>
          <button
            onClick={() => setChannelDropdownOpen(!channelDropdownOpen)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] transition-all"
            style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)' }}
          >
            <Hash size={13} className="text-t-faint" />
            <span className="flex-1 text-left text-t-secondary">
              {selectedChannel?.name ?? 'Select a channel'}
            </span>
            <ChevronDown
              size={13}
              className={cn('text-t-faint transition-transform', channelDropdownOpen && 'rotate-180')}
            />
          </button>

          {channelDropdownOpen && (
            <div
              className="absolute left-3 right-3 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-lg py-1 shadow-lg"
              style={{ background: 'var(--surface)', border: '1px solid var(--glass-border-md)' }}
            >
              {textChannels.length === 0 ? (
                <div className="px-3 py-2 text-[12px] text-t-faint">
                  {connected ? 'No text channels found' : 'Connect to bot first'}
                </div>
              ) : (
                textChannels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => {
                      setSelectedChannelId(channel.id);
                      setChannelDropdownOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-1.5 text-[12px] transition-colors',
                      channel.id === selectedChannelId ? 'text-t-primary' : 'text-t-tertiary hover:text-t-secondary',
                    )}
                    style={{
                      background: channel.id === selectedChannelId ? 'var(--nav-active-bg)' : undefined,
                    }}
                    onMouseEnter={(e) => {
                      if (channel.id !== selectedChannelId)
                        e.currentTarget.style.background = 'var(--nav-hover-bg)';
                    }}
                    onMouseLeave={(e) => {
                      if (channel.id !== selectedChannelId)
                        e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <Hash size={12} />
                    <span>{channel.name}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Messages area ── */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto scroll-smooth"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--scrollbar-thumb) transparent' }}
      >
        {/* Load-more spinner */}
        {loadingOlder && (
          <div className="flex justify-center py-3">
            <Loader2 size={16} className="animate-spin text-t-faint" />
          </div>
        )}
        {hasMoreMessages && !loadingOlder && channelMessages.length > 0 && (
          <button
            onClick={loadOlderMessages}
            className="flex w-full items-center justify-center gap-1.5 py-2 text-[11px] text-t-faint transition-colors hover:text-t-secondary"
          >
            <ArrowUp size={12} />
            Load older messages
          </button>
        )}

        {!connected ? (
          <NotConnectedState />
        ) : !focusedGuildId ? (
          <NoServerState />
        ) : !selectedChannelId ? (
          <NoChannelState />
        ) : messagesLoading && channelMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 size={20} className="animate-spin text-t-faint" />
          </div>
        ) : channelMessages.length === 0 && !messagesLoading ? (
          <EmptyState onQuickCommand={(cmd) => { setInput(cmd + ' '); inputRef.current?.focus(); }} />
        ) : (
          <div className="flex flex-col px-3 py-2">
            {channelMessages.map((msg, i) => {
              const prev = i > 0 ? channelMessages[i - 1] : null;
              return (
                <DiscordMessageRow
                  key={msg.id}
                  message={msg}
                  showHeader={shouldShowHeader(msg, prev)}
                />
              );
            })}

            {/* Local entries (command feedback) rendered after real messages */}
            {localEntries.map((entry) => (
              <LocalEntryRow key={entry.id} entry={entry} />
            ))}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ── Command picker overlay ── */}
      {showCommandPicker && filteredCommands.length > 0 && (
        <div
          className="mx-3 mb-1 max-h-52 overflow-y-auto rounded-lg py-1"
          style={{ background: 'var(--surface)', border: '1px solid var(--glass-border-md)' }}
        >
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-t-faint">
            Commands
          </div>
          {filteredCommands.slice(0, 20).map((cmd, idx) => (
            <button
              key={cmd.name}
              onClick={() => selectCommand(cmd)}
              className={cn(
                'flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors',
                idx === selectedCmdIndex && 'bg-[var(--nav-hover-bg)]',
              )}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--nav-hover-bg)';
                setSelectedCmdIndex(idx);
              }}
              onMouseLeave={(e) => {
                if (idx !== selectedCmdIndex) e.currentTarget.style.background = 'transparent';
              }}
            >
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                style={{ background: 'var(--glass-bg-md)', border: '1px solid var(--glass-border)' }}
              >
                <Slash size={12} style={{ color: 'var(--accent)' }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-medium text-t-primary">{cmd.name}</span>
                  {cmd.options && cmd.options.length > 0 && (
                    <span className="text-[10px] text-t-ghost">
                      {cmd.options.map((o) => (o.required ? o.name : `[${o.name}]`)).join(' ')}
                    </span>
                  )}
                </div>
                <p className="truncate text-[11px] text-t-faint">{cmd.description}</p>
              </div>
              {cmd.category && (
                <span
                  className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-medium uppercase"
                  style={{ background: 'var(--glass-bg)', color: 'var(--text-tertiary)' }}
                >
                  {cmd.category}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Active command arg bar ── */}
      {activeCommandDef && activeCommandDef.options && activeCommandDef.options.length > 0 && !showCommandPicker && (
        <CommandArgBar
          command={activeCommandDef}
          args={commandArgs}
          onSetArg={setCommandArg}
          onCancel={resetCommandArgs}
        />
      )}

      {/* ── Input area ── */}
      <div className="shrink-0 px-3 py-2.5" style={{ borderTop: '1px solid var(--playerbar-border)' }}>
        <div
          className="flex items-center gap-2 rounded-lg px-3"
          style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)' }}
        >
          <Slash size={14} className="shrink-0 text-t-faint" />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              connected
                ? selectedChannelId
                  ? `Message #${selectedChannel?.name ?? 'channel'}`
                  : 'Select a channel first'
                : 'Connect to bot to chat'
            }
            disabled={!connected}
            className="h-9 flex-1 bg-transparent text-[13px] text-t-primary placeholder:text-t-faint outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending || !connected}
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-all',
              input.trim() && connected ? 'text-t-primary' : 'text-t-ghost',
            )}
            style={{
              background: input.trim() && connected ? 'var(--accent)' : 'transparent',
              color: input.trim() && connected ? 'var(--btn-primary-fg)' : undefined,
            }}
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Empty State ─────────────────────────────────────────────────────

function NotConnectedState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <div
        className="flex h-12 w-12 items-center justify-center rounded-xl"
        style={{ background: 'var(--glass-bg-md)', border: '1px solid var(--glass-border)' }}
      >
        <AlertCircle size={20} className="text-t-faint" />
      </div>
      <div>
        <p className="text-[13px] font-medium text-t-secondary">Not connected</p>
        <p className="mt-1 text-[11px] text-t-faint">
          Connect to the bot to start chatting
        </p>
      </div>
    </div>
  );
}

function NoServerState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <div
        className="flex h-12 w-12 items-center justify-center rounded-xl"
        style={{ background: 'var(--glass-bg-md)', border: '1px solid var(--glass-border)' }}
      >
        <Hash size={20} className="text-t-faint" />
      </div>
      <div>
        <p className="text-[13px] font-medium text-t-secondary">No server selected</p>
        <p className="mt-1 text-[11px] text-t-faint">
          Select a server from the sidebar to view channels
        </p>
      </div>
    </div>
  );
}

function NoChannelState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <div
        className="flex h-12 w-12 items-center justify-center rounded-xl"
        style={{ background: 'var(--glass-bg-md)', border: '1px solid var(--glass-border)' }}
      >
        <Hash size={20} className="text-t-faint" />
      </div>
      <div>
        <p className="text-[13px] font-medium text-t-secondary">No channel selected</p>
        <p className="mt-1 text-[11px] text-t-faint">
          Pick a text channel above to view messages
        </p>
      </div>
    </div>
  );
}

function EmptyState({ onQuickCommand }: { onQuickCommand: (cmd: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <div
        className="flex h-12 w-12 items-center justify-center rounded-xl"
        style={{ background: 'var(--glass-bg-md)', border: '1px solid var(--glass-border)' }}
      >
        <Hash size={20} className="text-t-faint" />
      </div>
      <div>
        <p className="text-[13px] font-medium text-t-secondary">No messages yet</p>
        <p className="mt-1 text-[11px] text-t-faint">
          Select a channel to view messages, or type{' '}
          <span style={{ color: 'var(--accent)' }}>/</span> for commands
        </p>
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-1.5">
        {['/play', '/skip', '/queue', '/volume', '/pause'].map((cmd) => (
          <button
            key={cmd}
            onClick={() => onQuickCommand(cmd)}
            className="rounded-full px-2.5 py-1 text-[11px] font-medium text-t-tertiary transition-colors hover:text-t-secondary"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
          >
            {cmd}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Discord-style message row ───────────────────────────────────────

function DiscordMessageRow({
  message,
  showHeader,
}: {
  message: DiscordMessage;
  showHeader: boolean;
}) {
  return (
    <div
      className={cn(
        'group relative flex gap-3 rounded px-1 py-0.5 transition-colors hover:bg-[var(--nav-hover-bg)]',
        showHeader && 'mt-3',
      )}
    >
      {/* Avatar column */}
      <div className="w-9 shrink-0">
        {showHeader ? (
          <img
            src={message.author.avatar}
            alt={message.author.displayName}
            className="h-9 w-9 rounded-full"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><rect fill="%235865F2" width="36" height="36" rx="18"/><text x="18" y="24" text-anchor="middle" fill="white" font-size="16">?</text></svg>';
            }}
          />
        ) : (
          <span className="hidden pt-0.5 text-center text-[10px] text-t-ghost group-hover:block">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {/* Content column */}
      <div className="min-w-0 flex-1">
        {showHeader && (
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-t-primary">
              {message.author.displayName}
            </span>
            {message.author.bot && (
              <span
                className="flex items-center gap-0.5 rounded px-1 py-0.5 text-[9px] font-semibold uppercase"
                style={{ background: 'var(--accent)', color: 'var(--btn-primary-fg)' }}
              >
                <Bot size={8} />
                BOT
              </span>
            )}
            <span className="text-[10px] text-t-ghost">{formatTimestamp(message.timestamp)}</span>
          </div>
        )}

        {/* Message text */}
        {message.content && (
          <DiscordMarkdown content={message.content} sizeClass="text-[13px]" />
        )}

        {/* Attachments */}
        {message.attachments.length > 0 && (
          <div className="mt-1 flex flex-col gap-1.5">
            {message.attachments.map((att) => (
              <AttachmentView key={att.id} attachment={att} />
            ))}
          </div>
        )}

        {/* Embeds */}
        {message.embeds.length > 0 && (
          <div className="mt-1.5 flex flex-col gap-1.5">
            {message.embeds.map((embed, idx) => (
              <EmbedView key={idx} embed={embed} />
            ))}
          </div>
        )}

        {/* Reactions */}
        {message.reactions.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {message.reactions.map((r, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]"
                style={{ background: 'var(--glass-bg-md)', border: '1px solid var(--glass-border)' }}
              >
                <span>{r.emoji}</span>
                <span className="text-t-faint">{r.count}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Attachment viewer ───────────────────────────────────────────────

function AttachmentView({ attachment }: { attachment: DiscordAttachment }) {
  const isImage = attachment.contentType?.startsWith('image/');

  if (isImage) {
    return (
      <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="block">
        <img
          src={attachment.proxyURL || attachment.url}
          alt={attachment.name ?? 'attachment'}
          className="max-h-[200px] max-w-full rounded-lg object-contain"
          style={{ border: '1px solid var(--glass-border)' }}
        />
      </a>
    );
  }

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] text-t-secondary transition-colors hover:text-t-primary"
      style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
    >
      <Image size={14} className="shrink-0 text-t-faint" />
      <span className="min-w-0 flex-1 truncate">{attachment.name ?? 'File'}</span>
      <span className="shrink-0 text-[10px] text-t-ghost">
        {attachment.size > 1024 * 1024
          ? `${(attachment.size / 1024 / 1024).toFixed(1)} MB`
          : `${(attachment.size / 1024).toFixed(1)} KB`}
      </span>
      <ExternalLink size={12} className="shrink-0 text-t-faint" />
    </a>
  );
}

// ── Embed viewer ────────────────────────────────────────────────────

function EmbedView({ embed }: { embed: DiscordEmbed }) {
  const borderColor = embedColorToCSS(embed.color);

  return (
    <div
      className="max-w-full overflow-hidden rounded-lg"
      style={{
        background: 'var(--glass-bg-md)',
        border: '1px solid var(--glass-border)',
        borderLeft: `3px solid ${borderColor}`,
      }}
    >
      <div className="p-3">
        {/* Embed author */}
        {embed.author && (
          <div className="mb-1 flex items-center gap-1.5">
            {embed.author.iconURL && (
              <img src={embed.author.iconURL} className="h-4 w-4 rounded-full" alt="" />
            )}
            {embed.author.url ? (
              <a
                href={embed.author.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-semibold text-t-primary hover:underline"
              >
                {embed.author.name}
              </a>
            ) : (
              <span className="text-[11px] font-semibold text-t-primary">{embed.author.name}</span>
            )}
          </div>
        )}

        {/* Embed title */}
        {embed.title && (
          <div className="mb-1">
            {embed.url ? (
              <a
                href={embed.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] font-semibold hover:underline"
                style={{ color: 'var(--accent)' }}
              >
                {embed.title}
              </a>
            ) : (
              <span className="text-[13px] font-semibold text-t-primary">{embed.title}</span>
            )}
          </div>
        )}

        {/* Embed description */}
        {embed.description && (
          <div className="mb-2">
            <DiscordMarkdown content={embed.description} sizeClass="text-[12px]" />
          </div>
        )}

        {/* Embed fields */}
        {embed.fields.length > 0 && (
          <div
            className="mb-2 grid gap-x-2 gap-y-1"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))' }}
          >
            {embed.fields.map((field, idx) => (
              <div key={idx} className={field.inline ? '' : 'col-span-full'}>
                <div className="text-[11px] font-semibold text-t-primary">{field.name}</div>
                <div className="text-[11px] text-t-secondary">
                  <DiscordMarkdown content={field.value} sizeClass="text-[11px]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Embed thumbnail (shown inline right) */}
        {embed.thumbnail && (
          <img
            src={embed.thumbnail.url}
            alt=""
            className="float-right ml-3 mt-1 max-h-[80px] max-w-[80px] rounded"
          />
        )}

        {/* Embed image */}
        {embed.image && (
          <img
            src={embed.image.url}
            alt=""
            className="mt-1 max-w-full rounded"
            style={{ maxHeight: 200 }}
          />
        )}

        {/* Embed footer */}
        {embed.footer && (
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-t-ghost">
            {embed.footer.iconURL && (
              <img src={embed.footer.iconURL} className="h-3.5 w-3.5 rounded-full" alt="" />
            )}
            <span>{embed.footer.text}</span>
            {embed.timestamp && (
              <>
                <span>•</span>
                <span>{new Date(embed.timestamp).toLocaleDateString()}</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Local (ephemeral) entry row ─────────────────────────────────────

function LocalEntryRow({ entry }: { entry: LocalMessage }) {
  const isError = entry.type === 'error' || entry.status === 'error';
  const isPending = entry.status === 'pending';
  const isSuccess = entry.status === 'success';

  return (
    <div
      className="mt-1 flex items-start gap-2 rounded-lg px-2 py-1.5"
      style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
    >
      <div className="mt-0.5 shrink-0">
        {isPending && <Loader2 size={13} className="animate-spin text-t-faint" />}
        {isSuccess && <CheckCircle2 size={13} style={{ color: 'var(--accent)' }} />}
        {isError && <AlertCircle size={13} className="text-red-400" />}
        {!isPending && !isSuccess && !isError && <Slash size={13} className="text-t-faint" />}
      </div>
      <div className="min-w-0 flex-1">
        {entry.commandName && (
          <span className="mr-1.5 text-[10px] font-semibold" style={{ color: 'var(--accent)' }}>
            /{entry.commandName}
          </span>
        )}
        <span className={cn('text-[12px]', isError ? 'text-red-400' : 'text-t-secondary')}>
          {entry.content}
        </span>
      </div>
    </div>
  );
}

// ── Command arg bar ─────────────────────────────────────────────────

function CommandArgBar({
  command,
  args,
  onSetArg,
  onCancel,
}: {
  command: CommandRegistryItem;
  args: Record<string, string>;
  onSetArg: (name: string, value: string) => void;
  onCancel: () => void;
}) {
  if (!command.options || command.options.length === 0) return null;

  return (
    <div
      className="mx-3 mb-1 flex flex-wrap items-center gap-1.5 rounded-lg px-3 py-2"
      style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
    >
      <span className="text-[11px] font-semibold" style={{ color: 'var(--accent)' }}>
        /{command.name}
      </span>
      {command.options.map((opt: CommandOptionItem) => (
        <div key={opt.name} className="flex items-center gap-1">
          <span
            className={cn('text-[10px]', opt.required ? 'font-semibold text-t-secondary' : 'text-t-faint')}
          >
            {opt.name}:
          </span>
          {opt.choices && opt.choices.length > 0 ? (
            <select
              value={args[opt.name] ?? ''}
              onChange={(e) => onSetArg(opt.name, e.target.value)}
              className="h-5 rounded border-0 bg-transparent px-1 text-[10px] text-t-primary outline-none"
              style={{ background: 'var(--input-bg)' }}
            >
              <option value="">...</option>
              {opt.choices.map((c) => (
                <option key={String(c.value)} value={String(c.value)}>
                  {c.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={opt.type === 'integer' ? 'number' : 'text'}
              value={args[opt.name] ?? ''}
              onChange={(e) => onSetArg(opt.name, e.target.value)}
              placeholder={opt.description.slice(0, 20)}
              className="h-5 w-16 rounded bg-transparent px-1 text-[10px] text-t-primary outline-none"
              style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)' }}
              min={opt.min}
              max={opt.max}
            />
          )}
        </div>
      ))}
      <button
        onClick={onCancel}
        className="ml-auto text-[10px] text-t-ghost transition-colors hover:text-t-faint"
      >
        <X size={12} />
      </button>
    </div>
  );
}
