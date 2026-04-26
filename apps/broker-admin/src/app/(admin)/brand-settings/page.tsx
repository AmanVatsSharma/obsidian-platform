/**
 * File:        apps/broker-admin/src/app/(admin)/brand-settings/page.tsx
 * Module:      broker-admin · Platform · Brand Settings
 * Purpose:     Broker identity, contact details, color scheme, and legal document management
 *
 * Exports:
 *   - default (BrandSettingsPage) — tabbed brand editor with live terminal preview
 *
 * Depends on:
 *   - none (local state; mock broker data hardcoded)
 *
 * Side-effects:
 *   - Local state only; save action shows feedback briefly
 *
 * Key invariants:
 *   - All color inputs are hex strings; preview updates live
 *   - Legal doc re-accept flag controls whether clients must re-accept on next login
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

'use client';

import { useState } from 'react';
import { Save, Plus } from 'lucide-react';

type Brand = {
  name: string;
  legalName: string;
  tagline: string;
  supportEmail: string;
  supportPhone: string;
  address: string;
  regBody: string;
  licenseNo: string;
  primaryColor: string;
  bullColor: string;
  bearColor: string;
};

type LegalDoc = {
  id: string;
  label: string;
  version: string;
  effective: string;
  reaccept: boolean;
};

const DEFAULT_BRAND: Brand = {
  name: 'ArcaFX Markets',
  legalName: 'ArcaFX Markets Ltd.',
  tagline: 'Professional FX & CFD Trading',
  supportEmail: 'support@arcafx.com',
  supportPhone: '+1 800 ARCAFX',
  address: 'Suite 201, Oliaji Trade Centre, Victoria, Mahé, Seychelles',
  regBody: 'Seychelles FSA',
  licenseNo: 'SD052',
  primaryColor: '#3B82F6',
  bullColor: '#10D996',
  bearColor: '#FF3B5C',
};

const DEFAULT_LEGAL: LegalDoc[] = [
  { id: 'tos',     label: 'Terms & Conditions', version: 'v4.2', effective: '2024-01-01', reaccept: true  },
  { id: 'privacy', label: 'Privacy Policy',      version: 'v3.1', effective: '2023-08-01', reaccept: false },
  { id: 'risk',    label: 'Risk Disclosure',      version: 'v2.0', effective: '2023-01-01', reaccept: true  },
  { id: 'client',  label: 'Client Agreement',     version: 'v5.0', effective: '2024-01-01', reaccept: true  },
];

const FOOTER_LINKS = [
  { label: 'Terms & Conditions', url: '/legal/terms' },
  { label: 'Privacy Policy',     url: '/legal/privacy' },
  { label: 'Risk Disclosure',    url: '/legal/risk' },
  { label: 'Contact Us',         url: '/contact' },
  { label: 'FSA Registration',   url: 'https://fsaseychelles.sc' },
];

function ColorSwatch({ label, value, onChange }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="kpi-label mb-1 block">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={e => onChange(e.target.value)}
          className="h-8 w-12 cursor-pointer rounded border border-[var(--border)] bg-transparent" />
        <input className="input flex-1 mono-cell text-[11px]" value={value}
          onChange={e => onChange(e.target.value)} />
      </div>
    </div>
  );
}

function TerminalPreview({ brand }: { brand: Brand }) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-[#06080A] text-[11px]"
      style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
      {/* Mock topbar */}
      <div className="flex items-center justify-between border-b border-white/8 px-3 py-2"
        style={{ background: '#0C0E12' }}>
        <p className="font-display text-[13px] font-bold tracking-wide"
          style={{ color: brand.primaryColor }}>{brand.name}</p>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full" style={{ background: brand.bullColor }} />
          <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Live</p>
        </div>
      </div>
      {/* Mock instrument row */}
      <div className="flex items-center gap-4 border-b border-white/5 px-3 py-2">
        <p className="font-mono font-bold text-[12px] text-white">EUR/USD</p>
        <p className="font-mono text-[12px]" style={{ color: brand.bullColor }}>1.08942</p>
        <p className="font-mono text-[10px]" style={{ color: brand.bullColor }}>+0.18%</p>
      </div>
      {/* Mock buttons */}
      <div className="flex gap-2 p-3">
        <div className="flex-1 rounded py-1.5 text-center text-[11px] font-bold text-white"
          style={{ background: brand.bullColor + '30', border: `1px solid ${brand.bullColor}50` }}>
          BUY
        </div>
        <div className="flex-1 rounded py-1.5 text-center text-[11px] font-bold text-white"
          style={{ background: brand.bearColor + '30', border: `1px solid ${brand.bearColor}50` }}>
          SELL
        </div>
      </div>
      <div className="px-3 pb-2">
        <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Powered by {brand.name} · {brand.regBody} {brand.licenseNo}
        </p>
      </div>
    </div>
  );
}

