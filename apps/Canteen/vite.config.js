import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared/core': path.resolve(__dirname, '../../shared/core'),
      '@shared/ui': path.resolve(__dirname, '../../shared/ui'),
    },
  },
  server: {
      proxy: {
        '/iam': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/iam/, ''),
        },
        '/canteen': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/canteen/, ''),
        },
      },
    },
});