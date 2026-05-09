/**
 * File:        apps/ib-portal/src/app/(portal)/referral-links/page.tsx
 * Module:      ib-portal · Referral Links
 * Purpose:     Per-channel tracking links — funnel stats, performance chart, create-new modal
 *
 * Exports:
 *   - ReferralLinksPage() — client component (create modal state)
 *
 * Depends on:
 *   - ../../../lib/mock-data-context — useIBData
 *   - lucide-react                   — Copy, Plus, X, QrCode
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

'use client';

import { useState } from 'react';
import { Copy, Plus, QrCode, X } from 'lucide-react';
import { cn } from '@obsidian/obsidian-ui';
import { useIBData } from '../../../lib/mock-data-context';

const fmt = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000   ? `$${(n / 1_000).toFixed(0)}K`
  : `$${n.toLocaleString()}`;

function LinkPerformanceChart({ history }: { history: number[][] }) {
  const colors = ['var(--bull)', 'var(--accent)', 'var(--warn)', '#A78BFA'];
  const W = 600, H = 120;
  const allVals = history.flat();
  const max = Math.max(...allVals);
  return (
    <svg viewBox={`0 0 ${W} ${H + 20}`} className="w-full overflow-visible">
      {history.map((series, li) => {
        const pts = series.map((v, i) => {
          const x = (i / (series.length - 1)) * W;
          const y = H - (v / max) * (H - 8) - 4;
          return `${x},${y}`;
        }).join(' ');
        return (
          <polyline key={li} points={pts} fill="none" stroke={colors[li]} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
        );
      })}
      {[0, 10, 20, 29].map(i => (
        <text key={i} x={(i / 29) * W} y={H + 16} textAnchor="middle" fill="var(--fg3)" fontSize="9" fontFamily="IBM Plex Mono">Mar {i + 1}</text>
      ))}
    </svg>
  );
}

function CreateLinkModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="absolute right-4 top-4 text-fg2 hover:text-fg1 transition-colors" onClick={onClose}>
          <X size={18} strokeWidth={2} />
        </button>
        <h2 className="font-display text-[18px] font-bold text-fg1 mb-4">Create New Referral Link</h2>
        {[
          { label: 'LINK NAME', placeholder: 'e.g. TikTok Bio', value: name, onChange: (v: string) => setName(v), type: 'input' as const },
          { label: 'UTM CAMPAIGN (OPTIONAL)', placeholder: 'e.g. spring_2026', type: 'input' as const },
          { label: 'PROMO CODE (OPTIONAL)', placeholder: 'e.g. WELCOME50', type: 'input' as const },
        ].map((f, i) => (
          <div key={i} className="mb-4">
            <label className="mb-1.5 block font-mono text-[10px] tracking-[0.1em] text-fg3 uppercase">{f.label}</label>
            <input
              className="input"
              placeholder={f.placeholder}
              value={'value' in f ? f.value : undefined}
              onChange={e => f.onChange?.(e.target.value)}
            />
          </div>
        ))}
        <div className="mb-5">
          <label className="mb-1.5 block font-mono text-[10px] tracking-[0.1em] text-fg3 uppercase">LANDING PAGE</label>
          <select className="input cursor-pointer">
            <option>Default Registration</option>
            <option>Free Demo Account</option>
            <option>Webinar Registration</option>
          </select>
        </div>
        <div className="flex gap-2.5">
          <button className="btn btn-ghost flex-1" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary flex-1" onClick={onClose}>Create Link</button>
        </div>
      </div>
    </div>
  );
}

export default function ReferralLinksPage() {
  const { ib, referralLinks, linkSignupHistory } = useIBData();
  const [showModal, setShowModal] = useState(false);

  const bestLink = referralLinks.reduce((a, b) => a.conv > b.conv ? a : b);
  const colors = ['var(--bull)', 'var(--accent)', 'var(--warn)', '#A78BFA'];

  const convClass = (c: number) =>
    c > 4 ? 'bg-bull/10 border border-bull/20 text-bull'
    : c > 2 ? 'bg-accent/10 border border-accent/20 text-accent'
    : 'bg-warn/10 border border-warn/20 text-warn';

  return (
    <div className="mx-auto max-w-[1400px] p-6 space-y-5">
      <div>
        <h1 className="font-display text-[22px] font-bold text-fg1">Referral Links</h1>
        <p className="mt-0.5 font-sans text-[13px] text-fg2">Track every channel — know exactly where your best clients come from</p>
      </div>

      {/* Default link */}
      <div className="card p-4">
        <div className="mb-3 font-display text-[10px] tracking-[0.15em] text-fg2 uppercase">DEFAULT REFERRAL LINK</div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex-1 min-w-0 rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-3.5 py-2.5 font-mono text-[13px] text-accent truncate">
            https://arcafx.com/join?ref={ib.code}
          </div>
          <button className="btn btn-ghost btn-sm shrink-0"><Copy size={12} strokeWidth={2} />Copy</button>
          <button className="btn btn-ghost btn-sm shrink-0"><QrCode size={12} strokeWidth={2} />QR Code</button>
        </div>
      </div>

      {/* Best performer callout */}
      <div className="flex items-center gap-3 rounded-lg border border-bull/20 bg-bull/8 px-4 py-3">
        <span className="font-sans text-[13px] text-fg2">
          Best performer: <strong className="text-bull">{bestLink.name}</strong>
          {' — '}
          <span className="font-mono text-[12px]">{bestLink.conv}% click-to-deposit conversion</span>
        </span>
      </div>

      {/* Performance chart */}
      <div className="card p-5">
        <div className="mb-3 font-display text-[10px] tracking-[0.15em] text-fg2 uppercase">SIGNUPS OVER TIME — MARCH 2026</div>
        <LinkPerformanceChart history={linkSignupHistory} />
        <div className="mt-3 flex gap-4 flex-wrap">
          {referralLinks.map((l, i) => (
            <div key={i} className="flex items-center gap-1.5 font-sans text-[11px] text-fg2">
              <div className="h-2 w-2 rounded-sm" style={{ background: colors[i] }} />
              {l.name}
            </div>
          ))}
        </div>
      </div>

      {/* Links header */}
      <div className="flex items-center justify-between">
        <div className="font-display text-[10px] tracking-[0.15em] text-fg2 uppercase">CUSTOM LINKS ({referralLinks.length})</div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
          <Plus size={12} strokeWidth={2} />Create New Link
        </button>
      </div>

      {/* Link cards */}
      {referralLinks.map((l, i) => (
        <div
          key={i}
          className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-4 hover:border-[var(--border-md)] transition-colors"
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="font-sans text-[13px] font-semibold text-fg1">{l.name}</span>
              </div>
              <div className="font-mono text-[11px] text-accent">{l.short}</div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn('rounded px-2 py-0.5 font-mono text-[12px]', convClass(l.conv))}>
                {l.conv}% conv.
              </span>
              <button className="btn btn-ghost btn-sm"><Copy size={11} strokeWidth={2} />Copy</button>
              <button className="btn btn-ghost btn-sm"><QrCode size={11} strokeWidth={2} />QR</button>
              <button className="btn btn-ghost btn-sm">Analytics</button>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-3 flex gap-5 flex-wrap">
            {[
              ['Clicks',     l.clicks.toLocaleString(), false],
              ['Signups',    String(l.signups),          false],
              ['Verified',   String(l.verified),         false],
              ['Deposited',  String(l.deposited),        false],
              ['Volume',     fmt(l.volume),              false],
              ['Commission', `$${l.commission.toLocaleString()}`, true],
            ].map(([label, val, isBull]) => (
              <div key={label as string}>
                <div className={cn('font-mono text-[14px] font-semibold', isBull ? 'text-bull' : 'text-fg1')}>{val}</div>
                <div className="font-mono text-[10px] text-fg3 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Funnel bar */}
          <div className="mt-3 flex h-1 gap-0.5 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
            <div className="h-full rounded-l-full bg-accent/40"  style={{ width: '100%' }} />
            <div className="h-full bg-accent/70"                  style={{ width: `${(l.signups / l.clicks) * 100}%` }} />
            <div className="h-full bg-warn"                       style={{ width: `${(l.verified / l.clicks) * 100}%` }} />
            <div className="h-full rounded-r-full bg-bull"        style={{ width: `${(l.deposited / l.clicks) * 100}%` }} />
          </div>
          <div className="mt-1.5 flex gap-4 font-mono text-[10px] text-fg3">
            <span className="text-accent">■ Signups</span>
            <span className="text-warn">■ Verified</span>
            <span className="text-bull">■ Deposited</span>
          </div>
        </div>
      ))}

      {showModal && <CreateLinkModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
