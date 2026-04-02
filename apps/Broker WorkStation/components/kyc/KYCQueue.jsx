'use client';
import { useState } from 'react';
import { clients } from '../../lib/mockData';

const PENDING_CLIENTS = clients.filter(c => c.kyc === 'Pending' || c.kyc === 'Rejected' || c.kyc === 'Expired');

const REJECT_REASONS = [
  'Blurry / poor quality',
  'Document expired',
  'Wrong document type',
  'Name mismatch',
  'Suspected forgery',
  'Date of birth mismatch',
  'Other',
];

function ReviewMode({ client, onDecision, onBack }) {
  const [decision, setDecision] = useState(null);
  const [reasons, setReasons] = useState(new Set());
  const [note, setNote] = useState('');
  const [checks, setChecks] = useState({ nameMatch: null, dobMatch: null, notExpired: null, notAltered: null });
  const [zoom, setZoom] = useState(1);

  const toggleReason = (r) => {
    setReasons(prev => {
      const n = new Set(prev);
      n.has(r) ? n.delete(r) : n.add(r);
      return n;
    });
  };

  const CheckRow = ({ key: k, label, field }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
      <div style={{ display: 'flex', gap: 6 }}>
        {['YES','NO'].map(v => (
          <button
            key={v}
            className={`btn btn-xs ${checks[field] === v ? (v === 'YES' ? 'btn-success' : 'btn-danger') : 'btn-ghost'}`}
            onClick={() => setChecks(c => ({ ...c, [field]: v }))}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );

  const allChecked = Object.values(checks).every(v => v !== null);
  const canApprove = allChecked && Object.values(checks).every(v => v === 'YES');

  return (
    <div style={{ height: 'calc(100vh - 52px)', display: 'flex', overflow: 'hidden' }}>
      {/* Left: Document viewer */}
      <div style={{ flex: '0 0 58%', background: 'var(--bg-base)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-1)' }}>
          <button className="btn btn-ghost btn-sm" onClick={onBack}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M7 2L3 5.5 7 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Back to queue
          </button>
          <div style={{ height: 16, width: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
            Reviewing: {client.name} — Passport
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
            <button className="btn btn-ghost btn-xs" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}>−</button>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', minWidth: 36, textAlign: 'center' }}>{(zoom * 100).toFixed(0)}%</span>
            <button className="btn btn-ghost btn-xs" onClick={() => setZoom(z => Math.min(2, z + 0.25))}>+</button>
            <button className="btn btn-ghost btn-xs" onClick={() => setZoom(1)}>Reset</button>
          </div>
        </div>

        {/* Mock document preview */}
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, background: 'var(--bg-base)' }}>
          <div style={{
            transform: `scale(${zoom})`, transformOrigin: 'top center',
            transition: 'transform 0.2s',
          }}>
            {/* Mock passport */}
            <div style={{
              width: 500, height: 340, background: '#1a2550',
              borderRadius: 12, padding: 24, boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.01) 0, rgba(255,255,255,0.01) 1px, transparent 0, transparent 50%)', backgroundSize: '10px 10px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.15em', marginBottom: 4 }}>PASSPORT</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>UNITED KINGDOM OF GREAT BRITAIN</div>
                </div>
                <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  👑
                </div>
              </div>
              <div style={{ display: 'flex', gap: 20 }}>
                <div style={{ width: 90, height: 110, background: 'rgba(255,255,255,0.08)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                  {client.flag}
                </div>
                <div style={{ flex: 1 }}>
                  {[
                    ['Surname', client.name.split(' ').pop()?.toUpperCase()],
                    ['Given Names', client.name.split(' ').slice(0,-1).join(' ').toUpperCase()],
                    ['Nationality', client.nationality?.toUpperCase()],
                    ['Date of Birth', client.dob],
                    ['Document No.', `${client.id}P`],
                    ['Expiry Date', client.kycExpiry || '2028-01-15'],
                  ].map(([label, val]) => (
                    <div key={label} style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>{label}</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', fontFamily: 'var(--font-data)', fontWeight: 600 }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: 16, padding: '10px 0 0', borderTop: '1px solid rgba(255,255,255,0.1)', fontFamily: 'var(--font-data)', fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em', wordBreak: 'break-all' }}>
                {'P<GBR' + client.name.replace(' ','<<').toUpperCase() + '<'.repeat(20)}<br />
                {client.id + 'P' + '<' + '4' + 'GBR' + '8501149' + 'M' + '2801159' + '<' + '<' + '<' + '<' + '<'}
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg-1)', display: 'flex', justifyContent: 'center', gap: 8 }}>
          <button className="btn btn-ghost btn-sm">◀ Previous</button>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>Document 1 of 2</span>
          <button className="btn btn-ghost btn-sm">Next ▶</button>
        </div>
      </div>

      {/* Right: Review form */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {/* Client info */}
          <div style={{ background: 'var(--bg-2)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: 10 }}>
              Registration Data
            </div>
            {[
              ['Name', client.name],
              ['Date of Birth', client.dob],
              ['Nationality', client.nationality],
              ['ID', client.id],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{l}</span>
                <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Extracted data (manual entry) */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: 10 }}>
              Extracted from Document
            </div>
            {[
              ['Document Type', 'Passport'],
              ['Document Number', `${client.id}P`],
              ['Full Name', client.name.toUpperCase()],
              ['Date of Birth', client.dob],
              ['Expiry Date', client.kycExpiry || '2028-01-15'],
              ['Issuing Country', client.nationality],
            ].map(([label, val]) => (
              <div key={label} style={{ marginBottom: 8 }}>
                <label className="label" style={{ marginBottom: 3 }}>{label}</label>
                <input className="input" defaultValue={val} style={{ fontSize: 12 }} />
              </div>
            ))}
          </div>

          {/* Comparison checks */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: 10 }}>
              Verification Checks
            </div>
            <CheckRow label="Name on document matches registration?" field="nameMatch" />
            <CheckRow label="Date of birth matches?" field="dobMatch" />
            <CheckRow label="Document not expired?" field="notExpired" />
            <CheckRow label="Document not altered/tampered?" field="notAltered" />
          </div>

          {/* Internal note */}
          <div style={{ marginBottom: 16 }}>
            <label className="label">Internal Note</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Optional review notes..."
              style={{
                width: '100%', minHeight: 64, background: 'var(--bg-2)',
                border: '1px solid var(--border)', borderRadius: 6,
                padding: '8px 10px', fontSize: 12, color: 'var(--text-primary)',
                fontFamily: 'var(--font-ui)', resize: 'none', outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          {/* Rejection reasons (shown when rejecting) */}
          {decision === 'reject' && (
            <div style={{ background: 'var(--bear-muted)', border: '1px solid var(--bear-dim)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--bear)', marginBottom: 8 }}>Rejection Reasons (select all that apply)</div>
              {REJECT_REASONS.map(r => (
                <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer' }}>
                  <input type="checkbox" checked={reasons.has(r)} onChange={() => toggleReason(r)} />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{r}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Decision buttons */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg-1)' }}>
          <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginBottom: 10 }}>
            {!allChecked ? '⚠ Complete all verification checks above before deciding' : canApprove ? '✓ All checks passed — ready to approve' : '✗ One or more checks failed'}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-success"
              style={{ flex: 1 }}
              disabled={!canApprove}
              onClick={() => { onDecision('approve', client); onBack(); }}
            >
              ✓ Approve
            </button>
            <button
              className="btn btn-ghost"
              style={{ flex: 1 }}
              onClick={() => { onDecision('resubmit', client); onBack(); }}
            >
              ↩ Request Resubmit
            </button>
            <button
              className={`btn ${decision === 'reject' ? 'btn-danger' : 'btn-ghost'}`}
              style={{ flex: 1 }}
              onClick={() => {
                if (decision !== 'reject') { setDecision('reject'); return; }
                onDecision('reject', client, [...reasons]);
                onBack();
              }}
            >
              {decision === 'reject' ? `✗ Confirm Reject (${reasons.size})` : '✗ Reject'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function KYCQueue() {
  const [tab, setTab] = useState('Pending');
  const [reviewClient, setReviewClient] = useState(null);
  const [decisions, setDecisions] = useState({});

  const TABS = [
    { label: 'Pending',    count: clients.filter(c => c.kyc === 'Pending').length },
    { label: 'In Review',  count: 3 },
    { label: 'Approved',   count: clients.filter(c => c.kyc === 'Verified').length },
    { label: 'Rejected',   count: clients.filter(c => c.kyc === 'Rejected').length },
    { label: 'Expired',    count: clients.filter(c => c.kyc === 'Expired').length },
  ];

  const handleDecision = (action, client, reasons) => {
    setDecisions(d => ({ ...d, [client.id]: { action, reasons, time: new Date().toLocaleTimeString() } }));
    alert(`KYC ${action === 'approve' ? 'Approved ✓' : action === 'reject' ? 'Rejected ✗' : 'Resubmit Requested ↩'}: ${client.name}${reasons?.length ? '\nReasons: ' + reasons.join(', ') : ''}`);
  };

  if (reviewClient) {
    return <ReviewMode client={reviewClient} onDecision={handleDecision} onBack={() => setReviewClient(null)} />;
  }

  const tabClients = {
    Pending:  clients.filter(c => c.kyc === 'Pending'),
    Approved: clients.filter(c => c.kyc === 'Verified'),
    Rejected: clients.filter(c => c.kyc === 'Rejected'),
    Expired:  clients.filter(c => c.kyc === 'Expired'),
    'In Review': clients.filter(c => c.kyc === 'Pending').slice(0,3),
  };
  const displayList = tabClients[tab] || [];

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <div style={{ padding: '20px 0 16px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>KYC Queue</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>Review and approve client identity verification documents</div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ padding: 0, marginBottom: 16 }}>
        {TABS.map(t => (
          <button key={t.label} className={`tab ${tab === t.label ? 'active' : ''}`} onClick={() => setTab(t.label)}>
            {t.label}
            {t.count > 0 && <span className="tab-count">{t.count}</span>}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {['Client','Document Type','Uploaded','Country','KYC Level','Flags','Action'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayList.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-state__icon">◻</div>
                      <div className="empty-state__title">No clients in this queue</div>
                      <div className="empty-state__sub">All {tab.toLowerCase()} reviews are up to date</div>
                    </div>
                  </td>
                </tr>
              ) : displayList.map(client => {
                const decided = decisions[client.id];
                return (
                  <tr key={client.id}>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{client.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-data)' }}>{client.id}</div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Passport</td>
                    <td style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-data)' }}>
                      {client.regDate}
                    </td>
                    <td>
                      <span style={{ fontSize: 16 }}>{client.flag}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginLeft: 6 }}>{client.country}</span>
                    </td>
                    <td>
                      <span className="pill pill-muted" style={{ fontSize: 10 }}>{client.kycLevel}</span>
                    </td>
                    <td>
                      {client.amlStatus === 'Flagged' && <span style={{ fontSize: 10, color: 'var(--bear)', fontWeight: 700 }}>⚑ AML</span>}
                      {client.amlStatus === 'Review' && <span style={{ fontSize: 10, color: 'var(--warn)', fontWeight: 700 }}>⚠ Review</span>}
                      {client.amlStatus === 'Clear' && <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>—</span>}
                    </td>
                    <td>
                      {decided ? (
                        <span className={`pill ${decided.action === 'approve' ? 'pill-verified' : decided.action === 'reject' ? 'pill-rejected' : 'pill-pending'}`} style={{ fontSize: 10 }}>
                          {decided.action === 'approve' ? '✓ Approved' : decided.action === 'reject' ? '✗ Rejected' : '↩ Resubmit'} ({decided.time})
                        </span>
                      ) : (
                        <button className="btn btn-primary btn-xs" onClick={() => setReviewClient(client)}>
                          Review →
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
