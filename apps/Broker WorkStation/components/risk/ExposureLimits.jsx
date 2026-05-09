'use client';
import { useState } from 'react';
import { instruments } from '../../lib/mockData';
import { toast } from '../shared/Toast';

const GROUPS = ['Standard','Professional','VIP'];

const buildLimits = () => instruments.map(inst => ({
  symbol: inst.symbol,
  category: inst.category,
  globalNetLimit: inst.category === 'Crypto' ? 50 : inst.category === 'Commodities' ? 150 : inst.category === 'Indices' ? 200 : 500,
  globalGrossLimit: inst.category === 'Crypto' ? 100 : inst.category === 'Commodities' ? 300 : inst.category === 'Indices' ? 400 : 1000,
  softAlertPct: 70,
  hardStopPct: 90,
  groupOverrides: {
    Standard:     { net: null, gross: null, soft: null, hard: null },
    Professional: { net: null, gross: null, soft: null, hard: null },
    VIP:          { net: null, gross: null, soft: null, hard: null },
  },
}));

const HISTORY = [
  { time: '2024-01-15 09:15', actor: 'Sarah Chen',    symbol: 'EUR/USD',  field: 'netLimit',    old: '400', new: '500' },
  { time: '2024-01-14 15:40', actor: 'Jennifer Park', symbol: 'BTC/USD',  field: 'softAlertPct',old: '65',  new: '70' },
  { time: '2024-01-14 11:20', actor: 'Sarah Chen',    symbol: 'XAUUSD',   field: 'hardStopPct', old: '85',  new: '90' },
  { time: '2024-01-12 08:00', actor: 'Marcus Webb',   symbol: 'ALL',      field: 'grossLimit',  old: '800', new: '1000' },
];

