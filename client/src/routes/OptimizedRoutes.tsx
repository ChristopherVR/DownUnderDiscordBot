import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import {
  LazyDashboard,
  LazyMusicPlayerPage,
  LazyCommandInvocationPage,
  LazyAuditLogsPage,
  LazyBotManagementPage,
  ComponentLoader,
  LazyComponentErrorBoundary,
} from '@/components/LazyComponents';

// Wrapper component for lazy routes with error boundary and suspense
const LazyRoute = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary fallback={<LazyComponentErrorBoundary>{children}</LazyComponentErrorBoundary>}>
    <Suspense fallback={<ComponentLoader />}>{children}</Suspense>
  </ErrorBoundary>
);

export const OptimizedRoutes = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <LazyRoute>
            <LazyDashboard />
          </LazyRoute>
        }
      />
      <Route
        path="/music"
        element={
          <LazyRoute>
            <LazyMusicPlayerPage />
          </LazyRoute>
        }
      />
      <Route
        path="/commands"
        element={
          <LazyRoute>
            <LazyCommandInvocationPage />
          </LazyRoute>
        }
      />
      <Route
        path="/logs"
        element={
          <LazyRoute>
            <LazyAuditLogsPage />
          </LazyRoute>
        }
      />
      <Route
        path="/bots"
        element={
          <LazyRoute>
            <LazyBotManagementPage />
          </LazyRoute>
        }
      />
      {/* Fallback route */}
      <Route
        path="*"
        element={
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
              <p className="text-muted-foreground">The requested page could not be found.</p>
            </div>
          </div>
        }
      />
    </Routes>
  );
};
