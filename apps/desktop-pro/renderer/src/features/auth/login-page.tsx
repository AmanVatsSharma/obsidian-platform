/**
 * File:        apps/desktop-pro/renderer/src/features/auth/login-page.tsx
 * Module:      desktop-pro · Renderer · Auth · Login Page
 * Purpose:     OTP login flow for the desktop app — stores the received JWT in safeStorage
 *              via ntBridge.auth.setToken, then redirects to /workstation.
 *
 * Exports:
 *   - LoginPage → ReactNode
 *
 * Depends on:
 *   - react-router-dom — useNavigate
 *   - ../../shared/bridge/use-auth-store — setToken
 *
 * Side-effects:
 *   - POST /api/v1/auth/otp/request — triggers OTP send
 *   - POST /api/v1/auth/otp/verify — exchanges OTP for JWT
 *   - Calls ntBridge.auth.setToken to persist token in OS keychain
 *
 * Key invariants:
 *   - Token is NEVER written to localStorage — safeStorage only
 *   - On success, navigate('/workstation') renders the auth-guarded route
 *
 * Read order:
 *   1. LoginPage — form state + submit handlers
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../shared/bridge/use-auth-store';

type Step = 'phone' | 'otp';

export function LoginPage() {
  const navigate = useNavigate();
  const setToken = useAuthStore((s: { setToken: (t: string) => Promise<void> }) => s.setToken);

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const apiBase = window.__NESTTRADE_API_BASE__ ?? 'http://localhost:3000';

  const requestOtp = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${apiBase}/api/v1/auth/otp/request`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      if (!res.ok) throw new Error('Failed to send OTP');
      setStep('otp');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${apiBase}/api/v1/auth/otp/verify`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });
      if (!res.ok) throw new Error('Invalid OTP');
      const { accessToken } = (await res.json()) as { accessToken: string };
      await setToken(accessToken);
      navigate('/workstation');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-card">
        <div className="login-logo">
          <span className="topbar-logo-dot" />
          NESTTRADE PRO
        </div>

        {step === 'phone' ? (
          <div className="login-form">
            <label className="login-label">Mobile number</label>
            <input
              className="nt-input"
              type="tel"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void requestOtp()}
            />
            <button
              className="nt-btn-primary"
              onClick={() => void requestOtp()}
              disabled={loading || !phone.trim()}
            >
              {loading ? 'Sending…' : 'Send OTP'}
            </button>
          </div>
        ) : (
          <div className="login-form">
            <label className="login-label">Enter OTP sent to {phone}</label>
            <input
              className="nt-input nt-input-otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="------"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void verifyOtp()}
              autoFocus
            />
            <button
              className="nt-btn-primary"
              onClick={() => void verifyOtp()}
              disabled={loading || otp.length < 6}
            >
              {loading ? 'Verifying…' : 'Sign In'}
            </button>
            <button className="nt-btn-ghost" onClick={() => setStep('phone')}>
              Change number
            </button>
          </div>
        )}

        {error && <p className="login-error">{error}</p>}
      </div>
    </div>
  );
}
