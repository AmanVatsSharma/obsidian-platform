'use client';
import { useState, useMemo } from 'react';
import { transactions as initialTxns } from '../../lib/mockData';

const METHOD_ICONS = {
  'VISA': '💳', 'Mastercard': '💳', 'Wire Transfer': '🏦',
  'SEPA': '🇪🇺', 'USDT': '₮', 'Bitcoin': '₿',
  'Skrill': 'S', 'Neteller': 'N', 'PayPal': 'P', 'System': '⚙',
};

const PAYMENT_METHODS = [
  { id: 'visa',   name: 'Visa / MC',      enabled: true,  minDep: 20,    maxDep: 10000, fee: 0,    time: 'Instant',  logo: '💳' },
  { id: 'wire',   name: 'Wire Transfer',  enabled: true,  minDep: 500,   maxDep: 500000,fee: 25,   time: '1-3 days', logo: '🏦' },
  { id: 'sepa',   name: 'SEPA',           enabled: true,  minDep: 50,    maxDep: 50000, fee: 15,   time: '1-2 days', logo: '🇪🇺' },
  { id: 'usdt',   name: 'USDT (TRC20)',   enabled: true,  minDep: 100,   maxDep: 100000,fee: 0,    time: '~10 min',  logo: '₮' },
  { id: 'btc',    name: 'Bitcoin',        enabled: false, minDep: 100,   maxDep: 50000, fee: 0,    time: '~30 min',  logo: '₿' },
  { id: 'skrill', name: 'Skrill',         enabled: true,  minDep: 10,    maxDep: 5000,  fee: 2.5,  time: 'Instant',  logo: 'S' },
  { id: 'nett',   name: 'Neteller',       enabled: true,  minDep: 10,    maxDep: 5000,  fee: 2.5,  time: 'Instant',  logo: 'N' },
  { id: 'paypal', name: 'PayPal',         enabled: false, minDep: 10,    maxDep: 2500,  fee: 3.4,  time: 'Instant',  logo: 'P' },
];

function PriorityBadge({ priority }) {
  const map = { URGENT: 'pill-bear', STANDARD: 'pill-accent', LOW: 'pill-muted' };
  return <span className={`pill ${map[priority] || 'pill-muted'}`} style={{ fontSize: 9 }}>{priority}</span>;
}

