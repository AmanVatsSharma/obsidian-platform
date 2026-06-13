/**
 * File:        apps/web/features/mobile-terminal/components/mobile-workstation.tsx
 * Module:      Mobile Terminal · Data Adapter
 * Purpose:     Web platform adapter — wires auth, Apollo Client GraphQL hooks, and env vars
 *              into the mobile trading dashboard. NO mock data fallback — proper empty
 *              states and loading indicators instead. Live data (positions, orders,
 *              account balances) flows through PranaStream hooks; only the instrument
 *              catalogue and the active-symbol quote use GraphQL polling (5s/2s).
 *
 * Exports:
 *   - MobileWorkstation({ onDemoToggle?, demoMode? }) → ReactNode
 *
 * Depends on:
 *   - @/shared/providers/auth-provider — useAuth
 *   - @/gql/hooks — Apollo hooks for GraphQL operations (instruments + quote)
 *   - @/lib/prana-stream — useOpenOrders, usePositionPnL, usePortfolioEquity (live WS)
 *   - @/features/trading-terminal/lib/types — Instrument, OpenPosition, PendingOrder, AccountSnapshot
 *   - nanoid — clientOrderId generation
 *
 * Side-effects:
 *   - Network calls via Apollo Client (instruments poll + quote poll + place/cancel mutations)
 *   - WebSocket subscriptions via PranaStream (orders / positions / account updates)
 *   - NO mock data fallback — always shows loading/empty/error states
 *
 * Key invariants:
 *   - Positions, orders, and account balance come from PranaStream; not from poll-based GraphQL
 *   - Instrument catalogue + active-symbol quote are still GraphQL-polled (catalogue is large;
 *     5s/2s is fine for a mobile network)
 *   - loading=true only while the instrument catalogue is still loading
 *   - Streams surface empty arrays on first frame; the UI must render proper empty states
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-12
 */

'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/shared/providers/auth-provider';
import { useGetInstrumentsQuery, useGetQuoteQuery, usePlaceOrderMutation, useCancelOrderMutation } from '@/gql/hooks';
import { useOpenOrders, usePositionPnL, usePortfolioEquity } from '@/lib/prana-stream';
import { nanoid } from 'nanoid';
import type { Instrument, OpenPosition, PendingOrder, AccountSnapshot, QuoteDto } from '@/features/trading-terminal/lib/types';
import { MobileTradingDashboard } from './mobile-trading-dashboard';

// ─── Types ─────────────────────────────────────────────────────────────

export type MobileWorkstationData = {
  instruments: Instrument[];
  quotesBySymbol: Record<string, QuoteDto>;
  account: AccountSnapshot | null;
  orders: PendingOrder[];
  positions: OpenPosition[];
  accountId: string;
  placeOrder: (input: {
    instrumentId: string;
    side: 'BUY' | 'SELL';
    type: 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT' | 'GTT' | 'TRAILING_STOP';
    quantity: string;
    price?: string;
    triggerPrice?: string;
    triggerCondition?: 'ABOVE' | 'BELOW';
    trailingDistance?: string;
    trailingPct?: string;
  }) => Promise<void>;
  placeAlgoOrder: (input: {
    instrumentId: string;
    side: 'BUY' | 'SELL';
    type: 'TWAP' | 'VWAP' | 'ICEBERG';
    quantity: string;
    slices?: number;
    durationMinutes?: number;
    displayQty?: string;
  }) => Promise<void>;
  cancelOrder: (id: string) => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
};

