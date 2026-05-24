/**
 * File:        apps/web/features/trading-terminal/components/pending-orders-table.tsx
 * Module:      web · trading-terminal · Components
 * Purpose:     Pending orders table with bracket group display, filter tabs, and algo slices column
 *
 * Exports:
 *   - PendingOrdersTable — renders filterable, expandable pending orders grid
 *
 * Depends on:
 *   - @/features/trading-terminal/lib/gql-service — useOrderChildren, useCancelOrder, useCancelBracketGroup
 *   - @/features/trading-terminal/lib/types — PendingOrder, OrderRole, AlgoMeta
 *
 * Side-effects:
 *   - Apollo mutation network I/O on cancel actions
 *
 * Key invariants:
 *   - PRIMARY orders group with TAKE_PROFIT / STOP_LOSS children — parent row shows expand
 *   - Algo orders (TWAP/VWAP/ICEBERG) display slice progress in dedicated column
 *   - Filter tabs update visible rows without mutating data
 *   - "Cancel All" on PRIMARY cancels parent + children via cancelBracketGroup mutation
 *
 * Read order:
 *   1. FILTER_TABS + filter logic — which rows are visible
 *   2. orderRoleBadge — OrderRole badge render
 *   3. algoSlicesLabel — TWAP/VWAP slice progress
 *   4. cancelAction — Cancel All vs Cancel per orderRole
 *   5. PendingOrdersTable — main component
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-24
 */

'use client';

import React, { useState, useCallback } from 'react';
import { useOrderChildren, useCancelOrder, useCancelBracketGroup } from '../lib/gql-service';
import type { PendingOrder, OrderRole } from '../lib/types';

// ─── Filter tabs ─────────────────────────────────────────────────────────────

const FILTER_TABS = ['All', 'Bracket', 'GTT', 'Trailing', 'Algo'] as const;
type FilterTab = (typeof FILTER_TABS)[number];

