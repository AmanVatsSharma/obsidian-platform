'use client';
import { useState } from 'react';
import { transactions as allTxns, auditLog } from '../../lib/mockData';

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt = (n) => n == null ? '—' : `$${Number(n).toLocaleString()}`;

function avatarBg(name = '') {
  const colors = ['#3B82F6','#10D996','#F59E0B','#8B5CF6','#EC4899','#06B6D4','#EF4444','#84CC16'];
  let h = 0;
  for (const c of name) h = ((h << 5) - h) + c.charCodeAt(0);
  return colors[Math.abs(h) % colors.length];
}

function StatusPill({ status }) {
  const map = { Active:'pill-active', Dormant:'pill-dormant', Pending:'pill-pending', Suspended:'pill-suspended' };
  return <span className={`pill ${map[status] || 'pill-muted'}`}>{status}</span>;
}

function InfoRow({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{label}</span>
      <span style={{ fontSize: 12, color: 'var(--text-primary)', fontFamily: mono ? 'var(--font-data)' : undefined, fontWeight: 500 }}>{value || '—'}</span>
    </div>
  );
}

function SectionTitle({ children, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, marginTop: 18 }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)' }}>
        {children}
      </div>
      {action}
    </div>
  );
}

// ─── TAB: OVERVIEW ────────────────────────────────────────────────────────────
function OverviewTab({ client }) {
  const kycMap = {
    Verified: 'pill-verified',
    Pending:  'pill-pending',
    Rejected: 'pill-rejected',
    Expired:  'pill-expired',
  };

  return (
    <div style={{ padding: '0 20px 20px' }}>
      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
        {[
          ['Balance', fmt(client.balance)],
          ['Equity', fmt(client.equity)],
          ['Margin %', client.marginPct ? `${client.marginPct}%` : '—'],
          ['Total Deposited', fmt(client.totalDeposited)],
          ['Total Withdrawn', fmt(client.totalWithdrawn)],
          ['Net Funding', (() => {
            const net = client.totalDeposited - client.totalWithdrawn;
            return <span style={{ color: net >= 0 ? 'var(--bull)' : 'var(--bear)' }}>{net >= 0 ? '+' : ''}{fmt(net)}</span>;
          })()],
        ].map(([label, val]) => (
          <div key={label} style={{ background: 'var(--bg-3)', borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 5 }}>{label}</div>
            <div style={{ fontSize: 14, fontFamily: 'var(--font-data)', fontWeight: 600, color: 'var(--text-primary)' }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Personal info */}
      <SectionTitle action={<button className="btn btn-ghost btn-xs">Edit</button>}>Personal Information</SectionTitle>
      <InfoRow label="Full Name"           value={client.name} />
      <InfoRow label="Date of Birth"       value={client.dob} />
      <InfoRow label="Nationality"         value={client.nationality} />
      <InfoRow label="Country"             value={client.address?.split(',').pop()?.trim()} />
      <InfoRow label="Address"             value={client.address} />
      <InfoRow label="Phone"               value={client.phone} mono />
      <InfoRow label="Email"               value={client.email} mono />

      {/* Account details */}
      <SectionTitle>Account Details</SectionTitle>
      <InfoRow label="Account Number"      value={client.id} mono />
      <InfoRow label="Currency"            value={client.accountCurrency} />
      <InfoRow label="Leverage"            value={client.leverage} />
      <InfoRow label="Account Type"        value={client.type} />
      <InfoRow label="Group"               value={client.group} />
      <InfoRow label="Registration Date"   value={client.regDate} />
      <InfoRow label="Referred by IB"      value={client.ib || 'Direct'} />
      <div style={{ padding: '7px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Platform Access</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {(client.platform || ['Web']).map(p => (
            <span key={p} className="pill pill-muted" style={{ fontSize: 10 }}>{p}</span>
          ))}
        </div>
      </div>
      <InfoRow label="Last Login" value={client.lastLogin} mono />

      {/* KYC Status */}
      <SectionTitle action={
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-ghost btn-xs">Request Docs</button>
          <button className="btn btn-ghost btn-xs">Upgrade Level</button>
        </div>
      }>KYC Status</SectionTitle>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[
          ['Identity Verification', client.kyc === 'Verified' ? 'Verified' : client.kyc, '2023-01-15', 'Passport'],
          ['Address Verification',  client.kyc === 'Verified' ? 'Verified' : 'Pending',   '2023-01-16', 'Utility Bill'],
          ['Selfie / Liveness',     client.kyc === 'Verified' ? 'Verified' : 'Pending',   '2023-01-15', null],
          ['Source of Funds',       client.kyc === 'Verified' ? 'Verified' : 'Pending',   null,          null],
        ].map(([label, status, date, docType]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'var(--bg-3)', borderRadius: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', flex: 1 }}>{label}</span>
            <span className={`pill ${kycMap[status] || 'pill-pending'}`} style={{ fontSize: 10 }}>{status}</span>
            {date && <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-data)' }}>{date}</span>}
            {docType && <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{docType}</span>}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 10, padding: '8px 10px', background: 'var(--bg-3)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>KYC Level: <strong style={{ color: 'var(--text-primary)' }}>{client.kycLevel}</strong></span>
        {client.kycExpiry && (
          <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-data)' }}>Expires: {client.kycExpiry}</span>
        )}
      </div>

      {/* Risk Profile */}
      <SectionTitle>Risk Profile</SectionTitle>
      <InfoRow label="Self-Declared Risk"     value={client.riskProfile} />
      <InfoRow label="Suitability Assessment" value={
        <span style={{ color: client.suitability === 'APPROPRIATE' ? 'var(--bull)' : client.suitability === 'NOT APPROPRIATE' ? 'var(--bear)' : 'var(--warn)' }}>
          {client.suitability}
        </span>
      } />
      <InfoRow label="Risk Disclosure Signed" value="2022-04-10" />
      <InfoRow label="EULA Signed"            value="2022-04-10" />

      {/* Tags */}
      <SectionTitle action={<button className="btn btn-ghost btn-xs">+ Add Tag</button>}>Internal Tags</SectionTitle>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {(client.tags || []).length === 0 ? (
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>No tags</span>
        ) : (
          client.tags.map(tag => (
            <span key={tag} style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '3px 10px', borderRadius: 20, fontSize: 11,
              background: 'var(--bg-4)', border: '1px solid var(--border-strong)',
              color: 'var(--text-secondary)',
            }}>
              {tag}
              <span style={{ cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 10 }}>✕</span>
            </span>
          ))
        )}
      </div>

      {/* AML */}
      <SectionTitle>AML Score</SectionTitle>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--bg-3)', borderRadius: 8 }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: client.amlScore > 50 ? 'var(--bear-muted)' : client.amlScore > 25 ? 'var(--warn-muted)' : 'var(--bull-muted)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontFamily: 'var(--font-data)', fontWeight: 700,
          color: client.amlScore > 50 ? 'var(--bear)' : client.amlScore > 25 ? 'var(--warn)' : 'var(--bull)',
        }}>
          {client.amlScore}
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 3 }}>
            {client.amlStatus === 'Flagged' ? '⚑ Flagged' : client.amlStatus === 'Review' ? '⚠ Under Review' : '✓ Clear'}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>Score 0–100 · Last updated today</div>
        </div>
        {client.amlStatus === 'Flagged' && (
          <button className="btn btn-danger btn-xs" style={{ marginLeft: 'auto' }}>View SAR</button>
        )}
      </div>
    </div>
  );
}

