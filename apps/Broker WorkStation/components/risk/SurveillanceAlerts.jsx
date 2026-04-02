'use client';
import { useState } from 'react';
import { surveillanceAlerts, clients } from '../../lib/mockData';

// ─────────────────────────────────────────────────────────────────────────────
// SURVEILLANCE ALERTS
// ─────────────────────────────────────────────────────────────────────────────
export function SurveillanceAlerts() {
  const [alerts, setAlerts] = useState(surveillanceAlerts);
  const [tab, setTab] = useState('Open');
  const [selected, setSelected] = useState(null);

  const TABS = [
    { label: 'Open',         filter: a => a.status === 'Open' },
    { label: 'Investigating',filter: a => a.status === 'Investigating' },
    { label: 'Resolved',     filter: a => a.status === 'Resolved' },
    { label: 'All',          filter: () => true },
  ];

  const current = TABS.find(t => t.label === tab);
  const displayed = alerts.filter(current.filter);

  const sevColor = s => s === 'HIGH' ? 'var(--bear)' : s === 'MEDIUM' ? 'var(--warn)' : 'var(--text-secondary)';
  const sevBg    = s => s === 'HIGH' ? 'var(--bear-muted)' : s === 'MEDIUM' ? 'var(--warn-muted)' : 'var(--bg-3)';

  const updateStatus = (id, status) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    setSelected(null);
  };

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <div style={{ padding: '20px 0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>Surveillance Alerts</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
            {alerts.filter(a => a.status === 'Open').length} open · {alerts.filter(a => a.severity === 'HIGH' && a.status === 'Open').length} high severity
          </div>
        </div>
        <button className="btn btn-ghost btn-sm">Export History</button>
      </div>

      <div className="tabs" style={{ padding: 0, marginBottom: 16 }}>
        {TABS.map(t => {
          const count = alerts.filter(t.filter).length;
          return (
            <button key={t.label} className={`tab ${tab === t.label ? 'active' : ''}`} onClick={() => setTab(t.label)}>
              {t.label}
              {count > 0 && <span className="tab-count">{count}</span>}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 360px' : '1fr', gap: 14 }}>
        <div className="card">
          {displayed.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">✓</div>
              <div className="empty-state__title">No {tab.toLowerCase()} alerts</div>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    {['Severity','Type','Entity','Time','Status','Actions'].map(h => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {displayed.map(alert => (
                    <tr
                      key={alert.id}
                      style={{ cursor: 'pointer', background: selected?.id === alert.id ? 'var(--bg-3)' : '' }}
                      onClick={() => setSelected(alert)}
                    >
                      <td>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '3px 8px',
                          borderRadius: 20, background: sevBg(alert.severity), color: sevColor(alert.severity),
                        }}>
                          {alert.severity}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{alert.type}</td>
                      <td style={{ fontSize: 11, color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {alert.entity}
                      </td>
                      <td style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-data)', whiteSpace: 'nowrap' }}>
                        {alert.time}
                      </td>
                      <td>
                        <span className={`pill ${alert.status === 'Open' ? 'pill-bear' : alert.status === 'Investigating' ? 'pill-warn' : 'pill-muted'}`} style={{ fontSize: 10 }}>
                          {alert.status}
                        </span>
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {alert.status === 'Open' && (
                            <button className="btn btn-ghost btn-xs" onClick={() => updateStatus(alert.id, 'Investigating')}>
                              Investigate
                            </button>
                          )}
                          {alert.status === 'Investigating' && (
                            <button className="btn btn-success btn-xs" onClick={() => updateStatus(alert.id, 'Resolved')}>
                              Resolve
                            </button>
                          )}
                          <button className="btn btn-ghost btn-xs" onClick={() => { updateStatus(alert.id, alert.status); alert && setSelected(null); }}>
                            FP
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selected && (
          <div className="card" style={{ height: 'fit-content' }}>
            <div className="card-header">
              <span className="card-title">Alert Detail</span>
              <button className="drawer-close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ padding: '8px 12px', borderRadius: 8, background: sevBg(selected.severity), marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: sevColor(selected.severity), marginBottom: 4 }}>
                  {selected.severity} SEVERITY
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{selected.type}</div>
              </div>

              {[
                ['Alert ID',   selected.id],
                ['Entity',     selected.entity],
                ['Time',       selected.time],
                ['Status',     selected.status],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{l}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{v}</span>
                </div>
              ))}

              <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--bg-3)', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {selected.description}
              </div>

              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-tertiary)', marginBottom: 4 }}>
                  Actions
                </div>
                <button className="btn btn-ghost btn-sm" style={{ justifyContent: 'flex-start' }}>
                  📧 Notify compliance team
                </button>
                {selected.status === 'Open' && (
                  <button className="btn btn-warn btn-sm" style={{ justifyContent: 'flex-start' }}
                    onClick={() => updateStatus(selected.id, 'Investigating')}>
                    🔍 Start investigation
                  </button>
                )}
                {selected.status === 'Investigating' && (
                  <button className="btn btn-success btn-sm" style={{ justifyContent: 'flex-start' }}
                    onClick={() => updateStatus(selected.id, 'Resolved')}>
                    ✓ Mark resolved
                  </button>
                )}
                <button className="btn btn-ghost btn-sm" style={{ justifyContent: 'flex-start' }}>
                  📄 Generate SAR
                </button>
                <button className="btn btn-ghost btn-sm" style={{ justifyContent: 'flex-start' }}
                  onClick={() => alert('Marked as false positive')}>
                  ○ Mark false positive
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AML MONITOR
// ─────────────────────────────────────────────────────────────────────────────
export function AMLMonitor() {
  const [showSAR, setShowSAR] = useState(null);
  const [sarNarrative, setSarNarrative] = useState('');

  const sortedClients = [...clients].sort((a, b) => b.amlScore - a.amlScore);

  const scoreColor = s => s > 50 ? 'var(--bear)' : s > 25 ? 'var(--warn)' : 'var(--bull)';
  const scoreLabel = s => s > 50 ? 'HIGH RISK' : s > 25 ? 'MEDIUM' : 'LOW';

  const flags = [
    { id: 1, type: 'Round-number deposits', client: 'Tariq Hassan (C1009)', time: '2024-01-15 08:30', detail: '3 deposits of exactly $10,000 within 24h' },
    { id: 2, type: 'Rapid deposit-withdraw', client: 'Omar Abdullah (C1015)', time: '2024-01-14 19:00', detail: 'Deposit $10K → Withdrawal $9.8K within 2h' },
    { id: 3, type: 'Trading without profit motive', client: 'Tariq Hassan (C1009)', time: '2024-01-14 22:00', detail: '47 offsetting trades generating near-zero P&L' },
  ];

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <div style={{ padding: '20px 0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>AML Monitor</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
            Automated risk scoring · Suspicious activity detection
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowSAR({})}>
          + Generate SAR
        </button>
      </div>

      {/* Suspicious flags */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-header">
          <span className="card-title">Active Suspicious Activity Flags</span>
          <span style={{ fontSize: 10, padding: '2px 8px', background: 'var(--bear-muted)', color: 'var(--bear)', borderRadius: 10, fontWeight: 700 }}>
            {flags.length} active
          </span>
        </div>
        <div>
          {flags.map(flag => (
            <div key={flag.id} style={{ display: 'flex', gap: 14, padding: '12px 16px', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--bear)', flexShrink: 0, marginTop: 4 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{flag.type}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 3 }}>{flag.client}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{flag.detail}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-data)', marginBottom: 6 }}>{flag.time}</div>
                <button className="btn btn-ghost btn-xs" onClick={() => setShowSAR(flag)}>Generate SAR</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Client AML scores */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Client AML Risk Scores</span>
          <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>Auto-scored · Updated daily</span>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {['Client','AML Score','Risk Level','Status','Factors','Last Updated',''].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {sortedClients.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-data)' }}>{c.id}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 48, height: 6, background: 'var(--bg-4)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${c.amlScore}%`, height: '100%', background: scoreColor(c.amlScore), borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 12, fontFamily: 'var(--font-data)', fontWeight: 700, color: scoreColor(c.amlScore) }}>
                        {c.amlScore}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: 10, fontWeight: 700, color: scoreColor(c.amlScore) }}>{scoreLabel(c.amlScore)}</span>
                  </td>
                  <td>
                    <span className={`pill ${c.amlStatus === 'Flagged' ? 'pill-bear' : c.amlStatus === 'Review' ? 'pill-warn' : 'pill-muted'}`} style={{ fontSize: 10 }}>
                      {c.amlStatus === 'Clear' ? '✓ Clear' : c.amlStatus === 'Flagged' ? '⚑ Flagged' : '⚠ Review'}
                    </span>
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    {c.amlScore > 50 ? 'Country risk, trade pattern, deposit frequency' :
                     c.amlScore > 25 ? 'Country risk, volume spike' : 'No risk factors'}
                  </td>
                  <td style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-data)' }}>Today</td>
                  <td>
                    {c.amlStatus !== 'Clear' && (
                      <button className="btn btn-ghost btn-xs" onClick={() => setShowSAR(c)}>SAR</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SAR Builder Modal */}
      {showSAR && (
        <div className="modal-overlay" onClick={() => setShowSAR(null)}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ fontSize: 15, fontWeight: 600 }}>Suspicious Activity Report (SAR)</div>
              <button className="drawer-close" onClick={() => setShowSAR(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: 'var(--bear-muted)', border: '1px solid var(--bear-dim)', borderRadius: 8, padding: '10px 14px', fontSize: 11, color: 'var(--bear)' }}>
                ⚑ This SAR will be submitted to Seychelles FSA under AML/CFT obligations
              </div>
              {[
                ['Reporting Entity', 'ArcaFX Ltd — SD052'],
                ['Client', showSAR.client || (showSAR.name ? `${showSAR.name} (${showSAR.id})` : 'Select client...')],
                ['Activity Type', showSAR.type || 'Suspicious transaction pattern'],
                ['Period', '2024-01-01 to 2024-01-15'],
              ].map(([l, v]) => (
                <div key={l} className="form-group" style={{ margin: 0 }}>
                  <label className="label">{l}</label>
                  <input className="input" defaultValue={v} />
                </div>
              ))}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="label">Narrative Description</label>
                <textarea
                  value={sarNarrative}
                  onChange={e => setSarNarrative(e.target.value)}
                  placeholder="Describe the suspicious activity in detail: timeline, amounts, patterns, and why this raises suspicion of money laundering or terrorist financing..."
                  style={{
                    width: '100%', minHeight: 120, background: 'var(--bg-3)',
                    border: '1px solid var(--border)', borderRadius: 6,
                    padding: '10px 12px', fontSize: 12, color: 'var(--text-primary)',
                    fontFamily: 'var(--font-ui)', resize: 'vertical', outline: 'none',
                    boxSizing: 'border-box', lineHeight: 1.5,
                  }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowSAR(null)}>Cancel</button>
              <button className="btn btn-ghost btn-sm" onClick={() => alert('SAR PDF generated')}>
                📄 Generate PDF
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => { alert('SAR submitted to regulator'); setShowSAR(null); }}>
                Submit to Regulator
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SurveillanceAlerts;