function filterPredicate(tab: FilterTab, o: PendingOrder): boolean {
  switch (tab) {
    case 'All':
      return true;
    case 'Bracket':
      return o.orderRole === 'PRIMARY';
    case 'GTT':
      return o.type === 'GTT';
    case 'Trailing':
      return o.type === 'TRAILING_STOP';
    case 'Algo':
      return o.type === 'TWAP' || o.type === 'VWAP' || o.type === 'ICEBERG';
    default:
      return true;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function orderRoleBadge(role?: OrderRole | null): React.ReactNode {
  if (!role) return null;
  if (role === 'PRIMARY')
    return (
      <span className="badge-primary text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded border border-obsidian-primary/30 bg-obsidian-primary/10 text-obsidian-primary">
        PRIMARY
      </span>
    );
  if (role === 'TAKE_PROFIT')
    return (
      <span className="text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded border border-bull/30 bg-bull/10 text-bull">
        TP
      </span>
    );
  if (role === 'STOP_LOSS')
    return (
      <span className="text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded border border-bear/30 bg-bear/10 text-bear">
        SL
      </span>
    );
  return null;
}

function algoSlicesLabel(o: PendingOrder): React.ReactNode {
  if (!o.algoMeta?.slices || o.algoMeta?.completedSlices === undefined) return null;
  const done = o.algoMeta.completedSlices;
  const total = o.algoMeta.slices;
  return (
    <span className="font-mono text-[11px] text-obsidian-muted">
      {done}/{total}
    </span>
  );
}

function priceDisplay(price: string | undefined): string {
  return price ?? '—';
}

function statusChip(status: string): React.ReactNode {
  const cls =
    status === 'PENDING'
      ? 'bg-obsidian-elevated text-obsidian-muted'
      : status === 'TRIGGERED'
        ? 'bg-obsidian-primary/10 text-obsidian-primary border border-obsidian-primary/30'
        : 'bg-obsidian-elevated text-obsidian-muted';
  return (
    <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${cls}`}>
      {status}
    </span>
  );
}

// ─── Cancel action ─────────────────────────────────────────────────────────────

interface CancelCellProps {
  order: PendingOrder;
  onCancelled: () => void;
}

function CancelCell({ order, onCancelled }: CancelCellProps) {
  const [cancelOrder] = useCancelOrder();
  const [cancelBracketGroup] = useCancelBracketGroup();

  const handleCancel = useCallback(async () => {
    if (order.orderRole === 'PRIMARY') {
      // Cancel parent + all children
      await cancelBracketGroup({ variables: { parentOrderId: order.id } });
    } else {
      // Cancel single child
      await cancelOrder({ variables: { orderId: order.id } });
    }
    onCancelled();
  }, [order, cancelOrder, cancelBracketGroup, onCancelled]);

  const isPrimary = order.orderRole === 'PRIMARY';

  return (
    <button
      onClick={handleCancel}
      className="text-[11px] font-mono uppercase tracking-wider px-2 py-1 rounded border transition-colors duration-150 hover:border-bear/50 hover:text-bear border-obsidian-border text-obsidian-muted"
    >
      {isPrimary ? 'Cancel All' : 'Cancel'}
    </button>
  );
}

// ─── Child rows ───────────────────────────────────────────────────────────────

interface ChildRowProps {
  child: PendingOrder;
  onCancelled: () => void;
}

function ChildRow({ child, onCancelled }: ChildRowProps) {
  return (
    <tr className="border-b border-obsidian-border/50 bg-obsidian-panel/50 pl-6">
      <td className="pl-10 py-2">
        <span className="text-[10px] font-mono text-obsidian-muted">
          {child.id.slice(-6)}
        </span>
      </td>
      <td className="py-2">{orderRoleBadge(child.orderRole)}</td>
      <td className="py-2 font-mono text-[12px] text-obsidian-text">
        {child.symbol}
      </td>
      <td className="py-2">
        <span
          className={`text-[12px] font-mono font-medium ${child.side === 'BUY' ? 'text-bull' : 'text-bear'}`}
        >
          {child.side}
        </span>
      </td>
      <td className="py-2 font-mono text-[12px] text-obsidian-text">{child.lots}</td>
      <td className="py-2 font-mono text-[12px] text-obsidian-text">
        {priceDisplay(child.price)}
      </td>
      <td className="py-2 font-mono text-[12px] text-bear">
        {priceDisplay(child.sl)}
      </td>
      <td className="py-2 font-mono text-[12px] text-bull">
        {priceDisplay(child.tp)}
      </td>
      <td className="py-2">{statusChip(child.status)}</td>
      <td className="py-2 text-[11px] font-mono text-obsidian-muted">
        {algoSlicesLabel(child)}
      </td>
      <td className="py-2 text-[10px] font-mono text-obsidian-muted">
        {new Date(child.created).toLocaleTimeString()}
      </td>
      <td className="py-2">
        <CancelCell order={child} onCancelled={onCancelled} />
      </td>
    </tr>
  );
}

// ─── Parent row (expandable) ───────────────────────────────────────────────────

interface ParentRowProps {
  order: PendingOrder;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  onCancelled: () => void;
}

function ParentRow({ order, isExpanded, onToggle, onCancelled }: ParentRowProps) {
  return (
    <>
      <tr className="border-b border-obsidian-border hover:bg-obsidian-elevated/30 transition-colors duration-100">
        <td className="py-2.5 pl-4">
          <button
            onClick={() => onToggle(order.id)}
            className="w-5 h-5 flex items-center justify-center rounded border border-obsidian-border hover:border-obsidian-primary/40 transition-colors duration-100"
            aria-label={isExpanded ? 'Collapse bracket group' : 'Expand bracket group'}
          >
            <svg
              className={`w-3 h-3 text-obsidian-muted transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 16 16"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 8l4 4 4-4" />
            </svg>
          </button>
        </td>
        <td className="py-2">{orderRoleBadge(order.orderRole)}</td>
        <td className="py-2 font-mono text-[12px] text-obsidian-text font-medium">
          {order.symbol}
        </td>
        <td className="py-2">
          <span
            className={`text-[12px] font-mono font-medium ${order.side === 'BUY' ? 'text-bull' : 'text-bear'}`}
          >
            {order.side}
          </span>
        </td>
        <td className="py-2 font-mono text-[12px] text-obsidian-text">{order.lots}</td>
        <td className="py-2 font-mono text-[12px] text-obsidian-text">
          {priceDisplay(order.price)}
        </td>
        <td className="py-2 font-mono text-[12px] text-bear">{priceDisplay(order.sl)}</td>
        <td className="py-2 font-mono text-[12px] text-bull">{priceDisplay(order.tp)}</td>
        <td className="py-2">{statusChip(order.status)}</td>
        <td className="py-2 text-[11px] font-mono text-obsidian-muted">
          {algoSlicesLabel(order)}
        </td>
        <td className="py-2 text-[10px] font-mono text-obsidian-muted">
          {new Date(order.created).toLocaleTimeString()}
        </td>
        <td className="py-2">
          <CancelCell order={order} onCancelled={onCancelled} />
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={12} className="p-0">
            <div className="pl-4 border-l-2 border-obsidian-border/70">
              {/* Children rendered by parent — see PendingOrdersTable */}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Main table ───────────────────────────────────────────────────────────────

export interface PendingOrdersTableProps {
  orders: PendingOrder[];
  /** Children fetched per parent via useOrderChildren */
  childrenByParent?: Map<string, PendingOrder[]>;
  isLoading?: boolean;
}

export function PendingOrdersTable({
  orders,
  childrenByParent = new Map(),
  isLoading = false,
}: PendingOrdersTableProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>('All');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const handleToggle = useCallback((id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleCancelled = useCallback(() => {
    // Refetch triggered by Apollo mutation refetchQueries
  }, []);

  // Build parent/child map from orders that have parentOrderId set
  const childrenMap = childrenByParent;

  // Group orders: parents = PRIMARY or no parentOrderId; children = TP/SL with parentOrderId
  const parentOrders = orders.filter(
    (o) => o.orderRole === 'PRIMARY' || (!o.parentOrderId && o.orderRole !== 'TAKE_PROFIT' && o.orderRole !== 'STOP_LOSS'),
  );
  const childOrders = orders.filter(
    (o) => o.orderRole === 'TAKE_PROFIT' || o.orderRole === 'STOP_LOSS',
  );

  // Filter parents by active tab
  const filteredParents = parentOrders.filter((o) => filterPredicate(activeTab, o));

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <span className="font-mono text-[12px] text-obsidian-muted uppercase tracking-widest">
          Loading orders...
        </span>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-12 gap-2">
        <svg className="w-8 h-8 text-obsidian-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <span className="font-mono text-[12px] text-obsidian-muted uppercase tracking-widest">
          No pending orders
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filter tabs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-obsidian-border bg-obsidian-panel/50">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-[11px] font-mono uppercase tracking-widest px-3 py-1.5 rounded border transition-colors duration-100 ${
              activeTab === tab
                ? 'border-obsidian-primary/50 bg-obsidian-primary/10 text-obsidian-primary'
                : 'border-transparent text-obsidian-muted hover:text-obsidian-text hover:border-obsidian-border'
            }`}
          >
            {tab}
          </button>
        ))}
        <span className="ml-auto font-mono text-[10px] text-obsidian-muted">
          {filteredParents.length} group{filteredParents.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-auto flex-1">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-obsidian-panel border-b border-obsidian-border">
            <tr>
              <th className="py-2 pl-4 pr-2 text-left w-8" />
              <th className="py-2 px-2 text-left text-[10px] font-mono uppercase tracking-widest text-obsidian-muted">
                Role
              </th>
              <th className="py-2 px-2 text-left text-[10px] font-mono uppercase tracking-widest text-obsidian-muted">
                Symbol
              </th>
              <th className="py-2 px-2 text-left text-[10px] font-mono uppercase tracking-widest text-obsidian-muted">
                Side
              </th>
              <th className="py-2 px-2 text-left text-[10px] font-mono uppercase tracking-widest text-obsidian-muted">
                Lots
              </th>
              <th className="py-2 px-2 text-left text-[10px] font-mono uppercase tracking-widest text-obsidian-muted">
                Price
              </th>
              <th className="py-2 px-2 text-left text-[10px] font-mono uppercase tracking-widest text-obsidian-muted">
                SL
              </th>
              <th className="py-2 px-2 text-left text-[10px] font-mono uppercase tracking-widest text-obsidian-muted">
                TP
              </th>
              <th className="py-2 px-2 text-left text-[10px] font-mono uppercase tracking-widest text-obsidian-muted">
                Status
              </th>
              <th className="py-2 px-2 text-left text-[10px] font-mono uppercase tracking-widest text-obsidian-muted">
                Slices
              </th>
              <th className="py-2 px-2 text-left text-[10px] font-mono uppercase tracking-widest text-obsidian-muted">
                Time
              </th>
              <th className="py-2 px-4 text-left text-[10px] font-mono uppercase tracking-widest text-obsidian-muted">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredParents.map((parent) => {
              const isExpanded = expandedGroups.has(parent.id);
              const children = childrenMap.get(parent.id) ?? [];

              return (
                <React.Fragment key={parent.id}>
                  <ParentRow
                    order={parent}
                    isExpanded={isExpanded}
                    onToggle={handleToggle}
                    onCancelled={handleCancelled}
                  />
                  {isExpanded &&
                    children.map((child) => (
                      <ChildRow key={child.id} child={child} onCancelled={handleCancelled} />
                    ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}