// ─── APPROVE DRAWER ───────────────────────────────────────────────────────────
function ApproveDrawer({ txn, onClose, onApprove, onReject }) {
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [adminNote, setAdminNote] = useState('');

  const fraudChecks = [
    { label: 'KYC verified', pass: txn.kycStatus === 'Verified', warn: txn.kycStatus === 'Pending' },
    { label: 'Deposit method matches withdrawal', pass: true },
    { label: 'No active suspicious activity flags', pass: txn.clientId !== 'C1009' },
    { label: 'Amount within normal range', pass: txn.amount < 10000, warn: txn.amount >= 10000 },
    { label: 'Account not suspended', pass: true },
  ];

  const allClear = fraudChecks.every(c => c.pass || c.warn);
  const hasWarnings = fraudChecks.some(c => c.warn);

  return (
    <div className={`drawer open`} style={{ width: 440 }}>
      <div className="drawer-header">
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
            {rejectMode ? 'Reject Transaction' : 'Approve Transaction'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            {txn.id} · {txn.type} · {txn.method}
          </div>
        </div>
        <button className="drawer-close" onClick={onClose}>✕</button>
      </div>

      <div className="drawer-body" style={{ padding: 20 }}>
        {/* Client summary */}
        <div style={{ background: 'var(--bg-3)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-tertiary)', marginBottom: 10 }}>
            Client
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{txn.clientName}</div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-data)' }}>{txn.clientId}</div>
          <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
            <span className={`pill ${txn.kycStatus === 'Verified' ? 'pill-verified' : txn.kycStatus === 'Pending' ? 'pill-pending' : 'pill-rejected'}`} style={{ fontSize: 10 }}>
              KYC: {txn.kycStatus}
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
              {txn.priorWithdrawals} prior withdrawal{txn.priorWithdrawals !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Transaction details */}
        <div style={{ background: 'var(--bg-3)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-tertiary)', marginBottom: 10 }}>
            Transaction
          </div>
          {[
            ['Type',    txn.type],
            ['Method',  `${METHOD_ICONS[txn.method] || ''} ${txn.method}`],
            ['Amount',  `$${txn.amount.toLocaleString()}`],
            ['Fee',     txn.fee ? `$${txn.fee}` : 'None'],
            ['Net',     `$${(txn.amount - (txn.fee || 0)).toLocaleString()}`],
            ['Requested', txn.requested],
          ].map(([l, v]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{l}</span>
              <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Fraud checks */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-tertiary)', marginBottom: 10 }}>
            Automated Checks
          </div>
          {fraudChecks.map((check, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 6, marginBottom: 4, background: check.warn ? 'rgba(245,158,11,0.06)' : 'transparent' }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>
                {check.pass ? '✓' : check.warn ? '⚠' : '✗'}
              </span>
              <span style={{ fontSize: 11, color: check.warn ? 'var(--warn)' : check.pass ? 'var(--text-secondary)' : 'var(--bear)' }}>
                {check.label}
              </span>
              {check.warn && (
                <span style={{ fontSize: 10, color: 'var(--warn)', marginLeft: 'auto' }}>Requires review</span>
              )}
            </div>
          ))}
        </div>

        {/* Admin note */}
        <div style={{ marginBottom: 16 }}>
          <label className="label">Admin Note (optional)</label>
          <textarea
            value={adminNote}
            onChange={e => setAdminNote(e.target.value)}
            placeholder="Add a note to this transaction..."
            style={{
              width: '100%', minHeight: 64, background: 'var(--bg-2)',
              border: '1px solid var(--border)', borderRadius: 6,
              padding: '8px 10px', fontSize: 12, color: 'var(--text-primary)',
              fontFamily: 'var(--font-ui)', resize: 'none', outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Reject reason */}
        {rejectMode && (
          <div style={{ marginBottom: 16, padding: 12, background: 'var(--bear-muted)', border: '1px solid var(--bear-dim)', borderRadius: 8 }}>
            <label className="label" style={{ color: 'var(--bear)', marginBottom: 8 }}>Rejection Reason</label>
            <select className="select" value={rejectReason} onChange={e => setRejectReason(e.target.value)}>
              <option value="">Select reason...</option>
              {['KYC not verified', 'Suspicious activity', 'Method not verified', 'Exceeds limit', 'Account suspended', 'Insufficient balance', 'Other'].map(r => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
        {!rejectMode ? (
          <>
            <button
              className="btn btn-success"
              style={{ flex: 1 }}
              onClick={() => onApprove(txn.id, adminNote)}
            >
              ✓ Confirm Approve
            </button>
            <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => setRejectMode(true)}>
              ✗ Reject
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => setRejectMode(false)}>
              ← Back
            </button>
            <button
              className="btn btn-danger"
              style={{ flex: 1 }}
              disabled={!rejectReason}
              onClick={() => onReject(txn.id, rejectReason, adminNote)}
            >
              ✗ Confirm Reject
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── PAYMENT METHODS GRID ─────────────────────────────────────────────────────
function PaymentMethodsGrid() {
  const [methods, setMethods] = useState(PAYMENT_METHODS);
  const toggleMethod = (id) => setMethods(prev => prev.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m));

  return (
    <div>
      <div style={{ padding: '20px 0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600 }}>Payment Methods</div>
        <button className="btn btn-primary btn-sm">+ Add Method</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {methods.map(m => (
          <div key={m.id} className="card" style={{ padding: 16, opacity: m.enabled ? 1 : 0.5 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 24 }}>{m.logo}</span>
              <div className={`toggle ${m.enabled ? 'on' : ''}`} onClick={() => toggleMethod(m.id)} style={{ cursor: 'pointer' }} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 }}>{m.name}</div>
            {[
              ['Min deposit', `$${m.minDep.toLocaleString()}`],
              ['Max deposit', `$${m.maxDep.toLocaleString()}`],
              ['Fee', m.fee ? `${m.fee}%` : 'Free'],
              ['Processing', m.time],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{l}</span>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-data)', color: 'var(--text-secondary)' }}>{v}</span>
              </div>
            ))}
            <button className="btn btn-ghost btn-xs" style={{ width: '100%', marginTop: 10, justifyContent: 'center' }}>Configure</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TRANSACTIONS MAIN ────────────────────────────────────────────────────────
export default function Transactions() {
  const [txns, setTxns]           = useState(initialTxns);
  const [tab, setTab]             = useState('Pending');
  const [approving, setApproving] = useState(null);
  const [subTab, setSubTab]       = useState('queue');
  const [selected, setSelected]   = useState(new Set());

  const TABS = [
    { label: 'Pending',    filter: t => t.status === 'Pending' },
    { label: 'Processing', filter: t => t.status === 'Processing' },
    { label: 'Approved',   filter: t => t.status === 'Approved' },
    { label: 'Rejected',   filter: t => t.status === 'Rejected' },
    { label: 'All',        filter: () => true },
  ];

  const current = TABS.find(t => t.label === tab);
  const displayed = useMemo(() => txns.filter(current.filter).sort((a, b) => {
    const prio = { URGENT: 0, STANDARD: 1, LOW: 2 };
    return (prio[a.priority] ?? 3) - (prio[b.priority] ?? 3);
  }), [txns, tab, current]);

  const handleApprove = (id, note) => {
    setTxns(prev => prev.map(t => t.id === id ? { ...t, status: 'Approved', adminNote: note } : t));
    setApproving(null);
  };

  const handleReject = (id, reason, note) => {
    setTxns(prev => prev.map(t => t.id === id ? { ...t, status: 'Rejected', adminNote: `${reason}${note ? ': ' + note : ''}` } : t));
    setApproving(null);
  };

  const bulkApprove = () => {
    const ids = [...selected];
    const total = displayed.filter(t => ids.includes(t.id)).reduce((s, t) => s + t.amount, 0);
    if (confirm(`Approve ${ids.length} transactions totaling $${total.toLocaleString()}?`)) {
      setTxns(prev => prev.map(t => ids.includes(t.id) ? { ...t, status: 'Approved' } : t));
      setSelected(new Set());
    }
  };

  const allSelected = displayed.length > 0 && displayed.every(t => selected.has(t.id));

  return (
    <div style={{ padding: '0 24px 24px' }}>
      {/* Header */}
      <div style={{ padding: '20px 0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>Transactions</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
            {txns.filter(t => t.status === 'Pending').length} pending approval · {txns.filter(t => t.priority === 'URGENT' && t.status === 'Pending').length} urgent
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={`btn ${subTab === 'queue' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
            onClick={() => setSubTab('queue')}
          >
            Transaction Queue
          </button>
          <button
            className={`btn ${subTab === 'methods' ? 'btn-primary' : 'btn-ghost'} btn-sm`}
            onClick={() => setSubTab('methods')}
          >
            Payment Methods
          </button>
        </div>
      </div>

      {subTab === 'methods' ? (
        <PaymentMethodsGrid />
      ) : (
        <>
          {/* Tabs */}
          <div className="tabs" style={{ padding: 0, marginBottom: 14 }}>
            {TABS.map(t => {
              const count = txns.filter(t.filter).length;
              return (
                <button key={t.label} className={`tab ${tab === t.label ? 'active' : ''}`} onClick={() => setTab(t.label)}>
                  {t.label}
                  {count > 0 && <span className="tab-count">{count}</span>}
                </button>
              );
            })}
          </div>

          {/* Bulk actions */}
          {selected.size > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', background: 'var(--accent-muted)', border: '1px solid var(--border-accent)', borderRadius: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>{selected.size} selected</span>
              <button className="btn btn-success btn-sm" onClick={bulkApprove}>
                ✓ Bulk Approve ({selected.size})
              </button>
              <button className="btn btn-ghost btn-xs" onClick={() => setSelected(new Set())}>Clear</button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="card">
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: 36 }}>
                          <input type="checkbox" checked={allSelected}
                            onChange={() => {
                              if (allSelected) setSelected(new Set());
                              else setSelected(new Set(displayed.map(t => t.id)));
                            }}
                          />
                        </th>
                        {['Priority','Client','Type','Method','Amount','KYC','Prior Wdls','Requested','Status','Actions'].map(h => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {displayed.length === 0 ? (
                        <tr>
                          <td colSpan={11}>
                            <div className="empty-state">
                              <div className="empty-state__icon">◻</div>
                              <div className="empty-state__title">No {tab.toLowerCase()} transactions</div>
                              <div className="empty-state__sub">All caught up!</div>
                            </div>
                          </td>
                        </tr>
                      ) : displayed.map(txn => (
                        <tr
                          key={txn.id}
                          style={{ background: approving?.id === txn.id ? 'var(--bg-3)' : '', cursor: 'pointer' }}
                          onClick={() => setApproving(txn)}
                        >
                          <td onClick={e => e.stopPropagation()}>
                            <input type="checkbox" checked={selected.has(txn.id)}
                              onChange={() => setSelected(s => { const n = new Set(s); n.has(txn.id) ? n.delete(txn.id) : n.add(txn.id); return n; })}
                            />
                          </td>
                          <td><PriorityBadge priority={txn.priority} /></td>
                          <td>
                            <div style={{ fontWeight: 500, fontSize: 12 }}>{txn.clientName}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-data)' }}>{txn.clientId}</div>
                          </td>
                          <td>
                            <span className={`pill ${txn.type === 'Deposit' ? 'pill-bull' : txn.type === 'Withdrawal' ? 'pill-bear' : 'pill-accent'}`} style={{ fontSize: 10 }}>
                              {txn.type}
                            </span>
                          </td>
                          <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                            {METHOD_ICONS[txn.method] || ''} {txn.method}
                          </td>
                          <td style={{ fontFamily: 'var(--font-data)', fontWeight: 700, color: txn.type === 'Withdrawal' ? 'var(--bear)' : 'var(--bull)', fontSize: 12 }}>
                            {txn.type === 'Withdrawal' ? '-' : '+'}${txn.amount.toLocaleString()}
                          </td>
                          <td>
                            <span className={`pill ${txn.kycStatus === 'Verified' ? 'pill-verified' : txn.kycStatus === 'Pending' ? 'pill-pending' : 'pill-rejected'}`} style={{ fontSize: 9 }}>
                              {txn.kycStatus === 'Verified' ? '✓' : txn.kycStatus === 'Pending' ? '⏳' : '✗'} {txn.kycStatus}
                            </span>
                          </td>
                          <td style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: txn.priorWithdrawals > 5 ? 'var(--warn)' : 'var(--text-secondary)' }}>
                            {txn.priorWithdrawals}×
                          </td>
                          <td style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-data)', whiteSpace: 'nowrap' }}>
                            {txn.requested}
                          </td>
                          <td>
                            <span className={`pill ${txn.status === 'Approved' ? 'pill-verified' : txn.status === 'Pending' ? 'pill-pending' : txn.status === 'Rejected' ? 'pill-rejected' : 'pill-accent'}`} style={{ fontSize: 10 }}>
                              {txn.status}
                            </span>
                          </td>
                          <td onClick={e => e.stopPropagation()}>
                            {(txn.status === 'Pending' || txn.status === 'Processing') ? (
                              <div style={{ display: 'flex', gap: 4 }}>
                                <button className="btn btn-success btn-xs" onClick={() => setApproving(txn)}>Review</button>
                              </div>
                            ) : (
                              <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{txn.adminNote ? '📝' : '—'}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Approve drawer (inline on right) */}
            {approving && (
              <div style={{ flexShrink: 0, width: 440, position: 'relative' }}>
                <ApproveDrawer
                  txn={approving}
                  onClose={() => setApproving(null)}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
