'use client';
import { useState } from 'react';

// ─── COMPLIANCE CONFIG ────────────────────────────────────────────────────────
const HIGH_RISK_COUNTRIES = ['AF','BY','CF','CD','CU','ER','ET','GN','GW','HT','IR','IQ','KP','LB','LY','ML','MM','NI','RU','SO','SS','SD','SY','UA','VE','YE','ZW'];
const RESTRICTED_COUNTRIES = ['KP','IR','SY','CU','SD','RU','BY'];
const ALL_COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'CN', name: 'China',         flag: '🇨🇳' },
  { code: 'RU', name: 'Russia',        flag: '🇷🇺' },
  { code: 'IR', name: 'Iran',          flag: '🇮🇷' },
  { code: 'KP', name: 'North Korea',   flag: '🇰🇵' },
  { code: 'SY', name: 'Syria',         flag: '🇸🇾' },
  { code: 'BY', name: 'Belarus',       flag: '🇧🇾' },
  { code: 'CU', name: 'Cuba',          flag: '🇨🇺' },
  { code: 'SD', name: 'Sudan',         flag: '🇸🇩' },
  { code: 'AF', name: 'Afghanistan',   flag: '🇦🇫' },
];

function Toggle({ on, onChange, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div
        className={`toggle ${on ? 'on' : ''}`}
        onClick={() => onChange(!on)}
        style={{ cursor: 'pointer', flexShrink: 0 }}
      />
      {label && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
        {title}
      </div>
      {children}
    </div>
  );
}

export function ComplianceConfig() {
  const [cfg, setCfg] = useState({
    minKycDeposit:    'Full',
    minKycWithdraw:   'Full',
    minKycTrade:      'Basic',
    expiryAlertDays:  30,
    autoRestrictExpiry: true,
    negBalProtection: true,
    riskDisclosure:   true,
    appTest:          true,
    restricted: new Set(RESTRICTED_COUNTRIES),
    highRisk: new Set(HIGH_RISK_COUNTRIES),
  });
  const [saved, setSaved] = useState(false);

  const set = (k, v) => setCfg(c => ({ ...c, [k]: v }));

  const leverageCaps = [
    { jurisdiction: 'EU (ESMA)',    retail: '1:30', pro: '1:200', auto: true },
    { jurisdiction: 'UK (FCA)',     retail: '1:30', pro: '1:200', auto: true },
    { jurisdiction: 'Australia (ASIC)', retail: '1:30', pro: '1:500', auto: false },
    { jurisdiction: 'Custom',       retail: '1:100', pro: '1:500', auto: false },
  ];

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <div style={{ padding: '20px 0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>Compliance Configuration</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>KYC requirements · Jurisdiction controls · Regulatory settings</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}>
          {saved ? '✓ Saved' : 'Save Changes'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Left column */}
        <div>
          <Section title="KYC Requirements">
            {[
              ['Minimum KYC to deposit', 'minKycDeposit'],
              ['Minimum KYC to withdraw', 'minKycWithdraw'],
              ['Minimum KYC to trade', 'minKycTrade'],
            ].map(([label, field]) => (
              <div key={field} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
                <select className="select" style={{ width: 120 }} value={cfg[field]} onChange={e => set(field, e.target.value)}>
                  <option value="None">None</option>
                  <option value="Basic">Basic</option>
                  <option value="Standard">Standard</option>
                  <option value="Full">Full (Enhanced)</option>
                </select>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Document expiry alert (days before)</span>
              <input className="input" type="number" value={cfg.expiryAlertDays} onChange={e => set('expiryAlertDays', +e.target.value)} style={{ width: 70 }} />
            </div>
            <div style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <Toggle on={cfg.autoRestrictExpiry} onChange={v => set('autoRestrictExpiry', v)}
                label="Auto-restrict account when KYC expires" />
            </div>
          </Section>

          <Section title="Regulatory Settings">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Toggle on={cfg.negBalProtection} onChange={v => set('negBalProtection', v)}
                label="Negative balance protection" />
              <Toggle on={cfg.riskDisclosure} onChange={v => set('riskDisclosure', v)}
                label="Require risk disclosure before first trade" />
              <Toggle on={cfg.appTest} onChange={v => set('appTest', v)}
                label="Require appropriateness test" />
            </div>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }}>
              Upload appropriateness test questions (JSON)
            </button>
          </Section>

          <Section title="Leverage Caps by Jurisdiction">
            <div style={{ overflow: 'auto', borderRadius: 8, border: '1px solid var(--border)' }}>
              <table>
                <thead>
                  <tr>
                    {['Jurisdiction','Retail Max','Pro Max','Auto-enforced'].map(h => <th key={h} style={{ fontSize: 10 }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {leverageCaps.map((row, i) => (
                    <tr key={i}>
                      <td style={{ fontSize: 12, fontWeight: 500 }}>{row.jurisdiction}</td>
                      <td>
                        <input className="input" defaultValue={row.retail} style={{ width: 72, fontSize: 11 }} />
                      </td>
                      <td>
                        <input className="input" defaultValue={row.pro} style={{ width: 72, fontSize: 11 }} />
                      </td>
                      <td>
                        <span style={{ fontSize: 10, color: row.auto ? 'var(--bull)' : 'var(--text-tertiary)' }}>
                          {row.auto ? '✓ Auto' : '— Manual'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="btn btn-ghost btn-xs" style={{ marginTop: 8 }}>+ Add Country Rule</button>
          </Section>
        </div>

        {/* Right column */}
        <div>
          <Section title="Restricted Countries (OFAC/EU)">
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 10 }}>
              Clients from these countries cannot register or trade.
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {ALL_COUNTRIES.filter(c => cfg.restricted.has(c.code)).map(c => (
                <div key={c.code} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '3px 10px', borderRadius: 20,
                  background: 'var(--bear-muted)', border: '1px solid var(--bear-dim)',
                  fontSize: 11, color: 'var(--bear)',
                }}>
                  <span>{c.flag}</span> {c.name}
                  <span
                    style={{ cursor: 'pointer', opacity: 0.7 }}
                    onClick={() => set('restricted', new Set([...cfg.restricted].filter(x => x !== c.code)))}
                  >✕</span>
                </div>
              ))}
            </div>
            <button className="btn btn-ghost btn-xs">+ Add Country</button>
          </Section>

          <Section title="High-Risk Countries (Enhanced Due Diligence)">
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 10 }}>
              Clients from these jurisdictions require enhanced KYC.
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {ALL_COUNTRIES.filter(c => cfg.highRisk.has(c.code) && !cfg.restricted.has(c.code)).map(c => (
                <div key={c.code} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '3px 10px', borderRadius: 20,
                  background: 'var(--warn-muted)', border: '1px solid var(--warn-dim)',
                  fontSize: 11, color: 'var(--warn)',
                }}>
                  <span>{c.flag}</span> {c.name}
                </div>
              ))}
              <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>+{HIGH_RISK_COUNTRIES.length - 3} more...</span>
            </div>
            <button className="btn btn-ghost btn-xs">Manage List</button>
          </Section>

          <Section title="EULA">
            {[
              ['Current EULA version', 'v3.2'],
              ['Last updated', '2024-01-01'],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{l}</span>
                <span style={{ fontSize: 12, color: 'var(--text-primary)', fontFamily: 'var(--font-data)' }}>{v}</span>
              </div>
            ))}
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }}>Upload New EULA Version</button>
          </Section>
        </div>
      </div>
    </div>
  );
}

