/**
 * File:        apps/desktop-pro/renderer/src/app.tsx
 * Module:      desktop-pro · Renderer · App Router
 * Purpose:     Hash-based memory router for the desktop app (no URL bar visible to users).
 *
 * Exports:
 *   - App → ReactNode
 *
 * Depends on:
 *   - react-router-dom — HashRouter, Routes, Route, Navigate
 *   - ./features/workstation/workstation-page — main trading terminal
 *   - ./features/workstation/detached-chart-page — torn-off chart panel window
 *   - ./features/auth/login-page — OTP login flow
 *   - ./features/settings/settings-page — app settings
 *   - ./shared/bridge/use-auth-store — reads token from safeStorage on mount
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - HashRouter used so Electron can load file:// URLs without a server serving 404s
 *   - Auth guard: if no token → redirect to /login; after login → /workstation
 *   - Detached panel routes (/detached/*) bypass the auth guard — they only open from the
 *     main workstation which is already authenticated; the token is readable via ntBridge
 *
 * Read order:
 *   1. App — route declarations + auth guard
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { WorkstationPage } from './features/workstation/workstation-page';
import { DetachedChartPage } from './features/workstation/detached-chart-page';
import { LoginPage } from './features/auth/login-page';
import { SettingsPage } from './features/settings/settings-page';
import { useAuthStore } from './shared/bridge/use-auth-store';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s: { token: string | null }) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/workstation"
          element={
            <AuthGuard>
              <WorkstationPage />
            </AuthGuard>
          }
        />
        <Route
          path="/settings"
          element={
            <AuthGuard>
              <SettingsPage />
            </AuthGuard>
          }
        />
        {/* Detached panel windows — opened from the workstation via ntBridge.window.openChart */}
        <Route path="/detached/chart/:symbol" element={<DetachedChartPage />} />
        <Route path="*" element={<Navigate to="/workstation" replace />} />
      </Routes>
    </HashRouter>
  );
}
