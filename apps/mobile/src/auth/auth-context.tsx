/**
 * File:        apps/mobile/src/auth/auth-context.tsx
 * Module:      mobile · Auth
 * Purpose:     React context that holds the current session — the decoded
 *              principal, the access token (synchronously available), and a
 *              login/logout API. The provider is mounted once at the root of
 *              the navigation tree; downstream screens call `useAuth()` to
 *              read session state and `signIn(...)` / `signOut()` to mutate.
 *
 * Exports:
 *   - AuthProvider                    — wraps the navigation tree
 *   - useAuth() → AuthContextValue    — read session + login/logout
 *   - AuthContextValue                — type
 *
 * Depends on:
 *   - react                              — createContext, useContext, useState
 *   - @obsidian/mobile-auth              — MobileSessionPrincipal contract
 *   - ./secure-store                     — token persistence (secure store)
 *
 * Side-effects:
 *   - Reads/writes tokens in `expo-secure-store` on login/logout.
 *   - Primes the in-memory access token cache for the Apollo auth link.
 *
 * Key invariants:
 *   - `useAuth()` MUST be called from inside <AuthProvider>. Calling it
 *     outside throws — components should not have to defend against a
 *     missing provider.
 *   - The session state is `undefined` while the boot-time hydration runs.
 *     Render a Splash screen during that window — DO NOT render the app
 *     shell with a phantom `null` session.
 *   - `signIn()` writes tokens to secure store AND primes the sync cache
 *     so the very next Apollo operation sees the new Authorization header.
 *   - `signOut()` wipes the keychain AND the in-memory cache. After
 *     signOut, the next `useAuth().status` is `'unauthenticated'`.
 *
 * Read order:
 *   1. AuthContextValue  — the public shape
 *   2. AuthProvider      — the provider component
 *   3. useAuth           — the consumer hook
 *
 * Author:       BharatERP
 * Last-updated: 2026-06-03
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { MobileSessionPrincipal } from '@obsidian/mobile-auth';
import {
  clearTokens,
  loadTokens,
  primeAccessTokenCache,
  storeTokens,
  type StoredTokens,
} from './secure-store';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export type AuthContextValue = {
  status: AuthStatus;
  principal: MobileSessionPrincipal | null;
  accessToken: string | null;
  signIn: (tokens: StoredTokens) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [principal, setPrincipal] = useState<MobileSessionPrincipal | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Boot-time hydration: read the keychain and prime the sync cache.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await primeAccessTokenCache();
      const stored = await loadTokens();
      if (cancelled) return;
      if (stored) {
        setPrincipal(stored.principal);
        setAccessToken(stored.accessToken);
        setStatus('authenticated');
      } else {
        setPrincipal(null);
        setAccessToken(token);
        setStatus('unauthenticated');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (tokens: StoredTokens) => {
    await storeTokens(tokens);
    setPrincipal(tokens.principal);
    setAccessToken(tokens.accessToken);
    setStatus('authenticated');
  }, []);

  const signOut = useCallback(async () => {
    await clearTokens();
    setPrincipal(null);
    setAccessToken(null);
    setStatus('unauthenticated');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, principal, accessToken, signIn, signOut }),
    [status, principal, accessToken, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('[auth] useAuth() must be called inside <AuthProvider>');
  }
  return ctx;
}