export type MobileWorkstationProps = {
  desktopHref?: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────

const QUOTE_POLL_INTERVAL = 2000;
const INSTRUMENT_POLL_INTERVAL = 5000;

const mapPositionPnL = (
  p: { instrumentId: string; netQty: number; averagePrice: number; unrealizedPnl: number; markPrice: number | null },
  instruments: Instrument[],
): OpenPosition => {
  const inst = instruments.find((i) => i.id === p.instrumentId);
  const symbol = inst?.symbol ?? p.instrumentId;
  return {
    id: p.instrumentId,
    symbol,
    type: p.netQty >= 0 ? 'BUY' : 'SELL',
    lots: Math.abs(p.netQty),
    openPrice: p.averagePrice,
    currentPrice: p.markPrice ?? p.averagePrice,
    sl: '',
    tp: '',
    pnl: p.unrealizedPnl,
    pnlPct: p.averagePrice > 0 ? (p.unrealizedPnl / (p.averagePrice * Math.abs(p.netQty))) * 100 : 0,
    swap: 0,
    commission: 0,
    openTime: '',
    margin: 0,
  };
};

const mapStreamOrder = (
  o: { id: string; instrumentId: string; side: string; type: string; quantity: string; price?: string; status: string; createdAt: string },
  instruments: Instrument[],
): PendingOrder => {
  const inst = instruments.find((i) => i.id === o.instrumentId);
  return {
    id: o.id,
    symbol: inst?.symbol ?? o.instrumentId,
    type: o.type as PendingOrder['type'],
    orderRole: null,
    parentOrderId: null,
    side: o.side === 'BUY' ? 'BUY' : 'SELL',
    lots: parseFloat(o.quantity) || 0,
    price: parseFloat(o.price ?? '0') || 0,
    sl: 0,
    tp: 0,
    distance: 0,
    status: o.status,
    created: o.createdAt,
    expiry: undefined,
    algoMeta: undefined,
  };
};

// ─── Component ─────────────────────────────────────────────────────────────────
//
// NO MOCK DATA - Always queries backend. Proper loading/empty/error states are handled
// in the UI layer (MobileTradingDashboard). This adapter always returns real data
// or signals loading/error to the UI via the data prop.
//

export function MobileWorkstation({ }: MobileWorkstationProps) {
  const { accessToken } = useAuth();
  const accountId = process.env.NEXT_PUBLIC_DEFAULT_TRADING_ACCOUNT_ID ?? '';
  const isAuthenticated = !!(accessToken && accountId);

  // Instruments are still loaded via GraphQL poll (the market catalogue is
  // large and rarely changes; 5s poll is fine). Everything else is streamed
  // live from PranaStream below.
  const { data: instrumentsData, error: instrumentsError, loading: instrumentsLoading } = useGetInstrumentsQuery({
    variables: {},
    pollInterval: INSTRUMENT_POLL_INTERVAL,
  });

  // ── PranaStream-driven live data ─────────────────────────────────────
  // No more poll-based GraphQL: positions, orders, and account balances
  // all stream live from the WS gateway.
  const positionPnLs = usePositionPnL(accountId ? { accountId } : {});
  const streamOrders = useOpenOrders(accountId ? { accountId } : {});
  const equity = usePortfolioEquity(accountId || undefined);

  const [activeSymbol, setActiveSymbol] = useState<string | null>(null);
  const { data: quoteData, error: quoteError } = useGetQuoteQuery({
    variables: { exchange: activeSymbol ? 'forex' : '', symbol: activeSymbol || '' },
    pollInterval: activeSymbol ? QUOTE_POLL_INTERVAL : 0,
    skip: !activeSymbol,
  });

  const [placeOrderMutation] = usePlaceOrderMutation();
  const [cancelOrderMutation] = useCancelOrderMutation();

  // Combine all errors - show first error encountered
  const firstError = useMemo(() => {
    const errs = [instrumentsError, quoteError].filter(Boolean);
    return errs[0]?.message ?? null;
  }, [instrumentsError, quoteError]);

  // Extract instruments - map from GraphQL shape to UI shape
  const instruments = useMemo(() => {
    // GraphQL returns { instruments: InstrumentDto[] } directly
    return (instrumentsData?.instruments ?? []).map((inst: any) => ({
      ...inst,
      id: inst.id,
      symbol: inst.symbol,
      name: inst.displayName,
      category: inst.category ?? 'forex',
      change: inst.change ?? 0,
      changePct: inst.changePct ?? 0,
      high: inst.high ?? 0,
      low: inst.low ?? 0,
      bid: inst.bid ?? 0,
      ask: inst.ask ?? 0,
      digits: inst.digits ?? 5,
      pip: inst.pip ?? 0.00001,
      spread: inst.spread ?? 1,
    }));
  }, [instrumentsData]);

  // Live quote for active symbol
  const quotesBySymbol = useMemo(() => {
    if (!quoteData?.quote) return {};
    const q = quoteData.quote;
    return q.symbol ? { [q.symbol]: { symbol: q.symbol, exchange: q.exchange, price: q.price, ts: q.ts } } : {};
  }, [quoteData]);

  // Account snapshot — derived from the PranaStream account stream via
  // usePortfolioEquity. Falls back to null until the first event arrives.
  const account = useMemo<AccountSnapshot | null>(() => {
    if (!equity) return null;
    return {
      accountId: equity.accountId,
      name: 'Trading Account',
      server: 'Live',
      accountType: 'Trading',
      broker: 'Obsidian',
      leverage: '1:100',
      balance: equity.totalCash,
      equity: equity.totalEquity,
      margin: equity.marginUsed,
      freeMargin: equity.marginAvailable,
      unrealizedPnl: equity.totalPnL,
      realizedPnlToday: 0,
      marginLevel: equity.marginUsed > 0 ? (equity.totalEquity / equity.marginUsed) * 100 : 0,
      drawdownPct: 0,
      ping: 0,
      currency: 'USD',
    };
  }, [equity]);

  // Map orders from GraphQL
  const orders = useMemo(() => {
    return streamOrders.map((o) => mapStreamOrder(o, instruments));
  }, [streamOrders, instruments]);

  // Map positions from the PranaStream PositionPnL stream
  const positions = useMemo(() => {
    return positionPnLs.map((p) => mapPositionPnL(p, instruments));
  }, [positionPnLs, instruments]);

  // Order placement - real mutation (Market/Limit/Stop/StopLimit/GTT/TrailingStop via GraphQL)
  const placeOrder = async (input: {
    instrumentId: string;
    side: 'BUY' | 'SELL';
    type: 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT' | 'GTT' | 'TRAILING_STOP';
    quantity: string;
    price?: string;
    triggerPrice?: string;
    triggerCondition?: 'ABOVE' | 'BELOW';
    trailingDistance?: string;
    trailingPct?: string;
  }) => {
    if (!accountId) throw new Error('Account ID not configured');
    const mutationInput = {
      accountId,
      instrumentId: input.instrumentId,
      side: input.side,
      type: input.type,
      quantity: input.quantity,
      timeInForce: 'DAY' as const,
      externalRefId: `mobile-${nanoid(12)}`,
      clientOrderId: `mobile-${nanoid(10)}`,
      ...(input.price ? { price: input.price } : {}),
      ...(input.triggerPrice ? { triggerPrice: input.triggerPrice } : {}),
      ...(input.triggerCondition ? { triggerCondition: input.triggerCondition } : {}),
      ...(input.trailingDistance ? { trailingDistance: input.trailingDistance } : {}),
      ...(input.trailingPct ? { trailingPct: input.trailingPct } : {}),
    };
    const result = await placeOrderMutation({ variables: { input: mutationInput } });
    if (result.errors?.length) throw new Error(result.errors[0].message);
    if (!result.data?.placeOrder) throw new Error('Order placement returned no data');
    const { status } = result.data.placeOrder;
    if (status === 'REJECTED' || status === 'CANCELLED') throw new Error(`Order ${status.toLowerCase()}`);
  };

  // Algo orders - TWAP/VWAP/Iceberg via REST /api/orders/algo
  const placeAlgoOrder = async (input: {
    instrumentId: string;
    side: 'BUY' | 'SELL';
    type: 'TWAP' | 'VWAP' | 'ICEBERG';
    quantity: string;
    slices?: number;
    durationMinutes?: number;
    displayQty?: string;
  }) => {
    if (!accountId) throw new Error('Account ID not configured');
    // Use REST for algo orders - same as desktop trading-terminal
    const response = await fetch('/api/orders/algo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountId,
        instrumentId: input.instrumentId,
        side: input.side,
        type: input.type,
        quantity: input.quantity,
        timeInForce: 'DAY',
        externalRefId: `mobile-${nanoid(12)}`,
        clientOrderId: `mobile-${nanoid(10)}`,
        ...(input.slices ? { slices: input.slices } : {}),
        ...(input.durationMinutes ? { durationMinutes: input.durationMinutes } : {}),
        ...(input.displayQty ? { displayQty: input.displayQty } : {}),
      }),
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(err || `Algo order failed: ${response.status}`);
    }
  };

  // Cancel order - real mutation
  const cancelOrder = async (id: string) => {
    const result = await cancelOrderMutation({ variables: { orderId: id } });
    if (result.errors?.length) throw new Error(result.errors[0].message);
  };

  // Loading - true while we're still fetching the instrument catalogue.
  // Positions / orders / account are streamed and arrive incrementally; the
  // UI shows them as soon as each stream delivers its first event.
  const loading = instrumentsLoading;

  const data: MobileWorkstationData = {
    instruments,
    quotesBySymbol,
    account,
    orders,
    positions,
    accountId,
    placeOrder,
    placeAlgoOrder,
    cancelOrder,
    isAuthenticated,
    loading,
    error: firstError,
  };

  return <MobileTradingDashboard data={data} onSetActiveSymbol={setActiveSymbol} />;
}