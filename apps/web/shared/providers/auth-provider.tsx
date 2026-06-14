"use client";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

type AuthContextValue = {
  accessToken: string | null;
  tokenId: string | null;
  requestOtp: (tenantId: string, mobileE164: string) => Promise<void>;
  verifyOtp: (payload: { tenantId: string; mobileE164: string; otp: string; totpCode?: string; deviceInfo?: string }) => Promise<void>;
  devLogin: (tenantId: string, mobileE164: string) => Promise<void>;
  refresh: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const REFRESH_COOKIE_NAME = process.env.NEXT_PUBLIC_REFRESH_COOKIE_NAME || 'rt';
const CSRF_HEADER_NAME = (process.env.NEXT_PUBLIC_CSRF_HEADER_NAME || 'x-csrf-token').toLowerCase();
const CSRF_COOKIE_NAME = process.env.NEXT_PUBLIC_CSRF_COOKIE_NAME || 'csrf';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [tokenId, setTokenId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem('tokenId');
    } catch {
      return null;
    }
  });
  const refreshingRef = useRef<Promise<void> | null>(null);

  const apiFetch = useCallback(async (path: string, init?: RequestInit) => {
    const csrf = getCookie(CSRF_COOKIE_NAME) || '';
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      'x-tenant-id': 'acme',
      [CSRF_HEADER_NAME]: csrf,
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      ...(init?.headers as Record<string, string> || {}),
    };
    const res = await fetch(path, { ...init, headers, credentials: 'include' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }, [accessToken]);

  const requestOtp = useCallback(async (tenantId: string, mobileE164: string) => {
    await apiFetch('/auth/otp/request', { method: 'POST', body: JSON.stringify({ tenantId, mobileE164 }) });
  }, [apiFetch]);

  const verifyOtp = useCallback(async (payload: { tenantId: string; mobileE164: string; otp: string; totpCode?: string; deviceInfo?: string }) => {
    const data = await apiFetch('/auth/otp/verify', { method: 'POST', body: JSON.stringify(payload) });
    const at = data.accessToken || null;
    const tid = data.tokenId || null;
    setAccessToken(at);
    setTokenId(tid);
    try {
      if (tid) localStorage.setItem('tokenId', tid);
    } catch {}
  }, [apiFetch]);

  const devLogin = useCallback(async (tenantId: string, mobileE164: string) => {
    // DEV ONLY: one-tap sign-in that bypasses the OTP step. Backend will reject
    // in production via NODE_ENV check, so this is safe to leave in the client.
    // The password is configured via NEXT_PUBLIC_DEV_LOGIN_PASSWORD, never bundled.
    // If unset, in dev mode, fall back to an interactive Node prompt.
    const getPassword = async (): Promise<string> => {
      const env = process.env.NEXT_PUBLIC_DEV_LOGIN_PASSWORD;
      if (env) return env;
      if (process.env.NODE_ENV === 'development' && typeof window === 'undefined') {
        // Lazy import so the client bundle never pulls in Node built-ins
        // (readline, fs). See apps/web/shared/providers/auth-dev-prompt.ts.
        const { promptDevPassword } = await import('./auth-dev-prompt');
        return promptDevPassword();
      }
      throw new Error('DEV_LOGIN_PASSWORD must be set in production builds');
    };
    const password = await getPassword();
    const data = await apiFetch('/auth/dev/login', {
      method: 'POST',
      headers: { 'x-tenant-id': tenantId },
      body: JSON.stringify({ tenantId, mobileE164, password }),
    });
    const at = data.accessToken || null;
    const tid = data.tokenId || null;
    setAccessToken(at);
    setTokenId(tid);
    try {
      if (tid) localStorage.setItem('tokenId', tid);
    } catch {}
  }, [apiFetch]);

  const doRefresh = useCallback(async () => {
    if (!tokenId) return;
    const p = (async () => {
      const data = await apiFetch('/auth/refresh', { method: 'POST', body: JSON.stringify({ tokenId }) });
      if (data?.accessToken) setAccessToken(data.accessToken);
      if (data?.tokenId) {
        setTokenId(data.tokenId);
        try { localStorage.setItem('tokenId', data.tokenId); } catch {}
      }
    })();
    refreshingRef.current = p;
    await p.finally(() => { refreshingRef.current = null; });
  }, [apiFetch, tokenId]);

  const refresh = useCallback(async () => {
    if (refreshingRef.current) return refreshingRef.current;
    return doRefresh();
  }, [doRefresh]);

  const logout = useCallback(() => {
    setAccessToken(null);
    setTokenId(null);
    try { localStorage.removeItem('tokenId'); } catch {}
  }, []);

  useEffect(() => {
    // Attempt refresh on mount if cookies exist
    if (getCookie(REFRESH_COOKIE_NAME) && getCookie(CSRF_COOKIE_NAME) && tokenId) {
      void refresh();
    }
    // refresh on window focus
    const onFocus = () => {
      if (getCookie(REFRESH_COOKIE_NAME) && getCookie(CSRF_COOKIE_NAME) && tokenId) {
        void refresh();
      }
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refresh, tokenId]);

  const value: AuthContextValue = useMemo(() => ({ accessToken, tokenId, requestOtp, verifyOtp, devLogin, refresh, logout }), [accessToken, tokenId, requestOtp, verifyOtp, devLogin, refresh, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}