export default function BrandSettingsPage() {
  const [brand, setBrand] = useState<Brand>(DEFAULT_BRAND);
  const [legal, setLegal] = useState<LegalDoc[]>(DEFAULT_LEGAL);
  const [tab, setTab] = useState<'identity' | 'colors' | 'legal' | 'footer'>('identity');
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof Brand>(k: K, v: Brand[K]) => setBrand(b => ({ ...b, [k]: v }));
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="flex flex-col">
      <div className="module-header">
        <div>
          <p className="module-title">Brand Settings</p>
          <p className="module-subtitle">Broker identity, colors, legal documents</p>
        </div>
        <button className="btn-primary btn btn-sm" onClick={handleSave}>
          <Save size={13} /> {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-[1fr_280px] gap-5">
          <div className="space-y-4">
            {/* Tabs */}
            <div className="chart-tabs">
              {(['identity', 'colors', 'legal', 'footer'] as const).map(t => (
                <button key={t} className={`chart-tab capitalize ${tab === t ? 'active' : ''}`}
                  onClick={() => setTab(t)}>{t}</button>
              ))}
            </div>

            <div className="card p-5">
              {/* Identity */}
              {tab === 'identity' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="kpi-label mb-1 block">Brand Name</label>
                    <input className="input" value={brand.name} onChange={e => set('name', e.target.value)} />
                  </div>
                  <div>
                    <label className="kpi-label mb-1 block">Legal Name</label>
                    <input className="input" value={brand.legalName} onChange={e => set('legalName', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <label className="kpi-label mb-1 block">Tagline</label>
                    <input className="input" value={brand.tagline} onChange={e => set('tagline', e.target.value)} />
                  </div>
                  <div>
                    <label className="kpi-label mb-1 block">Support Email</label>
                    <input className="input" type="email" value={brand.supportEmail} onChange={e => set('supportEmail', e.target.value)} />
                  </div>
                  <div>
                    <label className="kpi-label mb-1 block">Support Phone</label>
                    <input className="input" value={brand.supportPhone} onChange={e => set('supportPhone', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <label className="kpi-label mb-1 block">Registered Address</label>
                    <input className="input" value={brand.address} onChange={e => set('address', e.target.value)} />
                  </div>
                  <div>
                    <label className="kpi-label mb-1 block">Regulatory Body</label>
                    <input className="input" value={brand.regBody} onChange={e => set('regBody', e.target.value)} />
                  </div>
                  <div>
                    <label className="kpi-label mb-1 block">License Number</label>
                    <input className="input mono-cell" value={brand.licenseNo} onChange={e => set('licenseNo', e.target.value)} />
                  </div>
                </div>
              )}

              {/* Colors */}
              {tab === 'colors' && (
                <div className="grid grid-cols-3 gap-4">
                  <ColorSwatch label="Primary / Accent" value={brand.primaryColor} onChange={v => set('primaryColor', v)} />
                  <ColorSwatch label="Bull (Long / Up)"  value={brand.bullColor}    onChange={v => set('bullColor', v)} />
                  <ColorSwatch label="Bear (Short / Down)" value={brand.bearColor}  onChange={v => set('bearColor', v)} />
                  <div className="col-span-3 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3">
                    <p className="text-[11px] text-fg3">
                      Color changes affect the trader terminal, client portal, and all branded emails.
                      The dark background (#06080A) is fixed for readability.
                    </p>
                  </div>
                </div>
              )}

              {/* Legal docs */}
              {tab === 'legal' && (
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <button className="btn-ghost btn btn-sm"><Plus size={13} /> Upload Document</button>
                  </div>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Document</th>
                        <th>Version</th>
                        <th>Effective</th>
                        <th>Re-accept Required</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {legal.map(doc => (
                        <tr key={doc.id}>
                          <td className="text-[12px] font-medium text-fg1">{doc.label}</td>
                          <td className="mono-cell text-[11px] text-accent">{doc.version}</td>
                          <td className="mono-cell text-[11px] text-fg2">{doc.effective}</td>
                          <td>
                            <button
                              className={`relative h-5 w-9 rounded-full transition-colors ${doc.reaccept ? 'bg-bull/30' : 'bg-[var(--border-md)]'}`}
                              onClick={() => setLegal(ld => ld.map(d => d.id === doc.id ? { ...d, reaccept: !d.reaccept } : d))}>
                              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${doc.reaccept ? 'translate-x-4' : 'translate-x-0.5'}`} />
                            </button>
                          </td>
                          <td>
                            <button className="btn-ghost btn btn-xs">Edit</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Footer links */}
              {tab === 'footer' && (
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <button className="btn-ghost btn btn-sm"><Plus size={13} /> Add Link</button>
                  </div>
                  <div className="space-y-2">
                    {FOOTER_LINKS.map((link, i) => (
                      <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-center gap-3">
                        <input className="input text-[12px]" defaultValue={link.label} />
                        <input className="input mono-cell text-[11px]" defaultValue={link.url} />
                        <button className="btn-danger btn btn-xs">Del</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Live preview */}
          <div className="space-y-3">
            <p className="kpi-label">Live Preview</p>
            <TerminalPreview brand={brand} />
            <div className="rounded-lg border border-[var(--border)] p-3 text-[11px] space-y-1">
              <p className="kpi-label mb-1">Broker Identity</p>
              <p className="text-fg1 font-semibold">{brand.name}</p>
              <p className="text-fg3">{brand.legalName}</p>
              <p className="text-fg3">{brand.regBody} · {brand.licenseNo}</p>
              <p className="text-fg3 mt-2">{brand.supportEmail}</p>
              <p className="text-fg3">{brand.supportPhone}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