// ─── TAB: TRADING ─────────────────────────────────────────────────────────────
function TradingTab({ client }) {
  // Mock open positions for clients that have them
  const openPositions = client.openPositions > 0 ? Array.from({ length: client.openPositions }, (_, i) => ({
    id: `P${1000 + i}`,
    symbol: ['EUR/USD','GBP/USD','XAUUSD','USD/JPY','US30'][i % 5],
    side: i % 2 === 0 ? 'BUY' : 'SELL',
    lots: (0.5 + i * 0.3).toFixed(2),
    openPrice: [1.08542, 1.27105, 2023.45, 147.82, 37845][i % 5],
    current: [1.08612, 1.27045, 2028.90, 147.65, 37923][i % 5],
    pnl: [140, -95, 275, -85, 390][i % 5],
    sl: null, tp: null,
    opened: '2024-01-14 14:22',
  })) : [];

  // Mock order history
  const history = Array.from({ length: 8 }, (_, i) => ({
    date: `2024-01-${String(15 - i).padStart(2,'0')}`,
    symbol: ['EUR/USD','XAUUSD','GBP/USD','USD/JPY','US30','BTC/USD'][i % 6],
    type: 'Market',
    side: i % 2 === 0 ? 'BUY' : 'SELL',
    lots: (0.5 + (i * 0.2)).toFixed(2),
    price: [1.085, 2020.1, 1.271, 147.9, 37800, 43200][i % 6],
    pnl: [240, -180, 95, 320, -420, 780][i % 6],
    status: 'Closed',
  }));

  const winRate = history.filter(h => h.pnl > 0).length / history.length;

  return (
    <div style={{ padding: '0 20px 20px' }}>
      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
        {[
          ['Total Trades (all time)', '247'],
          ['Win Rate', `${(winRate * 100).toFixed(0)}%`],
          ['Volume MTD', `${client.volumeMTD} lots`],
          ['Avg Hold Time', '4h 22m'],
          ['Biggest Win', <span style={{ color:'var(--bull)' }}>+$2,840</span>],
          ['Biggest Loss', <span style={{ color:'var(--bear)' }}>-$1,250</span>],
        ].map(([label, val]) => (
          <div key={label} style={{ background: 'var(--bg-3)', borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 14, fontFamily: 'var(--font-data)', fontWeight: 600, color: 'var(--text-primary)' }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Open positions */}
      <SectionTitle>Open Positions ({openPositions.length})</SectionTitle>
      {openPositions.length === 0 ? (
        <div style={{ padding: '16px 0', fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center' }}>No open positions</div>
      ) : (
        <div style={{ overflow: 'auto', borderRadius: 8, border: '1px solid var(--border)' }}>
          <table>
            <thead>
              <tr>
                {['Symbol','Side','Lots','Open','Current','P&L','Opened'].map(h => (
                  <th key={h} style={{ fontSize: 9 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {openPositions.map(pos => (
                <tr key={pos.id}>
                  <td style={{ fontFamily: 'var(--font-data)', fontWeight: 600, fontSize: 11 }}>{pos.symbol}</td>
                  <td>
                    <span className={`pill ${pos.side === 'BUY' ? 'pill-bull' : 'pill-bear'}`} style={{ fontSize: 9 }}>{pos.side}</span>
                  </td>
                  <td className="mono">{pos.lots}</td>
                  <td className="mono">{pos.openPrice}</td>
                  <td className="mono">{pos.current}</td>
                  <td className="mono" style={{ color: pos.pnl >= 0 ? 'var(--bull)' : 'var(--bear)' }}>
                    {pos.pnl >= 0 ? '+' : ''}{pos.pnl}
                  </td>
                  <td style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-data)' }}>{pos.opened}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order history */}
      <SectionTitle>Order History (last 50)</SectionTitle>
      <div style={{ overflow: 'auto', borderRadius: 8, border: '1px solid var(--border)' }}>
        <table>
          <thead>
            <tr>
              {['Date','Symbol','Type','Side','Lots','Price','P&L','Status'].map(h => (
                <th key={h} style={{ fontSize: 9 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {history.map((h, i) => (
              <tr key={i}>
                <td style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-data)' }}>{h.date}</td>
                <td style={{ fontFamily: 'var(--font-data)', fontWeight: 600, fontSize: 11 }}>{h.symbol}</td>
                <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{h.type}</td>
                <td>
                  <span className={`pill ${h.side === 'BUY' ? 'pill-bull' : 'pill-bear'}`} style={{ fontSize: 9 }}>{h.side}</span>
                </td>
                <td className="mono">{h.lots}</td>
                <td className="mono">{h.price}</td>
                <td className="mono" style={{ color: h.pnl >= 0 ? 'var(--bull)' : 'var(--bear)' }}>
                  {h.pnl >= 0 ? '+' : ''}{h.pnl}
                </td>
                <td><span className="pill pill-muted" style={{ fontSize: 9 }}>{h.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Trading restrictions */}
      <SectionTitle action={<button className="btn btn-ghost btn-xs">Edit Restrictions</button>}>Trading Restrictions</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg-3)', borderRadius: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Max lot size override</span>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-data)', color: 'var(--text-primary)' }}>Platform default</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg-3)', borderRadius: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Max open positions</span>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-data)', color: 'var(--text-primary)' }}>Platform default</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg-3)', borderRadius: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Restricted symbols</span>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>None</span>
        </div>
      </div>
    </div>
  );
}

// ─── TAB: FINANCE ─────────────────────────────────────────────────────────────
function FinanceTab({ client }) {
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjType, setAdjType] = useState('Credit');
  const [adjAmt, setAdjAmt] = useState('');
  const [adjReason, setAdjReason] = useState('');

  const clientTxns = allTxns.filter(t => t.clientId === client.id);

  return (
    <div style={{ padding: '0 20px 20px' }}>
      {/* Balance summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
        {[
          ['Available Balance', fmt(client.balance - client.margin), 'var(--bull)'],
          ['Locked in Positions', fmt(client.margin), 'var(--warn)'],
          ['Bonus Balance', fmt(client.bonusBalance), 'var(--accent)'],
          ['Credit', fmt(client.credit), 'var(--text-primary)'],
        ].map(([label, val, color]) => (
          <div key={label} style={{ background: 'var(--bg-3)', borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 14, fontFamily: 'var(--font-data)', fontWeight: 600, color }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Transactions table */}
      <SectionTitle action={
        <button className="btn btn-ghost btn-xs" onClick={() => setShowAdjust(v => !v)}>
          {showAdjust ? '✕ Cancel' : '+ Adjustment'}
        </button>
      }>Transactions</SectionTitle>

      {/* Add adjustment form */}
      {showAdjust && (
        <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border-accent)', borderRadius: 10, padding: 14, marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', marginBottom: 12 }}>Add Balance Adjustment</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="label">Type</label>
              <select className="select" value={adjType} onChange={e => setAdjType(e.target.value)}>
                <option>Credit</option>
                <option>Debit</option>
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="label">Amount (USD)</label>
              <input className="input" type="number" placeholder="0.00" value={adjAmt} onChange={e => setAdjAmt(e.target.value)} />
            </div>
          </div>
          <div className="form-group" style={{ margin: '10px 0 0' }}>
            <label className="label">Reason</label>
            <select className="select" value={adjReason} onChange={e => setAdjReason(e.target.value)} style={{ marginBottom: 6 }}>
              <option value="">Select reason...</option>
              <option>Bonus adjustment</option>
              <option>Error correction</option>
              <option>Promotional credit</option>
              <option>Trading fee refund</option>
              <option>Other</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => { alert(`Applying ${adjType} $${adjAmt}`); setShowAdjust(false); }}
              disabled={!adjAmt || !adjReason}
            >
              Apply Adjustment
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowAdjust(false)}>Cancel</button>
          </div>
        </div>
      )}

      {clientTxns.length === 0 ? (
        <div style={{ padding: '16px 0', fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center' }}>No transactions found</div>
      ) : (
        <div style={{ overflow: 'auto', borderRadius: 8, border: '1px solid var(--border)' }}>
          <table>
            <thead>
              <tr>
                {['Date','Type','Method','Amount','Status',''].map(h => (
                  <th key={h} style={{ fontSize: 9 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clientTxns.map(txn => (
                <tr key={txn.id}>
                  <td style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-data)' }}>
                    {txn.requested.slice(0,10)}
                  </td>
                  <td style={{ fontSize: 11 }}>
                    <span className={`pill ${txn.type === 'Deposit' ? 'pill-bull' : txn.type === 'Withdrawal' ? 'pill-bear' : 'pill-accent'}`} style={{ fontSize: 9 }}>
                      {txn.type}
                    </span>
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{txn.method}</td>
                  <td className="mono" style={{ fontWeight: 600, color: txn.type === 'Withdrawal' ? 'var(--bear)' : 'var(--bull)' }}>
                    {txn.type === 'Withdrawal' ? '-' : '+'}{fmt(txn.amount)}
                  </td>
                  <td>
                    <span className={`pill ${txn.status === 'Approved' ? 'pill-verified' : txn.status === 'Pending' ? 'pill-pending' : txn.status === 'Rejected' ? 'pill-rejected' : 'pill-accent'}`} style={{ fontSize: 9 }}>
                      {txn.status}
                    </span>
                  </td>
                  <td>
                    {txn.status === 'Pending' && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-success btn-xs" onClick={e => e.stopPropagation()}>✓</button>
                        <button className="btn btn-danger btn-xs" onClick={e => e.stopPropagation()}>✗</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Totals */}
      <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        {[
          ['Total Deposited', fmt(client.totalDeposited)],
          ['Total Withdrawn', fmt(client.totalWithdrawn)],
          ['Net Funding', (() => { const n = client.totalDeposited - client.totalWithdrawn; return <span style={{ color: n >= 0 ? 'var(--bull)' : 'var(--bear)' }}>{n >= 0 ? '+' : ''}{fmt(n)}</span>; })()],
          ['Bonuses Received', fmt(client.bonusBalance)],
        ].map(([label, val]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg-3)', borderRadius: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{label}</span>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-data)', fontWeight: 600, color: 'var(--text-primary)' }}>{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TAB: DOCUMENTS ───────────────────────────────────────────────────────────
function DocumentsTab({ client }) {
  const docs = [
    { type: 'Government ID (Front)', status: client.kyc === 'Verified' ? 'Approved' : client.kyc === 'Pending' ? 'Pending' : 'Rejected', date: '2023-01-15', ext: 'JPG' },
    { type: 'Government ID (Back)',  status: client.kyc === 'Verified' ? 'Approved' : 'Pending', date: '2023-01-15', ext: 'JPG' },
    { type: 'Proof of Address',      status: client.kyc === 'Verified' ? 'Approved' : 'Pending', date: '2023-01-16', ext: 'PDF' },
    { type: 'Selfie / Liveness',     status: client.kyc === 'Verified' ? 'Approved' : 'Pending', date: '2023-01-15', ext: 'JPG' },
    { type: 'Source of Funds',       status: 'Pending',  date: null, ext: null },
  ];

  const UploadZone = ({ label }) => (
    <div style={{
      border: '1px dashed var(--border-strong)', borderRadius: 8,
      padding: '16px', textAlign: 'center', cursor: 'pointer',
      transition: 'all 0.15s', marginBottom: 8,
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
    onClick={() => alert(`Upload: ${label}`)}
    >
      <div style={{ fontSize: 20, marginBottom: 6, opacity: 0.4 }}>📄</div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Upload {label}</div>
      <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>Drag & drop or click to browse</div>
    </div>
  );

  return (
    <div style={{ padding: '0 20px 20px' }}>
      <SectionTitle>Uploaded Documents</SectionTitle>

      {docs.map((doc, i) => (
        <div key={i} style={{
          display: 'flex', gap: 10, padding: '10px 12px',
          background: 'var(--bg-3)', borderRadius: 8, marginBottom: 6,
          alignItems: 'center',
        }}>
          {/* File icon */}
          <div style={{
            width: 36, height: 36, background: 'var(--bg-4)', borderRadius: 6,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700 }}>{doc.ext || '?'}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>{doc.type}</div>
            {doc.date && <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-data)' }}>Uploaded: {doc.date}</div>}
          </div>
          <span className={`pill ${doc.status === 'Approved' ? 'pill-verified' : doc.status === 'Rejected' ? 'pill-rejected' : 'pill-pending'}`} style={{ fontSize: 10 }}>
            {doc.status}
          </span>
          {doc.date && (
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="btn btn-ghost btn-xs" onClick={() => alert(`View: ${doc.type}`)}>View</button>
              {doc.status === 'Pending' && (
                <>
                  <button className="btn btn-success btn-xs" onClick={() => alert(`Approve: ${doc.type}`)}>✓</button>
                  <button className="btn btn-danger btn-xs" onClick={() => alert(`Reject: ${doc.type}`)}>✗</button>
                </>
              )}
            </div>
          )}
        </div>
      ))}

      <SectionTitle>Upload New Document</SectionTitle>
      <UploadZone label="document" />

      {/* Document audit trail */}
      <SectionTitle>Document Audit Trail</SectionTitle>
      <div style={{ overflow: 'auto', borderRadius: 8, border: '1px solid var(--border)' }}>
        <table>
          <thead>
            <tr>
              {['Reviewed By','Date','Decision','Notes'].map(h => (
                <th key={h} style={{ fontSize: 9 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ['Sarah Chen', '2023-01-16', 'Approved', 'All documents verified'],
              ['System', '2023-01-15', 'Uploaded', 'Client uploaded passport + utility bill'],
            ].map(([by, date, dec, note], i) => (
              <tr key={i}>
                <td style={{ fontSize: 11 }}>{by}</td>
                <td style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-data)' }}>{date}</td>
                <td>
                  <span className={`pill ${dec === 'Approved' ? 'pill-verified' : dec === 'Rejected' ? 'pill-rejected' : 'pill-muted'}`} style={{ fontSize: 9 }}>
                    {dec}
                  </span>
                </td>
                <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── TAB: COMMUNICATIONS ──────────────────────────────────────────────────────
function CommunicationsTab({ client }) {
  const [noteText, setNoteText] = useState('');
  const [notes, setNotes] = useState(client.notes || []);

  const addNote = () => {
    if (!noteText.trim()) return;
    setNotes(n => [{ author: 'Sarah Chen', time: new Date().toISOString().slice(0,16).replace('T',' '), text: noteText }, ...n]);
    setNoteText('');
  };

  const emails = [
    { date: '2024-01-08 09:12', subject: 'Welcome to ArcaFX Markets', sender: 'system@arcafx.com', opened: true },
    { date: '2023-01-16 14:30', subject: 'KYC Approved — Your account is verified', sender: 'kyc@arcafx.com', opened: true },
    { date: '2023-01-15 09:00', subject: 'Action Required: Verify your identity', sender: 'kyc@arcafx.com', opened: true },
    { date: '2022-04-10 10:00', subject: 'Email Verification', sender: 'no-reply@arcafx.com', opened: true },
  ];

  return (
    <div style={{ padding: '0 20px 20px' }}>
      {/* Email history */}
      <SectionTitle>Email History</SectionTitle>
      <div style={{ overflow: 'auto', borderRadius: 8, border: '1px solid var(--border)' }}>
        <table>
          <thead>
            <tr>
              {['Date','Subject','From','Opened'].map(h => (
                <th key={h} style={{ fontSize: 9 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {emails.map((email, i) => (
              <tr key={i}>
                <td style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-data)', whiteSpace: 'nowrap' }}>{email.date}</td>
                <td style={{ fontSize: 11, color: 'var(--text-primary)' }}>{email.subject}</td>
                <td style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{email.sender}</td>
                <td>
                  <span style={{ fontSize: 10, color: email.opened ? 'var(--bull)' : 'var(--text-tertiary)' }}>
                    {email.opened ? '✓ Opened' : '○ Sent'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Internal notes */}
      <SectionTitle>Internal CRM Notes</SectionTitle>

      {/* Add note */}
      <div style={{ background: 'var(--bg-3)', borderRadius: 8, padding: 12, marginBottom: 12 }}>
        <textarea
          value={noteText}
          onChange={e => setNoteText(e.target.value)}
          placeholder="Add an internal note..."
          style={{
            width: '100%', minHeight: 72, background: 'var(--bg-2)',
            border: '1px solid var(--border)', borderRadius: 6,
            padding: '8px 10px', fontSize: 12, color: 'var(--text-primary)',
            fontFamily: 'var(--font-ui)', resize: 'vertical', outline: 'none',
            boxSizing: 'border-box',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="btn btn-primary btn-sm" onClick={addNote} disabled={!noteText.trim()}>
            Add Note
          </button>
        </div>
      </div>

      {/* Notes list */}
      {notes.length === 0 ? (
        <div style={{ padding: '16px 0', textAlign: 'center', fontSize: 12, color: 'var(--text-tertiary)' }}>
          No notes yet
        </div>
      ) : (
        notes.map((note, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <div className="avatar-sm" style={{ background: '#3B82F6', flexShrink: 0, marginTop: 2 }}>
              {note.author.split(' ').map(n => n[0]).join('').slice(0,2)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{note.author}</span>
                <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-data)' }}>{note.time}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, background: 'var(--bg-3)', padding: '8px 10px', borderRadius: 6 }}>
                {note.text}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─── TAB: AUDIT TRAIL ─────────────────────────────────────────────────────────
function AuditTrailTab({ client }) {
  const entries = auditLog.filter(e => e.entityId === client.id);
  const allEntries = entries.length > 0 ? entries : [
    { id: 'AL-X1', time: client.regDate + ' 10:00', member: 'System', role: 'System', action: 'client.registered', details: 'Account created via web registration', oldValue: null, newValue: 'Active', ip: 'external', result: 'success' },
    { id: 'AL-X2', time: client.regDate + ' 10:01', member: 'System', role: 'System', action: 'kyc.initiated', details: 'KYC process initiated', oldValue: null, newValue: 'Pending', ip: 'internal', result: 'success' },
  ];

  return (
    <div style={{ padding: '0 20px 20px' }}>
      <SectionTitle action={
        <button className="btn btn-ghost btn-xs">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 7v2h2M9 7v2H7M5 1v5M2.5 3.5L5 1l2.5 2.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Export
        </button>
      }>
        Audit Trail ({allEntries.length} entries)
      </SectionTitle>

      <div style={{ overflow: 'auto', borderRadius: 8, border: '1px solid var(--border)' }}>
        <table>
          <thead>
            <tr>
              {['Timestamp','Actor','Action','Details','Old Value','New Value','Result'].map(h => (
                <th key={h} style={{ fontSize: 9 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allEntries.map(entry => (
              <tr key={entry.id}>
                <td style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-data)', whiteSpace: 'nowrap' }}>{entry.time}</td>
                <td>
                  <div style={{ fontSize: 11, color: 'var(--text-primary)' }}>{entry.member}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>{entry.role}</div>
                </td>
                <td style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--accent)' }}>{entry.action}</td>
                <td style={{ fontSize: 11, color: 'var(--text-secondary)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.details}</td>
                <td style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-data)' }}>{entry.oldValue || '—'}</td>
                <td style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'var(--font-data)' }}>{entry.newValue || '—'}</td>
                <td>
                  <span style={{ fontSize: 10, color: entry.result === 'success' ? 'var(--bull)' : 'var(--bear)' }}>
                    {entry.result === 'success' ? '✓' : '✗'} {entry.result}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 10, fontSize: 10, color: 'var(--text-tertiary)', textAlign: 'center' }}>
        Audit log is immutable — records cannot be deleted
      </div>
    </div>
  );
}

// ─── DRAWER HEADER ACTIONS ────────────────────────────────────────────────────
function DrawerActions({ client, onAction }) {
  const actions = [
    { icon: '📧', label: 'Email',   key: 'email' },
    { icon: '📞', label: 'Call',    key: 'call' },
    { icon: '📝', label: 'Note',    key: 'note' },
    { icon: '💰', label: 'Bonus',   key: 'bonus' },
    { icon: '⚑',  label: 'Flag',    key: 'flag' },
    { icon: '🔒', label: client.status === 'Suspended' ? 'Unsuspend' : 'Suspend', key: 'suspend' },
  ];
  return (
    <div style={{ display: 'flex', gap: 6, padding: '10px 20px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
      {actions.map(a => (
        <button
          key={a.key}
          className="btn btn-ghost btn-xs"
          style={{ gap: 5 }}
          onClick={() => onAction(a.key)}
        >
          <span style={{ fontSize: 11 }}>{a.icon}</span>
          {a.label}
        </button>
      ))}
    </div>
  );
}

// ─── CLIENT DRAWER ────────────────────────────────────────────────────────────
const TABS = ['Overview','Trading','Finance','Documents','Communications','Audit Trail'];

export default function ClientDrawer({ client, open, onClose }) {
  const [activeTab, setActiveTab] = useState('Overview');

  if (!client) return null;

  const handleAction = (action) => {
    if (action === 'suspend') alert(`${client.status === 'Suspended' ? 'Unsuspend' : 'Suspend'}: ${client.name}`);
    else if (action === 'bonus') alert(`Apply bonus to: ${client.name}`);
    else alert(`Action: ${action} for ${client.name}`);
  };

  return (
    <>
      {open && <div className="drawer-overlay" onClick={onClose} />}
      <div className={`drawer ${open ? 'open' : ''}`}>
        {/* Header */}
        <div className="drawer-header">
          <div className="avatar" style={{ background: avatarBg(client.name) }}>
            {client.name.split(' ').map(n => n[0]).join('').slice(0,2)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {client.name}
              </span>
              <StatusPill status={client.status} />
              {client.amlStatus === 'Flagged' && (
                <span style={{ fontSize: 11, color: 'var(--bear)', fontWeight: 700 }}>⚑ AML</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-data)', color: 'var(--text-tertiary)' }}>{client.id}</span>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>·</span>
              <span className={`pill ${client.type === 'VIP' ? 'pill-warn' : client.type === 'Pro' ? 'pill-accent' : 'pill-muted'}`} style={{ fontSize: 10 }}>
                {client.type}
              </span>
              <span className="pill pill-muted" style={{ fontSize: 10 }}>{client.group}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
            <button className="btn btn-ghost btn-xs">Edit</button>
            <button className="drawer-close" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Action row */}
        <DrawerActions client={client} onAction={handleAction} />

        {/* Tabs */}
        <div className="tabs" style={{ padding: '0 20px' }}>
          {TABS.map(tab => (
            <button
              key={tab}
              className={`tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
              style={{ fontSize: 11, padding: '9px 10px' }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="drawer-body">
          {activeTab === 'Overview'        && <OverviewTab        client={client} />}
          {activeTab === 'Trading'         && <TradingTab         client={client} />}
          {activeTab === 'Finance'         && <FinanceTab         client={client} />}
          {activeTab === 'Documents'       && <DocumentsTab       client={client} />}
          {activeTab === 'Communications'  && <CommunicationsTab  client={client} />}
          {activeTab === 'Audit Trail'     && <AuditTrailTab      client={client} />}
        </div>
      </div>
    </>
  );
}
