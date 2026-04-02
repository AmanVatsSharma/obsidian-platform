'use client';
import { useState, useMemo, useCallback } from 'react';
import { clients as allClients } from '../../lib/mockData';
import ClientDrawer from './ClientDrawer';

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt = (n) => n == null ? '—' : `$${Number(n).toLocaleString()}`;
const fmtPct = (n) => n == null ? '—' : `${n.toFixed(0)}%`;

function avatarBg(name = '') {
  const colors = ['#3B82F6','#10D996','#F59E0B','#8B5CF6','#EC4899','#06B6D4','#EF4444','#84CC16'];
  let h = 0;
  for (const c of name) h = ((h << 5) - h) + c.charCodeAt(0);
  return colors[Math.abs(h) % colors.length];
}

function KYCBadge({ status }) {
  const map = {
    Verified: { cls: 'pill-verified', icon: '✓' },
    Pending:  { cls: 'pill-pending',  icon: '⏳' },
    Rejected: { cls: 'pill-rejected', icon: '✗' },
    Expired:  { cls: 'pill-expired',  icon: '⚠' },
  };
  const { cls, icon } = map[status] || { cls: 'pill-muted', icon: '?' };
  return <span className={`pill ${cls}`}>{icon} {status}</span>;
}

function StatusPill({ status }) {
  const map = {
    Active:    'pill-active',
    Dormant:   'pill-dormant',
    Pending:   'pill-pending',
    Suspended: 'pill-suspended',
    Closed:    'pill-muted',
  };
  return <span className={`pill ${map[status] || 'pill-muted'}`}>{status}</span>;
}

function MarginCell({ pct }) {
  if (pct == null) return <span style={{ color: 'var(--text-tertiary)' }}>—</span>;
  const color = pct < 50 ? 'var(--bear)' : pct < 100 ? 'var(--warn)' : 'var(--bull)';
  const fill = Math.min(100, 100 - Math.min(100, 100 / (pct / 100)));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 40, height: 4, background: 'var(--bg-4)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(100, (pct / 1000) * 100)}%`, height: '100%', background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 11, fontFamily: 'var(--font-data)', color, minWidth: 36 }}>{fmtPct(pct)}</span>
    </div>
  );
}

