/**
 * File:        apps/web/lib/prana-stream/stores/optimistic-orders.ts
 * Module:      web/prana-stream/stores
 * Purpose:     Optimistic orders store.
 *              When a user places an order we:
 *                1. Add a PENDING entry to the store immediately (sub-50ms)
 *                2. Issue the GraphQL mutation
 *                3. On success, replace the pending entry with the server
 *                   response (id may differ from clientOrderId)
 *                4. On error, mark the entry REJECTED with the error message
 *                5. The subsequent `order.updated` WebSocket event reconciles
 *                   the order's lifecycle (PENDING → ACCEPTED → PARTIAL → FILLED,
 *                   etc.). The reconciliation merges by clientOrderId, then by id.
 *
 *              Why this matters: the round-trip to the OMS can take 200–800ms
 *              (network + OMS + venue roundtrip). Showing the order immediately
 *              with a PENDING badge, then updating in-place, gives the trader
 *              feedback in <50ms — they can act on the next decision before
 *              the previous one is fully confirmed.
 *
 * Exports:
 *   - useOptimisticOrdersStore   — zustand store (selector-friendly)
 *   - OptimisticOrder            — the merged shape
 *
 * Depends on:
 *   - zustand
 *   - ../types — OrderUpdatePayload
 *
 * Side-effects:
 *   - In-memory only; survives React re-renders. No localStorage.
 *
 * Key invariants:
 *   - Pending entries are removed when the server returns the same clientOrderId
 *   - Server-issued `order.updated` events ALWAYS win over local pending state
 *     (the server is the source of truth)
 *   - Errors are sticky on the optimistic entry; user can dismiss or retry
 *
 * Read order:
 *   1. OptimisticOrder — shape
 *   2. Store API — addPending / reconcile / markRejected / applyServerUpdate
 *   3. Selectors — usePendingOrders, useOptimisticOrders
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-10
 */

'use client';

import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { nanoid } from 'nanoid';
import type { OrderUpdatePayload } from '../types';

export type OptimisticOrder = OrderUpdatePayload & {
  /** Local status flag — distinct from server status so we can show PENDING. */
  localStatus: 'pending' | 'confirmed' | 'rejected';
  /** Error message if rejected. */
  errorMessage?: string;
  /** When the optimistic entry was added. */
  addedAt: number;
  /** Client-generated ID used for reconciliation; the server's real id replaces this in `id`. */
  clientOrderId?: string;
};

type State = {
  /** Keyed by id OR clientOrderId (so we can find by either). */
  byKey: Map<string, OptimisticOrder>;
};

type Actions = {
  /**
   * Add a pending order entry. Returns the clientOrderId we generated so
   * the caller can pass it to the mutation.
   */
  addPending: (draft: Omit<OrderUpdatePayload, 'id' | 'status' | 'createdAt'>) => string;
  /**
   * Reconcile a pending entry with the server response (after mutation returns).
   * Matches by clientOrderId; updates id and status.
   */
  reconcile: (input: {
    clientOrderId: string;
    id: string;
    status: string;
    message?: string;
  }) => void;
  /**
   * Mark a pending entry as rejected with an error message.
   */
  markRejected: (clientOrderId: string, errorMessage: string) => void;
  /**
   * Apply a server-issued `order.updated` event. Server always wins.
   * Matches by id first, then by clientOrderId.
   */
  applyServerUpdate: (update: OrderUpdatePayload) => void;
  /** Clear all entries (e.g. on logout). */
  reset: () => void;
};

const initialState: State = {
  byKey: new Map(),
};

function findEntry(
  byKey: Map<string, OptimisticOrder>,
  idOrClientId: string,
): OptimisticOrder | undefined {
  // Direct hit
  const direct = byKey.get(idOrClientId);
  if (direct) return direct;
  // Fallback: scan by clientOrderId field
  for (const v of byKey.values()) {
    if (v.id === idOrClientId) return v;
  }
  return undefined;
}

