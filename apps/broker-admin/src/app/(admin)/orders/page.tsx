/**
 * File:        apps/broker-admin/src/app/(admin)/orders/page.tsx
 * Module:      broker-admin · Trading · Order Management
 * Purpose:     Order book view with status filtering, side badge color, and cancel action
 *
 * Exports:
 *   - default (OrdersPage) — sortable, filterable order table
 *
 * Depends on:
 *   - @/lib/api/hooks/use-orders — useOrdersApi() for real API data
 *   - @/lib/types — Order, OrderStatus
 *
 * Side-effects:
 *   - Local state copy; cancel action marks order as Cancelled locally
 *
 * Key invariants:
 *   - Buy = bull green, Sell = bear red — always
 *   - Open P&L only shown on Open orders (requires currentPrice and openPrice)
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useOrdersApi } from '@/lib/api/hooks/use-orders';
import type { Order, OrderStatus, OrderRole, OrderType } from '@/lib/types';

const STATUS_BADGE: Record<string, string> = {
  Open:            'status-active',
  Pending:         'status-pending',
  Filled:          'badge badge-accent',
  Cancelled:       'badge badge-muted',
  Rejected:        'status-suspended',
  Expired:         'badge badge-muted',
  PARTIALLY_FILLED: 'status-warning',
};

const STATUS_TABS: { label: string; filter: (o: Order) => boolean }[] = [
  { label: 'Open',      filter: o => o.status === 'Open' },
  { label: 'Pending',   filter: o => o.status === 'Pending' },
  { label: 'Filled',    filter: o => o.status === 'Filled' },
  { label: 'Cancelled', filter: o => o.status === 'Cancelled' || o.status === 'Expired' || o.status === 'Rejected' },
  { label: 'All',       filter: () => true },
];

const ORDER_TYPE_TABS: { label: string; filter: (o: Order) => boolean }[] = [
  { label: 'All Types',    filter: () => true },
  { label: 'Bracket',      filter: o => o.type === 'BRACKET' || o.orderRole === 'PRIMARY' },
  { label: 'GTT',          filter: o => o.type === 'GTT' },
  { label: 'Trailing',     filter: o => o.type === 'TRAILING_STOP' },
  { label: 'TWAP',         filter: o => o.type === 'TWAP' },
  { label: 'VWAP',         filter: o => o.type === 'VWAP' },
  { label: 'Iceberg',      filter: o => o.type === 'ICEBERG' },
  { label: 'Liquidation',  filter: o => o.externalRefId?.startsWith('liq:') ?? false },
] as const;

// ── PARENT / CHILD FILTER ─────────────────────────────────────────────────────

const PARENT_FILTER_TABS: { label: string; filter: (o: Order) => boolean }[] = [
  { label: 'All',       filter: () => true },
  { label: 'Parents',   filter: o => !o.parentOrderId },          // only top-level bracket parents
  { label: 'Children',  filter: o => Boolean(o.parentOrderId) },  // only bracket child orders
];

const ORDER_ROLE_BADGE: Record<string, string> = {
  PRIMARY:     'bg-obsidian-accent/10 text-obsidian-accent',
  TAKE_PROFIT:  'bg-[var(--bull)]/10 text-[var(--bull)]',
  STOP_LOSS:    'bg-[var(--bear)]/10 text-[var(--bear)]',
};

export default function OrdersPage() {
  const { orders: apiOrders, cancelOrder } = useOrdersApi();
  const [orders, setOrders] = useState<Order[]>([...apiOrders]);
  const [statusTab, setStatusTab] = useState('Open');
  const [typeTab, setTypeTab] = useState<string>('All Types');
  const [parentTab, setParentTab] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => { setOrders(apiOrders); }, [apiOrders]);

  const statusFilter = STATUS_TABS.find(t => t.label === statusTab)!.filter;
  const typeFilter = useMemo(
    () => ORDER_TYPE_TABS.find(t => t.label === typeTab)!.filter,
    [typeTab],
  );
  const parentFilter = useMemo(
    () => PARENT_FILTER_TABS.find(t => t.label === parentTab)!.filter,
    [parentTab],
  );
  const displayed = useMemo(() =>
    orders.filter(o =>
      statusFilter(o) && typeFilter(o) && parentFilter(o) &&
      (!search || o.clientName.toLowerCase().includes(search.toLowerCase()) || o.symbol.toLowerCase().includes(search.toLowerCase()))
    ), [orders, statusTab, typeTab, search, statusFilter, typeFilter, parentFilter]
  );

  const pnl = (o: Order): number | null => {
    if (o.status !== 'Open' || !o.currentPrice) return null;
    const diff = o.side === 'Buy' ? o.currentPrice - o.openPrice : o.openPrice - o.currentPrice;
    return diff * o.lots * 100_000 - o.commission - o.swap;
  };

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const isBracketParent = (o: Order) => o.type === 'BRACKET' || o.orderRole === 'PRIMARY';
  const isBracketChild = (o: Order) => o.orderRole === 'TAKE_PROFIT' || o.orderRole === 'STOP_LOSS';
  const algoLabel = (o: Order) => o.algoMeta ? `${o.algoMeta.completedSlices}/${o.algoMeta.totalSlices}` : undefined;

  return (
    <div className="flex flex-col">
      <div className="module-header">
        <div>
          <p className="module-title">Order Management</p>
          <p className="module-subtitle">
            {orders.filter(o => o.status === 'Open').length} open ·{' '}
            {orders.filter(o => o.status === 'Pending').length} pending
          </p>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="flex flex-col gap-3">
          <div className="chart-tabs">
            {STATUS_TABS.map(t => {
              const cnt = orders.filter(t.filter).length;
              return (
                <button key={t.label} className={`chart-tab ${statusTab === t.label ? 'active' : ''}`} onClick={() => setStatusTab(t.label)}>
                  {t.label}
                  <span className="ml-1 font-mono text-[9px] text-fg3">{cnt}</span>
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-fg3 font-semibold mr-1">Type</span>
            {ORDER_TYPE_TABS.map(t => {
              const cnt = orders.filter(t.filter).length;
              return (
                <button key={t.label} className={`chip-filter ${typeTab === t.label ? 'chip-active' : ''}`} onClick={() => setTypeTab(t.label)}>
                  {t.label}
                  <span className="ml-1 font-mono text-[9px] text-fg3">{cnt}</span>
                </button>
              );
            })}
          </div>
          {/* Parent / Child filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-fg3 font-semibold mr-1">Parent</span>
            {PARENT_FILTER_TABS.map(t => {
              const cnt = orders.filter(t.filter).length;
              return (
                <button key={t.label} className={`chip-filter ${parentTab === t.label ? 'chip-active' : ''}`} onClick={() => setParentTab(t.label)}>
                  {t.label}
                  <span className="ml-1 font-mono text-[9px] text-fg3">{cnt}</span>
                </button>
              );
            })}
          </div>
        </div>
        <input className="input ml-auto w-52" placeholder="Search client or symbol..." value={search} onChange={e => setSearch(e.target.value)} />

        <div className="card overflow-x-auto">
          <table className="data-table" style={{ minWidth: 1000 }}>
            <thead>
              <tr>
                <th style={{ width: 24 }}></th>
                <th>Order ID</th>
                <th>Client</th>
                <th>Symbol</th>
                <th>Type</th>
                <th>Role</th>
                <th>Side</th>
                <th>Lots</th>
                <th>Open Price</th>
                <th>Current / Close</th>
                <th>SL</th>
                <th>TP</th>
                <th>Algo</th>
                <th>Float P&amp;L</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 ? (
                <tr>
                  <td colSpan={16} className="py-12 text-center text-[12px] text-fg3">
                    No {statusTab.toLowerCase()} orders
                  </td>
                </tr>
              ) : displayed.map(o => {
                const floatPnl = pnl(o);
                const isParent = isBracketParent(o);
                const isChild = isBracketChild(o);
                const isExpanded = expanded.has(o.id);
                const algo = algoLabel(o);

                return (
                  <tr key={o.id} className={isChild ? 'border-l border-fg3/20 pl-4' : ''}>
                    <td>
                      {isParent && (
                        <button className="btn-ghost btn btn-xs p-0.5" onClick={() => toggleExpand(o.id)}>
                          <span className={`text-[10px] transition-transform ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
                        </button>
                      )}
                    </td>
                    <td className="mono-cell text-[11px] text-fg3">{o.id}</td>
                    <td>
                      <p className="text-[12px] font-medium text-fg1">{o.clientName}</p>
                      <p className="mono-cell text-[10px] text-fg3">{o.clientId}</p>
                    </td>
                    <td className="mono-cell font-bold text-[13px]">{o.symbol}</td>
                    <td className="text-[11px] text-fg2">{o.type}</td>
                    <td>
                      {o.orderRole ? (
                        <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold ${ORDER_ROLE_BADGE[o.orderRole] ?? 'bg-fg3/10 text-fg3'}`}>
                          {o.orderRole}
                        </span>
                      ) : <span className="text-fg3">—</span>}
                    </td>
                    <td>
                      <span className={`badge ${o.side === 'Buy' ? 'badge-bull' : 'badge-bear'}`}>{o.side}</span>
                    </td>
                    <td className="mono-cell text-[12px] text-fg1">{o.lots}</td>
                    <td className="mono-cell text-[12px] text-fg2">{o.openPrice.toFixed(5)}</td>
                    <td className="mono-cell text-[12px] text-fg1">
                      {o.status === 'Open' && o.currentPrice ? o.currentPrice.toFixed(5) : o.closePrice ? o.closePrice.toFixed(5) : '—'}
                    </td>
                    <td className="mono-cell text-[11px] text-bear">{o.sl ? o.sl.toFixed(5) : '—'}</td>
                    <td className="mono-cell text-[11px] text-bull">{o.tp ? o.tp.toFixed(5) : '—'}</td>
                    <td className="mono-cell text-[11px] text-fg2">{algo ?? '—'}</td>
                    <td>
                      {floatPnl !== null ? (
                        <span className={`mono-cell font-bold text-[12px] ${floatPnl >= 0 ? 'text-bull' : 'text-bear'}`}>
                          {floatPnl >= 0 ? '+' : ''}${floatPnl.toFixed(2)}
                        </span>
                      ) : <span className="text-[11px] text-fg3">—</span>}
                    </td>
                    <td><span className={STATUS_BADGE[o.status] ?? 'badge badge-muted'}>{o.status}</span></td>
                    <td>
                      {(o.status === 'Open' || o.status === 'Pending') && (
                        <button className="btn-danger btn btn-xs" onClick={() => cancelOrder(o.id)}>Cancel</button>
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
