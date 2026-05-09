/**
 * File:        apps/desktop-pro/renderer/src/features/settings/settings-page.tsx
 * Module:      desktop-pro · Renderer · Settings Page
 * Purpose:     App settings: theme switcher, auto-launch toggle, shortcut reference, sign-out.
 *
 * Exports:
 *   - SettingsPage → ReactNode
 *
 * Depends on:
 *   - @obsidian/obsidian-ui — useObsidian (theme context)
 *   - react-router-dom — useNavigate
 *   - ../../shared/bridge/use-auth-store — clearToken
 *
 * Side-effects:
 *   - Theme changes write to localStorage['obsidian-theme'] via ObsidianProvider
 *   - Auto-launch toggle calls ntBridge.settings.setAutoLaunch (OS login item)
 *   - Sign-out calls ntBridge.auth.clearToken and navigates to /login
 *
 * Key invariants:
 *   - 'system' mode follows OS prefers-color-scheme
 *   - Auto-launch is read from OS on mount via ntBridge (only available in Electron)
 *
 * Read order:
 *   1. SettingsPage — all controls
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useObsidian } from '@obsidian/obsidian-ui';
import { useAuthStore } from '../../shared/bridge/use-auth-store';

export function SettingsPage() {
  const navigate = useNavigate();
  const clearToken = useAuthStore((s: { clearToken: () => Promise<void> }) => s.clearToken);
  const { theme: colorMode, setTheme: setColorMode } = useObsidian();
  const [autoLaunch, setAutoLaunch] = useState(false);

  useEffect(() => {
    window.ntBridge?.settings.getAutoLaunch().then(setAutoLaunch).catch(() => null);
  }, []);

  const handleAutoLaunchChange = (enabled: boolean) => {
    setAutoLaunch(enabled);
    window.ntBridge?.settings.setAutoLaunch(enabled).catch(() => null);
  };

  const handleSignOut = async () => {
    await clearToken();
    navigate('/login');
  };

  return (
    <div className="settings-root">
      <div className="settings-header">
        <h1 className="settings-title">Settings</h1>
        <button className="nt-btn-ghost" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>

      <section className="settings-section">
        <h2 className="settings-section-title">APPEARANCE</h2>
        <div className="settings-row">
          <span className="settings-label">Theme</span>
          <div className="settings-theme-switcher">
            {(['dark', 'light', 'system'] as const).map((mode) => (
              <button
                key={mode}
                className={`settings-theme-btn ${colorMode === mode ? 'active' : ''}`}
                onClick={() => setColorMode(mode)}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="settings-section">
        <h2 className="settings-section-title">SHORTCUTS</h2>
        <div className="settings-shortcuts">
          {[
            { keys: 'Ctrl+Shift+T', action: 'Focus / show terminal' },
            { keys: 'Ctrl+Shift+B', action: 'Quick BUY order' },
            { keys: 'Ctrl+Shift+S', action: 'Quick SELL order' },
            { keys: 'Ctrl+T', action: 'New tab' },
            { keys: 'Ctrl+W', action: 'Close tab' },
            { keys: 'Ctrl+1–9', action: 'Switch to tab N' },
          ].map(({ keys, action }) => (
            <div key={keys} className="settings-shortcut-row">
              <kbd className="settings-kbd">{keys}</kbd>
              <span className="settings-shortcut-action">{action}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <h2 className="settings-section-title">SYSTEM</h2>
        <div className="settings-row">
          <span className="settings-label">Launch at login</span>
          <button
            className={`settings-toggle ${autoLaunch ? 'on' : 'off'}`}
            onClick={() => handleAutoLaunchChange(!autoLaunch)}
            title={autoLaunch ? 'Disable launch at login' : 'Enable launch at login'}
          >
            {autoLaunch ? 'ON' : 'OFF'}
          </button>
        </div>
      </section>

      <section className="settings-section">
        <h2 className="settings-section-title">ACCOUNT</h2>
        <div className="settings-row">
          <button className="nt-btn-danger" onClick={() => void handleSignOut()}>
            Sign out
          </button>
        </div>
      </section>
    </div>
  );
}
