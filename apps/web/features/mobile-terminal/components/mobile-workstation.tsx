/**
 * File:        apps/web/features/mobile-terminal/components/mobile-workstation.tsx
 * Module:      Mobile Terminal · Data Adapter
 * Purpose:     Web platform adapter — wires auth, Apollo Client GraphQL hooks, and env vars
 *              into the mobile trading dashboard, with fallback to mock data.
 *
 * Exports:
 *   - MobileWorkstation({ onDemoToggle?, demoMode? }) → ReactNode
 *
 * Depends on:
 *   - @/shared/providers/auth-provider — useAuth
 *   - @/gql/hooks — Apollo hooks for GraphQL operations
 *   - @/features/trading-terminal/lib/mock-data — INSTRUMENTS, ACCOUNT, OPEN_POSITIONS, PENDING_ORDERS
 *   - @/features/trading-terminal/lib/types — Instrument, OpenPosition, PendingOrder, AccountSnapshot
 *   - nanoid — clientOrderId generation
 *
 * Side-effects:
 *   - Network calls via Apollo Client (queries + mutations)
 *   - Direct mock data fallback when unauthenticated/demo mode
 *
 * Key invariants:
 *   - accessToken null → mock data fallback
 *   - ?demo=1 → mock data fallback
 *   - Apollo queries auto-invalidate cache on mutations
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-07
 */

'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/shared/providers/auth-provider';
import { useGetInstrumentsQuery, useGetAccountBalanceQuery, useGetOrdersQuery, useGetPositionsQuery, useGetQuoteQuery, usePlaceOrderMutation, useCancelOrderMutation } from '@/gql/hooks';
import { nanoid } from 'nanoid';
import type { Instrument, OpenPosition, PendingOrder, AccountSnapshot, QuoteDto } from '@/features/trading-terminal/lib/types';
import { INSTRUMENTS, ACCOUNT, OPEN_POSITIONS, PENDING_ORDERS } from '@/features/trading-terminal/lib/mock-data';
import { MobileTradingDashboard } from './mobile-trading-dashboard';

// ─── Types ─────────────────────────────────────────────────────────────

