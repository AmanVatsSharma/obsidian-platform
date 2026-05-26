/**
 * File:        libs/web-auth/src/components/screens/login-screen.tsx
 * Module:      web-auth · LoginScreen
 * Purpose:     Full Obsidian sign-in screen: email+password, SSO (Google/Apple/Microsoft/Wallet),
 *              passkey CTA, trust-device checkbox, security strip.
 *
 * Exports:
 *   - LoginScreen({ onSubmit?, onForgotPassword?, onSignUp?, onSso?, onPasskey?,
 *                   defaultEmail?, loading?, error? })
 *
 * Side-effects: none
 * Key invariants:
 *   - Render-only design comp with optional callback props — caller decides routing
 *   - Uses AuthShell split layout with default MarketHero
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

interface LoginScreenProps {
  heroVariant?: 'default' | 'broker' | 'platform';
  heroTitle?: string;
  heroSubtitle?: string;
  onSubmit?: (email: string, password: string, trustDevice: boolean) => void | Promise<void>;
  onForgotPassword?: () => void;
  onSignUp?: () => void;
  onSso?: (provider: 'google' | 'apple' | 'microsoft' | 'wallet') => void;
  onPasskey?: () => void;
  defaultEmail?: string;
  loading?: boolean;
  error?: string | null;
}

export function LoginScreen({
  heroVariant = 'default',
  heroTitle, heroSubtitle,
  onSubmit, onForgotPassword, onSignUp,
  onSso, onPasskey,
  defaultEmail = '',
  loading = false, error,
}: LoginScreenProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [pw, setPw] = useState('');
  const [trust, setTrust] = useState(false);

  return (
    <AuthShell heroVariant={heroVariant} heroTitle={heroTitle} heroSubtitle={heroSubtitle}>
      <FormCard
        title="Sign in to Obsidian"
        subtitle="Access your terminal, positions and dealer workflow. Sessions are signed and device-bound."
        footer={<LoginFooter onSignUp={onSignUp} />}
      >
        {/* SSO row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 4 }}>
          <GhostButton icon={AuthIcons.google} wide onClick={() => onSso?.('google')}>Google</GhostButton>
          <GhostButton icon={AuthIcons.apple} wide onClick={() => onSso?.('apple')}>Apple</GhostButton>
          <GhostButton icon={AuthIcons.microsoft} wide onClick={() => onSso?.('microsoft')}>Microsoft</GhostButton>
          <GhostButton icon={AuthIcons.wallet} wide onClick={() => onSso?.('wallet')}>Wallet</GhostButton>
        </div>

        <Divider label="OR CONTINUE WITH CREDENTIALS" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <FieldLabel>Work email</FieldLabel>
            <TextInput value={email} onChange={setEmail} type="email" icon={AuthIcons.mail} />
          </div>

          <div>
            <FieldLabel hint={
              <span
                onClick={onForgotPassword}
                style={{
                  color: 'var(--accent)', cursor: 'pointer',
                  fontFamily: 'var(--font-ui)', fontSize: 11,
                  textTransform: 'none', letterSpacing: 0,
                }}
              >
                Forgot password?
              </span>
            }>
              Password
            </FieldLabel>
            <TextInput value={pw} onChange={setPw} type="password" icon={AuthIcons.lock} />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <span
              onClick={() => setTrust(!trust)}
              style={{
                width: 16, height: 16, borderRadius: 4,
                background: trust ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                border: `1px solid ${trust ? 'var(--accent)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--accent)',
              }}
            >
              {trust && AuthIcons.check}
            </span>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--fg2)' }}>
              Trust this device for 30 days
            </span>
          </label>

          {error && (
            <div style={{
              padding: '10px 14px', background: 'var(--bear-dim)',
              border: '1px solid rgba(255,59,92,0.25)', borderRadius: 'var(--r-md)',
              fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--bear)',
            }}>
              {error}
            </div>
          )}

          <PrimaryButton
            disabled={loading}
            onClick={() => onSubmit?.(email, pw, trust)}
          >
            {loading ? 'Signing in…' : <>Sign in {AuthIcons.arrowRight}</>}
          </PrimaryButton>

          <button
            type="button"
            onClick={onPasskey}
            style={{
              height: 42, background: 'transparent',
              border: '1px dashed var(--border-md)',
              borderRadius: 'var(--r-md)', color: 'var(--fg2)',
              fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 500,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}
          >
            {AuthIcons.passkey}
            Sign in with Passkey
            <span style={{
              fontFamily: 'var(--font-data)', fontSize: 9, fontWeight: 600,
              background: 'var(--bull-dim)', color: 'var(--bull)',
              padding: '2px 6px', borderRadius: 3, letterSpacing: '0.1em',
            }}>FASTEST</span>
          </button>
        </div>
      </FormCard>
    </AuthShell>
  );
}

function LoginFooter({ onSignUp }: { onSignUp?: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{
        padding: '10px 14px', background: 'var(--bg-panel)',
        border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
        display: 'flex', alignItems: 'center', gap: 12,
        fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--fg2)',
      }}>
        <span style={{ color: 'var(--bull)', display: 'flex' }}>{AuthIcons.shield}</span>
        <span>TLS 1.3 · FIDO2 · SOC 2 Type II · Session hardening on</span>
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--fg2)',
      }}>
        <span>
          New to Obsidian?{' '}
          <span
            onClick={onSignUp}
            style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 500 }}
          >
            Request access →
          </span>
        </span>
        <span style={{
          fontFamily: 'var(--font-data)', fontSize: 10,
          letterSpacing: '0.06em', color: 'var(--fg3)', textTransform: 'uppercase',
        }}>v2.4.0 · EU · STABLE</span>
      </div>
    </div>
  );
}
