/**
 * File:        apps/web/features/trading-terminal/components/trading-workstation.tsx
 * Module:      web · trading-terminal · Platform Wrapper
 * Purpose:     Web platform adapter — wires Next.js auth and env vars into the platform-agnostic TradingWorkstation.
 *
 * Exports:
 *   - TradingWorkstation({ mobileHref?, forceMobileLayout? }) → ReactNode
 *
 * Depends on:
 *   - @obsidian/trading-ui — TradingWorkstation (lib), FetchJsonFn, OmsConfig
 *   - @/shared/providers/auth-provider — useAuth (web-only auth context)
 *
 * Side-effects:
 *   - Network calls via fetch (passed as fetchJson into lib)
 *
 * Key invariants:
 *   - This file is the only web-specific glue — all rendering logic lives in @obsidian/trading-ui
 *   - accessToken absent → fetchJson omits Authorization header (unauthenticated mode, mock data only)
 *   - NEXT_PUBLIC_DEFAULT_TRADING_ACCOUNT_ID / NEXT_PUBLIC_DEMO_INSTRUMENT_ID injected via OmsConfig
 *
 * Read order:
 *   1. TradingWorkstation — fetchJson builder + OmsConfig wiring
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

'use client';

import { useCallback } from 'react';
import {
  TradingWorkstation as TradingWorkstationLib,
  type FetchJsonFn,
  type OmsConfig,
} from '@obsidian/trading-ui';
import { useAuth } from '@/shared/providers/auth-provider';

export function TradingWorkstation({
  mobileHref = '/m/workstation',
  forceMobileLayout = false,
}: {
  mobileHref?: string;
  forceMobileLayout?: boolean;
}) {
  const { accessToken } = useAuth();

  const fetchJson = useCallback<FetchJsonFn>(
    async (path, init) => {
      const res = await fetch(path, {
        ...init,
        headers: {
          'content-type': 'application/json',
          'x-tenant-id': 'acme',
          ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
          ...(init?.headers as Record<string, string>),
        },
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    [accessToken],
  );

  const omsConfig: OmsConfig = {
    accountId: process.env.NEXT_PUBLIC_DEFAULT_TRADING_ACCOUNT_ID,
    demoInstrumentId: process.env.NEXT_PUBLIC_DEMO_INSTRUMENT_ID,
  };

  return (
    <TradingWorkstationLib
      fetchJson={fetchJson}
      mobileHref={mobileHref}
      forceMobileLayout={forceMobileLayout}
      omsConfig={omsConfig}
    />
  );
}
