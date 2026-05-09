'use client';
import { useState } from 'react';
import { clients } from '../../lib/mockData';
import { toast } from '../shared/Toast';

// ─── MOCK DATA ─────────────────────────────────────────────────────────────────
const INITIAL_BONUSES = [
  { id: 'B001', clientId: 'C1002', clientName: 'Fatima Al-Rashidi', type: 'Deposit Match', amount: 500, wagering: 10000, progress: 6240, expiry: '2024-02-28', status: 'Active' },
  { id: 'B002', clientId: 'C1003', clientName: 'James Okafor',      type: 'No-Deposit',   amount: 200, wagering: 8000,  progress: 3150, expiry: '2024-01-31', status: 'Active' },
  { id: 'B003', clientId: 'C1006', clientName: 'Lucas Oliveira',    type: 'Loyalty',      amount: 150, wagering: 5000,  progress: 4800, expiry: '2024-03-15', status: 'Active' },
  { id: 'B004', clientId: 'C1010', clientName: 'Anna Kowalski',     type: 'Welcome',      amount: 50,  wagering: 2000,  progress: 420,  expiry: '2024-02-13', status: 'Active' },
  { id: 'B005', clientId: 'C1019', clientName: 'Grace Osei',        type: 'Referral',     amount: 100, wagering: 3000,  progress: 2940, expiry: '2024-01-30', status: 'Active' },
  { id: 'B006', clientId: 'C1016', clientName: 'Hannah Mueller',    type: 'Deposit Match',amount: 0,   wagering: 1500,  progress: 1500, expiry: '2024-01-01', status: 'Completed' },
];

const INITIAL_CAMPAIGNS = [
  { id: 'CAM001', name: 'January Welcome Bonus', type: 'Deposit Match', pct: 100, maxAmount: 500, budget: 20000, given: 4, totalGiven: 1850, active: true, start: '2024-01-01', end: '2024-01-31', wagering: 20, minDeposit: 200, eligibility: ['Retail'] },
  { id: 'CAM002', name: 'No Deposit Promo — New Signups', type: 'No-Deposit', pct: null, maxAmount: 50, budget: 5000, given: 12, totalGiven: 600, active: true, start: '2024-01-10', end: '2024-01-31', wagering: 40, minDeposit: 0, eligibility: ['Retail'] },
  { id: 'CAM003', name: 'VIP Loyalty Reward Q1', type: 'Loyalty', pct: null, maxAmount: 1000, budget: 15000, given: 8, totalGiven: 4500, active: true, start: '2024-01-01', end: '2024-03-31', wagering: 10, minDeposit: 0, eligibility: ['VIP'] },
  { id: 'CAM004', name: 'Refer a Friend — Dec', type: 'Referral', pct: null, maxAmount: 100, budget: 3000, given: 18, totalGiven: 1800, active: false, start: '2023-12-01', end: '2023-12-31', wagering: 30, minDeposit: 100, eligibility: ['Retail','Pro'] },
];

const BONUS_TYPES = ['Deposit Match','No-Deposit','Loyalty','Referral Reward','Free Margin'];
const ACCOUNT_TYPES = ['Retail','Pro','VIP','All'];

// ─── WAGERING PROGRESS BAR ────────────────────────────────────────────────────
function WageringBar({ progress, wagering }) {
  const pct = Math.min(100, (progress / wagering) * 100);
  const color = pct >= 100 ? 'var(--bull)' : pct >= 60 ? 'var(--accent)' : 'var(--text-tertiary)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 5, background: 'var(--bg-4)', borderRadius: 3, overflow: 'hidden', minWidth: 60 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: 10, fontFamily: 'var(--font-data)', color, minWidth: 32, textAlign: 'right' }}>
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}

// ─── EXPIRY COUNTDOWN ─────────────────────────────────────────────────────────
function ExpiryBadge({ expiry }) {
  const days = Math.ceil((new Date(expiry) - new Date('2024-01-15')) / 86400000);
  if (days <= 0) return <span className="pill pill-muted" style={{ fontSize: 10 }}>Expired</span>;
  if (days <= 7)  return <span className="pill pill-bear" style={{ fontSize: 10 }}>⚠ {days}d left</span>;
  if (days <= 14) return <span className="pill pill-warn" style={{ fontSize: 10 }}>{days}d left</span>;
  return <span className="pill pill-muted" style={{ fontSize: 10 }}>{days}d left</span>;
}

