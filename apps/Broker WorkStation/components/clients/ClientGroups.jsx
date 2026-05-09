'use client';
import { useState } from 'react';
import { clients } from '../../lib/mockData';
import { toast } from '../shared/Toast';

const INITIAL_GROUPS = [
  {
    id: 'g1', name: 'Standard', description: 'Default retail client group', type: 'Retail',
    leverage: 30, spreadMarkup: 0.5, maxPositions: 20, swapFree: false, status: 'Active',
    color: '#3B82F6',
  },
  {
    id: 'g2', name: 'Professional', description: 'Verified professional / institutional clients', type: 'Pro',
    leverage: 200, spreadMarkup: 0.2, maxPositions: 50, swapFree: false, status: 'Active',
    color: '#10D996',
  },
  {
    id: 'g3', name: 'VIP', description: 'High-value clients with enhanced conditions', type: 'VIP',
    leverage: 500, spreadMarkup: 0, maxPositions: 100, swapFree: true, status: 'Active',
    color: '#F59E0B',
  },
  {
    id: 'g4', name: 'Internal', description: 'Team members and test accounts', type: 'Internal',
    leverage: 1000, spreadMarkup: -0.5, maxPositions: 999, swapFree: true, status: 'Active',
    color: '#8B5CF6',
  },
];

function Toggle({ on, onChange }) {
  return <div className={`toggle ${on ? 'on' : ''}`} onClick={() => onChange(!on)} style={{ cursor: 'pointer' }} />;
}

function CreateGroupModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    name: '', description: '', type: 'Retail', leverage: 30,
    spreadMarkup: 0, maxPositions: 20, swapFree: false, copyFrom: '',
    color: '#3B82F6',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCopyFrom = (groupName) => {
    const src = INITIAL_GROUPS.find(g => g.name === groupName);
    if (src) setForm(f => ({ ...f, leverage: src.leverage, spreadMarkup: src.spreadMarkup, maxPositions: src.maxPositions, swapFree: src.swapFree, copyFrom: groupName }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ fontSize: 14, fontWeight: 600 }}>Create Client Group</div>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="label">Group Name</label>
              <input className="input" placeholder="e.g. Premium Clients" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="label">Description</label>
              <input className="input" placeholder="Internal description..." value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">Account Type Base</label>
              <select className="select" value={form.type} onChange={e => set('type', e.target.value)}>
                {['Retail','Pro','VIP','Internal'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Copy Settings From</label>
              <select className="select" value={form.copyFrom} onChange={e => handleCopyFrom(e.target.value)}>
                <option value="">Start fresh</option>
                {INITIAL_GROUPS.map(g => <option key={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Default Max Leverage</label>
              <select className="select" value={form.leverage} onChange={e => set('leverage', +e.target.value)}>
                {[2,5,10,20,30,50,100,200,500,1000].map(l => <option key={l} value={l}>1:{l}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Spread Markup (pips)</label>
              <input className="input" type="number" step="0.1" value={form.spreadMarkup} onChange={e => set('spreadMarkup', +e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">Max Open Positions</label>
              <input className="input" type="number" value={form.maxPositions} onChange={e => set('maxPositions', +e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">Color</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: form.color, border: '1px solid var(--border-strong)', cursor: 'pointer' }} onClick={() => document.getElementById('grp-color').click()} />
                <input id="grp-color" type="color" value={form.color} onChange={e => set('color', e.target.value)} style={{ opacity: 0, width: 1, height: 1, position: 'absolute' }} />
                <input className="input" value={form.color} onChange={e => set('color', e.target.value)} style={{ fontFamily: 'var(--font-data)', fontSize: 11 }} />
              </div>
            </div>
          </div>
          <div style={{ padding: '10px 12px', background: 'var(--bg-3)', borderRadius: 8, marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Toggle on={form.swapFree} onChange={v => set('swapFree', v)} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>Swap-free (Islamic accounts)</div>
              <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>No overnight swap charges for this group</div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" disabled={!form.name} onClick={() => { onSave(form); onClose(); }}>
            Create Group
          </button>
        </div>
      </div>
    </div>
  );
}

function GroupDetail({ group, onBack }) {
  const [settings, setSettings] = useState(group);
  const set = (k, v) => setSettings(s => ({ ...s, [k]: v }));
  const members = clients.filter(c => c.group === group.name || c.type === group.type.slice(0, 3) || (group.name === 'Standard' && c.type === 'Retail'));

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <div style={{ padding: '20px 0 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M7 2L3 5.5 7 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Groups
        </button>
        <div style={{ height: 16, width: 1, background: 'var(--border)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: group.color }} />
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>{group.name}</div>
        </div>
        <span className="pill pill-muted" style={{ fontSize: 11 }}>{group.type}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm">Edit Name</button>
          <button className="btn btn-primary btn-sm" onClick={() => toast.success('Group settings saved')}>Save Settings</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14 }}>
        {/* Members */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Members ({members.length})</span>
            <button className="btn btn-ghost btn-xs">+ Move clients here</button>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>{['Client','Balance','Equity','KYC','Status',''].map(h => <th key={h} style={{ fontSize: 9 }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {members.slice(0, 10).map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 12 }}>{c.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-data)' }}>{c.id}</div>
                    </td>
                    <td className="mono" style={{ fontSize: 11 }}>${c.balance.toLocaleString()}</td>
                    <td className="mono" style={{ fontSize: 11 }}>${c.equity.toLocaleString()}</td>
                    <td><span className={`pill ${c.kyc === 'Verified' ? 'pill-verified' : 'pill-pending'}`} style={{ fontSize: 9 }}>{c.kyc}</span></td>
                    <td><span className={`pill ${c.status === 'Active' ? 'pill-active' : 'pill-muted'}`} style={{ fontSize: 9 }}>{c.status}</span></td>
                    <td>
                      <select className="select" style={{ height: 24, fontSize: 10, padding: '0 20px 0 6px' }}
                        onChange={e => e.target.value && toast.info(`Moving ${c.name} to ${e.target.value}`)}>
                        <option value="">Move to...</option>
                        {INITIAL_GROUPS.filter(g => g.name !== group.name).map(g => (
                          <option key={g.id}>{g.name}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
                {members.length > 10 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-tertiary)', padding: '10px 0' }}>
                      +{members.length - 10} more members
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
              <span className="card-title">Group Settings</span>
            </div>
            <div style={{ padding: '10px 14px' }}>
              {[
                ['Default Max Leverage', (
                  <select className="select" style={{ width: 100 }} value={settings.leverage} onChange={e => set('leverage', +e.target.value)}>
                    {[2,5,10,20,30,50,100,200,500,1000].map(l => <option key={l} value={l}>1:{l}</option>)}
                  </select>
                )],
                ['Spread Markup (pips)', (
                  <input className="input" type="number" step="0.1" value={settings.spreadMarkup} style={{ width: 80 }} onChange={e => set('spreadMarkup', +e.target.value)} />
                )],
                ['Max Open Positions', (
                  <input className="input" type="number" value={settings.maxPositions} style={{ width: 80 }} onChange={e => set('maxPositions', +e.target.value)} />
                )],
              ].map(([label, control]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
                  {control}
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Swap-free (Islamic)</div>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>No overnight charges</div>
                </div>
                <Toggle on={settings.swapFree} onChange={v => set('swapFree', v)} />
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '12px 14px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-tertiary)', marginBottom: 10 }}>
              Quick Stats
            </div>
            {[
              ['Total members',      members.length],
              ['Active trading',     members.filter(c => c.openPositions > 0).length],
              ['KYC verified',       members.filter(c => c.kyc === 'Verified').length],
              ['Total balance',      `$${members.reduce((s, c) => s + c.balance, 0).toLocaleString()}`],
              ['Volume MTD',         `${members.reduce((s, c) => s + c.volumeMTD, 0)} lots`],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{l}</span>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-data)', color: 'var(--text-primary)', fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClientGroups() {
  const [groups, setGroups] = useState(INITIAL_GROUPS);
  const [selectedGroup, setSel] = useState(null);
  const [showCreate, setCreate] = useState(false);

  if (selectedGroup) return <GroupDetail group={selectedGroup} onBack={() => setSel(null)} />;

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <div style={{ padding: '20px 0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>Client Groups</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
            Segment clients by account type, leverage, and pricing conditions
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setCreate(true)}>+ Create Group</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {groups.map(group => {
          const members = clients.filter(c => c.group === group.name || c.type === group.type.slice(0, 3) || (group.name === 'Standard' && c.type === 'Retail'));
          const activeMembers = members.filter(c => c.status === 'Active').length;
          const totalBalance = members.reduce((s, c) => s + c.balance, 0);

          return (
            <div key={group.id} className="card" style={{ padding: 0, cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = group.color}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              onClick={() => setSel(group)}>
              <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${group.color}20`, border: `1px solid ${group.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <div style={{ width: 16, height: 16, borderRadius: 4, background: group.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{group.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{group.description}</div>
                </div>
                <span className={`pill ${group.status === 'Active' ? 'pill-active' : 'pill-muted'}`} style={{ fontSize: 10 }}>
                  {group.status}
                </span>
              </div>

              <div style={{ padding: '12px 18px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
                  {[
                    ['Members', members.length, group.color],
                    ['Active', activeMembers, 'var(--bull)'],
                    ['Total AUM', `$${(totalBalance/1000).toFixed(0)}K`, 'var(--text-primary)'],
                  ].map(([label, val, color]) => (
                    <div key={label} style={{ background: 'var(--bg-3)', borderRadius: 7, padding: '8px 10px' }}>
                      <div style={{ fontSize: 9, color: 'var(--text-tertiary)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                      <div style={{ fontSize: 16, fontFamily: 'var(--font-data)', fontWeight: 700, color }}>{val}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[
                    [`1:${group.leverage} leverage`],
                    [`${group.spreadMarkup >= 0 ? '+' : ''}${group.spreadMarkup} pip markup`],
                    group.swapFree && [`Swap-free`],
                    [`Max ${group.maxPositions} positions`],
                  ].filter(Boolean).map(([label]) => (
                    <span key={label} className="pill pill-muted" style={{ fontSize: 10 }}>{label}</span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showCreate && (
        <CreateGroupModal
          onClose={() => setCreate(false)}
          onSave={(form) => {
            setGroups(gs => [...gs, { id: 'g' + Date.now(), ...form, status: 'Active' }]);
            toast.success(`Group "${form.name}" created`);
          }}
        />
      )}
    </div>
  );
}