// ─── API SETTINGS ─────────────────────────────────────────────────────────────
const WEBHOOK_EVENTS = [
  'trade.executed','deposit.completed','withdrawal.approved',
  'kyc.approved','kyc.rejected','margin.call','client.registered','client.suspended',
];

const INITIAL_KEYS = [
  { id: 'k1', name: 'CRM Integration',    key: 'ak_live_••••••••••••••••4a8f', perms: ['read:clients','read:transactions'], created: '2023-06-01', lastUsed: '2024-01-15', expires: null },
  { id: 'k2', name: 'Reporting Webhook',  key: 'ak_live_••••••••••••••••2c31', perms: ['read:reports'], created: '2023-11-01', lastUsed: '2024-01-14', expires: '2024-12-31' },
];

const INITIAL_WEBHOOKS = [
  { id: 'w1', event: 'deposit.completed',   url: 'https://crm.partner.io/hooks/deposit',   status: 'Active', lastTrigger: '2024-01-15 12:34' },
  { id: 'w2', event: 'kyc.approved',         url: 'https://crm.partner.io/hooks/kyc',        status: 'Active', lastTrigger: '2024-01-15 09:15' },
  { id: 'w3', event: 'trade.executed',       url: 'https://analytics.internal.io/trades',   status: 'Active', lastTrigger: '2024-01-15 12:33' },
  { id: 'w4', event: 'margin.call',          url: 'https://alerts.internal.io/margin',      status: 'Error',  lastTrigger: '2024-01-15 07:22' },
];

