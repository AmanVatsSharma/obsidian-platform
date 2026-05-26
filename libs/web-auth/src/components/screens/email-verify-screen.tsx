/**
 * File:        libs/web-auth/src/components/screens/email-verify-screen.tsx
 * Module:      web-auth · EmailVerifyScreen
 * Purpose:     6-digit email verification code entry. Step 1 of the onboarding flow.
 *              Shows OTP digit boxes, timer, resend / change-email actions, and a
 *              "while you wait" platform feature panel.
 *
 * Exports:
 *   - EmailVerifyScreen({ email, onVerify?, onResend?, onChangeEmail?, loading?, error? })
 *
 * Side-effects: none
 * Key invariants:
 *   - Code entry is controlled (value: string[6]); active digit highlighted with accent border
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

'use client';

import React, { useState, useRef } from 'react';
import { AuthShell } from '../shared/auth-shell';
import { FormCard } from '../shared/form-card';
import { StepIndicator } from '../shared/form-card';
import { PrimaryButton, FieldLabel } from '../shared/primitives';
import { AuthIcons } from '../shared/icons';

const WHILE_YOU_WAIT = [
  ['Terminal', 'Web, desktop & mobile · co-located feeds'],
  ['Execution', 'STP · ECN · DMA · FIX 4.4/5.0 API'],
  ['Coverage', '80+ FX pairs · 120 indices · 9k stocks · 40 cryptos'],
];

interface EmailVerifyScreenProps {
  heroVariant?: 'default' | 'broker' | 'platform';
  email?: string;
  onVerify?: (code: string) => void;
  onResend?: () => void;
  onChangeEmail?: () => void;
  loading?: boolean;
  error?: string | null;
}

export function EmailVerifyScreen({
  heroVariant = 'default',
  email = 'your.email@example.com',
  onVerify, onResend, onChangeEmail,
  loading, error,
}: EmailVerifyScreenProps) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function handleDigit(i: number, v: string) {
    const c = v.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = c;
    setDigits(next);
    if (c && i < 5) refs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  }

  function handlePaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setDigits(text.split(''));
      refs.current[5]?.focus();
    }
    e.preventDefault();
  }

  const code = digits.join('');

  return (
    <AuthShell heroVariant={heroVariant}>
      <FormCard
        eyebrow="STEP 01 · IDENTITY"
        title="Check your inbox"
        subtitle={
          <>
            We sent a 6-digit code to{' '}
            <span style={{ color: 'var(--fg1)', fontFamily: 'var(--font-data)' }}>{email}</span>.
            The code expires in 10 minutes.
          </>
        }
      >
        <div style={{ marginBottom: 28 }}>
          <StepIndicator current={0} total={4} labels={['EMAIL', '2FA', 'KYC', 'PROFILE']} />
        </div>

        <FieldLabel>Verification code</FieldLabel>
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }} onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => { refs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleDigit(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
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

        <div style={{
          padding: '12px 14px', background: 'var(--bg-panel)',
          border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
          fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--fg2)',
        }}>
          <span style={{ color: 'var(--warn)', display: 'flex' }}>{AuthIcons.info}</span>
          <span>CODE VALID FOR <span style={{ color: 'var(--fg1)' }}>09:47</span></span>
          <span style={{ marginLeft: 'auto', display: 'flex', gap: 14 }}>
            <span onClick={onResend} style={{ color: 'var(--accent)', cursor: 'pointer' }}>RESEND</span>
            <span onClick={onChangeEmail} style={{ color: 'var(--fg3)', cursor: 'pointer' }}>USE ANOTHER EMAIL</span>
          </span>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px', background: 'var(--bear-dim)', marginBottom: 16,
            border: '1px solid rgba(255,59,92,0.25)', borderRadius: 'var(--r-md)',
            fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--bear)',
          }}>{error}</div>
        )}

        <PrimaryButton
          disabled={code.length < 6 || loading}
          onClick={() => onVerify?.(code)}
        >
          {loading ? 'Verifying…' : <>Verify email {AuthIcons.arrowRight}</>}
        </PrimaryButton>

        <div style={{
          marginTop: 32, padding: 16, background: 'var(--bg-panel)',
          border: '1px solid var(--border)', borderRadius: 'var(--r-lg)',
        }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 600,
            letterSpacing: '0.1em', color: 'var(--fg3)', textTransform: 'uppercase',
            marginBottom: 12,
          }}>WHILE YOU WAIT</div>
          {WHILE_YOU_WAIT.map(([k, v], idx) => (
            <div key={k} style={{
              display: 'flex', justifyContent: 'space-between', padding: '6px 0',
              borderTop: idx === 0 ? 'none' : '1px solid var(--border)',
            }}>
              <span style={{
                fontFamily: 'var(--font-data)', fontSize: 10, fontWeight: 600,
                letterSpacing: '0.06em', color: 'var(--fg3)', textTransform: 'uppercase',
              }}>{k}</span>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--fg1)' }}>{v}</span>
            </div>
          ))}
        </div>
      </FormCard>
    </AuthShell>
  );
}
