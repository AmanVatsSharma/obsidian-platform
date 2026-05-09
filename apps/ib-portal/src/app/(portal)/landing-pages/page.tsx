/**
 * File:        apps/ib-portal/src/app/(portal)/landing-pages/page.tsx
 * Module:      ib-portal · Landing Pages
 * Purpose:     Broker-hosted microsite builder — template picker, config form, live preview
 *
 * Exports:
 *   - LandingPagesPage() — client component (template select, form state)
 *
 * Depends on:
 *   - ../../../lib/mock-data-context — useIBData
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

'use client';

import { useState } from 'react';
import { cn } from '@obsidian/obsidian-ui';
import { useIBData } from '../../../lib/mock-data-context';

const TEMPLATE_ICONS: Record<string, string> = {
  demo:       '🖥️',
  classic:    '📝',
  comparison: '⚖️',
  webinar:    '🎥',
  platform:   '🚀',
  analysis:   '📈',
};

const LANGS = ['EN', 'AR', 'ES', 'DE', 'FR', 'PT'];

export default function LandingPagesPage() {
  const { lpTemplates } = useIBData();
  const [selected, setSelected] = useState('demo');
  const [headline, setHeadline] = useState('Start Trading with a Free Demo Account');
  const [subline, setSubline] = useState('Trade 250+ instruments with $50,000 virtual funds. No risk, real markets.');
  const [slug, setSlug] = useState('james-liu-fx');
  const [lang, setLang] = useState('EN');
  const [promoCode, setPromoCode] = useState('');

  return (
    <div className="mx-auto max-w-[1400px] p-6 space-y-5">
      <div>
        <h1 className="font-display text-[22px] font-bold text-fg1">Landing Pages</h1>
        <p className="mt-0.5 font-sans text-[13px] text-fg2">Broker-hosted microsites personalized for your audience</p>
      </div>

      {/* Template picker */}
      <div>
        <div className="mb-3 font-display text-[10px] tracking-[0.15em] text-fg2 uppercase">AVAILABLE TEMPLATES</div>
        <div className="grid grid-cols-3 gap-3 lg:grid-cols-6">
          {lpTemplates.map(t => (
            <button
              key={t.id}
              className={cn(
                'rounded-lg border-2 p-3.5 text-center cursor-pointer transition-colors',
                selected === t.id
                  ? 'border-accent bg-accent/10'
                  : 'border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--border-md)]',
              )}
              onClick={() => setSelected(t.id)}
            >
              <div className="mb-2 text-[28px]">{TEMPLATE_ICONS[t.id]}</div>
              <div className="font-sans text-[12px] font-semibold text-fg1">{t.name}</div>
              <div className="mt-0.5 font-sans text-[11px] text-fg3">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="font-display text-[10px] tracking-[0.15em] text-fg2 uppercase">ACTIVE CONFIGURATION</div>

      {/* Config + Preview grid */}
      <div className="grid grid-cols-2 gap-5">
        {/* Config form */}
        <div className="space-y-4">
          <div className="card p-4 space-y-4">
            {/* Headline */}
            <div>
              <label className="mb-1.5 block font-mono text-[10px] tracking-[0.1em] text-fg3 uppercase">HEADLINE (MAX 60 CHARS)</label>
              <input
                className="input"
                value={headline}
                onChange={e => setHeadline(e.target.value.slice(0, 60))}
              />
              <div className="mt-1 font-mono text-[10px] text-fg3">{headline.length}/60</div>
            </div>

            {/* Sub-headline */}
            <div>
              <label className="mb-1.5 block font-mono text-[10px] tracking-[0.1em] text-fg3 uppercase">SUB-HEADLINE (MAX 120 CHARS)</label>
              <textarea
                className="input h-16 resize-none py-2"
                value={subline}
                onChange={e => setSubline(e.target.value.slice(0, 120))}
              />
              <div className="mt-1 font-mono text-[10px] text-fg3">{subline.length}/120</div>
            </div>

            {/* URL slug */}
            <div>
              <label className="mb-1.5 block font-mono text-[10px] tracking-[0.1em] text-fg3 uppercase">CUSTOM URL SLUG</label>
              <div className="flex">
                <div className="flex items-center rounded-l-md border border-r-0 border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 font-mono text-[12px] text-fg3 whitespace-nowrap">
                  arcafx.com/
                </div>
                <input
                  className="input rounded-l-none border-l-0"
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                />
              </div>
            </div>

            {/* Language */}
            <div>
              <label className="mb-1.5 block font-mono text-[10px] tracking-[0.1em] text-fg3 uppercase">LANGUAGE</label>
              <div className="flex gap-1.5 flex-wrap">
                {LANGS.map(l => (
                  <button
                    key={l}
                    className={cn('filter-pill', lang === l && 'active')}
                    onClick={() => setLang(l)}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Promo code */}
            <div>
              <label className="mb-1.5 block font-mono text-[10px] tracking-[0.1em] text-fg3 uppercase">PROMO CODE (OPTIONAL)</label>
              <input
                className="input"
                placeholder="e.g. JAMES50"
                value={promoCode}
                onChange={e => setPromoCode(e.target.value)}
              />
            </div>

            <div className="flex gap-2.5 pt-1">
              <button className="btn btn-primary flex-1">Save & Publish</button>
              <button className="btn btn-ghost">Reset</button>
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-3">
            {[['1,842', 'Views this month'], ['64', 'Conversions'], ['3.5%', 'Conv. Rate']].map(([v, l]) => (
              <div key={l} className="rounded-md bg-[var(--bg-elevated)] border border-[var(--border)] p-3 text-center">
                <div className="font-mono text-[18px] font-bold text-fg1">{v}</div>
                <div className="mt-0.5 font-sans text-[11px] text-fg3">{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Live preview */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2.5">
            <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.15em] text-fg3 uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-bull" />LIVE PREVIEW
            </span>
            <span className="font-mono text-[10px] text-accent">arcafx.com/{slug}</span>
          </div>
          <div
            className="flex min-h-[340px] flex-col items-center justify-center p-6 text-center"
            style={{ background: 'linear-gradient(135deg, #0a0d12, #070910)' }}
          >
            <div className="mb-3 font-mono text-[10px] tracking-[0.2em] text-accent uppercase">ArcaFX Markets</div>
            <div className="mb-2 font-display text-[20px] font-extrabold text-fg1 max-w-[260px]">
              {headline || 'Enter a headline...'}
            </div>
            <div className="mb-5 font-sans text-[13px] text-fg2 max-w-[260px]">
              {subline || 'Enter a sub-headline...'}
            </div>
            {/* Mock form */}
            <div className="mb-4 w-full max-w-[280px] space-y-2.5 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-5">
              {['Full Name', 'Email Address', 'Phone Number'].map(f => (
                <div key={f} className="rounded bg-[rgba(255,255,255,0.04)] px-3 py-2 font-mono text-[11px] text-fg3">{f}</div>
              ))}
            </div>
            <div className="rounded-md bg-accent px-6 py-2.5 font-sans text-[14px] font-semibold text-white">
              Open Free Demo →
            </div>
            <div className="mt-3 font-sans text-[10px] text-fg3">Trading involves risk. Capital at risk.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
