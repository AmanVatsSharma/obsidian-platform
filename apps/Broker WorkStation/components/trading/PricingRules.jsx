'use client';
import { useState } from 'react';
import { instruments } from '../../lib/mockData';
import { toast } from '../shared/Toast';

const GROUPS = ['Standard','Professional','VIP'];
const IMPACT = ['HIGH','MEDIUM'];
const ECONOMIC_EVENTS = ['Non-Farm Payrolls','FOMC Rate Decision','ECB Rate Decision','CPI Release','GDP Release','Bank of England Decision','Fed Chair Speech','Unemployment Rate'];

const INIT_GROUP_RULES = [
  { id: 'gr1', group: 'Standard',     symbol: 'EUR/USD', markup: 0.5, commOverride: null, leverageCap: 30 },
  { id: 'gr2', group: 'Standard',     symbol: 'GBP/USD', markup: 0.5, commOverride: null, leverageCap: 30 },
  { id: 'gr3', group: 'Professional', symbol: 'EUR/USD', markup: 0.2, commOverride: null, leverageCap: 200 },
  { id: 'gr4', group: 'VIP',          symbol: 'ALL',     markup: 0,   commOverride: null, leverageCap: 500 },
  { id: 'gr5', group: 'Standard',     symbol: 'BTC/USD', markup: 5,   commOverride: null, leverageCap: 2 },
];

const INIT_TIME_RULES = [
  { id: 'tr1', symbol: 'EUR/USD', markupDelta: 2, fromTime: '21:00', toTime: '22:00', days: ['Mon','Tue','Wed','Thu','Fri'], enabled: true, reason: 'Low liquidity close' },
  { id: 'tr2', symbol: 'ALL',     markupDelta: 3, fromTime: '00:00', toTime: '01:00', days: ['Sat','Sun'], enabled: true, reason: 'Weekend hours' },
  { id: 'tr3', symbol: 'XAUUSD', markupDelta: 1.5, fromTime: '13:25', toTime: '13:35', days: ['Mon','Tue','Wed','Thu','Fri'], enabled: false, reason: 'COMEX open' },
];

const INIT_EVENT_RULES = [
  { id: 'ev1', event: 'Non-Farm Payrolls',    impact: 'HIGH',   symbols: ['EUR/USD','GBP/USD','USD/JPY'], delta: 5, minutesBefore: 5, minutesAfter: 15, enabled: true },
  { id: 'ev2', event: 'FOMC Rate Decision',   impact: 'HIGH',   symbols: ['ALL'],                         delta: 8, minutesBefore: 10, minutesAfter: 30, enabled: true },
  { id: 'ev3', event: 'CPI Release',          impact: 'MEDIUM', symbols: ['EUR/USD','GBP/USD'],           delta: 3, minutesBefore: 5, minutesAfter: 10, enabled: true },
];

function Toggle({ on, onChange }) {
  return (
    <div className={`toggle ${on ? 'on' : ''}`} onClick={() => onChange(!on)} style={{ cursor: 'pointer', flexShrink: 0 }} />
  );
}

