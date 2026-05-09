/**
 * File:        apps/desktop-pro/renderer/src/features/workstation/workstation-page.tsx
 * Module:      desktop-pro · Renderer · Workstation Page
 * Purpose:     Desktop platform adapter — wraps the tab manager and wires safeStorage token
 *              and IPC-backed fetchJson into TradingWorkstation via TabContent.
 *
 * Exports:
 *   - WorkstationPage → ReactNode
 *
 * Depends on:
 *   - @obsidian/trading-ui — FetchJsonFn, OmsConfig
 *   - ../tab-manager/tab-bar — TabBar (Bloomberg-style tab strip)
 *   - ../tab-manager/tab-content — TabContent (active tab's workstation)
 *   - ../../shared/bridge/use-auth-store — token from safeStorage
 *
 * Side-effects:
 *   - Network calls go through fetch with Bearer auth header
 *
 * Key invariants:
 *   - mobileHref absent — desktop never shows the Mobile link
 *   - fetchJson is rebuilt when token changes (useCallback deps)
 *   - The tab bar renders above the workstation; TabContent fills remaining height
 *
 * Read order:
 *   1. WorkstationPage — fetchJson builder, layout render
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

import { useCallback } from 'react';
import { type FetchJsonFn, type OmsConfig } from '@obsidian/trading-ui';
import { TabBar } from '../tab-manager/tab-bar';
import { TabContent } from '../tab-manager/tab-content';
import { useAuthStore } from '../../shared/bridge/use-auth-store';

export function WorkstationPage() {
  const token = useAuthStore((s: { token: string | null }) => s.token);

  const fetchJson = useCallback<FetchJsonFn>(
    async (path, init) => {
      const fullUrl = path.startsWith('http')
        ? path
        : `${window.__NESTTRADE_API_BASE__ ?? 'http://localhost:3000'}${path}`;

      const res = await fetch(fullUrl, {
        ...init,
        headers: {
          'content-type': 'application/json',
          'x-tenant-id': window.__NESTTRADE_TENANT_ID__ ?? 'acme',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
          ...(init?.headers as Record<string, string>),
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    [token],
  );

  const omsConfig: OmsConfig = {
    accountId: window.__NESTTRADE_ACCOUNT_ID__,
    demoInstrumentId: window.__NESTTRADE_DEMO_INSTRUMENT_ID__,
  };

  return (
    <div className="workstation-page">
      <TabBar />
      <TabContent fetchJson={fetchJson} omsConfig={omsConfig} />
    </div>
  );
}

declare global {
  interface Window {
    __NESTTRADE_API_BASE__?: string;
    __NESTTRADE_TENANT_ID__?: string;
    __NESTTRADE_ACCOUNT_ID__?: string;
    __NESTTRADE_DEMO_INSTRUMENT_ID__?: string;
  }
}
