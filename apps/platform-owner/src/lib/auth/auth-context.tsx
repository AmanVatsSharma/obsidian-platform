/**
 * File:        apps/platform-owner/src/lib/auth/auth-context.tsx
 * Module:      platform-owner · Auth Context
 * Purpose:     React context holding Platform Owner session state.
 *              Persists access token in sessionStorage (tab-scoped; safe for PO tooling).
 *
 * Exports:
 *   - AuthProvider({ children })  — wraps app with auth state
 *   - useAuth()                   — returns AuthContextValue
 *   - AuthContextValue            — { user, accessToken, isAuthenticated, login, logout }
 *
 * Key invariants:
 *   - accessToken stored in sessionStorage under 'po_access_token'.
 *   - user = { userId, mobile } decoded from token payload on login.
 *   - Refresh token is httpOnly cookie (set by backend) — not accessible here.
 *     v1 accepts re-login on access token expiry (15 min). Rotation is Phase 2.
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-09
 */

'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export interface AuthUser {
  userId: string;
  mobile?: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (accessToken: string, mobile: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

function decodeUserId(token: string): string | null {
  try {
    const [, payload] = token.split('.');
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded?.sub ?? null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('po_access_token');
    if (stored) {
      const userId = decodeUserId(stored);
      setAccessToken(stored);
      if (userId) setUser({ userId });
    }
  }, []);

  const login = useCallback((token: string, mobile: string) => {
    sessionStorage.setItem('po_access_token', token);
    const userId = decodeUserId(token) ?? '';
    setAccessToken(token);
    setUser({ userId, mobile });
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('po_access_token');
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, accessToken, isAuthenticated: !!accessToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
