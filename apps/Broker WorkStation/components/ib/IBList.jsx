'use client';
import { useState } from 'react';
import { introducingBrokers, clients } from '../../lib/mockData';

function TierDiagram() {
  return (
    <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, padding: 20, marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: 16 }}>
        Commission Structure
      </div>
      <svg width="100%" viewBox="0 0 480 140" style={{ overflow: 'visible' }}>
        {/* Tier 1 */}
        <rect x="160" y="10" width="160" height="48" rx="8" fill="var(--bg-4)" stroke="var(--accent)" strokeWidth="0.8" />
        <text x="240" y="30" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text-primary)" fontFamily="DM Sans, sans-serif">Tier 1 IB</text>
        <text x="240" y="46" textAnchor="middle" fontSize="9.5" fill="var(--accent)" fontFamily="DM Sans, sans-serif">$6–$8 per lot traded</text>

        {/* Arrows down to clients + sub-IB */}
        <line x1="180" y1="58" x2="80" y2="100" stroke="var(--border-strong)" strokeWidth="0.8" markerEnd="url(#arr2)" />
        <line x1="240" y1="58" x2="240" y2="100" stroke="var(--border-strong)" strokeWidth="0.8" markerEnd="url(#arr2)" />
        <line x1="300" y1="58" x2="400" y2="100" stroke="var(--border-strong)" strokeWidth="0.8" markerEnd="url(#arr2)" />

        {/* Label on arrows */}
        <text x="125" y="83" textAnchor="middle" fontSize="8.5" fill="var(--text-tertiary)" fontFamily="DM Sans, sans-serif">refers</text>
        <text x="240" y="83" textAnchor="middle" fontSize="8.5" fill="var(--text-tertiary)" fontFamily="DM Sans, sans-serif">refers</text>
        <text x="355" y="83" textAnchor="middle" fontSize="8.5" fill="var(--text-tertiary)" fontFamily="DM Sans, sans-serif">sub-IB</text>

        {/* Clients box */}
        <rect x="20" y="100" width="120" height="34" rx="6" fill="var(--bg-4)" stroke="var(--bull)" strokeWidth="0.6" />
        <text x="80" y="118" textAnchor="middle" fontSize="10" fill="var(--bull)" fontFamily="DM Sans, sans-serif">Clients</text>
        <text x="80" y="130" textAnchor="middle" fontSize="8.5" fill="var(--text-tertiary)" fontFamily="DM Sans, sans-serif">trade volume</text>

        <rect x="180" y="100" width="120" height="34" rx="6" fill="var(--bg-4)" stroke="var(--bull)" strokeWidth="0.6" />
        <text x="240" y="118" textAnchor="middle" fontSize="10" fill="var(--bull)" fontFamily="DM Sans, sans-serif">Clients</text>
        <text x="240" y="130" textAnchor="middle" fontSize="8.5" fill="var(--text-tertiary)" fontFamily="DM Sans, sans-serif">trade volume</text>

        {/* Sub-IB */}
        <rect x="340" y="100" width="120" height="34" rx="6" fill="var(--bg-4)" stroke="var(--warn)" strokeWidth="0.6" />
        <text x="400" y="118" textAnchor="middle" fontSize="10" fill="var(--warn)" fontFamily="DM Sans, sans-serif">Tier 2 IB</text>
        <text x="400" y="130" textAnchor="middle" fontSize="8.5" fill="var(--text-tertiary)" fontFamily="DM Sans, sans-serif">50% of Tier1 rate</text>

        <defs>
          <marker id="arr2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M2 2L8 5L2 8" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </marker>
        </defs>
      </svg>
    </div>
  );
}

