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
 *   - @/gql/hooks/useOrders — pending orders hook (PENDING status)
 *   - @/gql/hooks/usePositions — open positions hook
 *   - nanoid — clientOrderId generation
 *
 * Side-effects:
 *   - Network calls via Apollo Client (useInstruments + useAccountBalance queries,
 *     placeOrder mutation + useOrders + usePositions)
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
import { useOrders } from '@/gql/hooks/useOrders';
import { usePositions } from '@/gql/hooks/usePositions';
import { nanoid } from 'nanoid';
import type { PlaceUiOrder } from '@obsidian/trading-ui';
import type { OpenPosition } from '@obsidian/trading-ui';
import type { PendingOrder } from '@obsidian/trading-ui';

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

  // Positions query — fetches real open positions from GraphQL (OMS)
  const { positions: gqlPositions } = usePositions({
    accountId: accountId || undefined,
    limit: 100,
  });

  // Pending orders query — fetches PENDING orders only for the orders tab
  const { orders: gqlOrders } = useOrders({
    accountId,
    status: 'PENDING',
    limit: 100,
  });

  // Map GraphQL Position[] (from usePositions) to the OpenPosition[] shape
  // that BottomTabsPanel's PositionsTable expects.
  // The lib's TradingWorkstation manages its own positions state, but we seed it
  // from real data and let tick simulation keep currentPrice/pnl live.
  const openPositions: OpenPosition[] = useMemo(() => {
    if (!gqlPositions?.length) return [];
    return gqlPositions.map((p) => {
      // Look up the instrument in the catalogue to get the symbol for display
      const inst = instrumentsData?.instruments?.find((i) => i.id === p.instrumentId);
      return {
        id: p.instrumentId,
        symbol: inst?.symbol ?? p.instrumentId,
        type: p.netQty >= 0 ? 'BUY' : 'SELL',
        lots: Math.abs(p.netQty),
        openPrice: p.avgPrice,
        currentPrice: p.lastPrice,
        sl: '',
        tp: '',
        pnl: p.mtmPnl,
        pnlPct: 0,
        swap: 0,
        commission: 0,
        openTime: '',
        margin: 0,
      } satisfies OpenPosition;
    });
  }, [gqlPositions, instrumentsData]);

  // Map GraphQL Order[] (from useOrders) to the PendingOrder[] shape that BottomTabsPanel's
  // OrdersTable expects. GQL Order uses `quantity` (number) and `price` (number | null);
  // PendingOrder (from @obsidian/trading-ui) uses `lots` (number), `price` (number), `distance`,
  // `sl`, `tp` (all numbers). We look up the instrument symbol from the catalogue for display.
  const pendingOrders: PendingOrder[] = useMemo(() => {
    if (!gqlOrders?.length) return [];
    return gqlOrders.map((o) => {
      const inst = instrumentsData?.instruments?.find((i) => i.id === o.instrumentId);
      return {
        id: o.id,
        symbol: inst?.symbol ?? o.instrumentId,
        type: o.type as PendingOrder['type'],
        orderRole: null,
        parentOrderId: null,
        side: o.side as 'BUY' | 'SELL',
        lots: o.quantity,
        price: o.price ?? 0,
        sl: o.slPrice ?? 0,
        tp: o.tpPrice ?? 0,
        distance: 0,
        status: o.status,
        created: o.createdAt,
        expiry: undefined,
        algoMeta: undefined,
      };
    });
  }, [gqlOrders, instrumentsData]);

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
      positions={openPositions}
      pendingOrders={pendingOrders}
    />
  );
}