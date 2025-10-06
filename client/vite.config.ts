/* eslint-disable no-undef */
/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const ensureLeadingSlash = (value: string) => (value.startsWith('/') ? value : `/${value}`);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const apiBaseEnv =
    env.VITE_API_BASE_URL || env.VITE_API_URL || process.env.VITE_API_BASE_URL || process.env.VITE_API_URL;
  const backendHostEnv = env.VITE_BACKEND_HOST || process.env.VITE_BACKEND_HOST || 'localhost';
  const backendPortEnv = env.VITE_BACKEND_PORT || process.env.VITE_BACKEND_PORT || '3000';
  const apiPrefixEnv = env.VITE_API_PREFIX || process.env.VITE_API_PREFIX || '/api';
  const wsPathEnv = env.VITE_WS_PATH || process.env.VITE_WS_PATH || '/ws';

  let httpTarget = `http://${backendHostEnv}:${backendPortEnv}`;
  let wsTarget = `ws://${backendHostEnv}:${backendPortEnv}`;
  let apiPrefix = ensureLeadingSlash(apiPrefixEnv);
  const wsPath = ensureLeadingSlash(wsPathEnv);

  if (apiBaseEnv) {
    try {
      const parsed = new URL(apiBaseEnv);
      httpTarget = `${parsed.protocol}//${parsed.host}`;
      const wsProtocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
      wsTarget = `${wsProtocol}//${parsed.host}`;
      const trimmedPath = parsed.pathname.replace(/\/$/, '');
      apiPrefix = trimmedPath && trimmedPath !== '/' ? ensureLeadingSlash(trimmedPath) : '/api';
    } catch (error) {
      console.warn('[vite-config] Failed to parse API base URL, using fallback host/port:', error);
    }
  }

  return {
    plugins: [react()],
    resolve: { alias: { '@': path.resolve(__dirname, './src') } },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: httpTarget,
          changeOrigin: true,
          rewrite: (pathStr) => pathStr.replace(/^\/api/, apiPrefix),
        },
        '/ws': {
          target: wsTarget,
          ws: true,
          changeOrigin: true,
          rewriteWsPath: (pathStr: string) => pathStr.replace(/^\/ws/, wsPath),
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./tests/setup.ts'],
      css: true,
      include: ['tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    },
  };
});
