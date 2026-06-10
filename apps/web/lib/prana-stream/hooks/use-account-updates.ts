/**
 * File:        apps/web/lib/prana-stream/hooks/use-account-updates.ts
 * Module:      web/prana-stream/hooks
 * Purpose:     Subscribe to live account balance updates from PranaStream.
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-10
 */

'use client';

import { useEffect, useState } from 'react';
import { usePranaStream } from '../prana-provider';
import type { AccountUpdatePayload, RealtimeEvent } from '../types';

export function useAccountUpdates(): Map<string, AccountUpdatePayload> {
  const { client, isReady } = usePranaStream();
  const [accounts, setAccounts] = useState<Map<string, AccountUpdatePayload>>(new Map());

  useEffect(() => {
    if (!isReady) return;
    client.subscribe({ accounts: true });

    const unsub = client.on<RealtimeEvent<AccountUpdatePayload>>('account.updated', (event) => {
      setAccounts((prev) => {
        const next = new Map(prev);
        next.set(event.data.accountId, event.data);
        return next;
      });
    });

    return () => {
      unsub();
      client.unsubscribe({ accounts: true });
    };
  }, [isReady, client]);

  return accounts;
}