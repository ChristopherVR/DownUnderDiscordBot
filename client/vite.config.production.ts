import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import { compression } from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    react(),
    // Gzip compression for production builds
    compression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    // Brotli compression for better compression ratio
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
    // Bundle analyzer for optimization insights
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Production optimizations
    target: 'es2020',
    minify: 'terser',
    sourcemap: false, // Disable source maps in production

    // Optimize chunk splitting
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          'utils-vendor': ['clsx', 'tailwind-merge', 'class-variance-authority'],

          // Feature chunks
          'music-player': [
            './src/components/MusicPlayer.tsx',
            './src/components/MiniPlayer.tsx',
            './src/components/FileUploader.tsx',
            './src/components/PlaybackSourceSelector.tsx',
          ],
          'command-system': ['./src/components/CommandExecutor.tsx', './src/components/CommandHistory.tsx'],
          'bot-management': ['./src/components/BotManagement.tsx', './src/components/BotInstanceCard.tsx'],
          'audit-logs': ['./src/components/LogsView.tsx'],
        },

        // Optimize chunk naming
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop()?.replace('.tsx', '').replace('.ts', '')
            : 'chunk';
          return `js/${facadeModuleId}-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext || '')) {
            return `img/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext || '')) {
            return `css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },

    // Terser options for better minification
    terserOptions: {
      compress: {
        drop_console: true, // Remove console statements in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
      },
      mangle: {
        safari10: true,
      },
      format: {
        comments: false,
      },
    },

    // Optimize asset handling
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb
    cssCodeSplit: true, // Split CSS into separate files

    // Performance optimizations
    chunkSizeWarningLimit: 1000, // Warn for chunks larger than 1MB
  },

  // Production server configuration
  preview: {
    port: 3000,
    host: true,
    cors: true,
  },

  // Define environment variables
  define: {
    __DEV__: false,
    __PROD__: true,
  },

  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'react-i18next', 'i18next', 'i18next-http-backend'],
    exclude: ['@vite/client', '@vite/env'],
  },
});
