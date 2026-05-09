/**
 * File:        apps/desktop-pro/electron.vite.config.ts
 * Module:      desktop-pro · Build Config
 * Purpose:     electron-vite triple-build: main (Node), preload (bridge), renderer (React SPA).
 *
 * Exports:
 *   - default — electron-vite config object
 *
 * Depends on:
 *   - electron-vite — defineConfig, bytecodePlugin
 *   - vite — resolve alias config
 *
 * Side-effects:
 *   - none (config only)
 *
 * Key invariants:
 *   - Tailwind preset imported via relative path — PostCSS cannot resolve TS path aliases
 *   - @obsidian/trading-ui resolves to the monorepo lib source (no build step needed in dev)
 *   - renderer runs React 19 fast-refresh (HMR) in dev; production build outputs to dist/renderer
 *
 * Read order:
 *   1. main — Node.js process config (no browser globals)
 *   2. preload — sandboxed bridge config
 *   3. renderer — React SPA config with alias map
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import type { Plugin } from 'vite';

// ws optional C++ addons — not installed in dev, but ws/socket.io-client try to require them.
// Vite normally replaces missing optional peer deps with a top-level throw stub, which crashes
// the Electron main process before ws's own try/catch can handle the absence.
// This plugin intercepts both IDs and returns empty stubs so socket.io-client loads cleanly.
const optionalNativeStubs: Plugin = {
  name: 'optional-native-stubs',
  resolveId(id: string) {
    if (id === 'bufferutil' || id === 'utf-8-validate') return id;
  },
  load(id: string) {
    if (id === 'bufferutil' || id === 'utf-8-validate') return 'module.exports = null;';
  },
};

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin(), optionalNativeStubs],
    resolve: {
      alias: {
        '@main': resolve('electron'),
      },
    },
    build: {
      outDir: 'dist/main',
      rollupOptions: {
        input: { index: resolve('electron/main.ts') },
      },
    },
  },

  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'dist/preload',
      rollupOptions: {
        input: { index: resolve('electron/preload.ts') },
      },
    },
  },

  renderer: {
    root: 'renderer',
    plugins: [react()],
    resolve: {
      alias: {
        '@renderer': resolve('renderer/src'),
        '@obsidian/trading-ui': resolve('../../libs/trading-ui/src/index.ts'),
        '@obsidian/obsidian-ui': resolve('../../libs/obsidian-ui/src/index.ts'),
      },
    },
    css: {
      postcss: {
        plugins: [],
      },
    },
    build: {
      outDir: 'dist/renderer',
      rollupOptions: {
        input: { index: resolve('renderer/index.html') },
      },
    },
  },
});