function IBDetail({ ib, onBack }) {
  const [tab, setTab] = useState('profile');
  const ibClients = clients.filter(c => c.ib === ib.id);

  const ledger = [
    { month: 'Jan 2024', volume: ib.volumeMTD, rate: ib.commissionRate, amount: ib.commissionPending, status: 'Pending' },
    { month: 'Dec 2023', volume: Math.floor(ib.volumeMTD * 0.9), rate: ib.commissionRate, amount: Math.floor(ib.commissionPending * 0.85), status: 'Paid' },
    { month: 'Nov 2023', volume: Math.floor(ib.volumeMTD * 0.8), rate: ib.commissionRate, amount: Math.floor(ib.commissionPending * 0.75), status: 'Paid' },
  ];

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <div style={{ padding: '20px 0 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M7 2L3 5.5 7 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          All IBs
        </button>
        <div style={{ height: 16, width: 1, background: 'var(--border)' }} />
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>{ib.name}</div>
        <span className={`pill ${ib.status === 'Active' ? 'pill-active' : 'pill-pending'}`}>{ib.status}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm">Edit</button>
          <button
            className="btn btn-success btn-sm"
            onClick={() => alert(`Paying $${ib.commissionPending.toLocaleString()} to ${ib.name}`)}
          >
            💰 Pay ${ib.commissionPending.toLocaleString()}
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          ['Clients Referred', ib.clientsReferred, 'var(--accent)'],
          ['Active Clients', ib.activeClients, 'var(--bull)'],
          ['Volume MTD', `${ib.volumeMTD.toLocaleString()} lots`, 'var(--text-primary)'],
          ['Commission Earned', `$${ib.commissionEarned.toLocaleString()}`, 'var(--bull)'],
          ['Pending Payout', `$${ib.commissionPending.toLocaleString()}`, 'var(--warn)'],
        ].map(([label, val, color]) => (
          <div key={label} style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 5 }}>{label}</div>
            <div style={{ fontSize: 18, fontFamily: 'var(--font-data)', fontWeight: 600, color }}>{val}</div>
          </div>
        ))}
      </div>

      <div className="tabs" style={{ padding: 0, marginBottom: 16 }}>
        {['profile','clients','commissions','documents'].map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
            <div style={{ padding: 20, borderRight: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: 12 }}>Profile</div>
              {[
                ['Contact', ib.contact],
                ['Country', `${ib.flag} ${ib.country}`],
                ['IB ID', ib.id],
                ['Tier', `Tier ${ib.tier}`],
                ['Agreement Signed', ib.agreementSigned],
                ['Payment Frequency', ib.paymentFrequency],
                ['Min Threshold', `$${ib.minThreshold}`],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{l}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: 12 }}>Bank Details</div>
              {[
                ['Bank', ib.bankDetails.bank],
                ['Account', ib.bankDetails.account],
                ['SWIFT', ib.bankDetails.swift],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{l}</span>
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-data)', color: 'var(--text-primary)' }}>{v}</span>
                </div>
              ))}
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginBottom: 12 }}>Commission Plan</div>
                <div style={{ background: 'var(--bg-3)', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 20, fontFamily: 'var(--font-data)', fontWeight: 700, color: 'var(--bull)', marginBottom: 4 }}>
                    ${ib.commissionRate} / lot
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>All eligible instruments</div>
                  <button className="btn btn-ghost btn-xs" style={{ marginTop: 10 }}>Edit Plan</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'clients' && (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>{['Client','Type','Balance','Volume MTD','Reg Date','Status'].map(h => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {ibClients.length === 0 ? (
                  <tr><td colSpan={6}><div className="empty-state"><div className="empty-state__title">No clients referred yet</div></div></td></tr>
                ) : ibClients.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{c.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-data)' }}>{c.id}</div>
                    </td>
                    <td><span className={`pill ${c.type === 'VIP' ? 'pill-warn' : c.type === 'Pro' ? 'pill-accent' : 'pill-muted'}`} style={{ fontSize: 10 }}>{c.type}</span></td>
                    <td className="mono">${c.balance.toLocaleString()}</td>
                    <td className="mono" style={{ color: 'var(--text-secondary)' }}>{c.volumeMTD} lots</td>
                    <td style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{c.regDate}</td>
                    <td><span className={`pill ${c.status === 'Active' ? 'pill-active' : 'pill-muted'}`} style={{ fontSize: 10 }}>{c.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'commissions' && (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>{['Month','Volume (lots)','Rate','Amount','Status',''].map(h => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {ledger.map((row, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{row.month}</td>
                    <td className="mono">{row.volume.toLocaleString()}</td>
                    <td className="mono">${row.rate}/lot</td>
                    <td className="mono" style={{ color: 'var(--bull)', fontWeight: 600 }}>${row.amount.toLocaleString()}</td>
                    <td><span className={`pill ${row.status === 'Paid' ? 'pill-verified' : 'pill-pending'}`} style={{ fontSize: 10 }}>{row.status}</span></td>
                    <td>
                      {row.status === 'Pending' && (
                        <button className="btn btn-success btn-xs" onClick={() => alert(`Pay $${row.amount}`)}>Pay Now</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'documents' && (
        <div className="card" style={{ padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>IB Agreement Signed</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 16 }}>Signed: {ib.agreementSigned}</div>
          <button className="btn btn-ghost btn-sm">📄 View Agreement PDF</button>
        </div>
      )}
    </div>
  );
}

export default function IBList() {
  const [selectedIB, setSelectedIB] = useState(null);

  if (selectedIB) return <IBDetail ib={selectedIB} onBack={() => setSelectedIB(null)} />;

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <div style={{ padding: '20px 0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>Introducing Brokers</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
            {introducingBrokers.length} IBs · {introducingBrokers.reduce((a, b) => a + b.clientsReferred, 0)} total clients referred
          </div>
        </div>
        <button className="btn btn-primary btn-sm">+ Onboard IB</button>
      </div>

      <TierDiagram />

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {['IB','Country','Tier','Clients Referred','Active','Volume MTD','Earned','Pending','Status',''].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {introducingBrokers.map(ib => (
                <tr key={ib.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedIB(ib)}>
                  <td>
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{ib.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{ib.contact} · {ib.id}</div>
                  </td>
                  <td><span style={{ fontSize: 16 }}>{ib.flag}</span></td>
                  <td>
                    <span className={`pill ${ib.tier === 1 ? 'pill-accent' : 'pill-warn'}`} style={{ fontSize: 10 }}>Tier {ib.tier}</span>
                  </td>
                  <td className="mono">{ib.clientsReferred}</td>
                  <td className="mono">{ib.activeClients}</td>
                  <td className="mono">{ib.volumeMTD.toLocaleString()} lots</td>
                  <td className="mono" style={{ color: 'var(--bull)' }}>${ib.commissionEarned.toLocaleString()}</td>
                  <td className="mono" style={{ color: ib.commissionPending > 0 ? 'var(--warn)' : 'var(--text-tertiary)' }}>
                    ${ib.commissionPending.toLocaleString()}
                  </td>
                  <td>
                    <span className={`pill ${ib.status === 'Active' ? 'pill-active' : 'pill-pending'}`} style={{ fontSize: 10 }}>
                      {ib.status}
                    </span>
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-xs" onClick={() => setSelectedIB(ib)}>View</button>
                      {ib.commissionPending > 0 && (
                        <button className="btn btn-success btn-xs" onClick={() => alert(`Pay $${ib.commissionPending} to ${ib.name}`)}>
                          Pay
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
