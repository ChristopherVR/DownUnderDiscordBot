import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Vite options tailored for Tauri development
  clearScreen: false,
  server: {
    // A project-specific default (not Vite's universal 5173) so this dev
    // server doesn't contend with every other local project's Vite instance
    // for the same address.
    port: parseInt(process.env.VITE_DEV_PORT || '15173'),
    strictPort: false,
    host: host || false,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 15174,
        }
      : undefined,
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_PROXY_TARGET || 'http://localhost:3000',
        changeOrigin: true,
      },
      '/ws': {
        target: (process.env.VITE_DEV_PROXY_TARGET || 'http://localhost:3000').replace(/^http/, 'ws'),
        ws: true,
      },
    },
  },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    // Tauri webviews pin to Chrome 105 on Windows and Safari 13 on mac/Linux
    // (via WKWebView/WebKitGTK). Plain web builds target evergreen browsers.
    target: process.env.TAURI_PLATFORM === 'windows' ? 'chrome105' : process.env.TAURI_PLATFORM ? 'safari13' : 'es2020',
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG,
  },
});
