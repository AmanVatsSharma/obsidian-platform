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
 * Last-updated: 2026-06-10
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/shared/providers/auth-provider';
import { AuthShell, FormCard, TextInput, PrimaryButton, FieldLabel, AuthIcons, CountrySelector, OtpInput } from '@obsidian/web-auth';

const TENANT_ID = process.env.NEXT_PUBLIC_TENANT_ID ?? 'web';

interface Country {
  code: string;
  name: string;
  dialCode: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { requestOtp, verifyOtp, devLogin } = useAuth();

  // Static fallback for SSR / missing browser context
  const defaultFallbackCountry = (): Country => ({ code: 'IN', name: 'India', dialCode: '+91' });

  // Determine default country from browser locale or saved preference
  const getDefaultCountry = (): Country => {
    // Guard for SSR — localStorage only exists in the browser
    if (typeof window === 'undefined') {
      return defaultFallbackCountry();
    }
    const savedCountry = localStorage.getItem('preferred-country');
    if (savedCountry) {
      const parsed = JSON.parse(savedCountry);
      return parsed; // code, name, dialCode format
    }

    // Try to detect from browser locale
    const locale = (navigator.language ?? '').split('-')[0].toUpperCase();
    const SUPPORTED: Record<string, Country> = {
      'US': { code: 'US', name: 'United States', dialCode: '+1' },
      'GB': { code: 'GB', name: 'United Kingdom', dialCode: '+44' },
      'IN': { code: 'IN', name: 'India', dialCode: '+91' },
      'SG': { code: 'SG', name: 'Singapore', dialCode: '+65' },
      'AU': { code: 'AU', name: 'Australia', dialCode: '+61' },
      'CA': { code: 'CA', name: 'Canada', dialCode: '+1' },
      'DE': { code: 'DE', name: 'Germany', dialCode: '+49' },
      'FR': { code: 'FR', name: 'France', dialCode: '+33' },
      'JP': { code: 'JP', name: 'Japan', dialCode: '+81' },
      'AE': { code: 'AE', name: 'UAE', dialCode: '+971' },
    };
    const defaultCountry: Country = SUPPORTED[locale] ?? defaultFallbackCountry();

    return defaultCountry;
  };

  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [country, setCountry] = useState<Country>(getDefaultCountry);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Derive full E.164 number for API
  const fullMobile = country ? `${country.dialCode}${mobile.replace(/^\+/, '')}` : mobile;


  async function handleRequestOtp() {
    setError('');
    setLoading(true);
    try {
      await requestOtp(TENANT_ID, fullMobile);
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
      await verifyOtp({ tenantId: TENANT_ID, mobileE164: fullMobile, otp: otp.trim() });
      // DIAG: tag with stack to confirm whether the login success redirect is
      // the offender. Filter DevTools on "[OBSIDIAN][WEB-LOGIN-REDIRECT]".
      // eslint-disable-next-line no-console
      console.warn('[OBSIDIAN][WEB-LOGIN-REDIRECT] verifyOtp OK -> /dashboard', {
        stack: new Error().stack,
      });
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleDevLogin() {
    setError('');
    setLoading(true);
    try {
      await devLogin(TENANT_ID, fullMobile || '+919999999999');
      // DIAG: tag with stack to confirm whether the dev-login redirect is
      // the offender. Filter DevTools on "[OBSIDIAN][WEB-LOGIN-REDIRECT]".
      // eslint-disable-next-line no-console
      console.warn('[OBSIDIAN][WEB-LOGIN-REDIRECT] devLogin OK -> /dashboard', {
        stack: new Error().stack,
      });
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Dev login failed');
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(value: string) {
    setOtp(value);
  }

  // Save country preference to localStorage on change
  function handleCountryChange(newCountry: Country) {
    setCountry(newCountry);
    try {
      localStorage.setItem('preferred-country', JSON.stringify(newCountry));
    } catch {
      // localStorage unavailable (private browsing, etc.)
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
              <FieldLabel>Country</FieldLabel>
              <CountrySelector
                selectedCountry={country}
                onCountryChange={handleCountryChange}
              />
            </div>

            <div>
              <FieldLabel>Mobile number</FieldLabel>
              <TextInput
                value={mobile}
                onChange={setMobile}
                type="tel"
                placeholder={country ? `${country.dialCode} 9999999999` : 'Select country first'}
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

            {process.env.NODE_ENV !== 'production' && (
              <button
                type="button"
                onClick={handleDevLogin}
                disabled={loading}
                style={{
                  background: 'transparent',
                  border: '1px dashed var(--accent)',
                  color: 'var(--accent)',
                  padding: '10px 14px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  marginTop: '4px',
                }}
              >
                Dev: One-tap sign-in (skip OTP)
              </button>
            )}
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
            onClick={() => { setStep('mobile'); setOtp(''); setError(''); }}
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
            <span style={{ color: 'var(--fg1)', fontFamily: 'var(--font-data)' }}>{fullMobile}</span>.
            Code expires in 10 minutes.
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <FieldLabel>One-time passcode</FieldLabel>
            <OtpInput
              value={otp}
              onChange={handleOtpChange}
              error={!!error}
            />
            <div style={{
              marginTop: '6px',
              fontFamily: 'var(--font-data)',
              fontSize: 11,
              color: 'var(--fg3)',
              textAlign: 'center',
            }}>
              Enter the 6-digit code sent to {fullMobile}
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

          {process.env.NODE_ENV !== 'production' && (
            <button
              type="button"
              onClick={handleDevLogin}
              disabled={loading}
              style={{
                background: 'transparent',
                border: '1px dashed var(--accent)',
                color: 'var(--accent)',
                padding: '10px 14px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                borderRadius: '4px',
                marginTop: '4px',
              }}
            >
              Dev: One-tap sign-in (skip OTP)
            </button>
          )}

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
                onClick={() => requestOtp(TENANT_ID, fullMobile)}
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
