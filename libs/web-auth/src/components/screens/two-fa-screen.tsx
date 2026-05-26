/**
 * File:        libs/web-auth/src/components/screens/two-fa-screen.tsx
 * Module:      web-auth · TwoFAScreen
 * Purpose:     2FA method selector: Passkey (recommended), TOTP authenticator app with
 *              QR mock, SMS, hardware key. Shows TOTP setup panel when TOTP is selected.
 *
 * Exports:
 *   - TwoFAScreen({ onContinue?, defaultMethod?, loading?, error? })
 *
 * Side-effects: none
 * Key invariants:
 *   - QrMock renders deterministic QR-like SVG (no real TOTP secret — replace in production)
 *   - TOTP secret displayed is a placeholder — real secret comes from server
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

'use client';

import React, { useState } from 'react';
import { AuthShell } from '../shared/auth-shell';
import { FormCard, StepIndicator } from '../shared/form-card';
import { PrimaryButton } from '../shared/primitives';
import { AuthIcons } from '../shared/icons';

type MFAMethod = 'passkey' | 'totp' | 'sms' | 'key';

const METHODS: { id: MFAMethod; title: string; sub: string; badge?: string; icon: React.ReactNode }[] = [
  { id: 'passkey', title: 'Passkey', sub: 'Biometric or device PIN · phishing-resistant', badge: 'RECOMMENDED', icon: AuthIcons.passkey },
  { id: 'totp', title: 'Authenticator app', sub: '1Password · Google Auth · Authy', icon: AuthIcons.shield },
  { id: 'sms', title: 'SMS OTP', sub: 'One-time code by text', icon: AuthIcons.phone },
  { id: 'key', title: 'Hardware key', sub: 'YubiKey · Solokey · Titan', icon: AuthIcons.lock },
];

function QrMock() {
  const cells: { x: number; y: number }[] = [];
  for (let i = 0; i < 21 * 21; i++) {
    const x = i % 21, y = Math.floor(i / 21);
    const corner = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
    const on = corner
      ? (x === 0 || x === 6 || y === 0 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4))
      : ((x * 7 + y * 13 + x * y) % 3 === 0);
    if (on) cells.push({ x, y });
  }
  return (
    <svg viewBox="0 0 21 21" style={{ width: '100%', height: '100%', display: 'block' }}>
      {cells.map((c, i) => <rect key={i} x={c.x} y={c.y} width="1" height="1" fill="#000" />)}
    </svg>
  );
}

interface TwoFAScreenProps {
  heroVariant?: 'default' | 'broker' | 'platform';
  defaultMethod?: MFAMethod;
  totpSecret?: string;
  onContinue?: (method: MFAMethod) => void;
  loading?: boolean;
  error?: string | null;
}

export function TwoFAScreen({
  heroVariant = 'default',
  defaultMethod = 'totp',
  totpSecret = 'JBSWY3DPEHPK3PXP · KQRT',
  onContinue,
  loading, error,
}: TwoFAScreenProps) {
  const [method, setMethod] = useState<MFAMethod>(defaultMethod);

  return (
    <AuthShell heroVariant={heroVariant}>
      <FormCard
        eyebrow="STEP 02 · MULTI-FACTOR"
        title="Secure your account"
        subtitle="Obsidian requires two-factor authentication for every sign-in. Choose how we verify it's you."
      >
        <div style={{ marginBottom: 28 }}>
          <StepIndicator current={1} total={4} labels={['EMAIL', '2FA', 'KYC', 'PROFILE']} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {METHODS.map(opt => {
            const active = method === opt.id;
            return (
              <div key={opt.id} onClick={() => setMethod(opt.id)} style={{
                padding: '14px 16px', borderRadius: 'var(--r-md)', cursor: 'pointer',
                background: active ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', gap: 14,
                transition: 'all 150ms var(--ease)',
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 'var(--r-sm)',
                  background: active ? 'rgba(59,130,246,0.15)' : 'var(--bg-panel)',
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: active ? 'var(--accent)' : 'var(--fg2)',
                }}>{opt.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 600, color: 'var(--fg1)' }}>{opt.title}</span>
                    {opt.badge && (
                      <span style={{
                        fontFamily: 'var(--font-data)', fontSize: 9, fontWeight: 700,
                        background: 'var(--bull-dim)', color: 'var(--bull)',
                        padding: '2px 6px', borderRadius: 3, letterSpacing: '0.1em',
                      }}>{opt.badge}</span>
                    )}
                  </div>
                  <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--fg2)', marginTop: 2 }}>{opt.sub}</div>
                </div>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%',
                  border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border-hi)'}`,
                  background: active ? 'var(--accent)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {active && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', display: 'block' }} />}
                </div>
              </div>
            );
          })}
        </div>

        {/* TOTP setup detail */}
        {method === 'totp' && (
          <div style={{
            padding: 18, background: 'var(--bg-panel)',
            border: '1px solid var(--border)', borderRadius: 'var(--r-lg)',
            display: 'grid', gridTemplateColumns: '110px 1fr', gap: 18, marginBottom: 20,
          }}>
            <div style={{
              width: 110, height: 110, borderRadius: 'var(--r-sm)',
              background: '#fff', padding: 6, boxSizing: 'border-box',
            }}>
              <QrMock />
            </div>
            <div>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600,
                letterSpacing: '0.1em', color: 'var(--fg3)', textTransform: 'uppercase',
                marginBottom: 8,
              }}>SCAN OR ENTER MANUALLY</div>
              <div style={{
                fontFamily: 'var(--font-data)', fontSize: 12, color: 'var(--fg1)',
                padding: '6px 10px', background: 'var(--bg-elevated)',
                border: '1px solid var(--border)', borderRadius: 4,
                letterSpacing: '0.06em', marginBottom: 10, userSelect: 'all' as const,
              }}>{totpSecret}</div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--fg2)', lineHeight: 1.5 }}>
                Issuer: <span style={{ color: 'var(--fg1)' }}>Obsidian Markets</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div style={{
            padding: '10px 14px', background: 'var(--bear-dim)', marginBottom: 16,
            border: '1px solid rgba(255,59,92,0.25)', borderRadius: 'var(--r-md)',
            fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--bear)',
          }}>{error}</div>
        )}

        <PrimaryButton onClick={() => onContinue?.(method)} disabled={loading}>
          Continue {AuthIcons.arrowRight}
        </PrimaryButton>
      </FormCard>
    </AuthShell>
  );
}
