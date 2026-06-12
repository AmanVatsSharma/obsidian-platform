/**
 * @file apps/web/lib/prana-stream/stores/optimistic-orders.spec.ts
 * @module web/prana-stream
 * @description Tests for the optimistic orders store.
 * @author BharatERP
 * @created 2026-06-10
 * @last-updated 2026-06-10
 */

import { useOptimisticOrdersStore } from './optimistic-orders';

describe('useOptimisticOrdersStore', () => {
  beforeEach(() => {
    useOptimisticOrdersStore.getState().reset();
  });

  it('addPending creates a PENDING entry and returns clientOrderId', () => {
    const cid = useOptimisticOrdersStore.getState().addPending({
      accountId: 'a1',
      instrumentId: 'i1',
      side: 'BUY',
      type: 'MARKET',
      quantity: '1.00',
    });
    expect(cid).toMatch(/^web-/);
    const entry = useOptimisticOrdersStore.getState().byKey.get(cid);
    expect(entry).toBeDefined();
    expect(entry?.localStatus).toBe('pending');
    expect(entry?.status).toBe('PENDING');
  });

  it('reconcile moves the entry from clientOrderId to id and updates status', () => {
    const cid = useOptimisticOrdersStore.getState().addPending({
      accountId: 'a1',
      instrumentId: 'i1',
      side: 'BUY',
      type: 'MARKET',
      quantity: '1.00',
    });
    useOptimisticOrdersStore.getState().reconcile({
      clientOrderId: cid,
      id: 'srv-123',
      status: 'ACCEPTED',
    });
    const byKey = useOptimisticOrdersStore.getState().byKey;
    expect(byKey.get('srv-123')).toBeDefined();
    expect(byKey.has(cid)).toBe(false);
    expect(byKey.get('srv-123')?.localStatus).toBe('confirmed');
  });

  it('reconcile with REJECTED status marks entry rejected', () => {
    const cid = useOptimisticOrdersStore.getState().addPending({
      accountId: 'a1',
      instrumentId: 'i1',
      side: 'BUY',
      type: 'MARKET',
      quantity: '1.00',
    });
    useOptimisticOrdersStore.getState().reconcile({
      clientOrderId: cid,
      id: 'srv-123',
      status: 'REJECTED',
      message: 'Insufficient margin',
    });
    const entry = useOptimisticOrdersStore.getState().byKey.get('srv-123');
    expect(entry?.localStatus).toBe('rejected');
    expect(entry?.errorMessage).toBe('Insufficient margin');
  });

  it('markRejected sets error message on a pending entry', () => {
    const cid = useOptimisticOrdersStore.getState().addPending({
      accountId: 'a1',
      instrumentId: 'i1',
      side: 'BUY',
      type: 'MARKET',
      quantity: '1.00',
    });
    useOptimisticOrdersStore.getState().markRejected(cid, 'Network error');
    const entry = useOptimisticOrdersStore.getState().byKey.get(cid);
    expect(entry?.localStatus).toBe('rejected');
    expect(entry?.errorMessage).toBe('Network error');
  });

  it('applyServerUpdate reconciles an existing optimistic entry', () => {
    const cid = useOptimisticOrdersStore.getState().addPending({
      accountId: 'a1',
      instrumentId: 'i1',
      side: 'BUY',
      type: 'MARKET',
      quantity: '1.00',
    });
    useOptimisticOrdersStore.getState().reconcile({
      clientOrderId: cid,
      id: 'srv-456',
      status: 'ACCEPTED',
    });
    // Simulate a later `order.updated` event from the WebSocket
    useOptimisticOrdersStore.getState().applyServerUpdate({
      id: 'srv-456',
      accountId: 'a1',
      instrumentId: 'i1',
      side: 'BUY',
      type: 'MARKET',
      quantity: '1.00',
      status: 'FILLED',
      filledQty: '1.00',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const entry = useOptimisticOrdersStore.getState().byKey.get('srv-456');
    expect(entry?.status).toBe('FILLED');
    expect(entry?.localStatus).toBe('confirmed');
  });

  it('applyServerUpdate adds a new entry when no optimistic match exists', () => {
    useOptimisticOrdersStore.getState().applyServerUpdate({
      id: 'srv-789',
      accountId: 'a1',
      instrumentId: 'i1',
      side: 'BUY',
      type: 'MARKET',
      quantity: '1.00',
      status: 'FILLED',
      createdAt: new Date().toISOString(),
    });
    const entry = useOptimisticOrdersStore.getState().byKey.get('srv-789');
    expect(entry).toBeDefined();
    expect(entry?.localStatus).toBe('confirmed');
  });

  it('usePendingOrderCount counts only pending entries', () => {
    useOptimisticOrdersStore.getState().addPending({
      accountId: 'a1', instrumentId: 'i1', side: 'BUY', type: 'MARKET', quantity: '1.00',
    });
    useOptimisticOrdersStore.getState().addPending({
      accountId: 'a1', instrumentId: 'i2', side: 'SELL', type: 'LIMIT', quantity: '2.00',
    });
    let n = 0;
    for (const v of useOptimisticOrdersStore.getState().byKey.values()) {
      if (v.localStatus === 'pending') n++;
    }
    expect(n).toBe(2);
  });
});
