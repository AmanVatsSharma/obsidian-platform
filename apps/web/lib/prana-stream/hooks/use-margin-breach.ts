/**
 * File:        apps/web/lib/prana-stream/hooks/use-margin-breach.ts
 * Module:      web/prana-stream/hooks
 * Purpose:     Subscribe to margin breach events.
 *              Returns the most recent breach event so the UI can render a
 *              blocking modal (critical/breach) or non-blocking toast (warning).
 *
 * Exports:
 *   - useMarginBreach() — { breach, dismiss, isBlocking }
 *
 * Depends on:
 *   - ./prana-provider   — usePranaStream
 *   - ../types           — MarginBreachPayload
 *
 * Side-effects:
 *   - Network I/O via the existing PranaStream socket
 *
 * Key invariants:
 *   - Only the latest breach is kept in state — older breaches are stale
 *   - `dismiss()` clears local state; the server still considers the breach
 *     active until the user tops up margin or positions are closed
 *   - `isBlocking` is true for severity ∈ {critical, breach}
 *
 * Read order:
 *   1. useMarginBreach — the hook
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-10
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePranaStream } from '../prana-provider';
import type { MarginBreachPayload, RealtimeEvent } from '../types';

export type MarginBreachState = {
  breach: MarginBreachPayload | null;
  /** When true, the UI should render a blocking modal that disables order entry. */
  isBlocking: boolean;
  dismiss: () => void;
};

export function useMarginBreach(): MarginBreachState {
  const { client, isReady } = usePranaStream();
  const [breach, setBreach] = useState<MarginBreachPayload | null>(null);

  useEffect(() => {
    if (!isReady) return;
    client.subscribe({ accounts: true });

    const unsub = client.on<RealtimeEvent<MarginBreachPayload>>('margin.breach', (event) => {
      setBreach(event.data);
    });

    return () => {
      unsub();
      client.unsubscribe({ accounts: true });
    };
  }, [isReady, client]);

  const dismiss = useCallback(() => setBreach(null), []);

  return {
    breach,
    isBlocking: breach?.severity === 'critical' || breach?.severity === 'breach',
    dismiss,
  };
}
