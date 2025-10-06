import React, { lazy } from 'react';

// Lazy load main page components for code splitting
export const LazyDashboard = lazy(() => import('@/pages/Dashboard'));
export const LazyMusicPlayerPage = lazy(() => import('@/pages/MusicPlayerPage'));
export const LazyCommandInvocationPage = lazy(() => import('@/pages/CommandInvocationPage'));
export const LazyAuditLogsPage = lazy(() => import('@/pages/AuditLogsPage'));
export const LazyBotManagementPage = lazy(() => import('@/pages/BotManagementPage'));

// Lazy load heavy components
export const LazyMusicPlayer = lazy(() => import('@/components/MusicPlayer'));
export const LazyFileUploader = lazy(() => import('@/components/FileUploader'));
export const LazyCommandExecutor = lazy(() => import('@/components/CommandExecutor'));
export const LazyCommandHistory = lazy(() => import('@/components/CommandHistory'));
export const LazyLogsView = lazy(() => import('@/components/LogsView'));

// Loading fallback component
export const ComponentLoader = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    <span className="ml-2 text-muted-foreground">Loading...</span>
  </div>
);

// Error boundary for lazy components
export const LazyComponentErrorBoundary = ({ children }: { children: React.ReactNode }) => (
  <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
    <p className="text-destructive text-sm">Failed to load component. Please refresh the page.</p>
    {children}
  </div>
);
