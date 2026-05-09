/**
 * File:        apps/broker-admin/src/app/login/page.tsx
 * Module:      broker-admin · Login Page
 * Purpose:     Two-step OTP login for broker admins. Resolves the tenant code from
 *              TenantContext, fetches brand config for custom branding, then guides
 *              the user through mobile → OTP → authenticated shell.
 *
 * Exports:
 *   - LoginPage() — client component
 *
 * Depends on:
 *   - ../../lib/tenant/tenant-context  — useTenant() for broker code
 *   - ../../lib/auth/auth-context      — useAuth() login()
 *
 * Side-effects:
 *   - Calls POST /auth/otp/request and POST /auth/otp/verify on the backend
 *   - Calls GET /tenancy/brand-config?slug={tenantCode} (public, no auth required)
 *
 * Key invariants:
 *   - 'use client' — OTP flow, state, router navigation
 *   - If brand config fetch fails (network down / tenant not found), silently falls back to defaults
 *   - Successful OTP verify stores token via auth-context and redirects to /dashboard
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-09
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldCheck, ArrowRight } from 'lucide-react';
import { useTenant } from '../../lib/tenant/tenant-context';
import { useAuth } from '../../lib/auth/auth-context';

interface BrandConfig {
  appName?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
}

async function fetchBrandConfig(tenantCode: string): Promise<BrandConfig> {
  try {
    const res = await fetch(`/api/tenancy/brand-config?slug=${encodeURIComponent(tenantCode)}`);
    if (!res.ok) return {};
    return res.json();
  } catch {
    return {};
  }
}

async function requestOtp(tenantCode: string, mobile: string): Promise<void> {
  const res = await fetch('/api/auth/otp/request', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-tenant-id': tenantCode },
    body: JSON.stringify({ tenantId: tenantCode, mobileE164: mobile }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `HTTP ${res.status}`);
  }
}

async function verifyOtp(
  tenantCode: string,
  mobile: string,
  otp: string,
): Promise<{ accessToken: string }> {
  const res = await fetch('/api/auth/otp/verify', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-tenant-id': tenantCode },
    credentials: 'include',
    body: JSON.stringify({ tenantId: tenantCode, mobileE164: mobile, otp }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export default function LoginPage() {
  const { tenantCode } = useTenant();
  const { isAuthenticated, login } = useAuth();
  const router = useRouter();

  const [brand, setBrand] = useState<BrandConfig>({});
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, router]);

  // Fetch brand config once tenantCode resolves
  useEffect(() => {
    if (tenantCode) {
      fetchBrandConfig(tenantCode).then(setBrand);
    }
  }, [tenantCode]);

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!tenantCode) { setError('Tenant not resolved — check the URL'); return; }
    setError('');
    setLoading(true);
    try {
      await requestOtp(tenantCode, mobile.trim());
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!tenantCode) { setError('Tenant not resolved'); return; }
    setError('');
    setLoading(true);
    try {
      const { accessToken } = await verifyOtp(tenantCode, mobile.trim(), otp.trim());
      login(accessToken, mobile.trim());
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  }

  const brokerName = brand.appName ?? (tenantCode
    ? tenantCode.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : 'Obsidian');

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-base)] p-4">
      <div className="w-full max-w-sm">
        {/* Brand header */}
        <div className="mb-8 text-center">
          {brand.logoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={brand.logoUrl} alt={brokerName} className="mx-auto mb-4 h-10 object-contain" />
          ) : (
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
              <ShieldCheck size={20} className="text-white" />
            </div>
          )}
          <h1 className="font-display text-[20px] font-bold uppercase tracking-[0.08em] text-fg1">
            {brokerName}
          </h1>
          <p className="mt-1 font-ui text-[12px] text-fg3">Admin Portal</p>
        </div>

        {/* Login panel */}
        <div className="rounded-lg border border-[var(--border-md)] bg-[var(--bg-panel)] p-6">
          <p className="mb-4 font-display text-[10px] uppercase tracking-[0.12em] text-fg3">
            {step === 'mobile' ? 'Sign In' : 'Enter OTP'}
          </p>

          {step === 'mobile' ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label htmlFor="mobile" className="block font-display text-[10px] uppercase tracking-[0.1em] text-fg3 mb-1.5">
                  Mobile Number
                </label>
                <input
                  id="mobile"
                  type="tel"
                  value={mobile}
                  onChange={e => setMobile(e.target.value)}
                  placeholder="+919999999999"
                  pattern="^\+[1-9]\d{1,14}$"
                  title="E.164 format — e.g. +919999999999"
                  required
                  autoFocus
                  className="w-full rounded border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2.5 font-mono text-[13px] text-fg1 placeholder-fg3 focus:border-[var(--border-hi)] focus:outline-none transition-colors"
                />
              </div>

              {error && (
                <p className="rounded bg-[var(--bear-dim,#FF3B5C1A)] px-3 py-2 font-mono text-[11px] text-[var(--bear)]">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded bg-accent px-4 py-2.5 font-display text-[11px] font-bold uppercase tracking-[0.08em] text-white hover:bg-accent/90 transition-colors disabled:opacity-60"
              >
                {loading ? <Loader2 size={13} className="animate-spin" /> : <ArrowRight size={13} />}
                SEND OTP
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-ui text-[11px] text-fg3">OTP sent to {mobile}</span>
                  <button
                    type="button"
                    onClick={() => { setStep('mobile'); setOtp(''); setError(''); }}
                    className="font-mono text-[10px] text-accent hover:underline"
                  >
                    Change
                  </button>
                </div>
                <label htmlFor="otp" className="block font-display text-[10px] uppercase tracking-[0.1em] text-fg3 mb-1.5">
                  One-Time Password
                </label>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  required
                  autoFocus
                  className="w-full rounded border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2.5 font-mono text-[18px] tracking-[0.5em] text-fg1 placeholder-fg3 focus:border-[var(--border-hi)] focus:outline-none transition-colors text-center"
                />
              </div>

              {error && (
                <p className="rounded bg-[var(--bear-dim,#FF3B5C1A)] px-3 py-2 font-mono text-[11px] text-[var(--bear)]">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || otp.length < 4}
                className="flex w-full items-center justify-center gap-2 rounded bg-accent px-4 py-2.5 font-display text-[11px] font-bold uppercase tracking-[0.08em] text-white hover:bg-accent/90 transition-colors disabled:opacity-60"
              >
                {loading ? <Loader2 size={13} className="animate-spin" /> : null}
                VERIFY & SIGN IN
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center font-mono text-[10px] text-fg3">
          {tenantCode ? `Tenant: ${tenantCode}` : 'Resolving tenant…'}
        </p>
      </div>
    </div>
  );
}
