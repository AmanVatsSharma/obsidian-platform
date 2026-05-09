'use client';
import { useState } from 'react';
import { toast } from '../shared/Toast';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const DAY_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const GROUPS = ['Forex','Indices','Commodities','Crypto'];
const GROUP_COLORS = { Forex: 'var(--accent)', Indices: 'var(--warn)', Commodities: '#EC4899', Crypto: '#8B5CF6' };

const DEFAULT_SCHEDULE = DAY_SHORT.map((day, i) => ({
  day,
  isWeekend: i >= 5,
  closed: i >= 5,
  open: '00:00',
  close: '23:59',
  breaks: i === 4 ? [{ from: '21:00', to: '22:00' }] : [],
}));

const DEFAULT_GROUP_SESSIONS = {
  Forex:       { mon: '00:00-23:59', tue: '00:00-23:59', wed: '00:00-23:59', thu: '00:00-23:59', fri: '00:00-22:00', sat: 'Closed', sun: '21:00-23:59' },
  Indices:     { mon: '08:00-22:00', tue: '08:00-22:00', wed: '08:00-22:00', thu: '08:00-22:00', fri: '08:00-21:30', sat: 'Closed', sun: 'Closed' },
  Commodities: { mon: '01:00-23:59', tue: '01:00-23:59', wed: '01:00-23:59', thu: '01:00-23:59', fri: '01:00-22:00', sat: 'Closed', sun: '23:00-23:59' },
  Crypto:      { mon: '00:00-23:59', tue: '00:00-23:59', wed: '00:00-23:59', thu: '00:00-23:59', fri: '00:00-23:59', sat: '00:00-23:59', sun: '00:00-23:59' },
};

const INITIAL_HOLIDAYS = [
  { id: 'h1', date: '2024-01-01', name: "New Year's Day",    affected: 'ALL',   type: 'Full Closure' },
  { id: 'h2', date: '2024-03-29', name: 'Good Friday',       affected: 'Forex,Indices', type: 'Early Close 18:00' },
  { id: 'h3', date: '2024-04-01', name: 'Easter Monday',     affected: 'Indices', type: 'Full Closure' },
  { id: 'h4', date: '2024-12-25', name: 'Christmas Day',     affected: 'ALL',   type: 'Full Closure' },
  { id: 'h5', date: '2024-12-26', name: 'Boxing Day',        affected: 'Indices', type: 'Full Closure' },
];

function Toggle({ on, onChange }) {
  return <div className={`toggle ${on ? 'on' : ''}`} onClick={() => onChange(!on)} style={{ cursor: 'pointer' }} />;
}

function TimeInput({ value, onChange }) {
  return (
    <input
      className="input"
      type="time"
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{ width: 88, fontSize: 12 }}
    />
  );
}

