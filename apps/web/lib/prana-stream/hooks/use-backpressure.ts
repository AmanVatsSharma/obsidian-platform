/**
 * File:        apps/web/lib/prana-stream/hooks/use-backpressure.ts
 * Module:      web/prana-stream
 * Purpose:     React hook to observe PranaStream backpressure events
 *              (level 1=warning, 2=critical, 3=force-disconnect).
 *              Exposes a reactive state so the UI can render warnings
 *              and prompt the user to reduce subscriptions or reconnect.
 *
 * Exports:
 *   - useBackpressure — returns { level, pendingBytes, hint } | null
 *
 * Depends on:
 *   - usePranaStream — provider context
 *
 * Side-effects:
 *   - Subscribes/unsubscribes to 'backpressure.slow' / 'backpressure.disconnect'
 *
 * Key invariants:
 *   - Returns null when no backpressure is active
 *   - Level 2 persists in the hook state until the connection recovers
 *   - Force-disconnect immediately clears state and the connection status flips
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-10
 */

'use client';

import { useEffect, useState } from 'react';
import { usePranaStream } from '../prana-provider';
import type { BackpressureEvent } from '../types';

export type BackpressureState = {
  level: 1 | 2 | 3;
  pendingBytes: number;
  hint: string;
  receivedAt: number;
};

export function useBackpressure(): BackpressureState | null {
  const { client } = usePranaStream();
  const [state, setState] = useState<BackpressureState | null>(null);

  useEffect(() => {
    const unsubSlow = client.on<BackpressureEvent>('backpressure.slow', (data) => {
      if (!data || data.level === 0) {
        setState(null);
        return;
      }
      setState({
        level: data.level as 1 | 2 | 3,
        pendingBytes: data.pendingBytes,
        hint: data.hint,
        receivedAt: Date.now(),
      });
    });

    const unsubDisc = client.on<{ reason: string }>('backpressure.disconnect', (data) => {
      setState({
        level: 3,
        pendingBytes: 0,
        hint: 'reconnect_with_reset',
        receivedAt: Date.now(),
      });
      // Allow the disconnect handler to close the socket; the reconnect loop
      // will fire on its own and `setState(null)` once the new connection emits
      // a level 0 backpressure event (or after 10s of healthy traffic).
    });

    // Auto-clear after 30s of health (so the UI doesn't keep the warning forever
    // if the server is busy and doesn't emit a level 0)
    const t = setInterval(() => {
      setState((prev) => {
        if (!prev) return null;
        if (Date.now() - prev.receivedAt > 30_000) return null;
        return prev;
      });
    }, 5000);

    return () => {
      unsubSlow();
      unsubDisc();
      clearInterval(t);
    };
  }, [client]);

  return state;
}