function InlineEdit({ value, onChange, width = 70, suffix = '' }) {
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <input className="input" type="number" defaultValue={value}
        style={{ width, height: 26, fontSize: 11, padding: '0 6px', textAlign: 'right' }}
        autoFocus
        onBlur={e => { onChange(+e.target.value); setEditing(false); }}
        onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') setEditing(false); }}
      />
    );
  }
  return (
    <span onClick={() => setEditing(true)} title="Click to edit"
      style={{ fontFamily: 'var(--font-data)', fontSize: 12, cursor: 'text', padding: '2px 6px', borderRadius: 4, display: 'inline-block', transition: 'background 0.12s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {value}{suffix}
    </span>
  );
}

export default function ExposureLimits() {
  const [limits, setLimits]       = useState(buildLimits);
  const [tab, setTab]             = useState('global');
  const [selectedGroup, setGrp]   = useState('Standard');
  const [bulkSelect, setBulkSel]  = useState(new Set());
  const [history]                 = useState(HISTORY);

  const updateLimit = (symbol, field, value) => {
    setLimits(ls => ls.map(l => l.symbol === symbol ? { ...l, [field]: value } : l));
  };

  const updateGroupOverride = (symbol, group, field, value) => {
    setLimits(ls => ls.map(l => l.symbol === symbol ? {
      ...l,
      groupOverrides: { ...l.groupOverrides, [group]: { ...l.groupOverrides[group], [field]: value } }
    } : l));
  };

  const allSelected = limits.length > 0 && limits.every(l => bulkSelect.has(l.symbol));

  const bulkSet = (field, value) => {
    const targets = bulkSelect.size > 0 ? [...bulkSelect] : limits.map(l => l.symbol);
    setLimits(ls => ls.map(l => targets.includes(l.symbol) ? { ...l, [field]: value } : l));
    toast.success(`Updated ${targets.length} symbols`);
    setBulkSel(new Set());
  };

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <div style={{ padding: '20px 0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>Exposure Limits</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
            Configure per-symbol net/gross exposure limits and alert thresholds
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {bulkSelect.size > 0 && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '4px 10px', background: 'var(--accent-muted)', border: '1px solid var(--border-accent)', borderRadius: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--accent)' }}>{bulkSelect.size} selected</span>
              <button className="btn btn-ghost btn-xs" onClick={() => setBulkSel(new Set())}>✕</button>
            </div>
          )}
          <button className="btn btn-ghost btn-sm" onClick={() => {
            setLimits(buildLimits());
            toast.info('Limits reset to defaults');
          }}>
            Reset to Defaults
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => toast.success('Exposure limits saved')}>
            Save All
          </button>
        </div>
      </div>

      {/* Global limits */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Global Net Limit',   field: 'globalNetLimit',   unit: 'lots', default: 2000 },
          { label: 'Global Gross Limit', field: 'globalGrossLimit', unit: 'lots', default: 4000 },
          { label: 'Soft Alert Threshold', field: 'softAlertPct',  unit: '%',    default: 70 },
          { label: 'Hard Stop Threshold',  field: 'hardStopPct',   unit: '%',    default: 90 },
        ].map(({ label, field, unit, default: def }) => (
          <div key={field} style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 6 }}>{label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <input className="input" type="number" defaultValue={def}
                style={{ width: 80, fontFamily: 'var(--font-data)', fontSize: 18, fontWeight: 700, padding: '4px 8px', height: 'auto' }}
                onChange={e => toast.info(`Global ${label} updated to ${e.target.value} ${unit}`)}
              />
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="tabs" style={{ padding: 0, marginBottom: 14 }}>
        <button className={`tab ${tab === 'global' ? 'active' : ''}`} onClick={() => setTab('global')}>Per-Symbol Limits</button>
        <button className={`tab ${tab === 'groups' ? 'active' : ''}`} onClick={() => setTab('groups')}>Group Overrides</button>
        <button className={`tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
          Change History<span className="tab-count">{history.length}</span>
        </button>
      </div>

      {tab === 'global' && (
        <>
          {bulkSelect.size > 0 && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10, padding: '8px 14px', background: 'var(--accent-muted)', border: '1px solid var(--border-accent)', borderRadius: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>Bulk edit {bulkSelect.size} symbols:</span>
              {[
                { label: 'Set Net Limit', field: 'globalNetLimit' },
                { label: 'Set Soft Alert %', field: 'softAlertPct' },
              ].map(({ label, field }) => {
                let v = '';
                return (
                  <div key={field} style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                    <input className="input" type="number" placeholder={label} style={{ width: 140, height: 28 }}
                      onChange={e => v = e.target.value} />
                    <button className="btn btn-primary btn-xs" onClick={() => v && bulkSet(field, +v)}>Set</button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="card">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>
                      <input type="checkbox" checked={allSelected}
                        onChange={() => allSelected ? setBulkSel(new Set()) : setBulkSel(new Set(limits.map(l => l.symbol)))} />
                    </th>
                    <th>Symbol</th>
                    <th>Category</th>
                    <th>Net Limit (lots)</th>
                    <th>Gross Limit (lots)</th>
                    <th>Soft Alert %</th>
                    <th>Hard Stop %</th>
                    <th>Current Usage</th>
                  </tr>
                </thead>
                <tbody>
                  {limits.map(l => {
                    const usage = Math.random() * 0.75;
                    const usagePct = Math.floor(usage * 100);
                    const usageColor = usagePct > 80 ? 'var(--bear)' : usagePct > l.softAlertPct ? 'var(--warn)' : 'var(--bull)';
                    return (
                      <tr key={l.symbol} className={bulkSelect.has(l.symbol) ? 'selected' : ''}>
                        <td>
                          <input type="checkbox" checked={bulkSelect.has(l.symbol)}
                            onChange={() => setBulkSel(s => { const n = new Set(s); n.has(l.symbol) ? n.delete(l.symbol) : n.add(l.symbol); return n; })} />
                        </td>
                        <td style={{ fontFamily: 'var(--font-data)', fontWeight: 700, fontSize: 12 }}>{l.symbol}</td>
                        <td><span className="pill pill-muted" style={{ fontSize: 10 }}>{l.category}</span></td>
                        <td>
                          <InlineEdit value={l.globalNetLimit} onChange={v => updateLimit(l.symbol, 'globalNetLimit', v)} />
                        </td>
                        <td>
                          <InlineEdit value={l.globalGrossLimit} onChange={v => updateLimit(l.symbol, 'globalGrossLimit', v)} />
                        </td>
                        <td>
                          <InlineEdit value={l.softAlertPct} onChange={v => updateLimit(l.symbol, 'softAlertPct', v)} suffix="%" />
                        </td>
                        <td>
                          <InlineEdit value={l.hardStopPct} onChange={v => updateLimit(l.symbol, 'hardStopPct', v)} suffix="%" />
                        </td>
                        <td style={{ minWidth: 140 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, height: 5, background: 'var(--bg-4)', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ width: `${usagePct}%`, height: '100%', background: usageColor, borderRadius: 3 }} />
                            </div>
                            <span style={{ fontSize: 10, fontFamily: 'var(--font-data)', color: usageColor, minWidth: 28, textAlign: 'right' }}>
                              {usagePct}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'groups' && (
        <>
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {GROUPS.map(g => (
              <button key={g} className={`btn ${selectedGroup === g ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                onClick={() => setGrp(g)}>
                {g}
              </button>
            ))}
          </div>
          <div className="card">
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text-secondary)' }}>
              Overrides for <strong style={{ color: 'var(--text-primary)' }}>{selectedGroup}</strong> group.
              Leave blank to inherit global limits.
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Net Limit Override</th>
                    <th>Gross Limit Override</th>
                    <th>Soft Alert % Override</th>
                    <th>Hard Stop % Override</th>
                  </tr>
                </thead>
                <tbody>
                  {limits.slice(0, 8).map(l => {
                    const ov = l.groupOverrides[selectedGroup];
                    return (
                      <tr key={l.symbol}>
                        <td style={{ fontFamily: 'var(--font-data)', fontWeight: 700, fontSize: 12 }}>{l.symbol}</td>
                        {['net','gross','soft','hard'].map(f => (
                          <td key={f}>
                            <input className="input" type="number" placeholder="— global"
                              value={ov[f] || ''} style={{ width: 110 }}
                              onChange={e => updateGroupOverride(l.symbol, selectedGroup, f, e.target.value ? +e.target.value : null)} />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'history' && (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>{['Timestamp','Actor','Symbol','Field Changed','Old Value','New Value'].map(h => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {history.map((entry, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: 10, fontFamily: 'var(--font-data)', color: 'var(--text-tertiary)' }}>{entry.time}</td>
                    <td style={{ fontSize: 12, fontWeight: 500 }}>{entry.actor}</td>
                    <td style={{ fontFamily: 'var(--font-data)', fontWeight: 700, fontSize: 12 }}>{entry.symbol}</td>
                    <td style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--accent)' }}>{entry.field}</td>
                    <td style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--bear)' }}>{entry.old}</td>
                    <td style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--bull)' }}>{entry.new}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)', fontSize: 10, color: 'var(--text-tertiary)', textAlign: 'center' }}>
            Showing last {history.length} changes · Immutable record
          </div>
        </div>
      )}
    </div>
  );
}
