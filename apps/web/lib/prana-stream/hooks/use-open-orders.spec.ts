/**
 * File:        apps/web/lib/prana-stream/hooks/use-open-orders.spec.ts
 * Module:      web/prana-stream/hooks
 * Purpose:     Unit tests for the open-orders filter hook.
 *              Verifies that terminal statuses are excluded, the filter
 *              slice is respected, and sorting is newest-first.
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-12
 */

import { renderHook } from '@testing-library/react';
import { useOrderUpdates } from './use-order-updates';
import { useOpenOrders } from './use-open-orders';
import type { OrderUpdatePayload } from '../types';

jest.mock('./use-order-updates');

const mockedOrders = useOrderUpdates as jest.MockedFunction<typeof useOrderUpdates>;

const order = (overrides: Partial<OrderUpdatePayload> = {}): OrderUpdatePayload => ({
  id: 'ord-x',
  accountId: 'acct-1',
  instrumentId: 'inst-A',
  side: 'BUY',
  type: 'LIMIT',
  quantity: '10',
  status: 'NEW',
  createdAt: '2026-06-12T10:00:00.000Z',
  ...overrides,
});

describe('useOpenOrders', () => {
  it('returns [] when the order stream is empty', () => {
    mockedOrders.mockReturnValue(new Map());
    const { result } = renderHook(() => useOpenOrders());
    expect(result.current).toEqual([]);
  });

  it('excludes terminal statuses (FILLED, CANCELED, REJECTED, EXPIRED)', () => {
    const orders = new Map<string, OrderUpdatePayload>([
      ['1', order({ id: '1', status: 'NEW', createdAt: '2026-06-12T09:00:00.000Z' })],
      ['2', order({ id: '2', status: 'PARTIALLY_FILLED', createdAt: '2026-06-12T09:01:00.000Z' })],
      ['3', order({ id: '3', status: 'WORKING', createdAt: '2026-06-12T09:02:00.000Z' })],
      ['4', order({ id: '4', status: 'FILLED', createdAt: '2026-06-12T09:03:00.000Z' })],
      ['5', order({ id: '5', status: 'CANCELED', createdAt: '2026-06-12T09:04:00.000Z' })],
      ['6', order({ id: '6', status: 'REJECTED', createdAt: '2026-06-12T09:05:00.000Z' })],
      ['7', order({ id: '7', status: 'EXPIRED', createdAt: '2026-06-12T09:06:00.000Z' })],
    ]);
    mockedOrders.mockReturnValue(orders);
    const { result } = renderHook(() => useOpenOrders());
    expect(result.current.map((o) => o.id)).toEqual(['3', '2', '1']);
  });

  it('respects the accountId filter', () => {
    const orders = new Map<string, OrderUpdatePayload>([
      ['1', order({ id: '1', accountId: 'acct-1' })],
      ['2', order({ id: '2', accountId: 'acct-2' })],
      ['3', order({ id: '3', accountId: 'acct-1' })],
    ]);
    mockedOrders.mockReturnValue(orders);
    const { result } = renderHook(() => useOpenOrders({ accountId: 'acct-1' }));
    expect(result.current.map((o) => o.id).sort()).toEqual(['1', '3']);
  });

  it('respects the instrumentId filter', () => {
    const orders = new Map<string, OrderUpdatePayload>([
      ['1', order({ id: '1', instrumentId: 'inst-A' })],
      ['2', order({ id: '2', instrumentId: 'inst-B' })],
      ['3', order({ id: '3', instrumentId: 'inst-A' })],
    ]);
    mockedOrders.mockReturnValue(orders);
    const { result } = renderHook(() => useOpenOrders({ instrumentId: 'inst-A' }));
    expect(result.current.map((o) => o.id).sort()).toEqual(['1', '3']);
  });
});