// ─── FILTER PANEL ─────────────────────────────────────────────────────────────
function FilterPanel({ filters, onChange, onClear }) {
  return (
    <div style={{
      background: 'var(--bg-2)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: 16, marginBottom: 12,
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
    }}>
      {/* Status */}
      <div className="form-group" style={{ margin: 0 }}>
        <label className="label">Status</label>
        <select className="select" value={filters.status} onChange={e => onChange('status', e.target.value)}>
          <option value="">All</option>
          {['Active','Dormant','Suspended','Pending','Closed'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      {/* KYC */}
      <div className="form-group" style={{ margin: 0 }}>
        <label className="label">KYC Status</label>
        <select className="select" value={filters.kyc} onChange={e => onChange('kyc', e.target.value)}>
          <option value="">All</option>
          {['Verified','Pending','Rejected','Expired'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      {/* Account type */}
      <div className="form-group" style={{ margin: 0 }}>
        <label className="label">Account Type</label>
        <select className="select" value={filters.type} onChange={e => onChange('type', e.target.value)}>
          <option value="">All</option>
          {['Retail','Pro','VIP','Internal'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      {/* Country */}
      <div className="form-group" style={{ margin: 0 }}>
        <label className="label">Country</label>
        <select className="select" value={filters.country} onChange={e => onChange('country', e.target.value)}>
          <option value="">All Countries</option>
          {['GB','AE','DE','AU','SG','ZA'].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      {/* Balance range */}
      <div className="form-group" style={{ margin: 0 }}>
        <label className="label">Min Balance ($)</label>
        <input className="input" type="number" placeholder="0" value={filters.minBalance}
          onChange={e => onChange('minBalance', e.target.value)} />
      </div>
      <div className="form-group" style={{ margin: 0 }}>
        <label className="label">Max Balance ($)</label>
        <input className="input" type="number" placeholder="∞" value={filters.maxBalance}
          onChange={e => onChange('maxBalance', e.target.value)} />
      </div>
      {/* Last login */}
      <div className="form-group" style={{ margin: 0 }}>
        <label className="label">Last Login</label>
        <select className="select" value={filters.lastLogin} onChange={e => onChange('lastLogin', e.target.value)}>
          <option value="">Any time</option>
          <option value="24h">Within 24h</option>
          <option value="7d">Within 7 days</option>
          <option value="30d">Within 30 days</option>
          <option value="90d">Within 90 days</option>
          <option value="never">Never logged in</option>
        </select>
      </div>
      {/* Open positions */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 4 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={filters.hasPositions === 'yes'}
              onChange={e => onChange('hasPositions', e.target.checked ? 'yes' : '')} />
            Has open positions
          </label>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onClear}>Clear filters</button>
      </div>
    </div>
  );
}

// ─── BULK ACTION BAR ──────────────────────────────────────────────────────────
function BulkActionBar({ count, onBulk, onClear }) {
  if (count === 0) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 16px', background: 'var(--accent-muted)',
      border: '1px solid var(--border-accent)', borderRadius: 'var(--radius-md)',
      marginBottom: 10,
    }}>
      <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
        {count} client{count !== 1 ? 's' : ''} selected
      </span>
      <div style={{ width: 1, height: 16, background: 'var(--border-accent)' }} />
      {[
        ['Send Email', '📧'],
        ['Change Group', '◈'],
        ['Apply Bonus', '💰'],
        ['Export CSV', '⬇'],
        ['Assign to IB', '◈'],
        ['Suspend', '🔒'],
      ].map(([label, icon]) => (
        <button key={label} className="btn btn-ghost btn-xs" onClick={() => onBulk(label)}
          style={{ fontSize: 11 }}>
          {icon} {label}
        </button>
      ))}
      <button className="btn btn-ghost btn-xs" style={{ marginLeft: 'auto', color: 'var(--text-secondary)' }} onClick={onClear}>
        ✕ Clear
      </button>
    </div>
  );
}

// ─── SORT ICON ─────────────────────────────────────────────────────────────────
function SortIcon({ col, sortCol, sortDir }) {
  if (col !== sortCol) return <span style={{ opacity: 0.2, marginLeft: 3, fontSize: 9 }}>↕</span>;
  return <span style={{ marginLeft: 3, fontSize: 9, color: 'var(--accent)' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>;
}

// ─── CLIENT LIST ──────────────────────────────────────────────────────────────
const COLS = [
  { key: 'name',       label: 'Client',        w: 180, sortable: true },
  { key: 'country',    label: 'Country',        w: 60,  sortable: true },
  { key: 'kyc',        label: 'KYC',            w: 100, sortable: true },
  { key: 'type',       label: 'Type',           w: 70,  sortable: true },
  { key: 'balance',    label: 'Balance',        w: 100, sortable: true },
  { key: 'equity',     label: 'Equity',         w: 100, sortable: true },
  { key: 'marginPct',  label: 'Margin %',       w: 120, sortable: true },
  { key: 'floatPnl',   label: 'Float P&L',      w: 90,  sortable: true },
  { key: 'openPositions', label: 'Positions',   w: 70,  sortable: true },
  { key: 'volumeMTD',  label: 'Vol MTD',        w: 80,  sortable: true },
  { key: 'regDate',    label: 'Reg. Date',      w: 90,  sortable: true },
  { key: 'lastLogin',  label: 'Last Login',     w: 130, sortable: true },
  { key: 'status',     label: 'Status',         w: 90,  sortable: true },
  { key: 'actions',    label: '',               w: 80,  sortable: false },
];

const PAGE_SIZES = [25, 50, 100];

export default function ClientList() {
  const [search, setSearch]             = useState('');
  const [showFilters, setShowFilters]   = useState(false);
  const [filters, setFilters]           = useState({ status:'', kyc:'', type:'', country:'', minBalance:'', maxBalance:'', lastLogin:'', hasPositions:'' });
  const [sortCol, setSortCol]           = useState('name');
  const [sortDir, setSortDir]           = useState('asc');
  const [pageSize, setPageSize]         = useState(25);
  const [page, setPage]                 = useState(1);
  const [selected, setSelected]         = useState(new Set());
  const [activeClient, setActiveClient] = useState(null);
  const [drawerOpen, setDrawerOpen]     = useState(false);

  const handleFilter = useCallback((key, val) => {
    setFilters(f => ({ ...f, [key]: val }));
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ status:'', kyc:'', type:'', country:'', minBalance:'', maxBalance:'', lastLogin:'', hasPositions:'' });
    setPage(1);
  }, []);

  // Filter + search + sort
  const filtered = useMemo(() => {
    let list = allClients;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.phone?.includes(q)
      );
    }
    if (filters.status)      list = list.filter(c => c.status === filters.status);
    if (filters.kyc)         list = list.filter(c => c.kyc === filters.kyc);
    if (filters.type)        list = list.filter(c => c.type === filters.type);
    if (filters.country)     list = list.filter(c => c.country === filters.country);
    if (filters.minBalance)  list = list.filter(c => c.balance >= +filters.minBalance);
    if (filters.maxBalance)  list = list.filter(c => c.balance <= +filters.maxBalance);
    if (filters.hasPositions === 'yes') list = list.filter(c => c.openPositions > 0);

    // sort
    list = [...list].sort((a, b) => {
      const va = a[sortCol] ?? 0, vb = b[sortCol] ?? 0;
      const cmp = typeof va === 'string' ? va.localeCompare(vb) : va - vb;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [search, filters, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const allSelected = paged.length > 0 && paged.every(c => selected.has(c.id));

  const toggleSort = (col) => {
    if (!COLS.find(c => c.key === col)?.sortable) return;
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const toggleRow = (id) => {
    setSelected(s => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelected(s => { const n = new Set(s); paged.forEach(c => n.delete(c.id)); return n; });
    } else {
      setSelected(s => { const n = new Set(s); paged.forEach(c => n.add(c.id)); return n; });
    }
  };

  const openDrawer = (client) => {
    setActiveClient(client);
    setDrawerOpen(true);
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <div style={{ padding: '0 24px 24px' }}>
      {/* Header */}
      <div style={{ padding: '20px 0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>All Clients</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
            {filtered.length.toLocaleString()} clients · {allClients.filter(c => c.status === 'Active').length} active
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1 1h9v2L6 6v4l-1 .5-2-1.5V6L1 3V1z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/></svg>
            Import CSV
          </button>
          <button className="btn btn-primary btn-sm">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
            Add Client
          </button>
        </div>
      </div>

      {/* Search + Filter toolbar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
        <div className="input-group" style={{ flex: 1, maxWidth: 360 }}>
          <svg className="input-icon" width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.2"/><line x1="8" y1="8" x2="11" y2="11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
          <input
            className="input input-search"
            placeholder="Search by name, email, ID, phone..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <button
          className={`btn ${showFilters ? 'btn-primary' : 'btn-ghost'} btn-sm`}
          onClick={() => setShowFilters(v => !v)}
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1 2h9M3 5h5M5 8h1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
          Filters
          {activeFiltersCount > 0 && (
            <span style={{ background: 'var(--accent)', color: 'white', fontSize: 9, padding: '0 4px', borderRadius: 8, fontWeight: 700 }}>
              {activeFiltersCount}
            </span>
          )}
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Show:</span>
          {PAGE_SIZES.map(s => (
            <button key={s} className={`chart-tab ${pageSize === s ? 'active' : ''}`}
              style={{ fontSize: 11, padding: '3px 10px' }}
              onClick={() => { setPageSize(s); setPage(1); }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {showFilters && (
        <FilterPanel filters={filters} onChange={handleFilter} onClear={clearFilters} />
      )}

      <BulkActionBar
        count={selected.size}
        onBulk={(action) => alert(`Bulk action: ${action} on ${selected.size} clients`)}
        onClear={() => setSelected(new Set())}
      />

      {/* Table */}
      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ width: 36, padding: '9px 12px' }}>
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                </th>
                <th style={{ width: 40 }}>#</th>
                {COLS.map(col => (
                  <th
                    key={col.key}
                    style={{ width: col.w, cursor: col.sortable ? 'pointer' : 'default' }}
                    className={sortCol === col.key ? 'sorted' : ''}
                    onClick={() => toggleSort(col.key)}
                  >
                    {col.label}
                    {col.sortable && <SortIcon col={col.key} sortCol={sortCol} sortDir={sortDir} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={COLS.length + 2} style={{ padding: 0 }}>
                    <div className="empty-state">
                      <div className="empty-state__icon">◻</div>
                      <div className="empty-state__title">No clients match your filters</div>
                      <div className="empty-state__sub">Try adjusting your search or clearing filters</div>
                      <button className="btn btn-ghost btn-sm" onClick={clearFilters}>Clear filters</button>
                    </div>
                  </td>
                </tr>
              ) : paged.map((client, i) => (
                <tr
                  key={client.id}
                  className={selected.has(client.id) ? 'selected' : ''}
                  style={{ cursor: 'pointer' }}
                  onClick={() => openDrawer(client)}
                >
                  <td onClick={e => { e.stopPropagation(); toggleRow(client.id); }}>
                    <input type="checkbox" checked={selected.has(client.id)} readOnly />
                  </td>
                  <td style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>
                    {(page - 1) * pageSize + i + 1}
                  </td>

                  {/* Name + avatar */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="avatar-sm" style={{ background: avatarBg(client.name) }}>
                        {client.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{client.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-data)' }}>{client.id}</div>
                      </div>
                      {client.amlStatus === 'Flagged' && (
                        <span title="AML Flagged" style={{ fontSize: 10, color: 'var(--bear)' }}>⚑</span>
                      )}
                    </div>
                  </td>

                  {/* Country */}
                  <td>
                    <span title={client.country} style={{ fontSize: 16 }}>{client.flag}</span>
                  </td>

                  {/* KYC */}
                  <td><KYCBadge status={client.kyc} /></td>

                  {/* Type */}
                  <td>
                    <span className={`pill ${client.type === 'VIP' ? 'pill-warn' : client.type === 'Pro' ? 'pill-accent' : 'pill-muted'}`}>
                      {client.type}
                    </span>
                  </td>

                  {/* Balance */}
                  <td className="mono">{fmt(client.balance)}</td>

                  {/* Equity */}
                  <td className="mono">{fmt(client.equity)}</td>

                  {/* Margin % */}
                  <td><MarginCell pct={client.marginPct} /></td>

                  {/* Float P&L */}
                  <td className="mono" style={{ color: client.floatPnl >= 0 ? 'var(--bull)' : 'var(--bear)' }}>
                    {client.floatPnl >= 0 ? '+' : ''}{fmt(client.floatPnl)}
                  </td>

                  {/* Open positions */}
                  <td className="mono" style={{ color: client.openPositions > 0 ? 'var(--accent)' : 'var(--text-tertiary)' }}>
                    {client.openPositions}
                  </td>

                  {/* Volume MTD */}
                  <td className="mono" style={{ color: 'var(--text-secondary)' }}>
                    {client.volumeMTD > 0 ? `${client.volumeMTD} lots` : '—'}
                  </td>

                  {/* Reg date */}
                  <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    {client.regDate}
                  </td>

                  {/* Last login */}
                  <td style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-data)' }}>
                    {client.lastLogin}
                  </td>

                  {/* Status */}
                  <td><StatusPill status={client.status} /></td>

                  {/* Actions */}
                  <td onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-xs" onClick={() => openDrawer(client)}>View</button>
                      <button className="icon-btn" style={{ width: 24, height: 24 }} title="More actions">
                        <span style={{ fontSize: 14, letterSpacing: 2 }}>⋮</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px', borderTop: '1px solid var(--border)',
        }}>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
            Showing {Math.min((page-1)*pageSize+1, filtered.length)}–{Math.min(page*pageSize, filtered.length)} of {filtered.length}
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn btn-ghost btn-xs" disabled={page === 1} onClick={() => setPage(1)}>«</button>
            <button className="btn btn-ghost btn-xs" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let p;
              if (totalPages <= 5) p = i + 1;
              else if (page <= 3) p = i + 1;
              else if (page >= totalPages - 2) p = totalPages - 4 + i;
              else p = page - 2 + i;
              return (
                <button
                  key={p}
                  className={`btn btn-xs ${page === p ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setPage(p)}
                  style={{ minWidth: 28 }}
                >
                  {p}
                </button>
              );
            })}
            <button className="btn btn-ghost btn-xs" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
            <button className="btn btn-ghost btn-xs" disabled={page === totalPages} onClick={() => setPage(totalPages)}>»</button>
          </div>
        </div>
      </div>

      {/* Drawer */}
      <ClientDrawer
        client={activeClient}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
