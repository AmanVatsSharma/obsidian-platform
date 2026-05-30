/**
 * File:        apps/platform-owner/src/app/login/page.tsx
 * Module:      platform-owner · Login Page
 * Purpose:     Password + OTP login for the Platform Owner. Uses the Obsidian shared
 *              auth UI (AuthShell + FormCard + MarketHero) with platform variant.
 *
 * Exports:
 *   - LoginPage()  — client component; Obsidian split-layout form
 *
 * Depends on:
 *   - ../../lib/api/endpoints     — api.requestOtp, api.verifyOtp, api.devLogin
 *   - ../../lib/auth/auth-context — useAuth().login
 *   - @obsidian/web-auth          — AuthShell, FormCard, TextInput, PrimaryButton, GhostButton
 *
 * Side-effects:
 *   - POST /api/auth/dev/login (dev-only password login)
 *   - POST /api/auth/otp/request and /api/auth/otp/verify with x-tenant-id: 'platform'
 *
 * Key invariants:
 *   - tenantId is always 'platform' for this app
 *   - heroVariant='platform' uses tailored hero copy for the control-plane context
 *   - Dev bypass: password 'platform123' or OTP flow
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-28
 */

'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api as endpoints } from '../../lib/api/endpoints';
import { useAuth } from '../../lib/auth/auth-context';
import { AuthShell, FormCard, TextInput, PrimaryButton, GhostButton, FieldLabel, AuthIcons } from '@obsidian/web-auth';

type Step = 'credentials' | 'otp';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [step, setStep] = useState<Step>('credentials');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
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

  async function handlePasswordSubmit() {
    setError(null);
    setLoading(true);
    try {
      const res = await endpoints.devLogin('platform', mobile, password);
      login(res.accessToken, mobile);
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpRequest() {
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

  if (step === 'credentials') {
    return (
      <AuthShell heroVariant="platform">
        <FormCard
          title="PLATFORM OWNER SIGN IN"
          subtitle="Access the Obsidian control plane. Onboard brokers, manage tenants, and control platform-wide settings."
          footer={
            <div style={{
              fontFamily: 'var(--font-data)',
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '0.08em',
              color: 'var(--fg3)',
              textTransform: 'uppercase',
              textAlign: 'center',
            }}>
              OBSIDIAN PLATFORM · RESTRICTED ACCESS · PLATFORM OWNERS ONLY
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Mobile input */}
            <div>
              <FieldLabel style={{ marginBottom: 6 }}>MOBILE NUMBER</FieldLabel>
              <TextInput
                value={mobile}
                onChange={setMobile}
                type="tel"
                placeholder="+919999999999"
                icon={AuthIcons.phone}
                autoFocus
              />
            </div>

            {/* Password input */}
            <div>
              <FieldLabel style={{ marginBottom: 6 }}>PASSWORD</FieldLabel>
              <TextInput
                value={password}
                onChange={setPassword}
                type="password"
                placeholder="Enter password"
                icon={AuthIcons.lock}
              />
            </div>

            {/* Error message */}
            {error && (
              <div style={{
                padding: '10px 14px',
                background: 'var(--bear-dim)',
                border: '1px solid rgba(255,59,92,0.25)',
                borderRadius: 'var(--r-md)',
                fontFamily: 'var(--font-ui)',
                fontSize: 12,
                color: 'var(--bear)',
              }}>
                {error}
              </div>
            )}

            {/* Sign in button */}
            <PrimaryButton
              onClick={handlePasswordSubmit}
              disabled={loading || !mobile.trim() || !password.trim()}
            >
              {loading ? 'SIGNING IN…' : <>SIGN IN {AuthIcons.arrowRight}</>}
            </PrimaryButton>

            {/* Divider */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{
                fontFamily: 'var(--font-data)',
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--fg3)',
              }}>
                OR
              </span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            {/* OTP option */}
            <GhostButton
              icon={AuthIcons.mail}
              onClick={handleOtpRequest}
              disabled={loading || !mobile.trim()}
              wide
            >
              SIGN IN WITH OTP
            </GhostButton>
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
            onClick={() => {
              setStep('credentials');
              setDigits(['', '', '', '', '', '']);
              setOtp('');
              setError(null);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              fontFamily: 'var(--font-data)',
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--fg2)',
            }}
          >
            {AuthIcons.arrowLeft} Change number
          </span>
        }
        title="ENTER OTP"
        subtitle={
          <>
            We sent a 6-digit code to{' '}
            <span style={{ color: 'var(--fg1)', fontFamily: 'var(--font-data)' }}>{mobile}</span>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* OTP input */}
          <div>
            <FieldLabel style={{ marginBottom: 8 }}>ONE-TIME PASSCODE</FieldLabel>
            <div style={{ display: 'flex', gap: 8 }} onPaste={handleDigitPaste}>
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
                    flex: 1,
                    height: 56,
                    borderRadius: 'var(--r-md)',
                    background: d ? 'var(--bg-panel)' : 'var(--bg-elevated)',
                    border: `1px solid ${!d && i === digits.findIndex(x => !x) ? 'var(--accent)' : d ? 'var(--border-md)' : 'var(--border)'}`,
                    textAlign: 'center',
                    fontFamily: 'var(--font-data)',
                    fontSize: 24,
                    fontWeight: 600,
                    color: 'var(--fg1)',
                    outline: 'none',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div style={{
              padding: '10px 14px',
              background: 'var(--bear-dim)',
              border: '1px solid rgba(255,59,92,0.25)',
              borderRadius: 'var(--r-md)',
              fontFamily: 'var(--font-ui)',
              fontSize: 12,
              color: 'var(--bear)',
            }}>
              {error}
            </div>
          )}

          {/* Verify button */}
          <PrimaryButton onClick={handleOtpSubmit} disabled={loading || otp.length < 6}>
            {loading ? 'VERIFYING…' : <>VERIFY & ACCESS {AuthIcons.arrowRight}</>}
          </PrimaryButton>
        </div>
      </FormCard>
    </AuthShell>
  );
}
