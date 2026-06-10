/**
 * File:        apps/web/lib/prana-stream/hooks/use-position-updates.ts
 * Module:      web/prana-stream/hooks
 * Purpose:     Subscribe to live position updates from PranaStream.
 *              Returns a Map keyed by "accountId:instrumentId" → PositionUpdatePayload.
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-10
 */

'use client';

import { useEffect, useState } from 'react';
import { usePranaStream } from '../prana-provider';
import type { PositionUpdatePayload, RealtimeEvent } from '../types';

const positionKey = (p: { accountId: string; instrumentId: string }) =>
  `${p.accountId}:${p.instrumentId}`;

export function usePositionUpdates(): Map<string, PositionUpdatePayload> {
  const { client, isReady } = usePranaStream();
  const [positions, setPositions] = useState<Map<string, PositionUpdatePayload>>(new Map());

  useEffect(() => {
    if (!isReady) return;
    client.subscribe({ positions: true });

    const unsub = client.on<RealtimeEvent<PositionUpdatePayload>>('position.updated', (event) => {
      setPositions((prev) => {
        const next = new Map(prev);
        next.set(positionKey(event.data), event.data);
        return next;
      });
    });

    return () => {
      unsub();
      client.unsubscribe({ positions: true });
    };
  }, [isReady, client]);

  return positions;
}