export default function TradingSessions() {
  const [schedule, setSchedule]   = useState(DEFAULT_SCHEDULE);
  const [holidays, setHolidays]   = useState(INITIAL_HOLIDAYS);
  const [dst, setDst]             = useState(true);
  const [dstDate, setDstDate]     = useState('2024-03-31');
  const [tab, setTab]             = useState('global');
  const [showAddHoliday, setAddH] = useState(false);
  const [newHoliday, setNewH]     = useState({ date: '', name: '', affected: 'ALL', type: 'Full Closure' });

  const updateDay = (dayIdx, field, value) => {
    setSchedule(s => s.map((d, i) => i === dayIdx ? { ...d, [field]: value } : d));
  };

  const addBreak = (dayIdx) => {
    setSchedule(s => s.map((d, i) => i === dayIdx ? { ...d, breaks: [...d.breaks, { from: '12:00', to: '13:00' }] } : d));
  };

  const removeBreak = (dayIdx, breakIdx) => {
    setSchedule(s => s.map((d, i) => i === dayIdx ? { ...d, breaks: d.breaks.filter((_, bi) => bi !== breakIdx) } : d));
  };

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <div style={{ padding: '20px 0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>Trading Sessions</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
            Global trading schedule · All times UTC
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => toast.success('Trading sessions saved')}>
          Save All Changes
        </button>
      </div>

      {/* DST Banner */}
      <div style={{ padding: '10px 14px', background: 'var(--accent-muted)', border: '1px solid var(--border-accent)', borderRadius: 8, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Toggle on={dst} onChange={setDst} />
        <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>Auto-adjust for Daylight Saving Time (DST)</span>
        {dst && (
          <>
            <div style={{ height: 12, width: 1, background: 'var(--border-accent)' }} />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Next transition:</span>
            <input className="input" type="date" value={dstDate} onChange={e => setDstDate(e.target.value)} style={{ width: 140 }} />
          </>
        )}
      </div>

      <div className="tabs" style={{ padding: 0, marginBottom: 16 }}>
        <button className={`tab ${tab === 'global' ? 'active' : ''}`} onClick={() => setTab('global')}>Global Schedule</button>
        <button className={`tab ${tab === 'groups' ? 'active' : ''}`} onClick={() => setTab('groups')}>By Instrument Group</button>
        <button className={`tab ${tab === 'holidays' ? 'active' : ''}`} onClick={() => setTab('holidays')}>
          Market Closures<span className="tab-count">{holidays.filter(h => h.date >= '2024-01-15').length} upcoming</span>
        </button>
      </div>

      {tab === 'global' && (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 100 }}>Day</th>
                  <th style={{ width: 80 }}>Open</th>
                  <th style={{ width: 80 }}>Close</th>
                  <th>Breaks</th>
                  <th style={{ width: 80 }}>Closed</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((day, i) => (
                  <tr key={day.day} style={{ opacity: day.closed ? 0.5 : 1, transition: 'opacity 0.15s' }}>
                    <td>
                      <span style={{ fontSize: 12, fontWeight: day.isWeekend ? 400 : 500, color: day.isWeekend ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                        {day.day}
                      </span>
                    </td>
                    <td>
                      <TimeInput value={day.open} onChange={v => updateDay(i, 'open', v)} />
                    </td>
                    <td>
                      <TimeInput value={day.close} onChange={v => updateDay(i, 'close', v)} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        {day.breaks.map((brk, bi) => (
                          <div key={bi} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-3)', borderRadius: 6, padding: '3px 8px' }}>
                            <span style={{ fontSize: 11, fontFamily: 'var(--font-data)', color: 'var(--text-secondary)' }}>
                              {brk.from}–{brk.to}
                            </span>
                            <button style={{ cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 10, border: 'none', background: 'none' }}
                              onClick={() => removeBreak(i, bi)}>✕</button>
                          </div>
                        ))}
                        <button className="btn btn-ghost btn-xs" onClick={() => addBreak(i)}>+ Break</button>
                      </div>
                    </td>
                    <td>
                      <Toggle on={day.closed} onChange={v => updateDay(i, 'closed', v)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-xs" onClick={() => {
              setSchedule(s => s.map(d => ({ ...d, open: '00:00', close: '23:59', breaks: [] })));
              toast.info('Applied 24/7 schedule to all days');
            }}>
              Apply 24/7 to all
            </button>
            <button className="btn btn-ghost btn-xs" onClick={() => {
              setSchedule(s => s.map((d, i) => ({ ...d, closed: i >= 5 })));
              toast.info('Weekends closed, weekdays open');
            }}>
              Standard M–F
            </button>
          </div>
        </div>
      )}

      {tab === 'groups' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {GROUPS.map(group => (
            <div key={group} className="card">
              <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: GROUP_COLORS[group] }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{group}</span>
              </div>
              <div style={{ padding: '10px 14px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr>
                      {DAY_SHORT.map(d => (
                        <th key={d} style={{ padding: '4px 6px', textAlign: 'center', fontSize: 9, color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: '0.05em' }}>{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {DAY_SHORT.map(d => {
                        const sessionKey = d.toLowerCase();
                        const val = DEFAULT_GROUP_SESSIONS[group][sessionKey];
                        const isClosed = val === 'Closed';
                        return (
                          <td key={d} style={{ padding: '4px 3px', textAlign: 'center' }}>
                            <div style={{
                              padding: '4px 2px', borderRadius: 5, fontSize: 9,
                              background: isClosed ? 'var(--bg-3)' : `${GROUP_COLORS[group]}15`,
                              color: isClosed ? 'var(--text-tertiary)' : GROUP_COLORS[group],
                              fontFamily: isClosed ? undefined : 'var(--font-data)',
                              fontWeight: isClosed ? 400 : 600,
                              border: `1px solid ${isClosed ? 'transparent' : GROUP_COLORS[group] + '30'}`,
                            }}>
                              {isClosed ? '—' : val.replace(/-/, '↔').replace(':00', '')}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'holidays' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button className="btn btn-primary btn-sm" onClick={() => setAddH(true)}>+ Add Closure</button>
          </div>
          <div className="card">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>{['Date','Holiday','Affected Instruments','Type',''].map(h => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {holidays.sort((a, b) => a.date.localeCompare(b.date)).map(h => {
                    const isPast = h.date < '2024-01-15';
                    return (
                      <tr key={h.id} style={{ opacity: isPast ? 0.45 : 1 }}>
                        <td style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: isPast ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>{h.date}</td>
                        <td style={{ fontWeight: 500 }}>{h.name}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {h.affected === 'ALL'
                              ? <span className="pill pill-bear" style={{ fontSize: 10 }}>All instruments</span>
                              : h.affected.split(',').map(a => (
                                <span key={a} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: `${GROUP_COLORS[a.trim()] || 'var(--bg-4)'}20`, color: GROUP_COLORS[a.trim()] || 'var(--text-secondary)' }}>
                                  {a.trim()}
                                </span>
                              ))
                            }
                          </div>
                        </td>
                        <td><span className="pill pill-muted" style={{ fontSize: 10 }}>{h.type}</span></td>
                        <td>
                          <button className="btn btn-danger btn-xs"
                            onClick={() => { setHolidays(hs => hs.filter(x => x.id !== h.id)); toast.warn(`Removed: ${h.name}`); }}>
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {showAddHoliday && (
            <div className="modal-overlay" onClick={() => setAddH(false)}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Add Market Closure</div>
                  <button className="drawer-close" onClick={() => setAddH(false)}>✕</button>
                </div>
                <div className="modal-body">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
                    <div className="form-group">
                      <label className="label">Date</label>
                      <input className="input" type="date" value={newHoliday.date} onChange={e => setNewH(h => ({ ...h, date: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="label">Holiday Name</label>
                      <input className="input" placeholder="e.g. Eid Al-Fitr" value={newHoliday.name} onChange={e => setNewH(h => ({ ...h, name: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="label">Affected</label>
                      <select className="select" value={newHoliday.affected} onChange={e => setNewH(h => ({ ...h, affected: e.target.value }))}>
                        <option value="ALL">All instruments</option>
                        {GROUPS.map(g => <option key={g}>{g}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="label">Closure Type</label>
                      <select className="select" value={newHoliday.type} onChange={e => setNewH(h => ({ ...h, type: e.target.value }))}>
                        {['Full Closure','Early Close 18:00','Early Close 20:00','Late Open 10:00'].map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-ghost btn-sm" onClick={() => setAddH(false)}>Cancel</button>
                  <button className="btn btn-primary btn-sm" disabled={!newHoliday.date || !newHoliday.name}
                    onClick={() => {
                      setHolidays(hs => [...hs, { ...newHoliday, id: 'h' + Date.now() }]);
                      toast.success(`Market closure added: ${newHoliday.name}`);
                      setAddH(false);
                      setNewH({ date: '', name: '', affected: 'ALL', type: 'Full Closure' });
                    }}>
                    Add Closure
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
