/**
 * File:        apps/web/lib/prana-stream/prana-provider.tsx
 * Module:      web/prana-stream
 * Purpose:     React context and provider for PranaStream realtime connection.
 *              Wraps the socket client in a useEffect and exposes it via usePranaStream.
 *
 * Exports:
 *   - PranaProvider      — wraps the app, connects on auth ready
 *   - usePranaStream  — hook to access the client
 *
 * Depends on:
 *   - socket-client  — PranaStreamClient singleton
 *   - jwt-decode     — extract tenantId + userId from access token
 *
 * Side-effects:
 *   - Connects to WS when access token is present
 *   - Disconnects on unmount or auth change
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-10
 */

'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getPranaClient, type PranaStreamClient } from './socket-client';
import { decodeJwtClaims } from './jwt-decode';
import type { ConnectionStatus } from './types';

type PranaContextValue = {
  client: PranaStreamClient;
  status: ConnectionStatus;
  isReady: boolean;
};

const PranaContext = createContext<PranaContextValue | null>(null);

interface PranaProviderProps {
  children: ReactNode;
  accessToken: string | null;
}

export function PranaProvider({
  children,
  accessToken,
}: PranaProviderProps): React.ReactElement {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const client = useMemo(() => getPranaClient(), []);

  // Decode tenantId + userId from the JWT
  const claims = useMemo(() => {
    if (!accessToken) return null;
    return decodeJwtClaims(accessToken);
  }, [accessToken]);

  const isReady = status === 'connected' && claims !== null;

  // Connect / disconnect on auth change
  useEffect(() => {
    if (!accessToken || !claims) {
      client.disconnect();
      setStatus('disconnected');
      return;
    }

    client.connect({
      token: accessToken,
      tenantId: claims.tid,
      userId: claims.sub,
    });

    const unsub = client.onStatusChange((s) => setStatus(s));
    return () => {
      unsub();
    };
  }, [accessToken, claims, client]);

  return (
    <PranaContext.Provider value={{ client, status, isReady }}>
      {children}
    </PranaContext.Provider>
  );
}

export function usePranaStream(): PranaContextValue {
  const ctx = useContext(PranaContext);
  if (!ctx) {
    return {
      client: getPranaClient(),
      status: 'disconnected',
      isReady: false,
    };
  }
  return ctx;
}