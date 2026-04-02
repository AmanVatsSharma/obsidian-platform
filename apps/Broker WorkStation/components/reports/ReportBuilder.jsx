'use client';
import { useState } from 'react';
import { clients, transactions, revenueData } from '../../lib/mockData';

const REPORT_CATALOG = [
  { id: 'daily-summary',    name: 'Daily Trading Summary',    category: 'Operational', icon: '◈', desc: 'Volume, P&L, and key metrics for the day' },
  { id: 'weekly-pnl',       name: 'Weekly P&L',               category: 'Operational', icon: '◈', desc: 'Revenue breakdown by source over 7 days' },
  { id: 'monthly-review',   name: 'Monthly Business Review',  category: 'Operational', icon: '◈', desc: 'Full month executive summary' },
  { id: 'symbol-perf',      name: 'Symbol Performance',       category: 'Operational', icon: '◉', desc: 'Volume, spread income, and P&L per instrument' },
  { id: 'client-statement', name: 'Client Statement',         category: 'Client',      icon: '◻', desc: 'Individual client trading and financial statement' },
  { id: 'client-activity',  name: 'Client Activity Summary',  category: 'Client',      icon: '◻', desc: 'Login frequency, trade count, deposit patterns' },
  { id: 'new-clients',      name: 'New Client Report',        category: 'Client',      icon: '◻', desc: 'Registrations, KYC completion rates, first deposit' },
  { id: 'dormant-clients',  name: 'Dormant Clients',          category: 'Client',      icon: '◻', desc: 'Clients inactive for 30, 60, 90+ days' },
  { id: 'top-clients',      name: 'Top Clients by Volume',    category: 'Client',      icon: '◻', desc: 'Ranked list of highest-volume traders' },
  { id: 'revenue-stmt',     name: 'Revenue Statement',        category: 'Financial',   icon: '◈', desc: 'Spread, commission, swap income breakdown' },
  { id: 'commission-rpt',   name: 'Commission Report',        category: 'Financial',   icon: '◈', desc: 'IB commission earned and paid' },
  { id: 'deposit-wdl',      name: 'Deposit/Withdrawal Summary', category: 'Financial', icon: '◈', desc: 'Net funding flows by method and period' },
  { id: 'kyc-summary',      name: 'KYC Status Summary',       category: 'Compliance',  icon: '◫', desc: 'KYC verification rates and pending queue' },
  { id: 'aml-screening',    name: 'AML Screening Report',     category: 'Compliance',  icon: '◫', desc: 'Risk scores and flagged accounts' },
  { id: 'trade-surv',       name: 'Trade Surveillance Summary', category: 'Compliance',icon: '◫', desc: 'Alert history and resolution status' },
  { id: 'mifid-txn',        name: 'Transaction Report (EMIR/MiFID)', category: 'Regulatory', icon: '⊡', desc: 'Regulatory-format transaction export' },
  { id: 'position-rpt',     name: 'Position Report',          category: 'Regulatory',  icon: '⊡', desc: 'End-of-day position snapshot' },
  { id: 'best-exec',        name: 'Best Execution Report',    category: 'Regulatory',  icon: '⊡', desc: 'MiFID II best execution compliance' },
];

const CATEGORY_COLORS = {
  Operational: 'var(--accent)',
  Client:      'var(--bull)',
  Financial:   'var(--warn)',
  Compliance:  'var(--bear)',
  Regulatory:  '#8B5CF6',
};

const COLUMNS_BY_TYPE = {
  default: ['Date','Client ID','Client Name','Country','Account Type','Instrument','Side','Lots','Open Price','Close Price','P&L','Status'],
  financial: ['Date','Revenue Type','Amount','Currency','Client','Method','Reference'],
  client: ['Client ID','Name','Email','Country','KYC Status','Balance','Volume MTD','Reg Date','Last Login','Status'],
};

