'use client';
import { useState, useMemo } from 'react';
import { clients, instruments } from '../../lib/mockData';
import { toast } from '../shared/Toast';

// Generate realistic order book from client data
function generateOrders() {
  const orders = [];
  const syms = instruments.slice(0, 8);
  let id = 1000;

  clients.forEach(client => {
    if (client.openPositions > 0) {
      for (let p = 0; p < client.openPositions; p++) {
        const inst = syms[p % syms.length];
        const side = Math.random() > 0.5 ? 'BUY' : 'SELL';
        const lots = +(0.1 + Math.random() * 4.9).toFixed(2);
        const basePrice = inst.symbol === 'EUR/USD' ? 1.0851 : inst.symbol === 'GBP/USD' ? 1.2704 : inst.symbol === 'XAUUSD' ? 2024 : inst.symbol === 'USD/JPY' ? 147.8 : inst.symbol === 'US30' ? 37920 : inst.symbol === 'BTC/USD' ? 43200 : inst.symbol === 'GER40' ? 16450 : 100;
        const openOffset = (Math.random() - 0.5) * basePrice * 0.004;
        const openPrice = +(basePrice + openOffset).toFixed(inst.symbol.includes('JPY') ? 3 : inst.symbol === 'US30' || inst.symbol === 'GER40' ? 1 : inst.symbol === 'XAUUSD' ? 2 : 5);
        const currentPrice = +(basePrice).toFixed(openPrice.toString().split('.')[1]?.length || 2);
        const priceDiff = side === 'BUY' ? currentPrice - openPrice : openPrice - currentPrice;
        const pointValue = inst.symbol.includes('JPY') ? 0.01 : inst.symbol === 'US30' || inst.symbol === 'GER40' ? 1 : inst.symbol === 'XAUUSD' ? 0.1 : 0.0001;
        const pnl = +((priceDiff / pointValue) * lots * 1).toFixed(2);
        const hoursAgo = Math.floor(Math.random() * 72);
        const openTime = new Date('2024-01-15T12:00:00');
        openTime.setHours(openTime.getHours() - hoursAgo);

        orders.push({
          id: `ORD${id++}`,
          clientId: client.id,
          clientName: client.name,
          accountType: client.type,
          symbol: inst.symbol,
          side,
          type: 'Market',
          lots,
          openPrice,
          currentPrice,
          pnl,
          sl: null,
          tp: null,
          openTime: openTime.toISOString().slice(0, 16).replace('T', ' '),
          duration: hoursAgo < 1 ? `${Math.floor(Math.random()*59)}m` : `${hoursAgo}h`,
          status: 'Open',
        });
      }
    }
  });

  // Add some pending orders
  clients.slice(0, 6).forEach(client => {
    const inst = syms[Math.floor(Math.random() * 4)];
    const basePrice = inst.symbol === 'EUR/USD' ? 1.0851 : inst.symbol === 'GBP/USD' ? 1.2704 : inst.symbol === 'XAUUSD' ? 2024 : 1.0;
    orders.push({
      id: `ORD${id++}`,
      clientId: client.id, clientName: client.name, accountType: client.type,
      symbol: inst.symbol, side: Math.random() > 0.5 ? 'BUY' : 'SELL',
      type: Math.random() > 0.5 ? 'Limit' : 'Stop',
      lots: +(0.1 + Math.random() * 2).toFixed(2),
      openPrice: +(basePrice * (1 + (Math.random() - 0.5) * 0.01)).toFixed(5),
      currentPrice: +basePrice.toFixed(5),
      pnl: 0, sl: null, tp: null,
      openTime: '2024-01-15 11:30',
      duration: '45m',
      status: 'Pending',
    });
  });

  // Historical closed orders
  for (let i = 0; i < 20; i++) {
    const client = clients[i % clients.length];
    const inst = syms[i % syms.length];
    const side = i % 2 === 0 ? 'BUY' : 'SELL';
    const lots = +(0.1 + Math.random() * 3).toFixed(2);
    const pnl = +((Math.random() - 0.42) * lots * 180).toFixed(2);
    const daysAgo = Math.floor(Math.random() * 7) + 1;
    const closeTime = new Date('2024-01-15');
    closeTime.setDate(closeTime.getDate() - daysAgo);
    orders.push({
      id: `ORD${id++}`,
      clientId: client.id, clientName: client.name, accountType: client.type,
      symbol: inst.symbol, side, type: 'Market',
      lots,
      openPrice: +(1.08 + Math.random() * 0.01).toFixed(5),
      closePrice: +(1.08 + Math.random() * 0.01).toFixed(5),
      pnl, sl: null, tp: null,
      openTime: closeTime.toISOString().slice(0, 16).replace('T', ' '),
      closeTime: closeTime.toISOString().slice(0, 16).replace('T', ' '),
      duration: `${Math.floor(Math.random() * 8) + 1}h`,
      status: 'Closed',
    });
  }

  return orders;
}

