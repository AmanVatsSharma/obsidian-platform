/**
 * File:        apps/platform-owner/src/app/login/page.tsx
 * Module:      platform-owner · Login Page
 * Purpose:     Two-step OTP login for the Platform Owner. Step 1: mobile input.
 *              Step 2: OTP input. On success, stores token and redirects to /dashboard.
 *
 * Exports:
 *   - LoginPage()  — client component; full-screen centered form
 *
 * Depends on:
 *   - ../../../lib/api/endpoints  — api.requestOtp, api.verifyOtp
 *   - ../../../lib/auth/auth-context  — useAuth().login
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-09
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@obsidian/obsidian-ui';
import { Loader2 } from 'lucide-react';
import { api as endpoints } from '../../lib/api/endpoints';
import { useAuth } from '../../lib/auth/auth-context';

type Step = 'mobile' | 'otp';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [step, setStep] = useState<Step>('mobile');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleMobileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await endpoints.requestOtp(mobile);
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await endpoints.verifyOtp(mobile, otp);
      login(res.accessToken, mobile);
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-base)] px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="mb-8 text-center">
          <p className="font-display text-[11px] uppercase tracking-[0.12em] text-fg3">
            Obsidian Platform
          </p>
          <h1 className="mt-1 font-display text-[22px] font-bold uppercase tracking-[0.06em] text-fg1">
            Control Plane
          </h1>
        </div>

        {/* Card */}
        <div className="rounded-r-lg border border-[var(--border)] bg-[var(--bg-panel)] p-6">
          {step === 'mobile' ? (
            <form onSubmit={handleMobileSubmit} className="space-y-4">
              <div>
                <label className="block font-display text-[10px] uppercase tracking-[0.1em] text-fg3 mb-1.5">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="+919999999999"
                  required
                  className={cn(
                    'w-full rounded-r-md border border-[var(--border)] bg-[var(--bg-elevated)]',
                    'px-3 py-2 font-mono text-[13px] text-fg1 placeholder-fg3',
                    'focus:border-[var(--border-hi)] focus:outline-none transition-colors',
                  )}
                />
              </div>

              {error && (
                <p className="rounded bg-[var(--bear-dim,#FF3B5C1A)] px-3 py-2 font-mono text-[12px] text-[var(--bear)]">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className={cn(
                  'flex w-full items-center justify-center gap-2',
                  'rounded-r-md bg-accent px-4 py-2.5',
                  'font-display text-[11px] font-bold uppercase tracking-[0.08em] text-white',
                  'hover:bg-accent/90 transition-colors disabled:opacity-60',
                )}
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                REQUEST OTP
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div>
                <label className="block font-display text-[10px] uppercase tracking-[0.1em] text-fg3 mb-1.5">
                  OTP Code
                </label>
                <p className="mb-2 font-mono text-[11px] text-fg3">
                  Sent to {mobile}
                </p>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  maxLength={6}
                  required
                  autoFocus
                  className={cn(
                    'w-full rounded-r-md border border-[var(--border)] bg-[var(--bg-elevated)]',
                    'px-3 py-2 font-mono text-[18px] tracking-[0.3em] text-fg1 placeholder-fg3',
                    'focus:border-[var(--border-hi)] focus:outline-none transition-colors text-center',
                  )}
                />
              </div>

              {error && (
                <p className="rounded bg-[var(--bear-dim,#FF3B5C1A)] px-3 py-2 font-mono text-[12px] text-[var(--bear)]">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className={cn(
                  'flex w-full items-center justify-center gap-2',
                  'rounded-r-md bg-accent px-4 py-2.5',
                  'font-display text-[11px] font-bold uppercase tracking-[0.08em] text-white',
                  'hover:bg-accent/90 transition-colors disabled:opacity-60',
                )}
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                VERIFY &amp; LOGIN
              </button>

              <button
                type="button"
                onClick={() => { setStep('mobile'); setError(null); setOtp(''); }}
                className="w-full font-mono text-[11px] text-fg3 hover:text-fg2 transition-colors"
              >
                Change number
              </button>
            </form>
          )}
        </div>

        <p className="mt-4 text-center font-mono text-[10px] text-fg3">
          Platform Owner access only
        </p>
      </div>
    </div>
  );
}
