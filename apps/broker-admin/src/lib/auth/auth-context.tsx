/**
 * File:        apps/broker-admin/src/lib/auth/auth-context.tsx
 * Module:      broker-admin · Auth Context
 * Purpose:     Stores the broker admin JWT + user identity in sessionStorage and
 *              exposes login/logout to the rest of the app. Tenant identity comes
 *              separately from TenantContext. A mirror cookie (`ba_session`) is
 *              written on login so `apps/broker-admin/middleware.ts` can gate
 *              requests at the edge — the cookie is *presence-only*; the backend
 *              re-validates the JWT on every API call.
 *
 *              The JWT payload is decoded on hydration to extract `brokerId` and
 *              `tenantId` (claims `bid` and `tid`). Pages that previously used
 *              hard-coded `'default'` strings should now read these from
 *              `useAuth()`.
 *
 * Exports:
 *   - AuthProvider({ children }) — wraps the app; hydrates from sessionStorage on mount
 *   - useAuth()                  — returns { user, accessToken, brokerId, tenantId,
 *                                       isAuthenticated, login, logout }
 *
 * Side-effects:
 *   - Reads and writes 'ba_access_token', 'ba_user_mobile' from sessionStorage
 *   - Writes and clears the 'ba_session' cookie (Path=/; SameSite=Lax) on login/logout
 *
 * Key invariants:
 *   - 'use client' — sessionStorage is unavailable during SSR
 *   - isAuthenticated is false until hydration completes (prevents SSR flash)
 *   - brokerId / tenantId are empty strings until hydration — consumers must
 *     guard with `isAuthenticated && brokerId` before firing API calls
 *   - Token storage: access token in sessionStorage (primary) + presence cookie
 *     (mirror for edge middleware). Cookie is NOT httpOnly by design — the
 *     client must be able to clear it on logout without a server roundtrip.
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-12
 */

'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

interface AuthUser {
  userId: string;
  mobile: string;
  brokerId: string;
  tenantId: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  brokerId: string;
  tenantId: string;
  isAuthenticated: boolean;
  login: (token: string, mobile: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_COOKIE = 'ba_session';

function setSessionCookie(token: string) {
  // 12h — matches typical Obsidian access-token TTL.
  // SameSite=Lax allows top-level navigation. We do NOT set Secure here because
  // dev runs on http://localhost; production should set Secure via a server route.
  const maxAge = 60 * 60 * 12;
  document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

function clearSessionCookie() {
  document.cookie = `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

interface JwtPayload {
  sub?: string;
  bid?: string;
  tid?: string;
  [key: string]: unknown;
}

function decodeJwt(token: string): JwtPayload {
  try {
    return JSON.parse(atob(token.split('.')[1])) as JwtPayload;
  } catch {
    return {};
  }
}

function readUserFromToken(token: string, mobile: string): AuthUser {
  const payload = decodeJwt(token);
  return {
    userId: payload.sub ?? '',
    mobile,
    brokerId: payload.bid ?? '',
    tenantId: payload.tid ?? '',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem('ba_access_token');
    const mobile = sessionStorage.getItem('ba_user_mobile');
    if (token && mobile) {
      setAccessToken(token);
      setUser(readUserFromToken(token, mobile));
    }
    setHydrated(true);
  }, []);

  const login = useCallback((token: string, mobile: string) => {
    sessionStorage.setItem('ba_access_token', token);
    sessionStorage.setItem('ba_user_mobile', mobile);
    setSessionCookie(token);
    setAccessToken(token);
    setUser(readUserFromToken(token, mobile));
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('ba_access_token');
    sessionStorage.removeItem('ba_user_mobile');
    sessionStorage.removeItem('ba_tenant_code');
    clearSessionCookie();
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        brokerId: user?.brokerId ?? '',
        tenantId: user?.tenantId ?? '',
        isAuthenticated: hydrated && !!accessToken,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
