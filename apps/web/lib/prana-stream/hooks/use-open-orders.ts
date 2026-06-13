/**
 * File:        apps/web/lib/prana-stream/hooks/use-open-orders.ts
 * Module:      web/prana-stream/hooks
 * Purpose:     Filter the live order stream to a slice of interest.
 *              Returns open (working) orders, optionally narrowed by account
 *              and/or instrument. Re-uses the existing order stream — no new
 *              PranaStream subscription is opened.
 *
 *              Open = status in {NEW, ACCEPTED, PARTIALLY_FILLED, PENDING,
 *              WORKING, OPEN}. The exact set depends on OMS conventions;
 *              anything not in {FILLED, CANCELLED, REJECTED, EXPIRED} is
 *              considered open.
 *
 * Exports:
 *   - useOpenOrders(opts?) — OrderUpdatePayload[]
 *   - OpenOrderFilter      — filter options
 *
 * Depends on:
 *   - useOrderUpdates — the live order stream
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - Sorted by createdAt DESC (newest first)
 *   - Returns [] when no live updates have arrived yet
 *   - memoized — only recomputes when orders change OR filter changes
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-12
 */

'use client';

import { useMemo } from 'react';
import { useOrderUpdates } from './use-order-updates';
import type { OrderUpdatePayload } from '../types';

export type OpenOrderFilter = {
  accountId?: string;
  instrumentId?: string;
};

const TERMINAL_STATUSES = new Set(['FILLED', 'CANCELED', 'CANCELLED', 'REJECTED', 'EXPIRED']);

const isOpen = (o: OrderUpdatePayload): boolean => !TERMINAL_STATUSES.has(o.status);

export function useOpenOrders(filter: OpenOrderFilter = {}): OrderUpdatePayload[] {
  const orders = useOrderUpdates();
  const filterKey = `${filter.accountId ?? '*'}|${filter.instrumentId ?? '*'}`;

  return useMemo(() => {
    const out: OrderUpdatePayload[] = [];
    for (const o of orders.values()) {
      if (!isOpen(o)) continue;
      if (filter.accountId && o.accountId !== filter.accountId) continue;
      if (filter.instrumentId && o.instrumentId !== filter.instrumentId) continue;
      out.push(o);
    }
    out.sort((a, b) => (b.createdAt > a.createdAt ? 1 : b.createdAt < a.createdAt ? -1 : 0));
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, filterKey]);
}