// ─── ADD RULE MODAL ────────────────────────────────────────────────────────────
function AddGroupRuleModal({ onClose, onSave }) {
  const [form, setForm] = useState({ group: 'Standard', symbol: 'EUR/USD', markup: 0, commOverride: '', leverageCap: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ fontSize: 14, fontWeight: 600 }}>Add Group Pricing Rule</div>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
            <div className="form-group">
              <label className="label">Client Group</label>
              <select className="select" value={form.group} onChange={e => set('group', e.target.value)}>
                {GROUPS.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Symbol</label>
              <select className="select" value={form.symbol} onChange={e => set('symbol', e.target.value)}>
                <option value="ALL">ALL instruments</option>
                {instruments.map(i => <option key={i.symbol}>{i.symbol}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Spread Markup (pips)</label>
              <input className="input" type="number" step="0.1" value={form.markup} onChange={e => set('markup', +e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">Commission Override ($/lot)</label>
              <input className="input" type="number" placeholder="Leave blank for default" value={form.commOverride} onChange={e => set('commOverride', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">Max Leverage Cap</label>
              <select className="select" value={form.leverageCap} onChange={e => set('leverageCap', +e.target.value)}>
                {[2,5,10,20,30,50,100,200,500].map(l => <option key={l} value={l}>1:{l}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={() => { onSave(form); onClose(); }}>Add Rule</button>
        </div>
      </div>
    </div>
  );
}

export default function PricingRules() {
  const [groupRules, setGroupRules]   = useState(INIT_GROUP_RULES);
  const [timeRules,  setTimeRules]    = useState(INIT_TIME_RULES);
  const [eventRules, setEventRules]   = useState(INIT_EVENT_RULES);
  const [showAddGroup, setAddGroup]   = useState(false);
  const [tab, setTab]                 = useState('group');

  const DAYS_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <div style={{ padding: '20px 0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>Pricing Rules</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
            Group overrides · Time-based markups · Event-triggered spreads
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {tab === 'group' && <button className="btn btn-primary btn-sm" onClick={() => setAddGroup(true)}>+ Add Rule</button>}
          {tab === 'time' && <button className="btn btn-primary btn-sm" onClick={() => toast.info('Time rule form')}>+ Add Time Rule</button>}
          {tab === 'event' && <button className="btn btn-primary btn-sm" onClick={() => toast.info('Event rule form')}>+ Add Event Rule</button>}
        </div>
      </div>

      {/* Alert banner */}
      <div style={{ padding: '10px 14px', background: 'var(--warn-muted)', border: '1px solid var(--warn-dim)', borderRadius: 8, marginBottom: 16, fontSize: 11, color: 'var(--warn)', display: 'flex', gap: 10, alignItems: 'center' }}>
        <span style={{ fontSize: 14 }}>⚠</span>
        <span>Rules are applied in order: <strong style={{ color: 'var(--text-primary)' }}>Event rules</strong> override <strong style={{ color: 'var(--text-primary)' }}>Time rules</strong> override <strong style={{ color: 'var(--text-primary)' }}>Group rules</strong> override <strong style={{ color: 'var(--text-primary)' }}>Instrument defaults</strong>.</span>
      </div>

      <div className="tabs" style={{ padding: 0, marginBottom: 16 }}>
        <button className={`tab ${tab === 'group' ? 'active' : ''}`} onClick={() => setTab('group')}>
          Group Overrides<span className="tab-count">{groupRules.length}</span>
        </button>
        <button className={`tab ${tab === 'time' ? 'active' : ''}`} onClick={() => setTab('time')}>
          Time-Based Rules<span className="tab-count">{timeRules.length}</span>
        </button>
        <button className={`tab ${tab === 'event' ? 'active' : ''}`} onClick={() => setTab('event')}>
          Event Triggers<span className="tab-count">{eventRules.length}</span>
        </button>
      </div>

      {tab === 'group' && (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  {['Group','Symbol','Spread Markup','Commission Override','Leverage Cap',''].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {groupRules.map(rule => (
                  <tr key={rule.id}>
                    <td>
                      <span className={`pill ${rule.group === 'VIP' ? 'pill-warn' : rule.group === 'Professional' ? 'pill-accent' : 'pill-muted'}`} style={{ fontSize: 10 }}>
                        {rule.group}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-data)', fontWeight: 700, fontSize: 12 }}>
                      {rule.symbol === 'ALL' ? <span style={{ color: 'var(--text-tertiary)' }}>ALL instruments</span> : rule.symbol}
                    </td>
                    <td>
                      <span style={{
                        fontFamily: 'var(--font-data)', fontSize: 12, fontWeight: 600,
                        color: rule.markup > 0 ? 'var(--warn)' : rule.markup < 0 ? 'var(--bull)' : 'var(--text-tertiary)',
                      }}>
                        {rule.markup > 0 ? '+' : ''}{rule.markup} pips
                      </span>
                    </td>
                    <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                      {rule.commOverride != null ? `$${rule.commOverride}/lot` : '— default'}
                    </td>
                    <td style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--accent)' }}>
                      1:{rule.leverageCap}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-xs">Edit</button>
                        <button className="btn btn-danger btn-xs"
                          onClick={() => { setGroupRules(rs => rs.filter(r => r.id !== rule.id)); toast.warn('Rule deleted'); }}>
                          Del
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'time' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {timeRules.map(rule => (
            <div key={rule.id} className="card" style={{ padding: 0 }}>
              <div style={{ padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <Toggle on={rule.enabled} onChange={v => setTimeRules(rs => rs.map(r => r.id === rule.id ? { ...r, enabled: v } : r))} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-data)', fontWeight: 700, fontSize: 13, color: rule.enabled ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                      {rule.symbol === 'ALL' ? 'All Instruments' : rule.symbol}
                    </span>
                    <span style={{ fontSize: 12, color: rule.enabled ? 'var(--warn)' : 'var(--text-tertiary)' }}>
                      +{rule.markupDelta} pips
                    </span>
                    <div style={{ height: 12, width: 1, background: 'var(--border)' }} />
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-data)' }}>
                      {rule.fromTime} – {rule.toTime} UTC
                    </span>
                    <div style={{ height: 12, width: 1, background: 'var(--border)' }} />
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{rule.reason}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {DAYS_SHORT.map(day => (
                      <div key={day} style={{
                        padding: '3px 8px', borderRadius: 5, fontSize: 10, fontWeight: 600,
                        background: rule.days.includes(day) ? (rule.enabled ? 'var(--accent-muted)' : 'var(--bg-4)') : 'var(--bg-3)',
                        color: rule.days.includes(day) ? (rule.enabled ? 'var(--accent)' : 'var(--text-tertiary)') : 'var(--text-muted)',
                        border: `1px solid ${rule.days.includes(day) ? (rule.enabled ? 'var(--border-accent)' : 'var(--border)') : 'transparent'}`,
                      }}>
                        {day}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button className="btn btn-ghost btn-xs">Edit</button>
                  <button className="btn btn-danger btn-xs"
                    onClick={() => { setTimeRules(rs => rs.filter(r => r.id !== rule.id)); toast.warn('Time rule deleted'); }}>
                    Del
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'event' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {eventRules.map(rule => (
            <div key={rule.id} className="card" style={{ padding: 0 }}>
              <div style={{ padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <Toggle on={rule.enabled} onChange={v => setEventRules(rs => rs.map(r => r.id === rule.id ? { ...r, enabled: v } : r))} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                      background: rule.impact === 'HIGH' ? 'var(--bear-muted)' : 'var(--warn-muted)',
                      color: rule.impact === 'HIGH' ? 'var(--bear)' : 'var(--warn)',
                    }}>
                      {rule.impact}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: rule.enabled ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                      {rule.event}
                    </span>
                    <span style={{ fontSize: 12, color: rule.enabled ? 'var(--warn)' : 'var(--text-tertiary)' }}>
                      +{rule.delta} pips
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                    <span>⏱ Widens <strong style={{ color: 'var(--text-primary)' }}>{rule.minutesBefore} min</strong> before event</span>
                    <span>↩ Reverts <strong style={{ color: 'var(--text-primary)' }}>{rule.minutesAfter} min</strong> after</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {rule.symbols.map(s => (
                        <span key={s} className="pill pill-muted" style={{ fontSize: 10 }}>{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button className="btn btn-ghost btn-xs">Edit</button>
                  <button className="btn btn-danger btn-xs"
                    onClick={() => { setEventRules(rs => rs.filter(r => r.id !== rule.id)); toast.warn('Event rule deleted'); }}>
                    Del
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddGroup && (
        <AddGroupRuleModal
          onClose={() => setAddGroup(false)}
          onSave={(rule) => {
            setGroupRules(rs => [...rs, { id: 'gr' + Date.now(), ...rule }]);
            toast.success('Group pricing rule added');
          }}
        />
      )}
    </div>
  );
}
