/**
 * File:        apps/web/features/console/components/sections/verification-section.tsx
 * Module:      web · Console · Verification (KYC)
 * Purpose:     /console/verification — KYC status banner, ordered verification steps,
 *              tier comparison, and a document-upload modal.
 *
 * Exports:
 *   - default VerificationSection
 *
 * Depends on:
 *   - @obsidian/obsidian-ui — ObsidianBadge, ObsidianIcon, useToast
 *   - ../local/console-modal — controlled modal helper
 *   - ../../lib/use-console-user
 *
 * Side-effects:
 *   - Local kycState transitions: 'todo' → 'pending' on submit; 'rejected' → 'pending'
 *     via a Resubmit click in a future iteration. Currently mock; toasts only.
 *   - [SonuRamTODO] Replace local KYC state with backend wiring (Sumsub session
 *     bootstrap + status polling) when ready.
 *
 * Key invariants:
 *   - The status banner colour mirrors kycState — bull (approved), warn (pending),
 *     warn-tinted (todo), bear (rejected).
 *   - "Source-of-funds" step only marks approved when tier === 'platinum'; otherwise
 *     it stays 'todo' regardless of overall kycState.
 *   - Tier cards highlight the user's current tier with an inset accent ring.
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

'use client';

import * as React from 'react';

import { ObsidianBadge, ObsidianIcon, useToast } from '@obsidian/obsidian-ui';

import type { KycState } from '../../lib/seed-data';
import { useConsoleUser } from '../../lib/use-console-user';
import { ConsoleModal } from '../local/console-modal';

type StepStatus = 'approved' | 'pending' | 'rejected' | 'todo';

type VerificationStep = {
  id: string;
  title: string;
  status: StepStatus;
  required: boolean;
  hint?: string;
};

const LIMITS: Record<KycState, { deposit: string; withdraw: string; leverage: string }> = {
  approved: {
    deposit: 'Unlimited',
    withdraw: '€100,000 / day',
    leverage: 'Up to 1:30 retail · 1:500 pro',
  },
  pending: { deposit: '€2,000 / day', withdraw: 'Locked', leverage: 'Demo only' },
  todo:    { deposit: '€0',           withdraw: 'Locked', leverage: 'Demo only' },
  rejected:{ deposit: '€0',           withdraw: 'Locked', leverage: 'Demo only' },
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span
        style={{
          fontFamily: 'var(--font-data)',
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--fg3)',
        }}
      >
        {label}
      </span>
      <span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>
        {value}
      </span>
    </div>
  );
}

function TierCard({
  tier,
  current,
  bullets,
}: {
  tier: string;
  current: boolean;
  bullets: ReadonlyArray<string>;
}) {
  return (
    <div
      className="card"
      style={
        current
          ? {
              borderColor: 'rgba(59,130,246,0.4)',
              boxShadow: '0 0 0 1px rgba(59,130,246,0.15) inset',
            }
          : undefined
      }
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.08em',
          }}
        >
          {tier}
        </span>
        {current && <ObsidianBadge kind="accent" dot>Current</ObsidianBadge>}
      </div>
      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {bullets.map((b, i) => (
          <li
            key={i}
            style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--fg2)' }}
          >
            <ObsidianIcon name="Check" size={12} strokeWidth={2.5} />
            {b}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function VerificationSection() {
  const user = useConsoleUser();
  const toast = useToast();
  const [kycState, setKycState] = React.useState<KycState>(user.kycState);
  const [activeStep, setActiveStep] = React.useState<VerificationStep | null>(null);

  const steps: VerificationStep[] = [
    { id: 'email', title: 'Email confirmation', status: 'approved', required: true },
    {
      id: 'id',
      title: 'Government-issued ID',
      status:
        kycState === 'approved'
          ? 'approved'
          : kycState === 'pending'
            ? 'pending'
            : kycState === 'rejected'
              ? 'rejected'
              : 'todo',
      required: true,
    },
    {
      id: 'selfie',
      title: 'Selfie & liveness check',
      status: kycState === 'approved' ? 'approved' : kycState === 'pending' ? 'pending' : 'todo',
      required: true,
    },
    {
      id: 'address',
      title: 'Proof of address',
      status: kycState === 'approved' ? 'approved' : 'todo',
      required: false,
      hint: 'Required to lift the €10,000 deposit limit',
    },
    {
      id: 'source',
      title: 'Source-of-funds declaration',
      status: user.tier === 'platinum' ? 'approved' : 'todo',
      required: false,
      hint: 'Required for accounts > €100k or VIP tier',
    },
  ];

  const lim = LIMITS[kycState];

  const bannerBg =
    kycState === 'approved'
      ? 'linear-gradient(180deg, rgba(16,217,150,0.04), transparent)'
      : kycState === 'rejected'
        ? 'linear-gradient(180deg, rgba(255,59,92,0.05), transparent)'
        : 'linear-gradient(180deg, rgba(245,158,11,0.05), transparent)';

  const bannerBadgeBg =
    kycState === 'approved'
      ? 'var(--bull-dim)'
      : kycState === 'rejected'
        ? 'var(--bear-dim)'
        : 'var(--warn-dim)';
  const bannerBadgeColor =
    kycState === 'approved'
      ? 'var(--bull)'
      : kycState === 'rejected'
        ? 'var(--bear)'
        : 'var(--warn)';
  const bannerIcon =
    kycState === 'approved' ? 'ShieldCheck' : kycState === 'rejected' ? 'ShieldX' : 'ShieldAlert';

  const submit = () => {
    setKycState('pending');
    setActiveStep(null);
    toast.push({
      kind: 'warn',
      title: 'Submitted for review',
      detail: 'Average review · 4h',
    });
  };

  return (
    <>
      <section className="sec">
        <div className="card" style={{ background: bannerBg }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
            <span
              aria-hidden="true"
              style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                background: bannerBadgeBg,
                color: bannerBadgeColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ObsidianIcon name={bannerIcon} size={28} />
            </span>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 18,
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                }}
              >
                {kycState === 'approved' && 'Identity verified'}
                {kycState === 'pending' && 'Verification under review'}
                {kycState === 'rejected' && 'Verification rejected'}
                {kycState === 'todo' && 'Identity not verified'}
              </div>
              <div
                style={{ fontSize: 12, color: 'var(--fg2)', marginTop: 4, lineHeight: 1.5 }}
              >
                {kycState === 'approved' &&
                  `Tier ${user.tier.toUpperCase()} · all trading and funding features unlocked. Last reviewed ${user.joined}.`}
                {kycState === 'pending' &&
                  "Documents submitted on 2026-04-29. Average review time is 4 hours; you'll receive an email when complete."}
                {kycState === 'rejected' &&
                  "We couldn't verify your documents. Please resubmit a clearer government-issued ID."}
                {kycState === 'todo' &&
                  'Complete the steps below to unlock live trading, deposits and withdrawals. Takes ~5 minutes.'}
              </div>
              <div
                style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap' }}
              >
                <Stat label="Deposit limit" value={lim.deposit} />
                <Stat label="Withdrawal limit" value={lim.withdraw} />
                <Stat label="Leverage" value={lim.leverage} />
              </div>
            </div>
            {kycState !== 'approved' && (
              <button
                type="button"
                className="btn primary lg"
                onClick={() =>
                  toast.push({
                    kind: 'accent',
                    title: 'Verification flow opened',
                    detail: 'Sumsub · session #4419',
                  })
                }
              >
                <ObsidianIcon name="UploadCloud" size={14} />
                {kycState === 'pending' ? 'View submission' : 'Continue verification'}
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="sec-hd">
          <h2>Verification steps</h2>
          <div className="line" />
        </div>
        <div className="card flush">
          {steps.map((s, i) => {
            const indicatorBg =
              s.status === 'approved'
                ? 'var(--bull-dim)'
                : s.status === 'rejected'
                  ? 'var(--bear-dim)'
                  : s.status === 'pending'
                    ? 'var(--warn-dim)'
                    : 'var(--bg-elevated)';
            const indicatorColor =
              s.status === 'approved'
                ? 'var(--bull)'
                : s.status === 'rejected'
                  ? 'var(--bear)'
                  : s.status === 'pending'
                    ? 'var(--warn)'
                    : 'var(--fg3)';
            const indicatorBorder =
              s.status === 'approved'
                ? 'rgba(16,217,150,0.3)'
                : s.status === 'rejected'
                  ? 'rgba(255,59,92,0.3)'
                  : s.status === 'pending'
                    ? 'rgba(245,158,11,0.3)'
                    : 'var(--border)';
            return (
              <div
                key={s.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 18px',
                  borderBottom:
                    i < steps.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: indicatorBg,
                    color: indicatorColor,
                    border: `1px solid ${indicatorBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontFamily: 'var(--font-data)',
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {s.status === 'approved' && <ObsidianIcon name="Check" size={14} />}
                  {s.status === 'rejected' && <ObsidianIcon name="X" size={14} />}
                  {s.status === 'pending' && <ObsidianIcon name="Clock" size={12} />}
                  {s.status === 'todo' && i + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {s.title}
                    {!s.required && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 9,
                          fontWeight: 700,
                          color: 'var(--fg3)',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                        }}
                      >
                        Optional
                      </span>
                    )}
                  </div>
                  {s.hint && (
                    <div style={{ fontSize: 11, color: 'var(--fg3)', marginTop: 2 }}>
                      {s.hint}
                    </div>
                  )}
                </div>
                <ObsidianBadge
                  kind={
                    s.status === 'approved'
                      ? 'bull'
                      : s.status === 'rejected'
                        ? 'bear'
                        : s.status === 'pending'
                          ? 'warn'
                          : 'muted'
                  }
                  dot={s.status === 'pending'}
                >
                  {s.status === 'todo' ? 'Required' : s.status}
                </ObsidianBadge>
                {s.status === 'todo' && (
                  <button type="button" className="btn sm" onClick={() => setActiveStep(s)}>
                    Start
                  </button>
                )}
                {s.status === 'rejected' && (
                  <button type="button" className="btn sm danger">
                    Resubmit
                  </button>
                )}
                {s.status === 'approved' && (
                  <button type="button" className="btn sm ghost" aria-label="View document">
                    <ObsidianIcon name="Eye" size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="sec">
        <div className="sec-hd">
          <h2>Tiers & what they unlock</h2>
          <div className="line" />
        </div>
        <div className="grid g3">
          <TierCard
            tier="L1 · Basic"
            current={user.kycLevel === 1}
            bullets={['Demo accounts', 'Watch markets', 'Up to €2,000 / day deposit']}
          />
          <TierCard
            tier="L2 · Verified"
            current={user.kycLevel === 2}
            bullets={[
              'Live FX, indices, commodities',
              'Unlimited deposits & withdrawals',
              'Leverage up to 1:30 (retail)',
            ]}
          />
          <TierCard
            tier="L3 · Pro"
            current={user.kycLevel === 3}
            bullets={[
              'Leverage up to 1:500',
              'API & FIX access',
              'Source-of-funds approval required',
            ]}
          />
        </div>
      </section>

      <ConsoleModal
        open={!!activeStep}
        onClose={() => setActiveStep(null)}
        title={activeStep?.title ?? ''}
        icon="UploadCloud"
        footer={
          <>
            <button type="button" className="btn ghost" onClick={() => setActiveStep(null)}>
              Cancel
            </button>
            <button type="button" className="btn primary" onClick={submit}>
              Submit
            </button>
          </>
        }
      >
        <p
          style={{
            color: 'var(--fg2)',
            fontSize: 12,
            lineHeight: 1.5,
            marginBottom: 14,
          }}
        >
          Drag a clear photo of your document, or use your device camera. Files are encrypted in
          transit and at rest.
        </p>
        <div
          style={{
            border: '2px dashed var(--border-md)',
            borderRadius: 8,
            padding: 28,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            background: 'var(--bg-base)',
          }}
        >
          <ObsidianIcon name="ImageUp" size={28} strokeWidth={1.5} />
          <div style={{ fontSize: 13, fontWeight: 600 }}>Drop file or click to upload</div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--fg3)',
              fontFamily: 'var(--font-data)',
            }}
          >
            JPG, PNG, PDF · max 8MB
          </div>
        </div>
      </ConsoleModal>
    </>
  );
}
