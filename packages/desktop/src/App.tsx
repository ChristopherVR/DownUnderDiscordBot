import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useBotStore } from '@/stores/useBotStore';
import TitleBar from '@/components/TitleBar';
import Sidebar from '@/components/Sidebar';
import PlayerBar from '@/components/PlayerBar';
import NowPlayingPage from '@/pages/NowPlayingPage';
import QueuePage from '@/pages/QueuePage';
import SearchPage from '@/pages/SearchPage';
import LibraryPage from '@/pages/LibraryPage';
import SettingsPage from '@/pages/SettingsPage';

export default function App() {
  const connect = useBotStore((s) => s.connect);
  const sidebarCollapsed = useBotStore((s) => s.sidebarCollapsed);

  useEffect(() => {
    connect();
  }, [connect]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--background)]">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden pt-9">
        <Sidebar />
        <main
          className={`flex-1 overflow-y-auto transition-all duration-300 ease-out ${
            sidebarCollapsed ? 'ml-[68px]' : 'ml-[220px]'
          }`}
        >
          <div className="p-6 pb-28">
            <Routes>
              <Route path="/" element={<NowPlayingPage />} />
              <Route path="/queue" element={<QueuePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
      <PlayerBar />
    </div>
  );
}
