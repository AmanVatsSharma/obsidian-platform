/**
 * File:        libs/web-auth/src/components/screens/sign-up-screen.tsx
 * Module:      web-auth · SignUpScreen
 * Purpose:     Account registration screen: account profile selector (Retail/Pro/Institutional),
 *              SSO options, email+password with strength meter, legal consent checkbox.
 *
 * Exports:
 *   - SignUpScreen({ onSubmit?, onSso?, onLogin?, loading?, error? })
 *
 * Side-effects: none
 * Key invariants:
 *   - Password strength meter is local-only (4 bars, static in design — reactive in impl)
 *   - heroVariant defaults to 'default'
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

'use client';

import React, { useState } from 'react';
import { AuthShell } from '../shared/auth-shell';
import { FormCard } from '../shared/form-card';
import { TextInput, PrimaryButton, GhostButton, FieldLabel, Divider } from '../shared/primitives';
import { AuthIcons } from '../shared/icons';

type AccountProfile = 'retail' | 'pro' | 'inst';

const PROFILES = [
  { id: 'retail' as AccountProfile, label: 'Retail', desc: 'FX · Stocks · ETF', min: '$250 min' },
  { id: 'pro' as AccountProfile, label: 'Pro', desc: 'Margin · Options · DMA', min: '$10k min' },
  { id: 'inst' as AccountProfile, label: 'Institutional', desc: 'FIX · Prime · OTC', min: 'Contact desk' },
];

function strengthOf(pw: string): { bars: number; label: string } {
  if (pw.length === 0) return { bars: 0, label: 'EMPTY' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ['WEAK', 'FAIR', 'GOOD', 'STRONG'];
  return { bars: score, label: labels[score - 1] ?? 'VERY WEAK' };
}

interface SignUpScreenProps {
  heroVariant?: 'default' | 'broker' | 'platform';
  onSubmit?: (data: { email: string; password: string; profile: AccountProfile }) => void;
  onSso?: (provider: 'google' | 'apple' | 'microsoft' | 'wallet') => void;
  onLogin?: () => void;
  loading?: boolean;
  error?: string | null;
}

export function SignUpScreen({ heroVariant = 'default', onSubmit, onSso, onLogin, loading, error }: SignUpScreenProps) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [account, setAccount] = useState<AccountProfile>('pro');
  const [agree, setAgree] = useState(false);
  const { bars, label } = strengthOf(pw);

  return (
    <AuthShell heroVariant={heroVariant}>
      <FormCard
        title="Open your account"
        subtitle="Two minutes to create credentials. Full verification after. Choose the account profile that matches your trading — you can change this later."
      >
        {/* Account profile */}
        <div style={{ marginBottom: 20 }}>
          <FieldLabel>Account profile</FieldLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {PROFILES.map(opt => {
              const active = account === opt.id;
              return (
                <div key={opt.id} onClick={() => setAccount(opt.id)} style={{
                  padding: 14, borderRadius: 'var(--r-md)', cursor: 'pointer',
                  background: active ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  boxShadow: active ? '0 0 0 3px rgba(59,130,246,0.12)' : 'none',
                  transition: 'all 150ms var(--ease)',
                }}>
                  <div style={{
                    fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
                    letterSpacing: '0.04em', color: active ? 'var(--accent)' : 'var(--fg1)',
                    textTransform: 'uppercase',
                  }}>{opt.label}</div>
                  <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--fg2)', marginTop: 4 }}>{opt.desc}</div>
                  <div style={{
                    fontFamily: 'var(--font-data)', fontSize: 10, fontWeight: 600,
                    letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg3)', marginTop: 6,
                  }}>{opt.min}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SSO */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 4 }}>
          <GhostButton icon={AuthIcons.google} wide onClick={() => onSso?.('google')}>Google</GhostButton>
          <GhostButton icon={AuthIcons.apple} wide onClick={() => onSso?.('apple')}>Apple</GhostButton>
          <GhostButton icon={AuthIcons.microsoft} wide onClick={() => onSso?.('microsoft')}>Microsoft</GhostButton>
          <GhostButton icon={AuthIcons.wallet} wide onClick={() => onSso?.('wallet')}>Wallet</GhostButton>
        </div>

        <Divider label="OR REGISTER WITH EMAIL" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <FieldLabel>Work email</FieldLabel>
            <TextInput value={email} onChange={setEmail} type="email" placeholder="name@firm.com" icon={AuthIcons.mail} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <FieldLabel>Password</FieldLabel>
              <TextInput value={pw} onChange={setPw} type="password" placeholder="Min 12 chars" icon={AuthIcons.lock} />
            </div>
            <div>
              <FieldLabel>Confirm</FieldLabel>
              <TextInput value={confirm} onChange={setConfirm} type="password" placeholder="Re-enter" icon={AuthIcons.lock} />
            </div>
          </div>

          {/* Strength meter */}
          {pw.length > 0 && (
            <div>
              <div style={{ display: 'flex', gap: 4, height: 3, marginBottom: 6 }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{
                    flex: 1, borderRadius: 2,
                    background: i <= bars ? (bars >= 3 ? 'var(--bull)' : bars === 2 ? 'var(--warn)' : 'var(--bear)') : 'var(--border)',
                  }} />
                ))}
              </div>
              <div style={{
                fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--fg3)',
                letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>
                STRENGTH ·{' '}
                <span style={{ color: bars >= 3 ? 'var(--bull)' : bars === 2 ? 'var(--warn)' : 'var(--bear)' }}>
                  {label}
                </span>
              </div>
            </div>
          )}

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginTop: 4 }}>
            <span
              onClick={() => setAgree(!agree)}
              style={{
                width: 16, height: 16, borderRadius: 4, marginTop: 2, flexShrink: 0,
                background: agree ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                border: `1px solid ${agree ? 'var(--accent)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--accent)',
              }}
            >
              {agree && AuthIcons.check}
            </span>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--fg2)', lineHeight: 1.5 }}>
              I acknowledge Obsidian's{' '}
              <span style={{ color: 'var(--accent)' }}>Customer Agreement</span>,{' '}
              <span style={{ color: 'var(--accent)' }}>Risk Disclosure</span>{' '}
              and consent to electronic signatures. CFDs are complex instruments; 74% of retail accounts lose money.
            </span>
          </label>

          {error && (
            <div style={{
              padding: '10px 14px', background: 'var(--bear-dim)',
              border: '1px solid rgba(255,59,92,0.25)', borderRadius: 'var(--r-md)',
              fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--bear)',
            }}>{error}</div>
          )}

          <PrimaryButton
            disabled={!agree || loading}
            onClick={() => onSubmit?.({ email, password: pw, profile: account })}
          >
            Continue to verification {AuthIcons.arrowRight}
          </PrimaryButton>

          <div style={{ textAlign: 'center', fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--fg2)' }}>
            Already have an account?{' '}
            <span onClick={onLogin} style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 500 }}>Sign in</span>
          </div>
        </div>
      </FormCard>
    </AuthShell>
  );
}