const PREVIEW_DATA = [
  { date: '2024-01-15', client: 'C1001', name: 'Alexander Mitchell', country: 'GB', type: 'VIP', instrument: 'EUR/USD', side: 'BUY', lots: 2.5, open: 1.0842, close: 1.0891, pnl: '+$1,225', status: 'Closed' },
  { date: '2024-01-15', client: 'C1005', name: 'Wei Zhang',          country: 'SG', type: 'VIP', instrument: 'XAUUSD', side: 'BUY', lots: 0.5, open: 2018.40, close: 2024.80, pnl: '+$320', status: 'Closed' },
  { date: '2024-01-15', client: 'C1009', name: 'Tariq Hassan',       country: 'AE', type: 'VIP', instrument: 'USD/JPY', side: 'SELL', lots: 1.0, open: 148.22, close: 147.95, pnl: '+$182', status: 'Closed' },
  { date: '2024-01-14', client: 'C1007', name: 'Priya Sharma',       country: 'GB', type: 'Pro', instrument: 'GBP/USD', side: 'BUY', lots: 1.5, open: 1.2705, close: 1.2689, pnl: '-$240', status: 'Closed' },
  { date: '2024-01-14', client: 'C1011', name: 'David Thompson',     country: 'AU', type: 'Pro', instrument: 'AUD/USD', side: 'SELL', lots: 2.0, open: 0.6582, close: 0.6571, pnl: '+$220', status: 'Closed' },
];

const SCHEDULED = [
  { id: 's1', name: 'Daily P&L Summary',    type: 'daily-summary',  freq: 'Daily',   recipients: ['sarah@arcafx.com','marcus@arcafx.com'], nextRun: 'Today 08:00', lastSent: 'Yesterday 08:01' },
  { id: 's2', name: 'Weekly Business Review',type: 'weekly-pnl',    freq: 'Weekly',  recipients: ['sarah@arcafx.com'], nextRun: 'Mon Jan 22 08:00', lastSent: 'Mon Jan 15 08:02' },
  { id: 's3', name: 'KYC Queue Summary',    type: 'kyc-summary',    freq: 'Daily',   recipients: ['sarah@arcafx.com','mike@arcafx.com'], nextRun: 'Today 09:00', lastSent: 'Yesterday 09:01' },
  { id: 's4', name: 'Monthly Regulatory',   type: 'mifid-txn',      freq: 'Monthly', recipients: ['compliance@arcafx.com'], nextRun: 'Feb 1 00:00', lastSent: 'Jan 1 00:02' },
];