export function APISettings() {
  const [keys, setKeys]             = useState(INITIAL_KEYS);
  const [webhooks, setWebhooks]     = useState(INITIAL_WEBHOOKS);
  const [showNewKey, setShowNewKey] = useState(false);
  const [showNewWH, setShowNewWH]   = useState(false);
  const [newKey, setNewKey]         = useState({ name: '', perms: new Set(), ip: '', expires: '' });
  const [generatedKey, setGenKey]   = useState(null);
  const [newWH, setNewWH]           = useState({ event: '', url: '', secret: '' });
  const [copiedKey, setCopied]      = useState(false);

  const ALL_PERMS = ['read:clients','write:clients','read:transactions','write:transactions','read:reports','read:instruments','write:instruments'];

  const generateKey = () => {
    const key = 'ak_live_' + Array.from({ length: 32 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
    const entry = { id: 'k' + Date.now(), name: newKey.name, key, perms: [...newKey.perms], created: new Date().toISOString().slice(0,10), lastUsed: 'Never', expires: newKey.expires || null };
    setKeys(k => [...k, entry]);
    setGenKey(key);
  };

  const copyKey = () => {
    navigator.clipboard?.writeText(generatedKey).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <div style={{ padding: '20px 0 16px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>API & Webhooks</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>Manage API keys and webhook endpoints</div>
      </div>

      {/* API Keys */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>API Keys</div>
          <button className="btn btn-primary btn-sm" onClick={() => { setShowNewKey(true); setGenKey(null); }}>+ Generate New Key</button>
        </div>

        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>{['Name','Key','Permissions','Created','Last Used','Expires',''].map(h => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {keys.map(k => (
                  <tr key={k.id}>
                    <td style={{ fontWeight: 500, fontSize: 12 }}>{k.name}</td>
                    <td style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--text-tertiary)' }}>{k.key}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        {k.perms.map(p => (
                          <span key={p} className="pill pill-accent" style={{ fontSize: 9 }}>{p}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-data)' }}>{k.created}</td>
                    <td style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'var(--font-data)' }}>{k.lastUsed}</td>
                    <td style={{ fontSize: 10, color: k.expires ? 'var(--warn)' : 'var(--text-tertiary)', fontFamily: 'var(--font-data)' }}>
                      {k.expires || 'Never'}
                    </td>
                    <td>
                      <button className="btn btn-danger btn-xs" onClick={() => setKeys(ks => ks.filter(x => x.id !== k.id))}>
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showNewKey && (
          <div style={{ marginTop: 14, background: 'var(--bg-2)', border: '1px solid var(--border-accent)', borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', marginBottom: 16 }}>Generate New API Key</div>
            {generatedKey ? (
              <div>
                <div style={{ padding: 14, background: 'var(--bull-muted)', border: '1px solid var(--bull-dim)', borderRadius: 8, marginBottom: 12 }}>
                  <div style={{ fontSize: 10, color: 'var(--bull)', fontWeight: 600, marginBottom: 6 }}>
                    ⚠ Copy this key now — it will not be shown again
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <code style={{ flex: 1, fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--bull)', wordBreak: 'break-all' }}>
                      {generatedKey}
                    </code>
                    <button className="btn btn-success btn-xs" onClick={copyKey}>
                      {copiedKey ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => { setShowNewKey(false); setNewKey({ name: '', perms: new Set(), ip: '', expires: '' }); }}>
                  Done
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                <div className="form-group">
                  <label className="label">Key Name</label>
                  <input className="input" placeholder="e.g. CRM Integration" value={newKey.name} onChange={e => setNewKey(k => ({ ...k, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="label">IP Whitelist (optional)</label>
                  <input className="input" placeholder="1.2.3.4, 5.6.7.8" value={newKey.ip} onChange={e => setNewKey(k => ({ ...k, ip: e.target.value }))} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="label">Permissions</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {ALL_PERMS.map(p => (
                      <label key={p} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 11, color: 'var(--text-secondary)' }}>
                        <input type="checkbox"
                          checked={newKey.perms.has(p)}
                          onChange={() => setNewKey(k => {
                            const perms = new Set(k.perms);
                            perms.has(p) ? perms.delete(p) : perms.add(p);
                            return { ...k, perms };
                          })}
                        />
                        {p}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="label">Expiry Date (optional)</label>
                  <input className="input" type="date" value={newKey.expires} onChange={e => setNewKey(k => ({ ...k, expires: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', paddingBottom: 16 }}>
                  <button className="btn btn-primary btn-sm" disabled={!newKey.name || newKey.perms.size === 0} onClick={generateKey}>
                    Generate Key
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowNewKey(false)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Webhooks */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Webhook Endpoints</div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowNewWH(true)}>+ Add Webhook</button>
        </div>

        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>{['Event','URL','Status','Last Triggered',''].map(h => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {webhooks.map(wh => (
                  <tr key={wh.id}>
                    <td style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--accent)' }}>{wh.event}</td>
                    <td style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--text-secondary)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {wh.url}
                    </td>
                    <td>
                      <span className={`pill ${wh.status === 'Active' ? 'pill-verified' : 'pill-bear'}`} style={{ fontSize: 10 }}>
                        {wh.status === 'Active' ? '● ' : '✗ '}{wh.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-data)' }}>{wh.lastTrigger}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-xs" onClick={() => alert(`Testing webhook: ${wh.event}`)}>Test</button>
                        <button className="btn btn-ghost btn-xs">Edit</button>
                        <button className="btn btn-danger btn-xs" onClick={() => setWebhooks(ws => ws.filter(w => w.id !== wh.id))}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showNewWH && (
          <div style={{ marginTop: 14, background: 'var(--bg-2)', border: '1px solid var(--border-accent)', borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', marginBottom: 16 }}>Add Webhook Endpoint</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div className="form-group">
                <label className="label">Event</label>
                <select className="select" value={newWH.event} onChange={e => setNewWH(w => ({ ...w, event: e.target.value }))}>
                  <option value="">Select event...</option>
                  {WEBHOOK_EVENTS.map(e => <option key={e}>{e}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Endpoint URL</label>
                <input className="input" placeholder="https://your-server.com/webhook" value={newWH.url} onChange={e => setNewWH(w => ({ ...w, url: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="label">Secret (for HMAC verification)</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input className="input" value={newWH.secret} placeholder="Auto-generated" onChange={e => setNewWH(w => ({ ...w, secret: e.target.value }))} />
                  <button className="btn btn-ghost btn-xs" onClick={() => setNewWH(w => ({ ...w, secret: 'whsec_' + Math.random().toString(36).slice(2, 18) }))}>
                    Generate
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', paddingBottom: 16 }}>
                <button
                  className="btn btn-primary btn-sm"
                  disabled={!newWH.event || !newWH.url}
                  onClick={() => {
                    setWebhooks(ws => [...ws, { id: 'w' + Date.now(), event: newWH.event, url: newWH.url, status: 'Active', lastTrigger: 'Never' }]);
                    setShowNewWH(false);
                    setNewWH({ event: '', url: '', secret: '' });
                  }}
                >
                  Add Webhook
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowNewWH(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ComplianceConfig;
