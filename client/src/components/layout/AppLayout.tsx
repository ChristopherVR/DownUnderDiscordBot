import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from '../Topbar';
import { ErrorBoundary } from './ErrorBoundary';
import { WebSocketStatus } from './WebSocketStatus';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen w-full text-foreground">
      <ErrorBoundary componentName="Sidebar">
        <Sidebar />
      </ErrorBoundary>

      <div className="flex flex-1 flex-col">
        <ErrorBoundary componentName="Topbar">
          <Topbar />
        </ErrorBoundary>

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-10">
            <ErrorBoundary componentName="Page Content">{children}</ErrorBoundary>
          </div>
        </div>

        <ErrorBoundary componentName="WebSocket Status">
          <WebSocketStatus />
        </ErrorBoundary>
      </div>
    </div>
  );
}
