/**
 * @file bottom-tabs-panel.tsx
 * @module web-trading
 * @description Positions, pending, history, calendar, and news tabs (legacy parity).
 * @author BharatERP
 * @created 2026-04-03
 */

'use client';

import { useState } from 'react';
import { BookOpen, Calendar, Clock, Edit, Layers, Newspaper } from 'lucide-react';
import type { OpenPosition, PendingOrder } from '../lib/types';
import { fmt, pnlClass, pnlSign } from '../lib/format-utils';
import { ECONOMIC_CALENDAR, NEWS, PENDING_ORDERS, TRADE_HISTORY } from '../lib/mock-data';

function PositionsTable({ positions, onClose }: { positions: OpenPosition[]; onClose: (id: string) => void }) {
  const totalPnl = positions.reduce((s, p) => s + p.pnl, 0);
  return (
    <div className="bottom-content">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '6px 16px',
          background: 'var(--bg-elevated)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <span style={{ fontFamily: 'var(--font-data)', fontSize: '11px', color: 'var(--text-muted)' }}>
          {positions.length} positions · Total P&L:&nbsp;
          <span className={pnlClass(totalPnl)} style={{ fontWeight: 600 }}>
            {pnlSign(totalPnl)}${fmt(Math.abs(totalPnl))}
          </span>
        </span>
        <button
          type="button"
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 8px',
            borderRadius: '4px',
            background: 'var(--bear-dim)',
            border: '1px solid var(--bear-dim)',
            color: 'var(--bear)',
            fontSize: '10px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Close All
        </button>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Type</th>
            <th>Lots</th>
            <th>Open Price</th>
            <th>Current</th>
            <th>SL</th>
            <th>TP</th>
            <th>Swap</th>
            <th>P&L</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((p) => (
            <tr key={p.id}>
              <td className="td-symbol">{p.symbol}</td>
              <td>
                <span className={`td-badge ${p.type.toLowerCase()}`}>{p.type}</span>
              </td>
              <td>{p.lots.toFixed(2)}</td>
              <td>{p.openPrice}</td>
              <td style={{ color: 'var(--text-primary)' }}>{p.currentPrice}</td>
              <td style={{ color: 'var(--bear)' }}>{p.sl || '—'}</td>
              <td style={{ color: 'var(--bull)' }}>{p.tp || '—'}</td>
              <td style={{ color: 'var(--text-muted)' }}>{p.swap}</td>
              <td className={`td-pnl ${p.pnl >= 0 ? 'pos' : 'neg'}`}>
                {pnlSign(p.pnl)}${fmt(Math.abs(p.pnl))}
              </td>
              <td>
                <div className="td-actions">
                  <button type="button" className="td-action-btn" aria-label="Edit position">
                    <Edit size={10} />
                  </button>
                  <button type="button" className="td-action-btn close" onClick={() => onClose(p.id)}>
                    Close
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OrdersTable({ orders }: { orders: PendingOrder[] }) {
  return (
    <div className="bottom-content">
      <table className="data-table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Type</th>
            <th>Lots</th>
            <th>Price</th>
            <th>SL</th>
            <th>TP</th>
            <th>Expiry</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => {
            const isBuy = o.side === 'BUY';
            return (
              <tr key={o.id}>
                <td className="td-symbol">{o.symbol}</td>
                <td>
                  <span className={`td-badge ${isBuy ? 'buy' : 'sell'}`}>{o.type}</span>
                </td>
                <td>{Number(o.lots).toFixed(2)}</td>
                <td style={{ color: 'var(--text-primary)' }}>{o.price}</td>
                <td style={{ color: 'var(--bear)' }}>{o.sl}</td>
                <td style={{ color: 'var(--bull)' }}>{o.tp}</td>
                <td style={{ color: 'var(--text-muted)' }}>{o.expiry}</td>
                <td style={{ color: 'var(--text-muted)' }}>{o.created}</td>
                <td>
                  <div className="td-actions">
                    <button type="button" className="td-action-btn" aria-label="Edit order">
                      <Edit size={10} />
                    </button>
                    <button type="button" className="td-action-btn close">
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TradeHistoryTable() {
  const totalProfit = TRADE_HISTORY.filter((t) => t.pnl > 0).reduce((s, t) => s + t.pnl, 0);
  const totalLoss = TRADE_HISTORY.filter((t) => t.pnl < 0).reduce((s, t) => s + t.pnl, 0);
  const winRate = ((TRADE_HISTORY.filter((t) => t.pnl > 0).length / TRADE_HISTORY.length) * 100).toFixed(0);
  return (
    <div className="bottom-content">
      <div style={{ display: 'flex', gap: '1px', background: 'var(--border)', borderBottom: '1px solid var(--border)' }}>
        {[
          { label: 'Win Rate', value: `${winRate}%`, cls: 'bull' },
          { label: 'Gross Profit', value: `+$${fmt(totalProfit)}`, cls: 'bull' },
          { label: 'Gross Loss', value: `-$${fmt(Math.abs(totalLoss))}`, cls: 'bear' },
          { label: 'Net P&L', value: `+$${fmt(totalProfit + totalLoss)}`, cls: 'bull' },
          { label: 'Trades', value: String(TRADE_HISTORY.length) },
        ].map((s) => (
          <div key={s.label} style={{ background: 'var(--bg-elevated)', padding: '6px 16px', flex: 1 }}>
            <div
              style={{
                fontSize: '9px',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-data)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              {s.label}
            </div>
            <div style={{ fontFamily: 'var(--font-data)', fontSize: '13px', fontWeight: 600 }} className={s.cls}>
              {s.value}
            </div>
          </div>
        ))}
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Type</th>
            <th>Lots</th>
            <th>Open</th>
            <th>Close</th>
            <th>Open Time</th>
            <th>Close Time</th>
            <th>Duration</th>
            <th>P&L</th>
          </tr>
        </thead>
        <tbody>
          {TRADE_HISTORY.map((t) => (
            <tr key={t.id}>
              <td className="td-symbol">{t.symbol}</td>
              <td>
                <span className={`td-badge ${t.type.toLowerCase()}`}>{t.type}</span>
              </td>
              <td>{t.lots.toFixed(2)}</td>
              <td>{t.openPrice}</td>
              <td>{t.closePrice}</td>
              <td style={{ color: 'var(--text-muted)' }}>{t.openTime}</td>
              <td style={{ color: 'var(--text-muted)' }}>{t.closeTime}</td>
              <td style={{ color: 'var(--text-muted)' }}>{t.duration}</td>
              <td className={`td-pnl ${t.pnl >= 0 ? 'pos' : 'neg'}`}>
                {pnlSign(t.pnl)}${fmt(Math.abs(t.pnl))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EconomicCalendarPanel() {
  const [filter, setFilter] = useState<string>('all');
  const filtered = filter === 'all' ? ECONOMIC_CALENDAR : ECONOMIC_CALENDAR.filter((e) => e.impact === filter);
  return (
    <div className="bottom-content">
      <div
        style={{
          display: 'flex',
          gap: '6px',
          alignItems: 'center',
          padding: '6px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-elevated)',
        }}
      >
        <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-data)', letterSpacing: '0.04em' }}>
          FILTER:
        </span>
        {['all', 'high', 'medium', 'low'].map((f) => (
          <button key={f} type="button" className={`cat-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)} style={{ fontSize: '10px' }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-data)' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
        </span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '60px 28px 28px 1fr 80px 80px 80px',
          gap: '0 8px',
          padding: '4px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-elevated)',
        }}
      >
        {['Time', '', 'Impact', 'Event', 'Forecast', 'Previous', 'Actual'].map((h) => (
          <span
            key={h || 'flag'}
            style={{
              fontSize: '9px',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-data)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              textAlign: h === 'Forecast' || h === 'Previous' || h === 'Actual' ? 'right' : 'left',
            }}
          >
            {h}
          </span>
        ))}
      </div>
      {filtered.map((e) => (
        <div key={e.id} className="cal-item">
          <span className="cal-time">{e.time}</span>
          <span className="cal-flag">{e.flag}</span>
          <div className={`cal-impact ${e.impact}`} />
          <span className="cal-event">{e.event}</span>
          <span className="cal-val">{e.forecast ?? '—'}</span>
          <span className="cal-val">{e.previous ?? '—'}</span>
          <span
            className={`cal-val ${
              e.actual != null && e.forecast != null && !Number.isNaN(parseFloat(String(e.actual))) && !Number.isNaN(parseFloat(String(e.forecast)))
                ? parseFloat(String(e.actual)) > parseFloat(String(e.forecast))
                  ? 'actual-up'
                  : 'actual-down'
                : ''
            }`}
          >
            {e.actual ?? '—'}
          </span>
        </div>
      ))}
    </div>
  );
}

function NewsPanel() {
  return (
    <div className="bottom-content">
      {NEWS.map((n) => (
        <div key={n.id} className="news-item">
          <div className={`news-sentiment ${n.sentiment}`} />
          <div className="news-body">
            <div className="news-meta">
              <span className="news-source">{n.source}</span>
              <span className="news-time">{n.time}</span>
              <span className="news-symbol">{n.symbol}</span>
            </div>
            <span className="news-headline-text news-headline">{n.headline}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function BottomTabsPanel({
  positions,
  onClosePosition,
  pendingOrders,
}: {
  positions: OpenPosition[];
  onClosePosition: (id: string) => void;
  pendingOrders?: PendingOrder[];
}) {
  const [tab, setTab] = useState<string>('positions');
  const orders = pendingOrders ?? PENDING_ORDERS;

  const tabs = [
    { id: 'positions', label: 'Positions', icon: <Layers size={12} />, badge: positions.length },
    { id: 'orders', label: 'Orders', icon: <BookOpen size={12} />, badge: orders.length },
    { id: 'history', label: 'History', icon: <Clock size={12} />, badge: null as number | null },
    { id: 'calendar', label: 'Calendar', icon: <Calendar size={12} />, badge: ECONOMIC_CALENDAR.filter((e) => e.impact === 'high').length },
    { id: 'news', label: 'News', icon: <Newspaper size={12} />, badge: null as number | null },
  ];

  return (
    <div className="bottom-panel">
      <div className="bottom-tabs">
        {tabs.map((t) => (
          <button key={t.id} type="button" className={`bottom-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.icon} {t.label}
            {t.badge != null ? <span className="tab-badge">{t.badge}</span> : null}
          </button>
        ))}
      </div>

      {tab === 'positions' ? <PositionsTable positions={positions} onClose={onClosePosition} /> : null}
      {tab === 'orders' ? <OrdersTable orders={orders} /> : null}
      {tab === 'history' ? <TradeHistoryTable /> : null}
      {tab === 'calendar' ? <EconomicCalendarPanel /> : null}
      {tab === 'news' ? <NewsPanel /> : null}
    </div>
  );
}
