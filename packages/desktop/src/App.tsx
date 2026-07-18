import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useBotStore } from '@/stores/useBotStore';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLayoutStore } from '@/stores/useLayoutStore';
import TitleBar from '@/components/TitleBar';
import Sidebar from '@/components/Sidebar';
import PlayerBar from '@/components/PlayerBar';
import ChatPanel from '@/components/ChatPanel';
import VoiceChannelModal from '@/components/VoiceChannelModal';
import VideoPreview from '@/components/VideoPreview';
import ToastContainer from '@/components/ToastContainer';
import DashboardPage from '@/pages/DashboardPage';
import QueuePage from '@/pages/QueuePage';
import SearchPage from '@/pages/SearchPage';
import LibraryPage from '@/pages/LibraryPage';
import PlaylistDetailPage from '@/pages/PlaylistDetailPage';
import SettingsPage from '@/pages/SettingsPage';
import CommandLogsPage from '@/pages/CommandLogsPage';
import LogsPage from '@/pages/LogsPage';
import AuthCallbackPage from '@/pages/AuthCallbackPage';
import { registerDeepLinkAuth, platform } from '@/platform';
import { MessageSquare } from 'lucide-react';

export default function App() {
  const pendingPlay = useBotStore((s) => s.pendingPlay);
  const setPendingPlay = useBotStore((s) => s.setPendingPlay);
  const pendingPlaylistPlay = useBotStore((s) => s.pendingPlaylistPlay);
  const setPendingPlaylistPlay = useBotStore((s) => s.setPendingPlaylistPlay);
  const playWithVoiceChannel = useBotStore((s) => s.playWithVoiceChannel);
  const restoreBotConnection = useBotStore((s) => s.restoreBotConnection);
  const initSystemListener = useThemeStore((s) => s.initSystemListener);
  const sidebarCollapsed = useLayoutStore((s) => s.sidebarCollapsed);
  const chatOpen = useLayoutStore((s) => s.chatOpen);
  const toggleChat = useLayoutStore((s) => s.toggleChat);
  const connected = useBotStore((s) => s.connection.connected);

  // Initialize theme system-preference listener
  useEffect(() => {
    initSystemListener();
  }, [initSystemListener]);

  // Attempt to restore a previous bot connection (non-blocking)
  useEffect(() => {
    restoreBotConnection();
  }, [restoreBotConnection]);

  // Tauri deep-link auth listener. No-op in browser mode (web uses the
  // `/auth/callback` route below to pick the token out of the URL).
  useEffect(() => {
    let unlisten: (() => void) | null = null;
    (async () => {
      unlisten = await registerDeepLinkAuth((token) => {
        useBotStore.getState().connectToBot(token);
      });
    })();
    return () => {
      unlisten?.();
    };
  }, []);

  // App always opens directly - no login or server selection gates
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--background)]">
      {platform.showCustomTitlebar && <TitleBar />}
      <div className={`flex flex-1 overflow-hidden ${platform.showCustomTitlebar ? 'pt-9' : 'pt-0'}`}>
        <Sidebar />
        <main
          className="flex-1 overflow-y-auto transition-all duration-300 ease-in-out"
          style={{
            marginLeft: sidebarCollapsed ? 60 : 220,
            marginRight: chatOpen ? 360 : 0,
          }}
        >
          <div className="p-6 pb-28">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/queue" element={<QueuePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/library/playlist/:id" element={<PlaylistDetailPage />} />
              <Route path="/command-logs" element={<CommandLogsPage />} />
              <Route path="/logs" element={<LogsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </main>
        <ChatPanel />

        {/* Chat toggle button (floating, right edge) */}
        {!chatOpen && (
          <button
            onClick={toggleChat}
            title="Open chat"
            className="fixed right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
            style={{
              bottom: 'calc(5rem + 1rem)',
              background: connected ? 'var(--gradient-accent)' : 'var(--glass-bg-heavy)',
              border: connected ? undefined : '1px solid var(--glass-border-heavy)',
              color: connected ? 'var(--btn-primary-fg)' : 'var(--text-faint)',
              boxShadow: connected ? '0 4px 14px var(--accent-shadow)' : 'var(--shadow-card)',
            }}
          >
            <MessageSquare size={18} />
          </button>
        )}
      </div>
      <PlayerBar />
      <VideoPreview />
      <VoiceChannelModal
        open={!!pendingPlay || !!pendingPlaylistPlay}
        onClose={() => {
          setPendingPlay(null);
          setPendingPlaylistPlay(null);
        }}
        onSelect={playWithVoiceChannel}
      />
      <ToastContainer />
    </div>
  );
}
