'use client';
import { useState, useCallback } from 'react';
import { broker } from '../../lib/mockData';

const DEFAULT_BRAND = {
  name: broker.name,
  legalName: broker.legalName,
  tagline: 'Professional FX & CFD Trading',
  supportEmail: 'support@arcafx.com',
  supportPhone: '+1 800 ARCAFX',
  liveChatUrl: 'https://chat.arcafx.com',
  address: 'Suite 201, Oliaji Trade Centre, Victoria, Mahé, Seychelles',
  regBody: 'Seychelles FSA',
  licenseNo: broker.licenseNumber,
  licenseCountry: 'Seychelles',
  primaryColor: '#3B82F6',
  bullColor: '#10D996',
  bearColor: '#FF3B5C',
  bgShade: 'current',
};

const LEGAL_DOCS = [
  { id: 'tos',     label: 'Terms & Conditions',  version: 'v4.2', effective: '2024-01-01', reaccept: true },
  { id: 'privacy', label: 'Privacy Policy',       version: 'v3.1', effective: '2023-08-01', reaccept: false },
  { id: 'risk',    label: 'Risk Disclosure',       version: 'v2.0', effective: '2023-01-01', reaccept: true },
  { id: 'client',  label: 'Client Agreement',      version: 'v5.0', effective: '2024-01-01', reaccept: true },
];

const DEFAULT_FOOTER_LINKS = [
  { id: 1, label: 'Terms & Conditions',  url: '/legal/terms',   newTab: false },
  { id: 2, label: 'Privacy Policy',      url: '/legal/privacy', newTab: false },
  { id: 3, label: 'Risk Disclosure',     url: '/legal/risk',    newTab: false },
  { id: 4, label: 'Contact Us',          url: '/contact',       newTab: false },
  { id: 5, label: 'FSA Registration',    url: 'https://fsaseychelles.sc', newTab: true },
];

function ColorSwatch({ label, value, onChange }) {
  return (
    <div className="form-group">
      <label className="label">{label}</label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 6,
            background: value, border: '1px solid var(--border-strong)',
            cursor: 'pointer', flexShrink: 0,
          }} onClick={() => document.getElementById(`cp-${label}`).click()} />
          <input
            id={`cp-${label}`}
            type="color"
            value={value}
            onChange={e => onChange(e.target.value)}
            style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
          />
        </div>
        <input
          className="input"
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ fontFamily: 'var(--font-data)', fontSize: 11 }}
        />
      </div>
    </div>
  );
}