// ─── REPORT BUILDER ───────────────────────────────────────────────────────────
function ReportBuilderWizard({ initialType, onBack }) {
  const [step, setStep]           = useState(initialType ? 2 : 1);
  const [reportType, setType]     = useState(initialType || '');
  const [dateRange, setDateRange] = useState({ preset: 'month', from: '2024-01-01', to: '2024-01-15' });
  const [filters, setFilters]     = useState({ client: '', symbol: '', accountType: '', country: '' });
  const [cols, setCols]           = useState(new Set(COLUMNS_BY_TYPE.default.slice(0, 8)));
  const [format, setFormat]       = useState('CSV');
  const [delivery, setDelivery]   = useState('download');
  const [generating, setGen]      = useState(false);
  const [generated, setGenDone]   = useState(false);
  const [showPreview, setPreview] = useState(false);

  const selectedReport = REPORT_CATALOG.find(r => r.id === reportType);
  const allCols = COLUMNS_BY_TYPE.default;

  const presets = [
    { label: 'Today',   key: 'today' },
    { label: 'Week',    key: 'week' },
    { label: 'Month',   key: 'month' },
    { label: 'Quarter', key: 'quarter' },
    { label: 'Year',    key: 'year' },
  ];

  const generate = () => {
    setGen(true);
    setTimeout(() => { setGen(false); setGenDone(true); }, 1800);
  };

  const STEPS = ['Report Type','Date Range','Filters','Columns','Format','Delivery'];

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <div style={{ padding: '20px 0 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M7 2L3 5.5 7 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Report Catalog
        </button>
        <div style={{ height: 16, width: 1, background: 'var(--border)' }} />
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>Report Builder</div>
        {selectedReport && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>— {selectedReport.name}</span>}
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, background: 'var(--bg-1)', borderRadius: 10, padding: 4, border: '1px solid var(--border)' }}>
        {STEPS.map((s, i) => (
          <button
            key={s}
            onClick={() => setStep(i + 1)}
            style={{
              flex: 1, padding: '8px 4px', borderRadius: 7, fontSize: 11, fontWeight: 500,
              cursor: 'pointer', border: 'none', transition: 'all 0.15s', textAlign: 'center',
              background: step === i + 1 ? 'var(--bg-3)' : 'transparent',
              color: step === i + 1 ? 'var(--accent)' : step > i + 1 ? 'var(--bull)' : 'var(--text-tertiary)',
            }}
          >
            <div style={{ fontSize: 9, marginBottom: 1, opacity: 0.6 }}>Step {i + 1}</div>
            {s}
            {step > i + 1 && <span style={{ marginLeft: 4 }}>✓</span>}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 24 }}>
        {step === 1 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Select Report Type</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {REPORT_CATALOG.map(r => (
                <div
                  key={r.id}
                  onClick={() => { setType(r.id); setStep(2); }}
                  style={{
                    padding: '14px', borderRadius: 10, cursor: 'pointer',
                    border: `1px solid ${reportType === r.id ? CATEGORY_COLORS[r.category] : 'var(--border)'}`,
                    background: reportType === r.id ? `${CATEGORY_COLORS[r.category]}10` : 'var(--bg-2)',
                    transition: 'all 0.12s',
                  }}
                  onMouseEnter={e => { if (reportType !== r.id) e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
                  onMouseLeave={e => { if (reportType !== r.id) e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 16, color: CATEGORY_COLORS[r.category] }}>{r.icon}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>{r.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-tertiary)', lineHeight: 1.4 }}>{r.desc}</div>
                      <div style={{ marginTop: 6 }}>
                        <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 10, background: `${CATEGORY_COLORS[r.category]}18`, color: CATEGORY_COLORS[r.category], fontWeight: 600 }}>
                          {r.category}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Date Range</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              {presets.map(p => (
                <button
                  key={p.key}
                  className={`btn ${dateRange.preset === p.key ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                  onClick={() => setDateRange(d => ({ ...d, preset: p.key }))}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="label">From</label>
                <input className="input" type="date" value={dateRange.from} onChange={e => setDateRange(d => ({ ...d, from: e.target.value, preset: 'custom' }))} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="label">To</label>
                <input className="input" type="date" value={dateRange.to} onChange={e => setDateRange(d => ({ ...d, to: e.target.value, preset: 'custom' }))} />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Filters (optional)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
              {[
                ['Client (search)', 'client', 'text', 'Name, ID, or email...'],
                ['Symbol', 'symbol', 'text', 'e.g. EUR/USD'],
                ['Account Type', 'accountType', 'select', ''],
                ['Country', 'country', 'text', 'e.g. GB'],
              ].map(([label, field, type, placeholder]) => (
                <div key={field} className="form-group">
                  <label className="label">{label}</label>
                  {type === 'select' ? (
                    <select className="select" value={filters[field]} onChange={e => setFilters(f => ({ ...f, [field]: e.target.value }))}>
                      <option value="">All</option>
                      {['Retail','Pro','VIP'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input className="input" placeholder={placeholder} value={filters[field]} onChange={e => setFilters(f => ({ ...f, [field]: e.target.value }))} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Select Columns</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 16 }}>
              {cols.size} of {allCols.length} columns selected
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {allCols.map(col => (
                <label key={col} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: cols.has(col) ? 'var(--accent-muted)' : 'var(--bg-2)', borderRadius: 6, cursor: 'pointer', fontSize: 12, color: cols.has(col) ? 'var(--accent)' : 'var(--text-secondary)', border: `1px solid ${cols.has(col) ? 'var(--border-accent)' : 'var(--border)'}`, transition: 'all 0.12s' }}>
                  <input type="checkbox" checked={cols.has(col)} onChange={() => setCols(c => { const n = new Set(c); n.has(col) ? n.delete(col) : n.add(col); return n; })} />
                  {col}
                </label>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Output Format</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {['PDF','CSV','XLSX','JSON'].map(f => (
                <button
                  key={f}
                  className={`btn ${format === f ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                  style={{ width: 80 }}
                  onClick={() => setFormat(f)}
                >
                  {f}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 20, padding: 14, background: 'var(--bg-2)', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>{format}</strong> format selected.
              {format === 'PDF' && ' Formatted report with charts and branding.'}
              {format === 'CSV' && ' Raw CSV, compatible with Excel and Google Sheets.'}
              {format === 'XLSX' && ' Excel workbook with formatting and multiple sheets.'}
              {format === 'JSON' && ' Machine-readable JSON for API integration.'}
            </div>
          </div>
        )}

        {step === 6 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Delivery Method</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {[
                { key: 'download', label: 'Download now', sub: 'File downloads immediately to your browser' },
                { key: 'email-me', label: 'Email to me', sub: 'Sent to sarah.chen@arcafx.com' },
                { key: 'email-list', label: 'Email to list', sub: 'Specify recipients below' },
              ].map(opt => (
                <div
                  key={opt.key}
                  onClick={() => setDelivery(opt.key)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 8, cursor: 'pointer', border: `1px solid ${delivery === opt.key ? 'var(--border-accent)' : 'var(--border)'}`, background: delivery === opt.key ? 'var(--accent-muted)' : 'var(--bg-2)' }}
                >
                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${delivery === opt.key ? 'var(--accent)' : 'var(--border-strong)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {delivery === opt.key && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{opt.label}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{opt.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Preview + Generate */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setPreview(v => !v)}>
                {showPreview ? 'Hide Preview' : 'Generate Preview (first 5 rows)'}
              </button>
              <button
                className="btn btn-primary"
                onClick={generate}
                disabled={generating}
              >
                {generating ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.7s linear infinite' }} />
                    Generating...
                  </span>
                ) : generated ? '✓ Report Ready — Download' : 'Generate Full Report'}
              </button>
            </div>

            {showPreview && (
              <div style={{ overflow: 'auto', borderRadius: 8, border: '1px solid var(--border)' }}>
                <table>
                  <thead>
                    <tr>{['Date','Client','Name','Country','Instrument','Side','Lots','P&L','Status'].map(h => <th key={h} style={{ fontSize: 9 }}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {PREVIEW_DATA.map((row, i) => (
                      <tr key={i}>
                        <td style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-data)' }}>{row.date}</td>
                        <td style={{ fontSize: 10, fontFamily: 'var(--font-data)', color: 'var(--accent)' }}>{row.client}</td>
                        <td style={{ fontSize: 11 }}>{row.name}</td>
                        <td style={{ fontSize: 12 }}>{row.country === 'GB' ? '🇬🇧' : row.country === 'SG' ? '🇸🇬' : row.country === 'AE' ? '🇦🇪' : row.country === 'AU' ? '🇦🇺' : row.country}</td>
                        <td style={{ fontSize: 11, fontFamily: 'var(--font-data)', fontWeight: 600 }}>{row.instrument}</td>
                        <td><span className={`pill ${row.side === 'BUY' ? 'pill-bull' : 'pill-bear'}`} style={{ fontSize: 9 }}>{row.side}</span></td>
                        <td className="mono">{row.lots}</td>
                        <td className="mono" style={{ color: row.pnl.startsWith('+') ? 'var(--bull)' : 'var(--bear)', fontWeight: 600 }}>{row.pnl}</td>
                        <td><span className="pill pill-muted" style={{ fontSize: 9 }}>{row.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)', fontSize: 10, color: 'var(--text-tertiary)' }}>
                  Showing 5 of ~{Math.floor(Math.random() * 200 + 100)} rows
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => step > 1 ? setStep(s => s - 1) : onBack()}>
            ← {step > 1 ? 'Back' : 'Cancel'}
          </button>
          {step < 6 && (
            <button className="btn btn-primary btn-sm" onClick={() => setStep(s => s + 1)} disabled={step === 1 && !reportType}>
              Next →
            </button>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── REPORT CATALOG ───────────────────────────────────────────────────────────
export default function ReportBuilder() {
  const [view, setView]     = useState('catalog');
  const [buildType, setBuild] = useState(null);
  const [schedTab, setSched]  = useState(false);

  if (view === 'build') return <ReportBuilderWizard initialType={buildType} onBack={() => { setView('catalog'); setBuild(null); }} />;

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <div style={{ padding: '20px 0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>
            {schedTab ? 'Scheduled Reports' : 'Report Catalog'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
            {schedTab ? `${SCHEDULED.length} active schedules` : `${REPORT_CATALOG.length} report types across 5 categories`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`btn ${!schedTab ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setSched(false)}>
            Report Catalog
          </button>
          <button className={`btn ${schedTab ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setSched(true)}>
            Scheduled Reports
          </button>
          {!schedTab && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setBuild(null); setView('build'); }}>
              Custom Build →
            </button>
          )}
        </div>
      </div>

      {!schedTab ? (
        <>
          {Object.entries(
            REPORT_CATALOG.reduce((acc, r) => { (acc[r.category] = acc[r.category] || []).push(r); return acc; }, {})
          ).map(([cat, reports]) => (
            <div key={cat} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: CATEGORY_COLORS[cat], marginBottom: 10 }}>
                {cat}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {reports.map(r => (
                  <div
                    key={r.id}
                    className="card"
                    style={{ padding: 14, cursor: 'pointer', transition: 'all 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = CATEGORY_COLORS[cat]}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                    onClick={() => { setBuild(r.id); setView('build'); }}
                  >
                    <div style={{ fontSize: 18, color: CATEGORY_COLORS[cat], marginBottom: 8 }}>{r.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.3 }}>{r.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)', lineHeight: 1.4, marginBottom: 12 }}>{r.desc}</div>
                    <button className="btn btn-ghost btn-xs" style={{ width: '100%', justifyContent: 'center', color: CATEGORY_COLORS[cat] }}>
                      Build Report →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      ) : (
        <>
          <div className="card">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>{['Name','Report Type','Frequency','Recipients','Next Run','Last Sent',''].map(h => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {SCHEDULED.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 500, fontSize: 12 }}>{s.name}</td>
                      <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        {REPORT_CATALOG.find(r => r.id === s.type)?.name || s.type}
                      </td>
                      <td><span className="pill pill-accent" style={{ fontSize: 10 }}>{s.freq}</span></td>
                      <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        {s.recipients.length === 1 ? s.recipients[0] : `${s.recipients[0]} +${s.recipients.length - 1}`}
                      </td>
                      <td style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'var(--font-data)' }}>{s.nextRun}</td>
                      <td style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-data)' }}>{s.lastSent}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-ghost btn-xs" onClick={() => alert(`Running: ${s.name}`)}>Run now</button>
                          <button className="btn btn-ghost btn-xs">Edit</button>
                          <button className="btn btn-danger btn-xs" style={{ fontSize: 9 }}>Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }}
            onClick={() => alert('Add schedule form')}>
            + Add Schedule
          </button>
        </>
      )}
    </div>
  );
}
