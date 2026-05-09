/**
 * File:        apps/ib-portal/src/app/(portal)/marketing/page.tsx
 * Module:      ib-portal · Marketing Materials
 * Purpose:     Broker-approved marketing assets — banners, email templates, presentations, brand
 *
 * Exports:
 *   - MarketingPage() — server component (static content, no interaction)
 *   - NOTE: tabs require client state — made client component
 *
 * Depends on:
 *   - ../../../lib/mock-data-context — useIBData
 *   - lucide-react                   — Download, Upload
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

'use client';

import { useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { cn } from '@obsidian/obsidian-ui';
import { useIBData } from '../../../lib/mock-data-context';

type MarketingTab = 'banners' | 'emails' | 'presentations' | 'brand';

function TagBadge({ tag }: { tag: string }) {
  const cls: Record<string, string> = {
    Onboarding: 'badge badge-bull',
    Content:    'badge badge-accent',
    Product:    'badge badge-purple',
    Retention:  'badge badge-warn',
    Event:      'badge badge-gold',
  };
  return <span className={cls[tag] ?? 'badge badge-muted'}>{tag}</span>;
}

export default function MarketingPage() {
  const { marketingBanners, emailTemplates } = useIBData();
  const [tab, setTab] = useState<MarketingTab>('banners');

  const tabs: { key: MarketingTab; label: string }[] = [
    { key: 'banners',       label: 'Banners'       },
    { key: 'emails',        label: 'Emails'        },
    { key: 'presentations', label: 'Presentations' },
    { key: 'brand',         label: 'Brand'         },
  ];

  const presentations = [
    { name: 'Introduction to Forex',   desc: 'FX basics for new clients',             slides: '42 slides' },
    { name: 'CFD Trading Explained',   desc: 'What are CFDs and how to trade them',    slides: '28 slides' },
    { name: 'Platform Walkthrough',    desc: 'ArcaFX platform feature guide',          slides: '36 slides' },
  ];

  const logoVariants = ['Light Background', 'Dark Background', 'Square Icon', 'Horizontal'];
  const brandColors = [
    { name: 'Primary Blue',   hex: '#1A56DB' },
    { name: 'Accent Green',   hex: '#10D996' },
    { name: 'Warning Amber',  hex: '#F59E0B' },
    { name: 'Background',     hex: '#06080A' },
  ];

  return (
    <div className="mx-auto max-w-[1400px] p-6 space-y-5">
      <div>
        <h1 className="font-display text-[22px] font-bold text-fg1">Marketing Materials</h1>
        <p className="mt-0.5 font-sans text-[13px] text-fg2">Broker-approved assets with your referral link pre-embedded</p>
      </div>

      <div className="tab-bar">
        {tabs.map(t => (
          <button key={t.key} className={cn('tab-btn', tab === t.key && 'active')} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Banners ── */}
      {tab === 'banners' && (
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <input className="input input-sm w-56" placeholder="Search by size or name..." />
            <button className="btn btn-ghost btn-sm ml-auto"><Download size={12} strokeWidth={2} />Download All</button>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
            {marketingBanners.map((b, i) => (
              <div key={i} className="card overflow-hidden hover:border-[var(--border-md)] transition-colors">
                <div
                  className="flex h-24 items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #0a1628, #0d1f38)' }}
                >
                  <div className="text-center">
                    <div className="font-display text-[13px] font-extrabold text-fg1">ArcaFX</div>
                    <div className="font-mono text-[9px] text-accent mt-0.5">{b.size}</div>
                  </div>
                </div>
                <div className="p-3">
                  <div className="font-sans text-[12px] font-semibold text-fg1">{b.name}</div>
                  <div className="font-mono text-[10px] text-fg3 mt-0.5">{b.size} · {b.type}</div>
                  <div className="mt-2 flex gap-1.5">
                    <button className="btn btn-ghost btn-xs">PNG</button>
                    {b.type.includes('HTML') && <button className="btn btn-ghost btn-xs">HTML</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-header">
              <div className="card-title">MY CUSTOM CREATIVES</div>
              <button className="btn btn-ghost btn-sm"><Upload size={12} strokeWidth={2} />Upload Creative</button>
            </div>
            <div className="border-t border-[var(--border)] py-10 text-center font-sans text-[13px] text-fg3">
              No custom creatives yet. Upload your own banners for compliance review.
            </div>
          </div>
        </div>
      )}

      {/* ── Emails ── */}
      {tab === 'emails' && (
        <div className="space-y-4">
          <div className="rounded-lg border border-accent/20 bg-accent/8 px-4 py-3 font-sans text-[12px] text-fg2">
            Your referral link and IB code are auto-inserted in all templates. Personalization tokens:{' '}
            <code className="font-mono text-accent">{'{{first_name}}'}</code>,{' '}
            <code className="font-mono text-accent">{'{{ib_link}}'}</code>
          </div>
          {emailTemplates.map((t, i) => (
            <div key={i} className="flex items-center gap-4 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-4 hover:border-[var(--border-md)] transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[var(--bg-panel)] text-[20px]">📧</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-sans text-[13px] font-semibold text-fg1">{t.name}</span>
                  <TagBadge tag={t.tag} />
                </div>
                <div className="font-sans text-[12px] italic text-fg2">"{t.subject}"</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button className="btn btn-ghost btn-sm">Preview</button>
                <button className="btn btn-ghost btn-sm">HTML</button>
                <button className="btn btn-ghost btn-sm">Plain</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Presentations ── */}
      {tab === 'presentations' && (
        <div className="card">
          {presentations.map((p, i) => (
            <div key={i} className={cn('flex items-center gap-4 p-4', i < presentations.length - 1 && 'border-b border-[var(--border)]')}>
              <div className="text-[32px]">📊</div>
              <div className="flex-1">
                <div className="font-sans text-[14px] font-semibold text-fg1 mb-0.5">{p.name}</div>
                <div className="font-sans text-[12px] text-fg2">{p.desc} · {p.slides}</div>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-ghost btn-sm">PPTX</button>
                <button className="btn btn-ghost btn-sm"><Download size={12} strokeWidth={2} />PDF</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Brand ── */}
      {tab === 'brand' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-4">
            <div className="mb-4 font-display text-[10px] tracking-[0.15em] text-fg2 uppercase">LOGO VARIANTS</div>
            {logoVariants.map((v, i) => (
              <div key={i} className={cn('flex items-center justify-between py-2.5', i < logoVariants.length - 1 && 'border-b border-[var(--border)]')}>
                <span className="font-sans text-[13px] text-fg2">{v}</span>
                <div className="flex gap-1.5">
                  <button className="btn btn-ghost btn-xs">SVG</button>
                  <button className="btn btn-ghost btn-xs">PNG</button>
                </div>
              </div>
            ))}
            <button className="btn btn-primary mt-4 w-full"><Download size={12} strokeWidth={2} />Download All Assets</button>
          </div>
          <div className="card p-4">
            <div className="mb-4 font-display text-[10px] tracking-[0.15em] text-fg2 uppercase">BRAND COLORS</div>
            {brandColors.map((c, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <div className="h-8 w-8 rounded-md border border-[var(--border)]" style={{ background: c.hex }} />
                <div>
                  <div className="font-sans text-[13px] font-medium text-fg1">{c.name}</div>
                  <div className="font-mono text-[11px] text-fg3">{c.hex}</div>
                </div>
              </div>
            ))}
            <button className="btn btn-ghost mt-4 w-full"><Download size={12} strokeWidth={2} />Brand Guidelines PDF</button>
          </div>
        </div>
      )}
    </div>
  );
}
