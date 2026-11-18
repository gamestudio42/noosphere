/// <reference types="vitest/config" />
import { readdirSync } from 'node:fs';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { serviceWorkerSource } from './pwa/serviceWorker';

// Writes sw.js next to the build with the exact list of files to cache offline
const serviceWorker = (): Plugin => ({
  name: 'noosphere-service-worker',
  apply: 'build',
  generateBundle(_options, bundle) {
    const files = [...Object.keys(bundle), ...readdirSync(path.resolve(__dirname, 'public'))];
    this.emitFile({ type: 'asset', fileName: 'sw.js', source: serviceWorkerSource(files) });
  },
});

export default defineConfig({
  // Relative asset paths so the build works from any sub-path (e.g. GitHub Pages)
  base: './',
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react(), tailwindcss(), serviceWorker()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'node',
    // e2e is Playwright's: Vitest would try to run those specs and fail on their imports.
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**', 'desktop/**'],
  },
});
