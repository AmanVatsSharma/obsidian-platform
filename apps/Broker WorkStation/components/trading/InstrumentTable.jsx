'use client';
import { useState, useCallback } from 'react';
import { instruments as initialInstruments } from '../../lib/mockData';

const CATEGORIES = ['All','Forex','Crypto','Indices','Commodities','Stocks'];

const SESSIONS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

function Toggle({ on, onChange }) {
  return (
    <div className={`toggle ${on ? 'on' : ''}`} onClick={() => onChange(!on)} style={{ cursor: 'pointer' }} />
  );
}

// ─── INSTRUMENT MODAL ─────────────────────────────────────────────────────────
function InstrumentModal({ instrument, onClose, onSave }) {
  const [tab, setTab] = useState('General');
  const [data, setData] = useState({ ...instrument });
  const TABS = ['General','Pricing','Margin & Leverage','Sessions','Swaps'];

  const set = (k, v) => setData(d => ({ ...d, [k]: v }));

  const Field = ({ label, field, type = 'text', unit }) => (
    <div className="form-group">
      <label className="label">{label}{unit ? ` (${unit})` : ''}</label>
      <input
        className="input"
        type={type}
        value={data[field] ?? ''}
        onChange={e => set(field, type === 'number' ? +e.target.value : e.target.value)}
      />
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 580, width: '100%' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-data)' }}>{data.symbol}</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{data.name}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto' }}>
            <Toggle on={data.enabled} onChange={v => set('enabled', v)} />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{data.enabled ? 'Enabled' : 'Disabled'}</span>
            <button className="drawer-close" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="tabs" style={{ padding: '0 20px' }}>
          {TABS.map(t => (
            <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)} style={{ fontSize: 11, padding: '8px 10px' }}>
              {t}
            </button>
          ))}
        </div>

        <div style={{ padding: '16px 20px', maxHeight: 440, overflowY: 'auto' }}>
          {tab === 'General' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <Field label="Symbol"       field="symbol" />
              <Field label="Display Name" field="name" />
              <div className="form-group">
                <label className="label">Category</label>
                <select className="select" value={data.category} onChange={e => set('category', e.target.value)}>
                  {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <Field label="Min Trade Size" field="minLot" type="number" unit="lots" />
              <Field label="Max Trade Size" field="maxLot" type="number" unit="lots" />
              <Field label="Lot Step"       field="lotStep" type="number" />
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="label">Description (shown to clients)</label>
                <input className="input" defaultValue={`Trade ${data.name} with competitive spreads`} />
              </div>
            </div>
          )}

          {tab === 'Pricing' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div className="form-group">
                <label className="label">Spread Type</label>
                <select className="select" value={data.spreadType} onChange={e => set('spreadType', e.target.value)}>
                  {['Fixed','Variable','As-is from LP'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <Field label="Spread Value" field="spread" type="number" unit="pips" />
              <div className="form-group">
                <label className="label">Markup (pips to add to LP)</label>
                <input className="input" type="number" defaultValue={0.2} />
              </div>
              <div className="form-group">
                <label className="label">Commission Type</label>
                <select className="select">
                  {['None','Per lot fixed','Per trade','% of notional'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <Field label="Commission Value" field="commission" type="number" />
              <div className="form-group">
                <label className="label">Slippage Model</label>
                <select className="select">
                  {['None','Market','Up to 2 pips','Up to 5 pips'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
          )}

          {tab === 'Margin & Leverage' && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-tertiary)', marginBottom: 12 }}>
                Per-Group Leverage Overrides
              </div>
              {[
                ['Retail',       data.leverageRetail],
                ['Professional', data.leveragePro],
                ['VIP',          data.leverageVIP],
              ].map(([group, lev]) => (
                <div key={group} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', width: 100 }}>{group}</span>
                  <select className="select" defaultValue={lev} style={{ width: 120 }}>
                    {[2,5,10,20,30,50,100,200,500].map(l => <option key={l} value={l}>1:{l}</option>)}
                  </select>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Max leverage</span>
                </div>
              ))}
              <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 16px' }}>
                <div className="form-group">
                  <label className="label">Initial Margin %</label>
                  <input className="input" type="number" value={data.marginPct} onChange={e => set('marginPct', +e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="label">Maintenance Margin %</label>
                  <input className="input" type="number" defaultValue={(data.marginPct * 0.5).toFixed(2)} />
                </div>
                <div className="form-group">
                  <label className="label">Stop-Out Level</label>
                  <select className="select">
                    <option>Use global (20%)</option>
                    <option>Custom</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {tab === 'Sessions' && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-tertiary)', marginBottom: 12 }}>
                Weekly Trading Schedule (UTC)
              </div>
              {SESSIONS.map(day => (
                <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', width: 36 }}>{day}</span>
                  {['Sat','Sun'].includes(day) ? (
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type="checkbox" defaultChecked={false} /> Closed
                    </span>
                  ) : (
                    <>
                      <input className="input" type="time" defaultValue="00:00" style={{ width: 96 }} />
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>to</span>
                      <input className="input" type="time" defaultValue="23:59" style={{ width: 96 }} />
                      <button className="btn btn-ghost btn-xs">+ Break</button>
                    </>
                  )}
                </div>
              ))}
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Toggle on={true} onChange={() => {}} />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Auto-adjust for summer/winter time</span>
              </div>
            </div>
          )}

          {tab === 'Swaps' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <Field label="Swap Long (per lot/night)" field="swapLong" type="number" />
              <Field label="Swap Short (per lot/night)" field="swapShort" type="number" />
              <div className="form-group">
                <label className="label">Triple Swap Day</label>
                <select className="select">
                  <option>Wednesday</option>
                  <option>Friday</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Swap Type</label>
                <select className="select">
                  {['Pips','Percentage','Flat fee'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'var(--bg-3)', borderRadius: 8 }}>
                  <Toggle on={false} onChange={() => {}} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>Swap-free (Islamic accounts)</div>
                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>Enable for clients with Islamic account type</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={() => { onSave(data); onClose(); }}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

// ─── INSTRUMENT TABLE ─────────────────────────────────────────────────────────
export default function InstrumentTable() {
  const [instruments, setInstruments] = useState(initialInstruments);
  const [category, setCategory] = useState('All');
  const [editing, setEditing] = useState(null);
  const [unsaved, setUnsaved] = useState({});
  const [showModal, setShowModal] = useState(null);

  const displayed = category === 'All' ? instruments : instruments.filter(i => i.category === category);

  const handleInlineEdit = (symbol, field, value) => {
    setUnsaved(u => ({ ...u, [`${symbol}.${field}`]: value }));
  };

  const getVal = (inst, field) => {
    const key = `${inst.symbol}.${field}`;
    return key in unsaved ? unsaved[key] : inst[field];
  };

  const unsavedCount = Object.keys(unsaved).length;

  const saveAll = () => {
    setInstruments(prev => prev.map(inst => {
      const updates = {};
      Object.entries(unsaved).forEach(([k, v]) => {
        const [sym, field] = k.split('.');
        if (sym === inst.symbol) updates[field] = v;
      });
      return Object.keys(updates).length ? { ...inst, ...updates } : inst;
    }));
    setUnsaved({});
  };

  const toggleEnabled = useCallback((symbol) => {
    setInstruments(prev => prev.map(i => i.symbol === symbol ? { ...i, enabled: !i.enabled } : i));
  }, []);

  const InlineCell = ({ inst, field, type = 'number', width = 70 }) => {
    const isEditing = editing === `${inst.symbol}.${field}`;
    const val = getVal(inst, field);
    const isDirty = `${inst.symbol}.${field}` in unsaved;

    if (isEditing) {
      return (
        <input
          className="input"
          type={type}
          defaultValue={val}
          style={{ width, fontSize: 11, height: 26, padding: '0 6px' }}
          autoFocus
          onBlur={e => { handleInlineEdit(inst.symbol, field, type === 'number' ? +e.target.value : e.target.value); setEditing(null); }}
          onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') setEditing(null); }}
        />
      );
    }
    return (
      <span
        onClick={() => setEditing(`${inst.symbol}.${field}`)}
        style={{
          fontFamily: 'var(--font-data)', fontSize: 11,
          cursor: 'text', display: 'inline-block',
          padding: '2px 4px', borderRadius: 4,
          background: isDirty ? 'rgba(245,158,11,0.1)' : 'transparent',
          border: `1px solid ${isDirty ? 'var(--warn-dim)' : 'transparent'}`,
          color: isDirty ? 'var(--warn)' : 'var(--text-primary)',
          transition: 'all 0.12s',
        }}
        title="Click to edit"
      >
        {val}
      </span>
    );
  };

  return (
    <div style={{ padding: '0 24px 24px' }}>
      {/* Header */}
      <div style={{ padding: '20px 0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>Instruments</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
            {instruments.filter(i => i.enabled).length} enabled · {instruments.length} total
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {unsavedCount > 0 && (
            <>
              <span style={{ fontSize: 11, color: 'var(--warn)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--warn)', display: 'inline-block' }} />
                {unsavedCount} unsaved change{unsavedCount !== 1 ? 's' : ''}
              </span>
              <button className="btn btn-ghost btn-sm" onClick={() => setUnsaved({})}>Discard</button>
              <button className="btn btn-warn btn-sm" onClick={saveAll}>Save All Changes</button>
            </>
          )}
          <button className="btn btn-ghost btn-sm">Import from Platform</button>
          <button className="btn btn-primary btn-sm">+ Add Instrument</button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="tabs" style={{ padding: 0, marginBottom: 16 }}>
        {CATEGORIES.map(cat => {
          const count = cat === 'All' ? instruments.length : instruments.filter(i => i.category === cat).length;
          return (
            <button key={cat} className={`tab ${category === cat ? 'active' : ''}`} onClick={() => setCategory(cat)}>
              {cat}
              <span className="tab-count">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ width: 48 }}>On</th>
                <th style={{ width: 80 }}>Symbol</th>
                <th>Name</th>
                <th style={{ width: 90 }}>Category</th>
                <th style={{ width: 80 }}>Spread Type</th>
                <th style={{ width: 70 }}>Spread</th>
                <th style={{ width: 70 }}>Comm.</th>
                <th style={{ width: 60 }}>Min Lot</th>
                <th style={{ width: 60 }}>Max Lot</th>
                <th style={{ width: 70 }}>Lev. Retail</th>
                <th style={{ width: 70 }}>Swap L</th>
                <th style={{ width: 70 }}>Swap S</th>
                <th style={{ width: 70 }}>Margin%</th>
                <th style={{ width: 70 }}>Status</th>
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {displayed.map(inst => (
                <tr key={inst.symbol}>
                  <td>
                    <Toggle on={inst.enabled} onChange={() => toggleEnabled(inst.symbol)} />
                  </td>
                  <td style={{ fontFamily: 'var(--font-data)', fontWeight: 700, fontSize: 12, color: inst.enabled ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                    {inst.symbol}
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--text-secondary)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {inst.name}
                  </td>
                  <td>
                    <span className="pill pill-muted" style={{ fontSize: 10 }}>{inst.category}</span>
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    {inst.spreadType}
                  </td>
                  <td><InlineCell inst={inst} field="spread" /></td>
                  <td><InlineCell inst={inst} field="commission" /></td>
                  <td><InlineCell inst={inst} field="minLot" /></td>
                  <td><InlineCell inst={inst} field="maxLot" /></td>
                  <td style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--text-secondary)' }}>
                    1:{inst.leverageRetail}
                  </td>
                  <td style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: inst.swapLong < 0 ? 'var(--bear)' : 'var(--bull)' }}>
                    {inst.swapLong > 0 ? '+' : ''}{inst.swapLong}
                  </td>
                  <td style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: inst.swapShort < 0 ? 'var(--bear)' : 'var(--bull)' }}>
                    {inst.swapShort > 0 ? '+' : ''}{inst.swapShort}
                  </td>
                  <td style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--text-secondary)' }}>
                    {inst.marginPct}%
                  </td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: inst.enabled ? 'var(--bull)' : 'var(--text-tertiary)' }} />
                      {inst.enabled ? 'Open' : 'Off'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-xs" onClick={() => setShowModal(inst)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <InstrumentModal
          instrument={showModal}
          onClose={() => setShowModal(null)}
          onSave={(updated) => {
            setInstruments(prev => prev.map(i => i.symbol === updated.symbol ? updated : i));
          }}
        />
      )}
    </div>
  );
}
