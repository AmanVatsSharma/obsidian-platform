/**
 * File:        libs/web-auth/src/components/screens/experience-screen.tsx
 * Module:      web-auth · ExperienceScreen
 * Purpose:     MiFID II suitability questionnaire — 5 questions about trading experience,
 *              instruments, volume, leverage understanding, and trading frequency.
 *
 * Exports:
 *   - ExperienceScreen({ onContinue?, onBack?, loading?, error? })
 *
 * Side-effects: none
 * Key invariants:
 *   - Q2 is multi-select (instruments traded); all others are single-select radio rows
 *   - Answers do NOT restrict the account — they calibrate the platform (per design copy)
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

'use client';

import React, { useState } from 'react';
import { AuthShell } from '../shared/auth-shell';
import { FormCard, StepIndicator } from '../shared/form-card';
import { PrimaryButton, GhostButton } from '../shared/primitives';
import { AuthIcons } from '../shared/icons';

interface RadioOption { id: string; label: string; }

function RadioRow({ options, value, onChange }: { options: RadioOption[]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
      {options.map(o => {
        const active = value === o.id;
        return (
          <div key={o.id} onClick={() => onChange(o.id)} style={{
            padding: '8px 14px', borderRadius: 'var(--r-md)', cursor: 'pointer',
            background: active ? 'var(--accent-dim)' : 'var(--bg-elevated)',
            border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
            fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 500,
            color: active ? 'var(--fg1)' : 'var(--fg2)',
            transition: 'all 120ms var(--ease)',
          }}>{o.label}</div>
        );
      })}
    </div>
  );
}

function Q({ num, text, children }: { num: string; text: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
        <span style={{ fontFamily: 'var(--font-data)', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--accent)' }}>Q.{num}</span>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 500, color: 'var(--fg1)' }}>{text}</span>
      </div>
      {children}
    </div>
  );
}

const INSTRUMENTS = [
  { id: 'equities', label: 'Equities / ETFs' }, { id: 'fx', label: 'Spot FX' },
  { id: 'cfd', label: 'CFDs' }, { id: 'options', label: 'Options' },
  { id: 'futures', label: 'Futures' }, { id: 'crypto', label: 'Crypto' },
  { id: 'bonds', label: 'Bonds / rates' }, { id: 'struct', label: 'Structured notes' },
  { id: 'none', label: 'None of these' },
];

interface ExperienceScreenProps {
  heroVariant?: 'default' | 'broker' | 'platform';
  onContinue?: (answers: Record<string, string | string[]>) => void;
  onBack?: () => void;
  loading?: boolean;
  error?: string | null;
}

export function ExperienceScreen({ heroVariant = 'default', onContinue, onBack, loading, error }: ExperienceScreenProps) {
  const [q1, setQ1] = useState('active_3_5');
  const [q2, setQ2] = useState<string[]>(['fx', 'equities', 'options']);
  const [q3, setQ3] = useState('50_250k');
  const [q4, setQ4] = useState('leverage_aware');
  const [q5, setQ5] = useState('weekly');

  const toggleInstrument = (id: string) =>
    setQ2(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <AuthShell heroVariant={heroVariant}>
      <FormCard
        eyebrow="STEP 04 · SUITABILITY · MiFID II APPROPRIATENESS"
        title="Your trading experience"
        subtitle="Five questions. We need this on file to offer leverage and complex instruments. Your answers do not restrict your account type — they calibrate the platform."
      >
        <div style={{ marginBottom: 28 }}>
          <StepIndicator current={3} total={4} labels={['EMAIL', '2FA', 'KYC', 'PROFILE']} />
        </div>

        <Q num="01" text="How long have you been trading actively?">
          <RadioRow value={q1} onChange={setQ1} options={[
            { id: 'none', label: 'New to it' }, { id: 'under_1', label: '< 1 year' },
            { id: 'active_1_3', label: '1 – 3 years' }, { id: 'active_3_5', label: '3 – 5 years' },
            { id: 'vet', label: '5+ years' },
          ]} />
        </Q>

        <Q num="02" text="Instruments you've traded in the last 12 months">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {INSTRUMENTS.map(o => {
              const on = q2.includes(o.id);
              return (
                <div key={o.id} onClick={() => toggleInstrument(o.id)} style={{
                  padding: '10px 12px', borderRadius: 'var(--r-md)', cursor: 'pointer',
                  background: on ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                  border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', gap: 10,
                  transition: 'all 120ms var(--ease)',
                }}>
                  <span style={{
                    width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                    background: on ? 'var(--accent)' : 'var(--bg-panel)',
                    border: `1px solid ${on ? 'var(--accent)' : 'var(--border-hi)'}`,
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{on && AuthIcons.check}</span>
                  <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--fg1)' }}>{o.label}</span>
                </div>
              );
            })}
          </div>
        </Q>

        <Q num="03" text="Approximate annual trading volume (USD notional)">
          <RadioRow value={q3} onChange={setQ3} options={[
            { id: 'under_50k', label: '< $50K' }, { id: '50_250k', label: '$50K – $250K' },
            { id: '250k_1m', label: '$250K – $1M' }, { id: '1m_5m', label: '$1M – $5M' },
            { id: 'over_5m', label: '> $5M' },
          ]} />
        </Q>

        <Q num="04" text="Understanding of leverage, margin & short-selling">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { id: 'beginner', label: 'Beginner', desc: 'Know what each term means, limited practice' },
              { id: 'leverage_aware', label: 'Competent', desc: 'Regularly use margin, calculate required margin independently' },
              { id: 'expert', label: 'Expert', desc: 'Manage cross-margined portfolios, option Greeks, VaR' },
            ].map(o => {
              const active = q4 === o.id;
              return (
                <div key={o.id} onClick={() => setQ4(o.id)} style={{
                  padding: '12px 14px', borderRadius: 'var(--r-md)', cursor: 'pointer',
                  background: active ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', gap: 12,
                  transition: 'all 120ms var(--ease)',
                }}>
                  <span style={{
                    width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                    border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border-hi)'}`,
                    background: active ? 'var(--accent)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{active && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff', display: 'block' }} />}</span>
                  <div>
                    <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600, color: 'var(--fg1)' }}>{o.label}</div>
                    <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--fg2)', marginTop: 2 }}>{o.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Q>

        <Q num="05" text="Trading frequency">
          <RadioRow value={q5} onChange={setQ5} options={[
            { id: 'rarely', label: 'Rarely' }, { id: 'monthly', label: 'Monthly' },
            { id: 'weekly', label: 'Weekly' }, { id: 'daily', label: 'Daily' },
            { id: 'intra', label: 'Intraday · many /day' },
          ]} />
        </Q>

        {error && (
          <div style={{
            padding: '10px 14px', background: 'var(--bear-dim)', marginBottom: 16,
            border: '1px solid rgba(255,59,92,0.25)', borderRadius: 'var(--r-md)',
            fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--bear)',
          }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <GhostButton icon={AuthIcons.arrowLeft} onClick={onBack}>Back</GhostButton>
          <PrimaryButton onClick={() => onContinue?.({ q1, q2, q3, q4, q5 })} disabled={loading}>
            Continue to risk profile {AuthIcons.arrowRight}
          </PrimaryButton>
        </div>
      </FormCard>
    </AuthShell>
  );
}
