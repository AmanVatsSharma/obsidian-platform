/**
 * File:        apps/web/app/(auth)/login/page.tsx
 * Module:      web · Auth · Login Page
 * Purpose:     Two-step OTP login for traders. Resolves tenant from x-tenant-id header
 *              (set by subdomain middleware on the backend); uses Obsidian shared auth UI.
 *
 * Exports:
 *   - LoginPage() — client component; mobile → OTP → authenticated redirect
 *
 * Depends on:
 *   - @/shared/providers/auth-provider — useAuth().requestOtp / verifyOtp
 *   - @obsidian/web-auth               — AuthShell, FormCard, TextInput, PrimaryButton
 *
 * Side-effects:
 *   - POST /auth/otp/request and /auth/otp/verify via AuthProvider
 *
 * Key invariants:
 *   - 'use client' — OTP state, digit refs, router navigation
 *   - tenantId is passed directly from env (NEXT_PUBLIC_TENANT_ID) or defaults to 'web'
 *   - On success, AuthProvider stores the access token; page redirects to /dashboard
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-09
 */

'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/shared/providers/auth-provider';
import { AuthShell, FormCard, TextInput, PrimaryButton, FieldLabel, AuthIcons } from '@obsidian/web-auth';

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? 'web';

export default function LoginPage() {
  const router = useRouter();
  const { requestOtp, verifyOtp } = useAuth();

  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);

  function handleDigit(i: number, v: string) {
    const c = v.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = c;
    setDigits(next);
    setOtp(next.join(''));
    if (c && i < 5) otpRefs.current[i + 1]?.focus();
  }

  function handleDigitKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) otpRefs.current[i - 1]?.focus();
  }

  function handleDigitPaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setDigits(text.split(''));
      setOtp(text);
      otpRefs.current[5]?.focus();
    }
    e.preventDefault();
  }

  async function handleRequestOtp() {
    setError('');
    setLoading(true);
    try {
      await requestOtp(TENANT_ID, mobile.trim());
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    setError('');
    setLoading(true);
    try {
      await verifyOtp({ tenantId: TENANT_ID, mobileE164: mobile.trim(), otp: otp.trim() });
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'mobile') {
    return (
      <AuthShell heroVariant="default">
        <FormCard
          title="Sign in to Obsidian"
          subtitle="Enter your registered mobile number. We'll send a one-time passcode."
          footer={
            <div style={{
              fontFamily: 'var(--font-data)', fontSize: 9, fontWeight: 600,
              letterSpacing: '0.08em', color: 'var(--fg3)', textTransform: 'uppercase', textAlign: 'center',
            }}>
              OBSIDIAN MARKETS · SECURE LOGIN · FCA 789021
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <FieldLabel>Mobile number (E.164)</FieldLabel>
              <TextInput
                value={mobile}
                onChange={setMobile}
                type="tel"
                placeholder="+919999999999"
                icon={AuthIcons.phone}
                autoFocus
              />
            </div>

            {error && (
              <div style={{
                padding: '10px 14px', background: 'var(--bear-dim)',
                border: '1px solid rgba(255,59,92,0.25)', borderRadius: 'var(--r-md)',
                fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--bear)',
              }}>{error}</div>
            )}

            <PrimaryButton onClick={handleRequestOtp} disabled={loading || !mobile.trim()}>
              {loading ? 'Sending…' : <>Request OTP {AuthIcons.arrowRight}</>}
            </PrimaryButton>
          </div>
        </FormCard>
      </AuthShell>
    );
  }

  return (
    <AuthShell heroVariant="default">
      <FormCard
        back={
          <span
            onClick={() => { setStep('mobile'); setDigits(['', '', '', '', '', '']); setOtp(''); setError(''); }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
              fontFamily: 'var(--font-data)', fontSize: 10, fontWeight: 600,
              letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg2)',
            }}
          >
            {AuthIcons.arrowLeft} Change number
          </span>
        }
        title="Enter your OTP"
        subtitle={
          <>
            We sent a 6-digit code to{' '}
            <span style={{ color: 'var(--fg1)', fontFamily: 'var(--font-data)' }}>{mobile}</span>.
            Code expires in 10 minutes.
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <FieldLabel>One-time passcode</FieldLabel>
            <div style={{ display: 'flex', gap: 10 }} onPaste={handleDigitPaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={el => { otpRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  autoFocus={i === 0}
                  onChange={e => handleDigit(i, e.target.value)}
                  onKeyDown={e => handleDigitKeyDown(i, e)}
                  style={{
                    flex: 1, height: 64, borderRadius: 'var(--r-md)',
                    background: d ? 'var(--bg-panel)' : 'var(--bg-elevated)',
                    border: `1px solid ${!d && i === digits.findIndex(x => !x) ? 'var(--accent)' : d ? 'var(--border-md)' : 'var(--border)'}`,
                    boxShadow: (!d && i === digits.findIndex(x => !x)) ? '0 0 0 3px rgba(59,130,246,0.15)' : 'none',
                    textAlign: 'center',
                    fontFamily: 'var(--font-data)', fontSize: 28, fontWeight: 600,
                    color: 'var(--fg1)', outline: 'none',
                  }}
                />
              ))}
            </div>
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', background: 'var(--bear-dim)',
              border: '1px solid rgba(255,59,92,0.25)', borderRadius: 'var(--r-md)',
              fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--bear)',
            }}>{error}</div>
          )}

          <PrimaryButton onClick={handleVerifyOtp} disabled={loading || otp.length < 6}>
            {loading ? 'Verifying…' : <>Verify & enter terminal {AuthIcons.arrowRight}</>}
          </PrimaryButton>

          <div style={{
            padding: '10px 14px', background: 'var(--bg-panel)',
            border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
            display: 'flex', alignItems: 'center', gap: 12,
            fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--fg2)',
          }}>
            <span style={{ color: 'var(--warn)', display: 'flex' }}>{AuthIcons.info}</span>
            <span>OTP valid for 10 minutes</span>
            <span style={{ marginLeft: 'auto' }}>
              <span
                onClick={() => requestOtp(TENANT_ID, mobile.trim())}
                style={{
                  color: 'var(--accent)', cursor: 'pointer',
                  letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: 9, fontWeight: 600,
                }}
              >
                RESEND
              </span>
            </span>
          </div>
        </div>
      </FormCard>
    </AuthShell>
  );
}
