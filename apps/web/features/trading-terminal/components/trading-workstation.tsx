/**
 * File:        apps/web/features/trading-terminal/components/trading-workstation.tsx
 * Module:      web · trading-terminal · Platform Wrapper
 * Purpose:     Web platform adapter — wires Next.js auth, Apollo Client GraphQL
 *              hooks, and env vars into the platform-agnostic TradingWorkstation.
 *
 * Exports:
 *   - TradingWorkstation({ mobileHref?, forceMobileLayout? }) → ReactNode
 *
 * Depends on:
 *   - @obsidian/trading-ui — TradingWorkstation (lib), OmsConfig, PlaceUiOrder
 *   - @/shared/providers/auth-provider — useAuth (web-only auth context)
 *   - ../lib/gql-service — useInstruments, useAccountBalance
 *   - nanoid — clientOrderId generation
 *
 * Side-effects:
 *   - Network calls via Apollo Client (useInstruments + useAccountBalance queries)
 *   - REST fetch to /api/orders for order submission
 *
 * Key invariants:
 *   - accessToken absent → auth header is omitted (unauthenticated mode)
 *   - NEXT_PUBLIC_DEFAULT_TRADING_ACCOUNT_ID injected via Apollo variable
 *   - AccountSummaryPanel receives live balance from useAccountBalance (falls back to mock)
 *   - TradingWorkstation receives onTradeSubmit (GraphQL-compatible bridge)
 *   - ApolloProviderWrapper is already mounted in layout.tsx — no double-wrapping
 *
 * Read order:
 *   1. TradingWorkstation — Apollo hooks wiring + onTradeSubmit bridge
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-22
 */

'use client';

import { useMemo } from 'react';
import { TradingWorkstation as TradingWorkstationLib } from '@obsidian/trading-ui';
import { useAuth } from '@/shared/providers/auth-provider';
import { useInstruments, useAccountBalance } from '../lib/gql-service';
import { nanoid } from 'nanoid';
import type { PlaceUiOrder } from '@obsidian/trading-ui';

export function TradingWorkstation({
  mobileHref = '/m/workstation',
  forceMobileLayout = false,
}: {
  mobileHref?: string;
  forceMobileLayout?: boolean;
}) {
  const { accessToken } = useAuth();
  const accountId = process.env.NEXT_PUBLIC_DEFAULT_TRADING_ACCOUNT_ID ?? '';

  // GraphQL data hooks — instrument catalogue + account balance snapshot
  const { data: instrumentsData } = useInstruments();
  const { data: balanceData } = useAccountBalance(accountId);

  // Transform backend balance strings (AccountBalancePayload uses string fields)
  // into the numeric shape TradingWorkstation's balance prop expects.
  const liveBalance = useMemo(() => {
    if (!balanceData?.accountBalance) return undefined;
    const b = balanceData.accountBalance;
    return {
      equity: parseFloat(b.equity) || 0,
      freeMargin: parseFloat(b.availableCash) || 0,
      margin: parseFloat(b.lockedCash) || 0,
      unrealizedPnl: parseFloat(b.unrealizedPnl) || 0,
      realizedPnlToday: 0,
      balance: parseFloat(b.totalCash) || 0,
      currency: b.currency ?? 'USD',
      accountId,
      accountType: 'Trading',
      leverage: '1:100',
    };
  }, [balanceData, accountId]);

  // GraphQL-compatible trade-submission bridge.
  // Today: calls REST /api/orders with fetch. When a native `placeOrder` GraphQL
  // mutation lands in the NestJS schema, replace this with useGqlPlaceOrder().
  type TradeResult = { ok: true; detail?: string } | { ok: false; message: string };
  const onTradeSubmit = useMemo<(uiOrder: PlaceUiOrder) => Promise<TradeResult>>(
    () =>
      async (uiOrder) => {
        if (!accountId) {
          return { ok: false, message: 'Set NEXT_PUBLIC_DEFAULT_TRADING_ACCOUNT_ID.' };
        }
        const instrumentId = uiOrder.instrument?.instrumentId;
        if (!instrumentId) {
          return { ok: false, message: 'No instrument selected.' };
        }

        const apiType: 'MARKET' | 'LIMIT' = uiOrder.type === 'Market' ? 'MARKET' : 'LIMIT';
        const side: 'BUY' | 'SELL' = uiOrder.side === 'buy' ? 'BUY' : 'SELL';

        let price: string | undefined;
        if (apiType === 'LIMIT') {
          const p =
            uiOrder.price ||
            (uiOrder.instrument ? String(uiOrder.side === 'buy' ? uiOrder.instrument.ask : uiOrder.instrument.bid) : '');
          const n = parseFloat(p);
          if (!p || Number.isNaN(n)) {
            return { ok: false, message: 'Limit orders need a valid price.' };
          }
          price = n.toFixed(Math.min(8, (uiOrder.instrument?.digits ?? 5) + 2));
        }

        const body = {
          accountId,
          instrumentId,
          side,
          type: apiType,
          quantity: (parseFloat(uiOrder.lots) || 0).toFixed(2),
          ...(price ? { price } : {}),
          timeInForce: 'DAY',
          clientOrderId: `web-${nanoid(10)}`,
        };

        try {
          const headers: Record<string, string> = {
            'content-type': 'application/json',
            'x-tenant-id': 'acme',
          };
          if (accessToken) {
            headers['authorization'] = `Bearer ${accessToken}`;
          }

          const res = await fetch('/api/orders', {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify(body),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
            return { ok: false, message: (err as { message?: string }).message ?? `HTTP ${res.status}` };
          }
          const data = await res.json();
          return { ok: true, detail: JSON.stringify(data) };
        } catch (e: unknown) {
          return { ok: false, message: e instanceof Error ? e.message : 'Order request failed.' };
        }
      },
    [accountId, accessToken],
  );

  // Provide a no-op fetchJson so the lib's mergeApiWatchlistInstruments call doesn't
  // fail on mount — instruments are loaded via useInstruments, not the REST watchlist.
  const noopFetchJson = () => Promise.resolve({});

  return (
    <TradingWorkstationLib
      fetchJson={noopFetchJson}
      mobileHref={mobileHref}
      forceMobileLayout={forceMobileLayout}
      balance={liveBalance}
      onTradeSubmit={onTradeSubmit}
    />
  );
}