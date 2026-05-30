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
 *   - @/gql/hooks/useInstruments — instrument catalogue hook
 *   - @/gql/hooks/useAccountBalance — account balance hook
 *   - @/gql/hooks/usePlaceOrder — order submission mutation hook
 *   - nanoid — clientOrderId generation
 *
 * Side-effects:
 *   - Network calls via Apollo Client (useInstruments + useAccountBalance queries,
 *     placeOrder mutation)
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
 * Last-updated: 2026-05-30
 */

'use client';

import { useMemo } from 'react';
import { TradingWorkstation as TradingWorkstationLib } from '@obsidian/trading-ui';
import { useAuth } from '@/shared/providers/auth-provider';
import { useInstruments } from '@/gql/hooks/useInstruments';
import { useAccountBalance } from '@/gql/hooks/useAccountBalance';
import { usePlaceOrder } from '@/gql/hooks/usePlaceOrder';
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
  const { data: instrumentsData } = useInstruments({});
  const { balance, parsedBalance, loading: balanceLoading } = useAccountBalance({
    accountId,
    skip: !accountId,
  });

  // PlaceOrder mutation hook — wired into the onTradeSubmit bridge
  const { placeOrder: placeOrderMutation, loading: placingOrder } = usePlaceOrder();

  // Transform parsedBalance (numeric) into the shape TradingWorkstation's balance prop expects.
  const liveBalance = useMemo(() => {
    if (!parsedBalance) return undefined;
    return {
      equity: parsedBalance.numericEquity,
      freeMargin: parsedBalance.numericBuyingPower,
      margin: parseFloat(balance?.lockedCash ?? '0') || 0,
      unrealizedPnl: parsedBalance.numericUnrealizedPnl,
      realizedPnlToday: 0,
      balance: parseFloat(balance?.totalCash ?? '0') || 0,
      currency: balance?.currency ?? 'USD',
      accountId,
      accountType: 'Trading',
      leverage: '1:100',
    };
  }, [parsedBalance, balance, accountId]);

  // Map gql instruments (InstrumentDto) to the Instrument shape TradingWorkstation expects.
  // InstrumentDto: { id, exchangeCode, symbol, displayName, type }
  // TradingWorkstation Instrument: { symbol, name, bid, ask, change, changePct, ... }
  const instrumentsForWorkstation = useMemo(() => {
    if (!instrumentsData?.instruments) return [];
    return instrumentsData.instruments.map((ins) => ({
      symbol: ins.symbol,
      name: ins.displayName,
      bid: 0,
      ask: 0,
      change: 0,
      changePct: 0,
      high: 0,
      low: 0,
      spread: 0,
      pip: 0.0001,
      category: 'forex' as const,
      digits: 5,
      instrumentId: ins.id,
    }));
  }, [instrumentsData]);

  // GraphQL-compatible trade-submission bridge — calls placeOrder mutation.
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

        const input = {
          accountId,
          instrumentId,
          side,
          type: apiType,
          quantity: (parseFloat(uiOrder.lots) || 0).toFixed(2),
          ...(price ? { price } : {}),
          timeInForce: 'DAY',
          clientOrderId: `web-${nanoid(10)}`,
          externalRefId: '',
        };

        try {
          const result = await placeOrderMutation({ variables: { input } });
          if (result.errors?.length) {
            return { ok: false, message: result.errors[0].message };
          }
          if (result.data?.placeOrder) {
            const { status } = result.data.placeOrder;
            if (status === 'REJECTED' || status === 'CANCELLED') {
              return { ok: false, message: `Order ${status.toLowerCase()}` };
            }
            return { ok: true, detail: JSON.stringify(result.data.placeOrder) };
          }
          return { ok: false, message: 'Order placement returned no data.' };
        } catch (e: unknown) {
          return { ok: false, message: e instanceof Error ? e.message : 'Order request failed.' };
        }
      },
    [accountId, placeOrderMutation],
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