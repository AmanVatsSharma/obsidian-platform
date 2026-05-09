/**
 * File:        apps/desktop-pro/renderer/src/shared/components/update-banner.tsx
 * Module:      desktop-pro · Renderer · Update Banner
 * Purpose:     Persistent OS-level update notification bar — listens to the 'updater:status'
 *              IPC channel and shows a dismissible banner when an update is ready to install.
 *
 * Exports:
 *   - UpdateBanner → ReactNode   — renders nothing until update is ready; then shows a banner
 *
 * Depends on:
 *   - react — useEffect, useState
 *   - ../../shared/bridge/nt-bridge.d — window.ntBridge (ambient)
 *
 * Side-effects:
 *   - Subscribes to ntBridge.on('updater:status', ...) on mount; cleans up on unmount
 *   - Calls ntBridge.updater.quitAndInstall() when user clicks the install button
 *
 * Key invariants:
 *   - Mounted at the AppProviders level so it persists across route changes
 *   - Shows ONLY when status === 'ready' (update downloaded and ready to install)
 *   - Dismissed state is local — reappears if the user navigates away and back
 *
 * Read order:
 *   1. UpdateBanner — subscription + render logic
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

import { useEffect, useState } from 'react';

export function UpdateBanner() {
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!window.ntBridge) return;
    const off = window.ntBridge.on('updater:status', (payload: unknown) => {
      const status = (payload as { status?: string })?.status;
      if (status === 'ready') setReady(true);
    });
    return off;
  }, []);

  if (!ready || dismissed) return null;

  return (
    <div className="update-banner">
      <span className="update-banner-text">
        A new version of Obsidian Pro is ready to install.
      </span>
      <button
        className="update-banner-install"
        onClick={() => window.ntBridge?.updater.quitAndInstall()}
      >
        Restart &amp; Install
      </button>
      <button
        className="update-banner-dismiss"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss update notification"
      >
        ×
      </button>
    </div>
  );
}
