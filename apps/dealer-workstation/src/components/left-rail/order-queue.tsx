/**
 * File:        apps/dealer-workstation/src/components/left-rail/order-queue.tsx
 * Module:      dealer-workstation · Left Rail
 * Purpose:     Scrollable pending order queue with bulk action bar (Accept All / Reject All /
 *              Requote All) and a recently processed orders strip at the bottom.
 *
 * Exports:
 *   - OrderQueue() — full order queue panel (takes top ~65% of left rail)
 *
 * Side-effects: none
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

'use client';

import { useDeskData } from '../../lib/mock-data-context';
import { OrderCard } from './order-card';

export function OrderQueue() {
  const {
    pendingOrders, processedOrders,
    acceptOrder, rejectOrder, requoteOrder,
    focusedOrderIdx, setFocusedOrderIdx,
  } = useDeskData();

  const urgentCount = pendingOrders.filter(o => o.age >= 4).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minHeight: 0, height: '65%' }}>
      {/* Section header */}
      <div className="rail-header">
        <div className="rail-title">
          ORDER QUEUE
          <span className={urgentCount > 0 ? 'count-badge' : 'count-badge'} style={{ background: urgentCount > 0 ? 'rgba(255,59,92,0.12)' : undefined, color: urgentCount > 0 ? 'var(--bear)' : undefined, borderColor: urgentCount > 0 ? 'rgba(255,59,92,0.3)' : undefined, animation: urgentCount > 0 ? 'warnPulse 2s infinite' : undefined }}>
            {pendingOrders.length}
          </span>
        </div>
      </div>

      {/* Bulk actions */}
      <div style={{ display: 'flex', gap: 4, padding: '5px 8px', borderBottom: '1px solid var(--border)', background: 'var(--bg-base)', flexShrink: 0 }}>
        {[
          { label: 'ACCEPT ALL', action: () => [...pendingOrders].forEach(o => acceptOrder(o.id)), color: 'var(--bull)' },
          { label: 'REJECT ALL', action: () => [...pendingOrders].forEach(o => rejectOrder(o.id)), color: 'var(--bear)' },
        ].map(btn => (
          <button
            key={btn.label}
            onClick={btn.action}
            style={{ flex: 1, padding: '4px 0', borderRadius: 'var(--r-sm)', fontFamily: 'var(--font-data)', fontSize: 10, fontWeight: 600, border: '1px solid var(--border)', color: 'var(--fg3)', background: 'var(--bg-panel)', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em', transition: 'all 0.15s' }}
            onMouseEnter={e => { (e.target as HTMLElement).style.color = btn.color; (e.target as HTMLElement).style.borderColor = btn.color; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.color = 'var(--fg3)'; (e.target as HTMLElement).style.borderColor = 'var(--border)'; }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Scrollable order list */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
        {pendingOrders.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--fg3)' }}>
            No pending orders
          </div>
        ) : (
          pendingOrders.map((order, idx) => (
            <div key={order.id} onClick={() => setFocusedOrderIdx(idx)}>
              <OrderCard
                order={order}
                focused={focusedOrderIdx === idx}
                onAccept={() => acceptOrder(order.id)}
                onReject={() => rejectOrder(order.id)}
                onRequote={(price) => requoteOrder(order.id, price)}
              />
            </div>
          ))
        )}
      </div>

      {/* Recently processed strip */}
      <div style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-base)', flexShrink: 0, maxHeight: 80, overflowY: 'auto' }}>
        {processedOrders.map(p => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px', fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--fg3)', borderBottom: '1px solid var(--border)' }}>
            <span style={{ color: p.action === 'ACCEPT' ? 'var(--bull)' : 'var(--bear)', fontWeight: 700 }}>
              {p.action === 'ACCEPT' ? '✓' : '✗'}
            </span>
            <span style={{ color: 'var(--fg2)' }}>{p.clientName}</span>
            <span style={{ color: p.side === 'BUY' ? 'var(--bull)' : 'var(--bear)' }}>{p.side}</span>
            <span>{p.lots}L {p.symbol}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