const ALL_ORDERS = generateOrders();

export default function OrderManagement() {
  const [tab, setTab]       = useState('open');
  const [selected, setSel]  = useState(new Set());
  const [filterSym, setFSym] = useState('');
  const [filterSide, setFSide] = useState('');
  const [sortCol, setSort]  = useState('pnl');
  const [sortDir, setSortDir] = useState('asc');

  const tabOrders = useMemo(() => {
    const statusMap = { open: 'Open', pending: 'Pending', history: 'Closed' };
    let list = ALL_ORDERS.filter(o => o.status === statusMap[tab]);
    if (filterSym)  list = list.filter(o => o.symbol === filterSym);
    if (filterSide) list = list.filter(o => o.side === filterSide);
    return [...list].sort((a, b) => {
      const va = a[sortCol] ?? 0, vb = b[sortCol] ?? 0;
      const cmp = typeof va === 'string' ? va.localeCompare(vb) : va - vb;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [tab, filterSym, filterSide, sortCol, sortDir]);

  const openOrders = ALL_ORDERS.filter(o => o.status === 'Open');
  const totalLots  = openOrders.reduce((s, o) => s + o.lots, 0).toFixed(1);
  const totalPnl   = openOrders.reduce((s, o) => s + o.pnl, 0).toFixed(0);
  const netLong    = openOrders.filter(o => o.side === 'BUY').reduce((s, o) => s + o.lots, 0);
  const netShort   = openOrders.filter(o => o.side === 'SELL').reduce((s, o) => s + o.lots, 0);

  const allSel = tabOrders.length > 0 && tabOrders.every(o => selected.has(o.id));

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSort(col); setSortDir('asc'); }
  };

  const SortTh = ({ col, children }) => (
    <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort(col)}
      className={sortCol === col ? 'sorted' : ''}>
      {children}
      <span style={{ marginLeft: 3, fontSize: 9, color: sortCol === col ? 'var(--accent)' : 'rgba(255,255,255,0.2)' }}>
        {sortCol === col ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    </th>
  );

  return (
    <div style={{ padding: '0 24px 24px' }}>
      {/* Header */}
      <div style={{ padding: '20px 0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>Order Management</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
            All-client order book · Read + close access
          </div>
        </div>
        <button className="btn btn-ghost btn-sm">Export CSV</button>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          ['Open Orders',   openOrders.length,            'var(--accent)'],
          ['Total Lots',    totalLots + ' lots',           'var(--text-primary)'],
          ['Long Lots',     netLong.toFixed(1),            'var(--bull)'],
          ['Short Lots',    netShort.toFixed(1),           'var(--bear)'],
          ['Net Position',  `${netLong > netShort ? '+' : ''}${(netLong - netShort).toFixed(1)} lots`, netLong >= netShort ? 'var(--bull)' : 'var(--bear)'],
          ['Total Float P&L', `${+totalPnl >= 0 ? '+' : ''}$${Math.abs(totalPnl).toLocaleString()}`, +totalPnl >= 0 ? 'var(--bull)' : 'var(--bear)'],
        ].map(([label, val, color]) => (
          <div key={label} style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-tertiary)', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 16, fontFamily: 'var(--font-data)', fontWeight: 700, color }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Tabs + filters */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
        <div className="tabs" style={{ padding: 0 }}>
          {[
            { key: 'open',    label: 'Open Orders' },
            { key: 'pending', label: 'Pending' },
            { key: 'history', label: 'History' },
          ].map(t => {
            const count = ALL_ORDERS.filter(o => o.status === { open: 'Open', pending: 'Pending', history: 'Closed' }[t.key]).length;
            return (
              <button key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
                {t.label}<span className="tab-count">{count}</span>
              </button>
            );
          })}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <select className="select" style={{ width: 130 }} value={filterSym} onChange={e => setFSym(e.target.value)}>
            <option value="">All symbols</option>
            {[...new Set(ALL_ORDERS.map(o => o.symbol))].map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="select" style={{ width: 100 }} value={filterSide} onChange={e => setFSide(e.target.value)}>
            <option value="">Both sides</option>
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
          </select>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: 'var(--bear-muted)', border: '1px solid var(--bear-dim)', borderRadius: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--bear)', fontWeight: 600 }}>{selected.size} orders selected</span>
          <button className="btn btn-danger btn-sm" onClick={() => {
            toast.success(`${selected.size} orders closed`);
            setSel(new Set());
          }}>
            Close Selected ({selected.size})
          </button>
          <button className="btn btn-ghost btn-xs" onClick={() => setSel(new Set())}>Clear</button>
        </div>
      )}

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input type="checkbox" checked={allSel}
                    onChange={() => allSel ? setSel(new Set()) : setSel(new Set(tabOrders.map(o => o.id)))} />
                </th>
                <th style={{ width: 80 }}>Order ID</th>
                <SortTh col="clientName">Client</SortTh>
                <SortTh col="symbol">Symbol</SortTh>
                <th>Side</th>
                <th>Type</th>
                <SortTh col="lots">Lots</SortTh>
                <SortTh col="openPrice">Open Price</SortTh>
                {tab === 'history'
                  ? <SortTh col="closePrice">Close Price</SortTh>
                  : <th>Current</th>}
                <SortTh col="pnl">P&L</SortTh>
                <th>Duration</th>
                {tab !== 'history' && <th></th>}
              </tr>
            </thead>
            <tbody>
              {tabOrders.length === 0 ? (
                <tr><td colSpan={12}>
                  <div className="empty-state">
                    <div className="empty-state__icon">◻</div>
                    <div className="empty-state__title">No {tab} orders</div>
                  </div>
                </td></tr>
              ) : tabOrders.map(order => (
                <tr key={order.id} className={selected.has(order.id) ? 'selected' : ''}>
                  <td><input type="checkbox" checked={selected.has(order.id)}
                    onChange={() => setSel(s => { const n = new Set(s); n.has(order.id) ? n.delete(order.id) : n.add(order.id); return n; })} /></td>
                  <td style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--text-tertiary)' }}>{order.id}</td>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: 12 }}>{order.clientName}</div>
                    <div style={{ fontSize: 9, color: 'var(--text-tertiary)', fontFamily: 'var(--font-data)' }}>{order.clientId}</div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-data)', fontWeight: 700, fontSize: 12 }}>{order.symbol}</td>
                  <td><span className={`pill ${order.side === 'BUY' ? 'pill-bull' : 'pill-bear'}`} style={{ fontSize: 10 }}>{order.side}</span></td>
                  <td><span className="pill pill-muted" style={{ fontSize: 10 }}>{order.type}</span></td>
                  <td className="mono">{order.lots}</td>
                  <td className="mono">{order.openPrice}</td>
                  <td className="mono" style={{ color: 'var(--text-secondary)' }}>
                    {tab === 'history' ? order.closePrice || '—' : order.currentPrice}
                  </td>
                  <td className="mono" style={{ fontWeight: 700, color: +order.pnl >= 0 ? 'var(--bull)' : 'var(--bear)' }}>
                    {tab === 'pending' ? '—' : `${+order.pnl >= 0 ? '+' : ''}$${order.pnl}`}
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-data)' }}>{order.duration}</td>
                  {tab !== 'history' && (
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-danger btn-xs" onClick={() => {
                          toast.warn(`Closed: ${order.symbol} ${order.lots} lots`);
                        }}>Close</button>
                        <button className="btn btn-ghost btn-xs">Modify</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text-tertiary)' }}>
          Showing {tabOrders.length} orders
          {filterSym && ` · Filtered: ${filterSym}`}
          {filterSide && ` · ${filterSide} only`}
        </div>
      </div>
    </div>
  );
}
