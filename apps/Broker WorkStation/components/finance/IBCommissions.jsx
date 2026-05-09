'use client';
import { useState, useMemo } from 'react';
import { introducingBrokers, clients } from '../../lib/mockData';
import { toast } from '../shared/Toast';

const MONTHS = ['Jan 2024','Dec 2023','Nov 2023','Oct 2023','Sep 2023','Aug 2023'];

function buildLedger(ib) {
  return MONTHS.map((month, i) => {
    const scale = 1 - i * 0.06;
    const vol = Math.round(ib.volumeMTD * scale);
    const amt = Math.round(vol * ib.commissionRate);
    return {
      month,
      volume: vol,
      rate: ib.commissionRate,
      gross: amt,
      adjustments: i === 0 ? 0 : i === 2 ? -150 : 0,
      net: amt + (i === 2 ? -150 : 0),
      status: i === 0 ? 'Pending' : i === 1 ? 'Processing' : 'Paid',
      paidDate: i >= 2 ? `2023-${String(12 - i).padStart(2,'0')}-05` : null,
      ref: `COM-${ib.id}-${String(2024 - Math.floor(i/12)).slice(-2)}${String(12 - (i % 12)).padStart(2,'0')}`,
    };
  });
}

// ─── MONTHLY RUN MODAL ────────────────────────────────────────────────────────
function RunModal({ onClose, onConfirm }) {
  const [step, setStep] = useState('preview');
  const preview = introducingBrokers.map(ib => ({
    ib,
    volume: ib.volumeMTD,
    rate: ib.commissionRate,
    gross: Math.round(ib.volumeMTD * ib.commissionRate),
    adjustments: 0,
    net: Math.round(ib.volumeMTD * ib.commissionRate),
    eligible: ib.status === 'Active' && Math.round(ib.volumeMTD * ib.commissionRate) >= ib.minThreshold,
  }));
  const total = preview.filter(p => p.eligible).reduce((s, p) => s + p.net, 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>
              {step === 'preview' ? 'Monthly Commission Run — Preview' : '✓ Commission Run Complete'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
              Period: January 2024
            </div>
          </div>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>

        {step === 'preview' && (
          <>
            <div className="modal-body" style={{ padding: '16px 20px 4px' }}>
              <div style={{ overflow: 'auto', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 14 }}>
                <table>
                  <thead>
                    <tr>
                      {['IB','Volume (lots)','Rate','Gross','Threshold Met','Net Due'].map(h => (
                        <th key={h} style={{ fontSize: 9 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map(p => (
                      <tr key={p.ib.id} style={{ opacity: p.eligible ? 1 : 0.45 }}>
                        <td>
                          <div style={{ fontWeight: 500 }}>{p.ib.name}</div>
                          <div style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>Tier {p.ib.tier}</div>
                        </td>
                        <td className="mono">{p.volume.toLocaleString()}</td>
                        <td className="mono">${p.rate}/lot</td>
                        <td className="mono" style={{ color: 'var(--bull)' }}>${p.gross.toLocaleString()}</td>
                        <td>
                          {p.eligible
                            ? <span style={{ color: 'var(--bull)', fontSize: 11 }}>✓ Yes</span>
                            : <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>✗ Below ${p.ib.minThreshold}</span>
                          }
                        </td>
                        <td className="mono" style={{ fontWeight: 700, color: p.eligible ? 'var(--bull)' : 'var(--text-tertiary)' }}>
                          {p.eligible ? `$${p.net.toLocaleString()}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg-3)', borderRadius: 8 }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Payout</div>
                  <div style={{ fontSize: 22, fontFamily: 'var(--font-data)', fontWeight: 700, color: 'var(--bull)' }}>${total.toLocaleString()}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{preview.filter(p => p.eligible).length} IBs eligible</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{preview.filter(p => !p.eligible).length} below threshold</div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
              <button className="btn btn-success btn-sm" onClick={() => {
                setStep('done');
                onConfirm(total, preview.filter(p => p.eligible).length);
              }}>
                Confirm & Mark for Payment
              </button>
            </div>
          </>
        )}

        {step === 'done' && (
          <div className="modal-body" style={{ textAlign: 'center', padding: 32 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--bull)', marginBottom: 6 }}>Commission run complete</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 20 }}>
              ${total.toLocaleString()} marked for payment across {preview.filter(p => p.eligible).length} IBs.
              Finance team has been notified.
            </div>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ADJUSTMENT MODAL ─────────────────────────────────────────────────────────
function AdjustModal({ ib, onClose, onSave }) {
  const [type, setType] = useState('credit');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ fontSize: 14, fontWeight: 600 }}>Commission Adjustment — {ib.name}</div>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
            <div className="form-group">
              <label className="label">Adjustment Type</label>
              <select className="select" value={type} onChange={e => setType(e.target.value)}>
                <option value="credit">Credit (add to owed)</option>
                <option value="debit">Debit (subtract from owed)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="label">Amount (USD)</label>
              <input className="input" type="number" min="0" step="0.01"
                placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="label">Reason</label>
            <select className="select" value={reason} onChange={e => setReason(e.target.value)}>
              <option value="">Select reason...</option>
              {['Dispute resolved in IB favour','Clawback — client refunded','Data correction','Bonus override','Other'].map(r => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="label">Internal Note</label>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              placeholder="Optional note for audit trail..."
              style={{ width: '100%', minHeight: 72, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', fontSize: 12, color: 'var(--text-primary)', fontFamily: 'var(--font-ui)', resize: 'none', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" disabled={!amount || !reason}
            onClick={() => { onSave({ type, amount: +amount, reason, note }); onClose(); }}>
            Apply Adjustment
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── IB COMMISSIONS MAIN ──────────────────────────────────────────────────────
export default function IBCommissions() {
  const [showRun, setShowRun]       = useState(false);
  const [adjustIB, setAdjustIB]     = useState(null);
  const [selectedIB, setSelectedIB] = useState(null);
  const [tab, setTab]               = useState('overview');

  const overview = useMemo(() => introducingBrokers.map(ib => ({
    ib,
    volumeMTD: ib.volumeMTD,
    earned: ib.commissionEarned,
    paid: ib.commissionPaid,
    pending: ib.commissionPending,
    ledger: buildLedger(ib),
  })), []);

  const totalPending = overview.reduce((s, r) => s + r.pending, 0);

  return (
    <div style={{ padding: '0 24px 24px' }}>
      {/* Header */}
      <div style={{ padding: '20px 0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>IB Commissions</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
            ${totalPending.toLocaleString()} pending payout · {overview.filter(r => r.pending > 0).length} IBs
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm">Export CSV</button>
          <button className="btn btn-success btn-sm" onClick={() => setShowRun(true)}>
            ▶ Run Monthly Calculation
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          ['Total Earned (MTD)',  `$${overview.reduce((s,r) => s + r.earned, 0).toLocaleString()}`,  'var(--bull)'],
          ['Total Paid (MTD)',    `$${overview.reduce((s,r) => s + r.paid,   0).toLocaleString()}`,  'var(--text-primary)'],
          ['Pending Payout',      `$${totalPending.toLocaleString()}`,                               'var(--warn)'],
          ['Active IBs',          overview.filter(r => r.ib.status === 'Active').length.toString(),  'var(--accent)'],
        ].map(([label, val, color]) => (
          <div key={label} style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 5 }}>{label}</div>
            <div style={{ fontSize: 20, fontFamily: 'var(--font-data)', fontWeight: 700, color }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ padding: 0, marginBottom: 16 }}>
        <button className={`tab ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>Overview</button>
        <button className={`tab ${tab === 'detail' ? 'active' : ''}`} onClick={() => setTab('detail')}
          style={{ opacity: selectedIB ? 1 : 0.5 }}>
          {selectedIB ? `${selectedIB.name} — Ledger` : 'Select IB for Ledger'}
        </button>
      </div>

      {tab === 'overview' && (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  {['IB','Tier','Volume MTD','Rate','Gross Earned','Adjustments','Net Due','Last Paid','Status',''].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {overview.map(({ ib, volumeMTD, earned, paid, pending, ledger }) => {
                  const adj = ledger.reduce((s, r) => s + r.adjustments, 0);
                  return (
                    <tr key={ib.id} style={{ cursor: 'pointer' }}
                      onClick={() => { setSelectedIB(ib); setTab('detail'); }}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{ib.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{ib.id} · {ib.flag}</div>
                      </td>
                      <td>
                        <span className={`pill ${ib.tier === 1 ? 'pill-accent' : 'pill-warn'}`} style={{ fontSize: 10 }}>
                          Tier {ib.tier}
                        </span>
                      </td>
                      <td className="mono">{volumeMTD.toLocaleString()}</td>
                      <td className="mono">${ib.commissionRate}/lot</td>
                      <td className="mono" style={{ color: 'var(--bull)' }}>${earned.toLocaleString()}</td>
                      <td className="mono" style={{ color: adj < 0 ? 'var(--bear)' : adj > 0 ? 'var(--bull)' : 'var(--text-tertiary)' }}>
                        {adj !== 0 ? `${adj > 0 ? '+' : ''}$${adj.toLocaleString()}` : '—'}
                      </td>
                      <td className="mono" style={{ fontWeight: 700, color: pending > 0 ? 'var(--warn)' : 'var(--text-secondary)' }}>
                        ${pending.toLocaleString()}
                      </td>
                      <td style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-data)' }}>
                        {ledger.find(l => l.status === 'Paid')?.paidDate || '—'}
                      </td>
                      <td>
                        <span className={`pill ${ib.status === 'Active' ? 'pill-active' : 'pill-pending'}`} style={{ fontSize: 10 }}>
                          {ib.status}
                        </span>
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {pending > 0 && (
                            <button className="btn btn-success btn-xs" onClick={() => {
                              toast.success(`$${pending.toLocaleString()} payment initiated to ${ib.name}`);
                            }}>
                              Pay ${pending.toLocaleString()}
                            </button>
                          )}
                          <button className="btn btn-ghost btn-xs" onClick={() => setAdjustIB(ib)}>Adjust</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'detail' && selectedIB && (() => {
        const ledger = buildLedger(selectedIB);
        return (
          <div className="card">
            <div className="card-header">
              <div>
                <span className="card-title">{selectedIB.name}</span>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 8 }}>Commission Ledger</span>
              </div>
              <button className="btn btn-ghost btn-xs" onClick={() => setAdjustIB(selectedIB)}>+ Adjustment</button>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    {['Period','Volume','Rate','Gross','Adjustments','Net','Status','Paid Date','Reference'].map(h => (
                      <th key={h} style={{ fontSize: 9 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((row, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 500 }}>{row.month}</td>
                      <td className="mono">{row.volume.toLocaleString()}</td>
                      <td className="mono" style={{ color: 'var(--text-secondary)' }}>${row.rate}/lot</td>
                      <td className="mono" style={{ color: 'var(--bull)' }}>${row.gross.toLocaleString()}</td>
                      <td className="mono" style={{ color: row.adjustments < 0 ? 'var(--bear)' : row.adjustments > 0 ? 'var(--bull)' : 'var(--text-tertiary)' }}>
                        {row.adjustments !== 0 ? `${row.adjustments > 0 ? '+' : ''}$${row.adjustments}` : '—'}
                      </td>
                      <td className="mono" style={{ fontWeight: 700, color: 'var(--bull)' }}>${row.net.toLocaleString()}</td>
                      <td>
                        <span className={`pill ${row.status === 'Paid' ? 'pill-verified' : row.status === 'Processing' ? 'pill-accent' : 'pill-pending'}`} style={{ fontSize: 10 }}>
                          {row.status}
                        </span>
                      </td>
                      <td style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-data)' }}>{row.paidDate || '—'}</td>
                      <td style={{ fontSize: 9, fontFamily: 'var(--font-data)', color: 'var(--text-tertiary)' }}>{row.ref}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {showRun && (
        <RunModal
          onClose={() => setShowRun(false)}
          onConfirm={(total, count) => {
            toast.success(`Commission run complete — $${total.toLocaleString()} to ${count} IBs`);
          }}
        />
      )}

      {adjustIB && (
        <AdjustModal
          ib={adjustIB}
          onClose={() => setAdjustIB(null)}
          onSave={(adj) => {
            toast.success(`Adjustment applied: ${adj.type} $${adj.amount} to ${adjustIB.name}`);
          }}
        />
      )}
    </div>
  );
}
