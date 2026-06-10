/**
 * File:        apps/web/lib/prana-stream/prana-provider-client.tsx
 * Module:      web/prana-stream
 * Purpose:     Client-side PranaProvider that reads the access token from
 *              AuthContext and passes it to the underlying PranaProvider.
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-10
 */

'use client';

import type { ReactNode } from 'react';
import { useAuth } from '@/shared/providers/auth-provider';
import { PranaProvider } from './prana-provider';

export function PranaProviderClient({
  children,
}: {
  children: ReactNode;
}): React.ReactElement {
  const { accessToken } = useAuth();
  return (
    <PranaProvider accessToken={accessToken}>{children}</PranaProvider>
  );
}