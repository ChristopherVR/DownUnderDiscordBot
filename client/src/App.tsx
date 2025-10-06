import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import PlayerPro from '@/components/PlayerPro';
import MusicPlayerPage from '@/pages/MusicPlayerPage';
import CommandInvocationPage from '@/pages/CommandInvocationPage';
import LogsView from '@/components/LogsView';
import BotManagement from '@/components/BotManagement';
import { startWebSocket } from '@/lib/ws';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';
import { initializeGlobalErrorHandling } from '@/lib/globalErrorHandling';
import { useWebSocketErrorHandling } from '@/hooks/useErrorHandling';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';

export default function App() {
  const { t } = useTranslation();
  useWebSocketErrorHandling();

  useEffect(() => {
    startWebSocket();
    // Initialize global error handling with localization support
    initializeGlobalErrorHandling(t);
  }, [t]);

  return (
    <ThemeProvider>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/player" element={<MusicPlayerPage />} />
          <Route path="/player-pro" element={<PlayerPro />} />
          <Route path="/commands" element={<CommandInvocationPage />} />
          <Route path="/logs" element={<LogsView />} />
          <Route path="/instances" element={<BotManagement />} />
        </Routes>
      </AppLayout>
      <Toaster position="bottom-center" />
    </ThemeProvider>
  );
}
