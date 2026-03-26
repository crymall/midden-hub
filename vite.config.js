import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared/core': path.resolve(__dirname, './shared/core'),
      '@shared/ui': path.resolve(__dirname, './shared/ui'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './shared/__tests__/setup.js', 
    include: [
      'apps/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'shared/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    coverage: {
      provider: 'v8',
      include: [
        'apps/**/*.jsx', 
        'apps/**/*.js', 
        'shared/**/*.jsx', 
        'shared/**/*.js'
      ],
      exclude: [
        '**/__tests__/**', 
        '**/*.config.js', 
        '**/main.jsx'
      ]
    }
  },
});