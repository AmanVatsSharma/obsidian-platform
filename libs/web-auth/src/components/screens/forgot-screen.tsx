/**
 * File:        libs/web-auth/src/components/screens/forgot-screen.tsx
 * Module:      web-auth · ForgotScreen
 * Purpose:     Password recovery screen — email input, recovery channels panel,
 *              and a warning that open positions are NOT cancelled.
 *
 * Exports:
 *   - ForgotScreen({ onSubmit?, onBack?, loading?, error? })
 *
 * Side-effects: none
 * Key invariants: warn-dim alert strip for positions-not-cancelled UX copy
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

'use client';

import React, { useState } from 'react';
import { AuthShell } from '../shared/auth-shell';
import { FormCard } from '../shared/form-card';
import { TextInput, PrimaryButton, FieldLabel } from '../shared/primitives';
import { AuthIcons } from '../shared/icons';

interface ForgotScreenProps {
  heroVariant?: 'default' | 'broker' | 'platform';
  onSubmit?: (email: string) => void;
  onBack?: () => void;
  loading?: boolean;
  error?: string | null;
}

function BackLink({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
        fontFamily: 'var(--font-data)', fontSize: 10, fontWeight: 600,
        letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg2)',
      }}
    >
      {AuthIcons.arrowLeft}
      {label}
    </span>
  );
}

const RECOVERY_CHANNELS = [
  { label: 'Email reset link', val: 'Sent to your registered email', status: 'PRIMARY', color: 'bull' },
  { label: 'SMS to backup phone', val: 'Registered backup mobile', status: 'AVAILABLE', color: 'accent' },
  { label: 'Security desk (voice)', val: '+44 20 3514 9010', status: 'MON–FRI · 24H', color: 'warn' },
  { label: 'Hardware key recovery kit', val: 'Printed · stored offline', status: 'OFFLINE', color: 'fg3' },
];

export function ForgotScreen({ heroVariant = 'default', onSubmit, onBack, loading, error }: ForgotScreenProps) {
  const [email, setEmail] = useState('');

  return (
    <AuthShell heroVariant={heroVariant}>
      <FormCard
        back={<BackLink label="Back to sign in" onClick={onBack} />}
        title="Reset your password"
        subtitle="Enter the email on file. We'll send a signed recovery link valid for 30 minutes. For hardware-key accounts, contact the security desk directly."
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <FieldLabel>Email on file</FieldLabel>
            <TextInput value={email} onChange={setEmail} type="email" placeholder="name@firm.com" icon={AuthIcons.mail} autoFocus />
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', background: 'var(--bear-dim)',
              border: '1px solid rgba(255,59,92,0.25)', borderRadius: 'var(--r-md)',
              fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--bear)',
            }}>{error}</div>
          )}

          <PrimaryButton onClick={() => onSubmit?.(email)} disabled={loading}>
            {loading ? 'Sending…' : <>Send recovery link {AuthIcons.arrowRight}</>}
          </PrimaryButton>

          <div style={{
            padding: 18, background: 'var(--bg-panel)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)', marginTop: 8,
          }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600,
              letterSpacing: '0.1em', color: 'var(--fg3)', textTransform: 'uppercase',
              marginBottom: 14,
            }}>RECOVERY CHANNELS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {RECOVERY_CHANNELS.map((r, idx) => (
                <div key={r.label} style={{
                  display: 'grid', gridTemplateColumns: '1fr 160px 90px', gap: 12,
                  alignItems: 'center', padding: '8px 0',
                  borderTop: idx === 0 ? 'none' : '1px solid var(--border)',
                }}>
                  <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--fg1)' }}>{r.label}</span>
                  <span style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--fg2)' }}>{r.val}</span>
                  <span style={{
                    fontFamily: 'var(--font-data)', fontSize: 9, fontWeight: 600,
                    letterSpacing: '0.08em', textAlign: 'right',
                    color: r.color === 'bull' ? 'var(--bull)' : r.color === 'accent' ? 'var(--accent)' : r.color === 'warn' ? 'var(--warn)' : 'var(--fg3)',
                  }}>{r.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            padding: '10px 14px', background: 'var(--warn-dim)',
            border: '1px solid rgba(245,158,11,0.25)', borderRadius: 'var(--r-md)',
            display: 'flex', alignItems: 'center', gap: 12,
            fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--fg1)',
          }}>
            <span style={{ color: 'var(--warn)', display: 'flex' }}>{AuthIcons.info}</span>
            <span>Open orders and active positions will{' '}
              <span style={{ color: 'var(--warn)', fontWeight: 600 }}>not</span>{' '}
              be cancelled during password reset.
            </span>
          </div>
        </div>
      </FormCard>
    </AuthShell>
  );
}
