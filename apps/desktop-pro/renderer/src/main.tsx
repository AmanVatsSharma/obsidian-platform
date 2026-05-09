/**
 * File:        apps/desktop-pro/renderer/src/main.tsx
 * Module:      desktop-pro · Renderer · Entry Point
 * Purpose:     React 19 root — mounts ObsidianProvider + QueryClientProvider + App.
 *
 * Exports:
 *   - none (side-effects only — mounts React tree)
 *
 * Depends on:
 *   - react-dom/client — createRoot
 *   - ./app — App component
 *   - ./shared/providers/app-providers — AppProviders wrapper
 *
 * Side-effects:
 *   - Mounts React root into #root div
 *
 * Key invariants:
 *   - StrictMode enabled in development; removed in production build
 *
 * Read order:
 *   1. This file — bootstrap
 *   2. app.tsx — routing
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppProviders } from './shared/providers/app-providers';
import { App } from './app';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>,
);