// Mini client terminal preview
function TerminalPreview({ brand }) {
  const accent = brand.primaryColor;
  const bull   = brand.bullColor;
  const bear   = brand.bearColor;

  return (
    <div style={{
      background: '#06080A', borderRadius: 10,
      border: '1px solid rgba(255,255,255,0.08)',
      overflow: 'hidden', fontSize: 11,
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
    }}>
      {/* Mini topbar */}
      <div style={{ background: '#0C0E12', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ width: 16, height: 16, background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: 'white', fontWeight: 700 }}>A</div>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#F0F2F5' }}>{brand.name}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {['EUR/USD','GBP/USD','XAUUSD'].map(sym => (
            <div key={sym} style={{ padding: '2px 6px', background: 'rgba(255,255,255,0.04)', borderRadius: 4, fontSize: 9, color: '#8B9AB0' }}>{sym}</div>
          ))}
        </div>
      </div>
      {/* Mini chart area */}
      <div style={{ padding: '10px 12px', display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ color: '#8B9AB0', fontSize: 9 }}>EUR / USD</span>
            <span style={{ color: bull, fontSize: 9, fontFamily: 'monospace' }}>+0.12%</span>
          </div>
          <svg width="100%" height="48" viewBox="0 0 200 48">
            <defs>
              <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accent} stopOpacity="0.3"/>
                <stop offset="100%" stopColor={accent} stopOpacity="0.02"/>
              </linearGradient>
            </defs>
            <path d="M0 38 L20 35 L40 32 L60 34 L80 28 L100 24 L120 26 L140 20 L160 16 L180 12 L200 8 L200 48 L0 48 Z" fill="url(#pg)" />
            <path d="M0 38 L20 35 L40 32 L60 34 L80 28 L100 24 L120 26 L140 20 L160 16 L180 12 L200 8" fill="none" stroke={accent} strokeWidth="1.5" />
          </svg>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <button style={{ flex: 1, padding: '5px 0', background: `${bull}22`, border: `1px solid ${bull}44`, borderRadius: 4, color: bull, fontSize: 9, fontWeight: 600, cursor: 'pointer' }}>BUY 1.0852</button>
            <button style={{ flex: 1, padding: '5px 0', background: `${bear}22`, border: `1px solid ${bear}44`, borderRadius: 4, color: bear, fontSize: 9, fontWeight: 600, cursor: 'pointer' }}>SELL 1.0850</button>
          </div>
        </div>
        <div style={{ width: 110, background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: '8px 10px' }}>
          <div style={{ fontSize: 9, color: '#4A5568', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Open Positions</div>
          {[['EUR/USD','BUY','+$124',bull],['XAUUSD','SELL','-$42',bear]].map(([s,side,pnl,c]) => (
            <div key={s} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize: 9, color: '#8B9AB0' }}>{s}</span>
              <span style={{ fontSize: 9, color: c, fontFamily: 'monospace' }}>{pnl}</span>
            </div>
          ))}
          <button style={{ width: '100%', marginTop: 8, padding: '4px 0', background: `${accent}22`, border: `1px solid ${accent}44`, borderRadius: 4, color: accent, fontSize: 9, cursor: 'pointer' }}>
            + New Trade
          </button>
        </div>
      </div>
      <div style={{ padding: '6px 12px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: 12 }}>
        {[brand.regBody, brand.licenseNo].map(t => (
          <span key={t} style={{ fontSize: 8, color: '#4A5568' }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

export default function BrandSettings() {
  const [brand, setBrand]       = useState(DEFAULT_BRAND);
  const [footerLinks, setLinks] = useState(DEFAULT_FOOTER_LINKS);
  const [tab, setTab]           = useState('identity');
  const [saved, setSaved]       = useState(false);

  const set = useCallback((k, v) => setBrand(b => ({ ...b, [k]: v })), []);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const TABS = ['identity','colors','legal','footer'];

  const Field = ({ label, field, type = 'text', placeholder }) => (
    <div className="form-group">
      <label className="label">{label}</label>
      <input className="input" type={type} value={brand[field]} placeholder={placeholder}
        onChange={e => set(field, e.target.value)} />
    </div>
  );

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <div style={{ padding: '20px 0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>Brand Settings</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
            White-label identity configuration for {brand.name}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {saved && <span style={{ fontSize: 12, color: 'var(--bull)', display: 'flex', alignItems: 'center', gap: 6 }}>✓ Changes saved</span>}
          <button className="btn btn-ghost btn-sm" onClick={() => alert('Opening client terminal preview...')}>Preview Changes ↗</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave}>Apply to Platform</button>
        </div>
      </div>

      <div className="tabs" style={{ padding: 0, marginBottom: 20 }}>
        {TABS.map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
        {/* Left: form */}
        <div className="card" style={{ padding: 24 }}>
          {tab === 'identity' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
              <Field label="Brand Name"        field="name"        placeholder="ArcaFX Markets" />
              <Field label="Legal Entity Name" field="legalName"   placeholder="ArcaFX Ltd" />
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="label">Logo</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  {['Light version','Dark version'].map(variant => (
                    <div key={variant} style={{
                      flex: 1, height: 80, border: '1px dashed var(--border-strong)',
                      borderRadius: 8, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', gap: 4,
                      cursor: 'pointer', background: variant === 'Dark version' ? '#1a1a1a' : 'white',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
                    >
                      <div style={{ fontSize: 20, opacity: 0.4 }}>🖼</div>
                      <span style={{ fontSize: 10, color: variant === 'Dark version' ? '#666' : '#999' }}>{variant}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 6, fontSize: 10, color: 'var(--text-tertiary)' }}>SVG/PNG · min 200×50px · transparent background</div>
              </div>
              <div className="form-group">
                <label className="label">Favicon</label>
                <div style={{
                  width: 64, height: 64, border: '1px dashed var(--border-strong)',
                  borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', fontSize: 20,
                }} onClick={() => alert('Upload favicon')}>🖼</div>
              </div>
              <Field label="Company Tagline"   field="tagline"     placeholder="Professional FX Trading" />
              <Field label="Support Email"     field="supportEmail" type="email" />
              <Field label="Support Phone"     field="supportPhone" />
              <Field label="Live Chat URL"     field="liveChatUrl"  type="url" />
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="label">Registered Address</label>
                <input className="input" value={brand.address} onChange={e => set('address', e.target.value)} />
              </div>
              <Field label="Regulatory Body"  field="regBody" />
              <Field label="License Number"   field="licenseNo" />
              <Field label="License Country"  field="licenseCountry" />
            </div>
          )}

          {tab === 'colors' && (
            <div>
              <div style={{ marginBottom: 20, padding: '10px 14px', background: 'var(--warn-muted)', border: '1px solid var(--warn-dim)', borderRadius: 8, fontSize: 11, color: 'var(--warn)' }}>
                ⚠ Color changes update the client terminal for all {broker.totalClients.toLocaleString()} clients immediately
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                <ColorSwatch label="Primary Accent"   value={brand.primaryColor} onChange={v => set('primaryColor', v)} />
                <ColorSwatch label="Bull / Positive"  value={brand.bullColor}    onChange={v => set('bullColor', v)} />
                <ColorSwatch label="Bear / Negative"  value={brand.bearColor}    onChange={v => set('bearColor', v)} />
                <div className="form-group">
                  <label className="label">Background Shade</label>
                  <select className="select" value={brand.bgShade} onChange={e => set('bgShade', e.target.value)}>
                    <option value="darker">Darker (#040608)</option>
                    <option value="current">Current (#06080A)</option>
                    <option value="lighter">Lighter (#0A0D11)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {tab === 'legal' && (
            <div>
              {LEGAL_DOCS.map(doc => (
                <div key={doc.id} style={{ padding: '14px 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 3 }}>{doc.label}</div>
                    <div style={{ display: 'flex', gap: 10, fontSize: 10, color: 'var(--text-tertiary)' }}>
                      <span style={{ fontFamily: 'var(--font-data)' }}>{doc.version}</span>
                      <span>Effective: {doc.effective}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                      <input type="checkbox" defaultChecked={doc.reaccept} />
                      Requires re-acceptance
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost btn-xs">View</button>
                    <button className="btn btn-ghost btn-xs">Upload new</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'footer' && (
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 14 }}>
                Drag to reorder. Links appear in the client platform footer.
              </div>
              {footerLinks.map((link, i) => (
                <div key={link.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: 14, cursor: 'grab', userSelect: 'none' }}>⠿</span>
                  <input className="input" value={link.label} style={{ width: 160 }}
                    onChange={e => setLinks(ls => ls.map(l => l.id === link.id ? { ...l, label: e.target.value } : l))} />
                  <input className="input" value={link.url} style={{ flex: 1 }}
                    onChange={e => setLinks(ls => ls.map(l => l.id === link.id ? { ...l, url: e.target.value } : l))} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    <input type="checkbox" checked={link.newTab}
                      onChange={e => setLinks(ls => ls.map(l => l.id === link.id ? { ...l, newTab: e.target.checked } : l))} />
                    New tab
                  </label>
                  <button className="btn btn-ghost btn-xs" style={{ color: 'var(--bear)' }}
                    onClick={() => setLinks(ls => ls.filter(l => l.id !== link.id))}>✕</button>
                </div>
              ))}
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }}
                onClick={() => setLinks(ls => [...ls, { id: Date.now(), label: 'New Link', url: '/', newTab: false }])}>
                + Add Link
              </button>
            </div>
          )}
        </div>

        {/* Right: live preview */}
        <div style={{ position: 'sticky', top: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: 10 }}>
            Live Preview
          </div>
          <TerminalPreview brand={brand} />
          <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--bg-2)', borderRadius: 8, fontSize: 10, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
            Preview reflects current settings. Click "Apply to Platform" to push changes to all {broker.totalClients.toLocaleString()} clients.
          </div>
        </div>
      </div>
    </div>
  );
}