// ─── CREATE CAMPAIGN MODAL ────────────────────────────────────────────────────
function CreateCampaignModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    name: '', type: 'Deposit Match', isPercent: true, amount: '',
    maxAmount: '', budget: '', wagering: 20, expiry: '', minDeposit: 200,
    eligibility: new Set(['Retail']), countries: '', terms: '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleElig = (t) => setForm(f => {
    const e = new Set(f.eligibility);
    e.has(t) ? e.delete(t) : e.add(t);
    return { ...f, eligibility: e };
  });

  const steps = ['Details','Rules','Eligibility','Terms'];
  const [step, setStep] = useState(0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ fontSize: 15, fontWeight: 600 }}>Create Bonus Campaign</div>
          <div style={{ display: 'flex', gap: 4, marginLeft: 'auto', marginRight: 12 }}>
            {steps.map((s, i) => (
              <div key={s} style={{
                width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 600, cursor: 'pointer',
                background: step === i ? 'var(--accent)' : step > i ? 'var(--bull-muted)' : 'var(--bg-4)',
                color: step === i ? 'white' : step > i ? 'var(--bull)' : 'var(--text-tertiary)',
              }} onClick={() => setStep(i)}>
                {step > i ? '✓' : i + 1}
              </div>
            ))}
          </div>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {step === 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="label">Campaign Name</label>
                <input className="input" placeholder="e.g. Summer Deposit Bonus 2024" value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label">Bonus Type</label>
                <select className="select" value={form.type} onChange={e => set('type', e.target.value)}>
                  {BONUS_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Total Budget Cap (USD)</label>
                <input className="input" type="number" placeholder="10000" value={form.budget} onChange={e => set('budget', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label">{form.type === 'Deposit Match' ? 'Match %' : 'Bonus Amount (USD)'}</label>
                <input className="input" type="number" placeholder={form.type === 'Deposit Match' ? '100' : '50'} value={form.amount} onChange={e => set('amount', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label">Max Per Client (USD)</label>
                <input className="input" type="number" placeholder="500" value={form.maxAmount} onChange={e => set('maxAmount', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label">Start Date</label>
                <input className="input" type="date" defaultValue="2024-01-15" />
              </div>
              <div className="form-group">
                <label className="label">Expiry Date</label>
                <input className="input" type="date" value={form.expiry} onChange={e => set('expiry', e.target.value)} />
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <div className="form-group">
                <label className="label">Wagering Requirement (× bonus amount)</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input className="input" type="number" value={form.wagering} onChange={e => set('wagering', +e.target.value)} style={{ width: 80 }} />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>× — e.g. 20× means client must trade 20× the bonus volume</span>
                </div>
              </div>
              <div className="form-group">
                <label className="label">Minimum Deposit to Qualify (USD)</label>
                <input className="input" type="number" value={form.minDeposit} onChange={e => set('minDeposit', +e.target.value)} style={{ width: 120 }} />
              </div>
              <div style={{ padding: '12px 14px', background: 'var(--bg-3)', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-primary)' }}>Example:</strong> Client deposits $1,000, earns $
                {form.amount && form.type === 'Deposit Match' ? Math.min(form.maxAmount || 999999, form.amount / 100 * 1000) : form.amount} bonus.
                They must trade {form.wagering}× = $
                {form.amount && form.type === 'Deposit Match' ? (Math.min(form.maxAmount || 999999, form.amount / 100 * 1000) * form.wagering).toLocaleString() : (form.amount * form.wagering).toLocaleString()} in volume before withdrawing the bonus.
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="form-group">
                <label className="label">Eligible Account Types</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                  {ACCOUNT_TYPES.map(t => (
                    <button key={t} className={`btn ${form.eligibility.has(t) ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                      onClick={() => toggleElig(t)}>
                      {form.eligibility.has(t) ? '✓ ' : ''}{t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="label">Eligible Countries (leave blank for all)</label>
                <input className="input" placeholder="e.g. GB, AE, SG (comma-separated)" value={form.countries} onChange={e => set('countries', e.target.value)} />
              </div>
              <div style={{ padding: '10px 12px', background: 'var(--warn-muted)', border: '1px solid var(--warn-dim)', borderRadius: 8, fontSize: 11, color: 'var(--warn)' }}>
                ⚠ Bonuses offered to EU/UK clients must comply with ESMA/FCA bonus restrictions. Verify eligibility with compliance before launching.
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <label className="label">Terms & Conditions</label>
              <textarea
                value={form.terms}
                onChange={e => set('terms', e.target.value)}
                placeholder="1. This bonus is available to verified clients only.&#10;2. Bonus funds cannot be withdrawn until wagering requirements are met.&#10;3. ArcaFX Markets reserves the right to cancel this bonus..."
                style={{ width: '100%', minHeight: 180, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px', fontSize: 12, color: 'var(--text-primary)', fontFamily: 'var(--font-ui)', resize: 'vertical', outline: 'none', boxSizing: 'border-box', lineHeight: 1.6 }}
              />
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={() => step > 0 ? setStep(s => s - 1) : onClose()}>
            {step > 0 ? '← Back' : 'Cancel'}
          </button>
          {step < steps.length - 1 ? (
            <button className="btn btn-primary btn-sm" onClick={() => setStep(s => s + 1)}
              disabled={step === 0 && !form.name}>
              Next →
            </button>
          ) : (
            <button className="btn btn-success btn-sm" onClick={() => {
              onSave(form);
              onClose();
            }} disabled={!form.name}>
              Launch Campaign
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── BONUS MANAGEMENT MAIN ────────────────────────────────────────────────────
export default function BonusManagement() {
  const [tab, setTab]             = useState('active');
  const [bonuses, setBonuses]     = useState(INITIAL_BONUSES);
  const [campaigns, setCampaigns] = useState(INITIAL_CAMPAIGNS);
  const [showCreate, setCreate]   = useState(false);

  const activeBonuses = bonuses.filter(b => b.status === 'Active');
  const expiringSoon  = activeBonuses.filter(b => {
    const days = Math.ceil((new Date(b.expiry) - new Date('2024-01-15')) / 86400000);
    return days > 0 && days <= 7;
  });

  const cancelBonus = (id) => {
    setBonuses(bs => bs.map(b => b.id === id ? { ...b, status: 'Cancelled' } : b));
    toast.warn('Bonus cancelled and removed from client account');
  };

  const grantBonus = () => {
    toast.success('Bonus applied to client account');
  };

  return (
    <div style={{ padding: '0 24px 24px' }}>
      {/* Header */}
      <div style={{ padding: '20px 0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>Bonus Management</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
            {activeBonuses.length} active bonuses · {expiringSoon.length > 0 && (
              <span style={{ color: 'var(--bear)' }}>{expiringSoon.length} expiring within 7 days</span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={grantBonus}>+ Grant Bonus</button>
          <button className="btn btn-primary btn-sm" onClick={() => setCreate(true)}>+ Create Campaign</button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          ['Active Bonuses',     activeBonuses.length,  'var(--accent)'],
          ['Total Bonus Value',  '$' + activeBonuses.reduce((s, b) => s + b.amount, 0).toLocaleString(), 'var(--warn)'],
          ['Active Campaigns',  campaigns.filter(c => c.active).length, 'var(--bull)'],
          ['Budget Remaining',  '$' + (campaigns.filter(c => c.active).reduce((s,c) => s + c.budget - c.totalGiven, 0)).toLocaleString(), 'var(--text-primary)'],
        ].map(([label, val, color]) => (
          <div key={label} style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 5 }}>{label}</div>
            <div style={{ fontSize: 20, fontFamily: 'var(--font-data)', fontWeight: 700, color }}>{val}</div>
          </div>
        ))}
      </div>

      <div className="tabs" style={{ padding: 0, marginBottom: 16 }}>
        <button className={`tab ${tab === 'active' ? 'active' : ''}`} onClick={() => setTab('active')}>
          Active Bonuses<span className="tab-count">{activeBonuses.length}</span>
        </button>
        <button className={`tab ${tab === 'campaigns' ? 'active' : ''}`} onClick={() => setTab('campaigns')}>
          Campaigns<span className="tab-count">{campaigns.length}</span>
        </button>
        <button className={`tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
          History
        </button>
      </div>

      {tab === 'active' && (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  {['Client','Bonus Type','Amount','Wagering Progress','Expiry','Status',''].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bonuses.map(b => (
                  <tr key={b.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{b.clientName}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-data)' }}>{b.clientId}</div>
                    </td>
                    <td>
                      <span className="pill pill-accent" style={{ fontSize: 10 }}>{b.type}</span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-data)', fontWeight: 600, color: 'var(--bull)' }}>
                      ${b.amount.toLocaleString()}
                    </td>
                    <td style={{ minWidth: 180 }}>
                      <div style={{ marginBottom: 3 }}>
                        <WageringBar progress={b.progress} wagering={b.wagering} />
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>
                        ${b.progress.toLocaleString()} / ${b.wagering.toLocaleString()} lots required
                      </div>
                    </td>
                    <td><ExpiryBadge expiry={b.expiry} /></td>
                    <td>
                      <span className={`pill ${b.status === 'Active' ? 'pill-active' : b.status === 'Completed' ? 'pill-verified' : 'pill-muted'}`} style={{ fontSize: 10 }}>
                        {b.status}
                      </span>
                    </td>
                    <td>
                      {b.status === 'Active' && (
                        <button className="btn btn-danger btn-xs"
                          onClick={() => cancelBonus(b.id)}>
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'campaigns' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {campaigns.map(camp => {
            const budgetUsedPct = Math.min(100, (camp.totalGiven / camp.budget) * 100);
            return (
              <div key={camp.id} className="card" style={{ padding: 0, opacity: camp.active ? 1 : 0.6 }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>{camp.name}</div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0, marginLeft: 8 }}>
                      <span className={`pill ${camp.active ? 'pill-active' : 'pill-muted'}`} style={{ fontSize: 10 }}>
                        {camp.active ? '● Live' : '○ Ended'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span className="pill pill-accent" style={{ fontSize: 10 }}>{camp.type}</span>
                    {camp.eligibility.map(e => (
                      <span key={e} className="pill pill-muted" style={{ fontSize: 10 }}>{e}</span>
                    ))}
                  </div>
                </div>
                <div style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
                    {[
                      ['Amount', camp.maxAmount ? `Up to $${camp.maxAmount}` : `$${camp.pct}%`],
                      ['Given to', `${camp.given} clients`],
                      ['Wagering', `${camp.wagering}×`],
                    ].map(([l, v]) => (
                      <div key={l}>
                        <div style={{ fontSize: 9, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{l}</div>
                        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>Budget used</span>
                    <span style={{ fontSize: 10, fontFamily: 'var(--font-data)', color: 'var(--text-secondary)' }}>
                      ${camp.totalGiven.toLocaleString()} / ${camp.budget.toLocaleString()}
                    </span>
                  </div>
                  <div style={{ height: 5, background: 'var(--bg-4)', borderRadius: 3, overflow: 'hidden', marginBottom: 10 }}>
                    <div style={{ width: `${budgetUsedPct}%`, height: '100%', background: budgetUsedPct > 80 ? 'var(--warn)' : 'var(--accent)', borderRadius: 3 }} />
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost btn-xs">Edit</button>
                    <button className="btn btn-ghost btn-xs" onClick={() => {
                      setCampaigns(cs => cs.map(c => c.id === camp.id ? { ...c, active: !c.active } : c));
                      toast.info(`Campaign ${camp.active ? 'paused' : 'activated'}: ${camp.name}`);
                    }}>
                      {camp.active ? '⏸ Pause' : '▶ Activate'}
                    </button>
                    <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-tertiary)' }}>
                      {camp.start} – {camp.end}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'history' && (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>{['Client','Bonus Type','Amount','Given','Wagering Met','Outcome'].map(h => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {[
                  { client: 'Hannah Mueller', type: 'Welcome', amount: 50, given: '2024-01-07', met: true, outcome: 'Credited' },
                  { client: 'Carlos Mendez',  type: 'Deposit Match', amount: 250, given: '2024-01-09', met: false, outcome: 'Expired' },
                  { client: 'Yuki Tanaka',    type: 'Loyalty', amount: 300, given: '2023-12-01', met: true, outcome: 'Credited' },
                  { client: 'Robert van der Berg', type: 'No-Deposit', amount: 50, given: '2023-11-30', met: true, outcome: 'Credited' },
                ].map((row, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{row.client}</td>
                    <td><span className="pill pill-muted" style={{ fontSize: 10 }}>{row.type}</span></td>
                    <td className="mono" style={{ color: 'var(--bull)' }}>${row.amount}</td>
                    <td style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{row.given}</td>
                    <td>
                      <span style={{ fontSize: 11, color: row.met ? 'var(--bull)' : 'var(--bear)' }}>
                        {row.met ? '✓ Yes' : '✗ No'}
                      </span>
                    </td>
                    <td>
                      <span className={`pill ${row.outcome === 'Credited' ? 'pill-verified' : 'pill-muted'}`} style={{ fontSize: 10 }}>
                        {row.outcome}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCreate && (
        <CreateCampaignModal
          onClose={() => setCreate(false)}
          onSave={(form) => {
            setCampaigns(cs => [...cs, {
              id: 'CAM' + Date.now(),
              name: form.name, type: form.type,
              pct: form.type === 'Deposit Match' ? +form.amount : null,
              maxAmount: +form.maxAmount, budget: +form.budget,
              given: 0, totalGiven: 0, active: true,
              start: '2024-01-15', end: form.expiry,
              wagering: form.wagering, minDeposit: form.minDeposit,
              eligibility: [...form.eligibility],
            }]);
            toast.success(`Campaign "${form.name}" launched successfully`);
          }}
        />
      )}
    </div>
  );
}
