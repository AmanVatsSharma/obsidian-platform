/**
 * File:        apps/web/features/mobile-terminal/components/mobile-workstation.tsx
 * Module:      Mobile Terminal · Data Adapter
 * Purpose:     Web platform adapter — wires auth, Apollo Client GraphQL hooks, and env vars
 *              into the mobile trading dashboard. NO mock data fallback — proper empty
 *              states and loading indicators instead.
 *
 * Exports:
 *   - MobileWorkstation({ onDemoToggle?, demoMode? }) → ReactNode
 *
 * Depends on:
 *   - @/shared/providers/auth-provider — useAuth
 *   - @/gql/hooks — Apollo hooks for GraphQL operations
 *   - @/features/trading-terminal/lib/types — Instrument, OpenPosition, PendingOrder, AccountSnapshot
 *   - nanoid — clientOrderId generation
 *
 * Side-effects:
 *   - Network calls via Apollo Client (queries + mutations)
 *   - NO mock data fallback — always shows loading/empty/error states
 *
 * Key invariants:
 *   - Always uses real data from backend (or shows loading/empty states)
 *   - loading=true when queries are loading
 *   - error set when any query fails
 *   - Empty arrays shown via proper empty states in UI, not fallback data
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-09
 */

'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/shared/providers/auth-provider';
import { useGetInstrumentsQuery, useGetAccountBalanceQuery, useGetOrdersQuery, useGetPositionsQuery, useGetQuoteQuery, usePlaceOrderMutation, useCancelOrderMutation } from '@/gql/hooks';
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
  onDemoToggle?: (enabled: boolean) => void;
  demoMode?: boolean;
  desktopHref?: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────

const QUOTE_POLL_INTERVAL = 2000;
const INSTRUMENT_POLL_INTERVAL = 5000;

const mapPosition = (p: any, instruments: Instrument[]): OpenPosition => {
  const inst = instruments.find(i => i.id === p.instrumentId);
  return { id: p.id, symbol: inst?.symbol ?? p.instrumentId, type: p.netQty >= 0 ? 'BUY' : 'SELL', lots: Math.abs(p.netQty), openPrice: p.avgPrice, currentPrice: p.lastPrice, sl: '', tp: '', pnl: p.mtmPnl, pnlPct: 0, swap: 0, commission: 0, openTime: p.openTime ?? '', margin: 0 };
};

const mapOrder = (o: any, instruments: Instrument[]): PendingOrder => {
  const inst = instruments.find(i => i.id === o.instrumentId);
  return { id: o.id, symbol: inst?.symbol ?? o.instrumentId, type: o.type, orderRole: null, parentOrderId: null, side: o.side as 'BUY' | 'SELL', lots: o.quantity, price: o.price ?? 0, sl: o.slPrice ?? 0, tp: o.tpPrice ?? 0, distance: 0, status: o.status, created: o.createdAt, expiry: undefined, algoMeta: undefined };
};

// ─── Component ─────────────────────────────────────────────────────────────────
//
// NO MOCK DATA - Always queries backend. Proper loading/empty/error states are handled
// in the UI layer (MobileTradingDashboard). This adapter always returns real data
// or signals loading/error to the UI via the data prop.
//

export function MobileWorkstation({ onDemoToggle, demoMode = false }: MobileWorkstationProps) {
  const { accessToken } = useAuth();
  const accountId = process.env.NEXT_PUBLIC_DEFAULT_TRADING_ACCOUNT_ID ?? '';
  const isAuthenticated = !!(accessToken && accountId);

  // All queries always run (no skip) - let Apollo handle auth errors
  // Loading state is determined by whether data has returned
  const { data: instrumentsData, error: instrumentsError, loading: instrumentsLoading } = useGetInstrumentsQuery({
    variables: {},
    pollInterval: INSTRUMENT_POLL_INTERVAL,
  });
  const { data: balanceData, error: balanceError, loading: balanceLoading } = useGetAccountBalanceQuery({
    variables: { accountId },
    skip: !accountId,
  });
  const { data: ordersData, error: ordersError, loading: ordersLoading } = useGetOrdersQuery({
    variables: { accountId, status: 'PENDING', limit: 100 },
    skip: !accountId,
  });
  const { data: positionsData, error: positionsError, loading: positionsLoading } = useGetPositionsQuery({
    variables: { accountId, limit: 100 },
    skip: !accountId,
  });

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
    const errs = [instrumentsError, balanceError, ordersError, positionsError, quoteError].filter(Boolean);
    return errs[0]?.message ?? null;
  }, [instrumentsError, balanceError, ordersError, positionsError, quoteError]);

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

  // Account balance - null if not available
  const account = useMemo(() => {
    if (!balanceData?.accountBalance) return null;
    const b = balanceData.accountBalance;
    return {
      accountId: b.accountId ?? accountId,
      name: b.accountHolderName ?? 'Trading Account',
      server: b.server ?? 'Live',
      accountType: b.accountType ?? 'Trading',
      leverage: b.leverage ?? '1:100',
      balance: parseFloat(b.totalCash) || 0,
      equity: parseFloat(b.equity) || 0,
      margin: parseFloat(b.lockedCash) || 0,
      freeMargin: parseFloat(b.buyingPower) || 0,
      unrealizedPnl: parseFloat(b.unrealizedPnl) || 0,
      realizedPnlToday: 0,
      marginLevel: 0,
      drawdownPct: 0,
      currency: b.currency ?? 'USD',
    } satisfies AccountSnapshot;
  }, [balanceData, accountId]);

  // Map orders from GraphQL
  const orders = useMemo(() => {
    return (ordersData?.orders?.data ?? []).map((o: any) => mapOrder(o, instruments));
  }, [ordersData, instruments]);

  // Map positions from GraphQL
  const positions = useMemo(() => {
    return (positionsData?.positions?.data ?? []).map((p: any) => mapPosition(p, instruments));
  }, [positionsData, instruments]);

  // Order placement - real mutation
  const placeOrder = async (input: { instrumentId: string; side: 'BUY' | 'SELL'; type: 'MARKET' | 'LIMIT'; quantity: string; price?: string }) => {
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
    };
    const result = await placeOrderMutation({ variables: { input: mutationInput } });
    if (result.errors?.length) throw new Error(result.errors[0].message);
    if (!result.data?.placeOrder) throw new Error('Order placement returned no data');
    const { status } = result.data.placeOrder;
    if (status === 'REJECTED' || status === 'CANCELLED') throw new Error(`Order ${status.toLowerCase()}`);
  };

  // Cancel order - real mutation
  const cancelOrder = async (id: string) => {
    const result = await cancelOrderMutation({ variables: { orderId: id } });
    if (result.errors?.length) throw new Error(result.errors[0].message);
  };

  // Loading - true when any critical query is still loading
  const loading = instrumentsLoading || balanceLoading || ordersLoading || positionsLoading;

  const data: MobileWorkstationData = {
    instruments,
    quotesBySymbol,
    account,
    orders,
    positions,
    accountId,
    placeOrder,
    cancelOrder,
    isAuthenticated,
    loading,
    error: firstError,
  };

  return <MobileTradingDashboard data={data} onSetActiveSymbol={setActiveSymbol} />;
}