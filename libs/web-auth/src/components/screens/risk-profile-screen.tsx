/**
 * File:        libs/web-auth/src/components/screens/risk-profile-screen.tsx
 * Module:      web-auth · RiskProfileScreen
 * Purpose:     Live risk profile calibration screen. Computes a score from 4 inputs
 *              (horizon, goal, drawdown slider, leverage slider) and displays a live
 *              CONSERVATIVE → AGGRESSIVE bucket with default guardrails.
 *
 * Exports:
 *   - RiskProfileScreen({ onSubmit?, onBack?, loading?, error? })
 *
 * Side-effects: none
 * Key invariants:
 *   - Score formula: (loss/5) + (leverage/3) + horizonScore + goalScore = 0–24
 *   - Bucket thresholds: >16 AGGRESSIVE, >11 BALANCED, >6 MODERATE, else CONSERVATIVE
 *   - Gradient scale bar: bull → warn → bear (left to right)
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

type Horizon = 'short' | 'medium' | 'long';
type Goal = 'preservation' | 'income' | 'growth' | 'speculation';

function RadioRow({ options, value, onChange }: { options: { id: string; label: string }[]; value: string; onChange: (v: string) => void }) {
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
            color: active ? 'var(--fg1)' : 'var(--fg2)', transition: 'all 120ms var(--ease)',
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

interface RiskProfileScreenProps {
  heroVariant?: 'default' | 'broker' | 'platform';
  onSubmit?: (profile: { score: number; bucket: string; loss: number; leverage: number; horizon: Horizon; goal: Goal }) => void;
  onBack?: () => void;
  loading?: boolean;
  error?: string | null;
}

export function RiskProfileScreen({ heroVariant = 'default', onSubmit, onBack, loading, error }: RiskProfileScreenProps) {
  const [loss, setLoss] = useState(20);
  const [horizon, setHorizon] = useState<Horizon>('medium');
  const [goal, setGoal] = useState<Goal>('growth');
  const [leverage, setLeverage] = useState(10);

  const score = (loss / 5) + (leverage / 3) +
    (horizon === 'short' ? 4 : horizon === 'medium' ? 2 : 0) +
    (goal === 'speculation' ? 6 : goal === 'growth' ? 3 : 0);
  const bucket = score > 16 ? 'AGGRESSIVE' : score > 11 ? 'BALANCED' : score > 6 ? 'MODERATE' : 'CONSERVATIVE';
  const bucketColor = bucket === 'AGGRESSIVE' ? 'var(--bear)' : bucket === 'BALANCED' ? 'var(--warn)' : bucket === 'MODERATE' ? 'var(--accent)' : 'var(--bull)';

  return (
    <AuthShell heroVariant={heroVariant}>
      <FormCard
        eyebrow="STEP 04 · RISK PROFILE"
        title="Calibrate your risk tolerance"
        subtitle="Obsidian uses this to set pre-trade warnings, default margin buffers, and position size limits. You can override individual checks, but the desk is notified when you do."
      >
        <div style={{ marginBottom: 28 }}>
          <StepIndicator current={3} total={4} labels={['EMAIL', '2FA', 'KYC', 'PROFILE']} />
        </div>

        <Q num="01" text="Investment horizon">
          <RadioRow value={horizon} onChange={v => setHorizon(v as Horizon)} options={[
            { id: 'short', label: '< 6 months · Trading' },
            { id: 'medium', label: '6M – 3Y · Active' },
            { id: 'long', label: '3Y+ · Wealth' },
          ]} />
        </Q>

        <Q num="02" text="Primary objective">
          <RadioRow value={goal} onChange={v => setGoal(v as Goal)} options={[
            { id: 'preservation', label: 'Capital preservation' }, { id: 'income', label: 'Yield / income' },
            { id: 'growth', label: 'Growth' }, { id: 'speculation', label: 'Alpha / speculation' },
          ]} />
        </Q>

        <Q num="03" text="Maximum annual drawdown you'd accept">
          <div style={{
            padding: 18, background: 'var(--bg-panel)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
              <div style={{ fontFamily: 'var(--font-data)', fontSize: 32, fontWeight: 600, color: 'var(--bear)' }}>
                −{loss}.0<span style={{ fontSize: 18, color: 'var(--fg3)' }}>%</span>
              </div>
              <div style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--fg2)', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
                ≈ <span style={{ color: 'var(--bear)' }}>−${(loss * 1000).toLocaleString()}</span> on $100K book
              </div>
            </div>
            <input type="range" min="5" max="60" step="1" value={loss} onChange={e => setLoss(+e.target.value)}
              style={{ width: '100%', accentColor: 'var(--accent)' }} />
            <div style={{
              display: 'flex', justifyContent: 'space-between', marginTop: 6,
              fontFamily: 'var(--font-data)', fontSize: 9, color: 'var(--fg3)',
              letterSpacing: '0.06em', textTransform: 'uppercase' as const,
            }}>
              <span>−5%</span><span>−20%</span><span>−40%</span><span>−60%+</span>
            </div>
          </div>
        </Q>

        <Q num="04" text="Comfortable leverage ceiling">
          <div style={{
            padding: 18, background: 'var(--bg-panel)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
              <div style={{ fontFamily: 'var(--font-data)', fontSize: 32, fontWeight: 600, color: 'var(--fg1)' }}>
                {leverage}<span style={{ fontSize: 18, color: 'var(--fg3)' }}>×</span>
              </div>
              <div style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--fg2)', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
                1 LOT EUR/USD ≈ <span style={{ color: 'var(--fg1)' }}>${(100000 / leverage).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span> MARGIN
              </div>
            </div>
            <input type="range" min="1" max="50" step="1" value={leverage} onChange={e => setLeverage(+e.target.value)}
              style={{ width: '100%', accentColor: 'var(--accent)' }} />
            <div style={{
              display: 'flex', justifyContent: 'space-between', marginTop: 6,
              fontFamily: 'var(--font-data)', fontSize: 9, color: 'var(--fg3)',
              letterSpacing: '0.06em', textTransform: 'uppercase' as const,
            }}>
              <span>1×</span><span>10×</span><span>25×</span><span>50× MAX</span>
            </div>
          </div>
        </Q>

        {/* Live profile summary */}
        <div style={{
          marginTop: 8, padding: 20, borderRadius: 'var(--r-lg)',
          background: 'var(--bg-panel)', border: `1px solid ${bucketColor}`,
          boxShadow: `0 0 24px ${bucketColor}22`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 600,
              letterSpacing: '0.1em', color: 'var(--fg3)', textTransform: 'uppercase' as const,
            }}>YOUR PROFILE</div>
            <div style={{
              fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--fg3)',
              letterSpacing: '0.06em', textTransform: 'uppercase' as const,
            }}>SCORE {score.toFixed(1)} / 24</div>
          </div>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700,
            letterSpacing: '0.04em', color: bucketColor, textTransform: 'uppercase' as const, marginBottom: 14,
          }}>{bucket}</div>
          <div style={{ position: 'relative', height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: `${Math.min(100, (score / 24) * 100)}%`,
              background: 'linear-gradient(90deg, var(--bull), var(--warn) 60%, var(--bear))',
              transition: 'width 300ms var(--ease)',
            }} />
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontFamily: 'var(--font-data)', fontSize: 9, color: 'var(--fg3)',
            letterSpacing: '0.08em', textTransform: 'uppercase' as const,
          }}>
            <span>CONSERVATIVE</span><span>MODERATE</span><span>BALANCED</span><span>AGGRESSIVE</span>
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
            marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--border)',
          }}>
            {[['MARGIN CALL', '80%'], ['STOP-OUT', '50%'], ['MAX POS SIZE', '5% NAV']].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontFamily: 'var(--font-data)', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--fg3)', textTransform: 'uppercase' as const }}>{k}</div>
                <div style={{ fontFamily: 'var(--font-data)', fontSize: 15, fontWeight: 600, color: 'var(--fg1)', marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px', background: 'var(--bear-dim)', marginTop: 16,
            border: '1px solid rgba(255,59,92,0.25)', borderRadius: 'var(--r-md)',
            fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--bear)',
          }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <GhostButton icon={AuthIcons.arrowLeft} onClick={onBack}>Back</GhostButton>
          <PrimaryButton
            variant="bull"
            onClick={() => onSubmit?.({ score, bucket, loss, leverage, horizon, goal })}
            disabled={loading}
          >
            Submit & launch terminal {AuthIcons.arrowRight}
          </PrimaryButton>
        </div>
      </FormCard>
    </AuthShell>
  );
}