export const useOptimisticOrdersStore = create<State & Actions>((set) => ({
  ...initialState,
  addPending: (draft) => {
    const provided = (draft as { clientOrderId?: string }).clientOrderId;
    const clientOrderId = provided ?? `web-${nanoid(10)}`;
    const entry: OptimisticOrder = {
      accountId: draft.accountId,
      instrumentId: draft.instrumentId,
      side: draft.side,
      type: draft.type,
      quantity: draft.quantity,
      ...(draft.price ? { price: draft.price } : {}),
      ...(draft.filledQty ? { filledQty: draft.filledQty } : {}),
      ...(draft.remainingQty ? { remainingQty: draft.remainingQty } : {}),
      clientOrderId,
      id: clientOrderId, // Temporary — replaced when server returns real id
      status: 'PENDING',
      localStatus: 'pending',
      createdAt: new Date().toISOString(),
      addedAt: Date.now(),
    };
    set((s) => {
      const next = new Map(s.byKey);
      next.set(clientOrderId, entry);
      return { byKey: next };
    });
    return clientOrderId;
  },
  reconcile: ({ clientOrderId, id, status, message }) => {
    set((s) => {
      const next = new Map(s.byKey);
      const existing = next.get(clientOrderId);
      if (!existing) return s; // Stale reconcile; ignore
      const updated: OptimisticOrder = {
        ...existing,
        id,
        status,
        localStatus: status === 'REJECTED' ? 'rejected' : 'confirmed',
        ...(message ? { errorMessage: message } : {}),
        updatedAt: new Date().toISOString(),
      };
      // Re-key: clientOrderId → id mapping changes
      next.delete(clientOrderId);
      next.set(id, updated);
      return { byKey: next };
    });
  },
  markRejected: (clientOrderId, errorMessage) => {
    set((s) => {
      const next = new Map(s.byKey);
      const existing = next.get(clientOrderId);
      if (!existing) return s;
      const updated: OptimisticOrder = {
        ...existing,
        localStatus: 'rejected',
        errorMessage,
        status: 'REJECTED',
        updatedAt: new Date().toISOString(),
      };
      next.set(clientOrderId, updated);
      return { byKey: next };
    });
  },
  applyServerUpdate: (update) => {
    set((s) => {
      const next = new Map(s.byKey);
      const existing = findEntry(next, update.id);
      if (existing) {
        // Merge: server is source of truth
        const merged: OptimisticOrder = {
          ...existing,
          ...update,
          localStatus: update.status === 'REJECTED' ? 'rejected' : 'confirmed',
          // Clear optimistic-only fields that the server now supplies
          errorMessage: update.status === 'REJECTED' ? existing.errorMessage : undefined,
        };
        // Re-key: id may have changed (rare)
        if (existing.id !== update.id) {
          // Find and remove the old key
          for (const [k, v] of next) {
            if (v === existing) {
              next.delete(k);
              break;
            }
          }
        }
        next.set(update.id, merged);
      } else {
        // Pure server-side event (not optimistic) — add it
        const entry: OptimisticOrder = {
          ...update,
          localStatus: 'confirmed',
          addedAt: Date.now(),
        };
        next.set(update.id, entry);
      }
      return { byKey: next };
    });
  },
  reset: () => set({ byKey: new Map() }),
}));

/* ─────────────────────────── Selectors ─────────────────────────── */

export function useOptimisticOrders(): OptimisticOrder[] {
  return useOptimisticOrdersStore((s) => Array.from(s.byKey.values()));
}

export function usePendingOrderCount(): number {
  // Use a stable selector — count the number of pending entries in the byKey map.
  // We avoid `byKey.size` because not all entries are pending.
  return useOptimisticOrdersStore(
    useShallow((s) => {
      let n = 0;
      for (const v of s.byKey.values()) if (v.localStatus === 'pending') n++;
      return n;
    }),
  );
}