export type MobileWorkstationData = {
  instruments: Instrument[];
  quotesBySymbol: Record<string, QuoteDto>;
  account: AccountSnapshot | null;
  orders: PendingOrder[];
  positions: OpenPosition[];
  accountId: string;
  placeOrder: (input: { instrumentId: string; side: 'BUY' | 'SELL'; type: 'MARKET' | 'LIMIT'; quantity: string; price?: string }) => Promise<void>;
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

export function MobileWorkstation({ onDemoToggle, demoMode = false }: MobileWorkstationProps) {
  const { accessToken } = useAuth();
  const accountId = process.env.NEXT_PUBLIC_DEFAULT_TRADING_ACCOUNT_ID ?? '';
  const useMockData = !accessToken || demoMode;

  const { data: instrumentsData, error: instrumentsError } = useGetInstrumentsQuery({
    variables: {}, pollInterval: useMockData ? 0 : INSTRUMENT_POLL_INTERVAL, skip: useMockData,
  });
  const { data: balanceData, error: balanceError } = useGetAccountBalanceQuery({
    variables: { accountId }, skip: !accountId || useMockData,
  });
  const { data: ordersData, error: ordersError } = useGetOrdersQuery({
    variables: { accountId, status: 'PENDING', limit: 100 }, skip: useMockData,
  });
  const { data: positionsData, error: positionsError } = useGetPositionsQuery({
    variables: { accountId, limit: 100 }, skip: useMockData,
  });

  const [activeSymbol, setActiveSymbol] = useState<string | null>(null);
  const { data: quoteData, error: quoteError } = useGetQuoteQuery({
    variables: { exchange: activeSymbol ? 'forex' : '', symbol: activeSymbol || '' },
    pollInterval: useMockData ? 0 : QUOTE_POLL_INTERVAL, skip: !activeSymbol || useMockData,
  });

  const [placeOrderMutation] = usePlaceOrderMutation();
  const [cancelOrderMutation] = useCancelOrderMutation();

  const firstError = useMemo(() => {
    const errs = [instrumentsError, balanceError, ordersError, positionsError, quoteError];
    return errs.find(e => e)?.message || null;
  }, [instrumentsError, balanceError, ordersError, positionsError, quoteError]);

  const instruments = useMemo(() => {
    if (useMockData) return INSTRUMENTS;
    // GraphQL returns { instruments: InstrumentDto[] } directly, not a connection edge
    return (instrumentsData?.instruments ?? []).map((inst: any) => ({ ...inst, id: inst.id, symbol: inst.symbol, name: inst.displayName, change: 0, changePct: 0, high: 0, low: 0 }));
  }, [useMockData, instrumentsData]);

  const quotesBySymbol = useMemo(() => {
    if (useMockData || !quoteData?.quote) return {};
    const q = quoteData.quote;
    return q.symbol ? { [q.symbol]: { symbol: q.symbol, exchange: q.exchange, price: q.price, ts: q.ts } } : {};
  }, [useMockData, quoteData]);

  const account = useMemo(() => {
    if (useMockData) return ACCOUNT;
    if (!balanceData?.accountBalance) return null;
    const b = balanceData.accountBalance;
    return { ...ACCOUNT, balance: parseFloat(b.totalCash) || 0, equity: parseFloat(b.equity) || 0, margin: parseFloat(b.lockedCash) || 0, freeMargin: parseFloat(b.buyingPower) || 0, unrealizedPnl: parseFloat(b.unrealizedPnl) || 0 };
  }, [useMockData, balanceData]);

  const orders = useMemo(() => useMockData ? PENDING_ORDERS : (ordersData?.orders?.data ?? []).map((o: any) => mapOrder(o, instruments)), [useMockData, ordersData, instruments]);
  const positions = useMemo(() => useMockData ? OPEN_POSITIONS : (positionsData?.positions?.data ?? []).map((p: any) => mapPosition(p, instruments)), [useMockData, positionsData, instruments]);

  const placeOrder = async (input: { instrumentId: string; side: 'BUY' | 'SELL'; type: 'MARKET' | 'LIMIT'; quantity: string; price?: string }) => {
    if (useMockData) { console.log('Mock order placed:', input); return; }
    if (!accountId) throw new Error('Account ID not configured');
    const mutationInput = { accountId, instrumentId: input.instrumentId, side: input.side, type: input.type, quantity: input.quantity, timeInForce: 'DAY' as const, externalRefId: `mobile-${nanoid(12)}`, clientOrderId: `mobile-${nanoid(10)}`, ...(input.price ? { price: input.price } : {}) };
    const result = await placeOrderMutation({ variables: { input: mutationInput } });
    if (result.errors?.length) throw new Error(result.errors[0].message);
    if (!result.data?.placeOrder) throw new Error('Order placement returned no data');
    const { status } = result.data.placeOrder;
    if (status === 'REJECTED' || status === 'CANCELLED') throw new Error(`Order ${status.toLowerCase()}`);
  };

  const cancelOrder = async (id: string) => {
    if (useMockData) { console.log('Mock order cancelled:', id); return; }
    const result = await cancelOrderMutation({ variables: { orderId: id } });
    if (result.errors?.length) throw new Error(result.errors[0].message);
  };

  const loading = useMockData ? false : !!(instrumentsData === undefined || balanceData === undefined || ordersData === undefined || positionsData === undefined);

  const data: MobileWorkstationData = { instruments, quotesBySymbol, account, orders, positions, accountId, placeOrder, cancelOrder, isAuthenticated: !useMockData, loading, error: firstError };

  return <MobileTradingDashboard data={data} onSetActiveSymbol={setActiveSymbol} />;
}