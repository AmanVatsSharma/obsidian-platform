/**
 * File:        apps/platform-owner/src/app/login/page.tsx
 * Module:      platform-owner · Login Page
 * Purpose:     Two-step OTP login for the Platform Owner. Uses the Obsidian shared
 *              auth UI (AuthShell + FormCard + MarketHero) with platform variant.
 *
 * Exports:
 *   - LoginPage()  — client component; Obsidian split-layout form
 *
 * Depends on:
 *   - ../../lib/api/endpoints     — api.requestOtp, api.verifyOtp
 *   - ../../lib/auth/auth-context — useAuth().login
 *   - @obsidian/web-auth          — AuthShell, FormCard, TextInput, PrimaryButton
 *
 * Side-effects:
 *   - POST /api/auth/otp/request and /api/auth/otp/verify with x-tenant-id: 'platform'
 *
 * Key invariants:
 *   - tenantId is always 'platform' for this app (no subdomain resolution needed)
 *   - heroVariant='platform' uses tailored hero copy for the control-plane context
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-09
 */

'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api as endpoints } from '../../lib/api/endpoints';
import { useAuth } from '../../lib/auth/auth-context';
import { AuthShell, FormCard, TextInput, PrimaryButton, FieldLabel, AuthIcons } from '@obsidian/web-auth';

type Step = 'mobile' | 'otp';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [step, setStep] = useState<Step>('mobile');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const arr = text.split('');
      setDigits(arr);
      setOtp(text);
      otpRefs.current[5]?.focus();
    }
    e.preventDefault();
  }

  async function handleMobileSubmit() {
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

  async function handleOtpSubmit() {
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

  if (step === 'mobile') {
    return (
      <AuthShell heroVariant="platform">
        <FormCard
          title="Platform Owner Sign In"
          subtitle="Access the Obsidian control plane. Onboard brokers, manage tenants, and control platform-wide settings."
          footer={
            <div style={{
              fontFamily: 'var(--font-data)', fontSize: 9, fontWeight: 600,
              letterSpacing: '0.08em', color: 'var(--fg3)', textTransform: 'uppercase', textAlign: 'center',
            }}>
              OBSIDIAN PLATFORM · RESTRICTED ACCESS · PLATFORM OWNERS ONLY
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

            <PrimaryButton onClick={handleMobileSubmit} disabled={loading || !mobile.trim()}>
              {loading ? 'Sending…' : <>Request OTP {AuthIcons.arrowRight}</>}
            </PrimaryButton>
          </div>
        </FormCard>
      </AuthShell>
    );
  }

  return (
    <AuthShell heroVariant="platform">
      <FormCard
        back={
          <span
            onClick={() => { setStep('mobile'); setDigits(['','','','','','']); setOtp(''); setError(null); }}
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

          <PrimaryButton onClick={handleOtpSubmit} disabled={loading || otp.length < 6}>
            {loading ? 'Verifying…' : <>Verify & access control plane {AuthIcons.arrowRight}</>}
          </PrimaryButton>
        </div>
      </FormCard>
    </AuthShell>
  );
}
