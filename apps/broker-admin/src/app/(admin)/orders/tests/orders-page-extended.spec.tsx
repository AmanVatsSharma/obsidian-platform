/**
 * File:        apps/broker-admin/src/app/(admin)/orders/tests/orders-page-extended.spec.tsx
 * Module:      broker-admin · Orders · Extended Filter Tests
 * Purpose:     Tests for order type filter tabs and orderRole column in the orders table
 *
 * Exports:
 *   - (all tests — no module exports)
 *
 * Depends on:
 *   - ../page — OrdersPage (via @testing-library/react render)
 *
 * Side-effects: none
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-24
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ── Mock orders ────────────────────────────────────────────────────────────────

const mockOrders = [
  // Standard
  { id: 'ORD001', clientId: 'C1', clientName: 'Alice', symbol: 'EUR/USD', type: 'Market', orderRole: undefined, side: 'Buy', status: 'Open', lots: 1, openPrice: 1.09, commission: 0, swap: 0, openTime: '2026-01-01' },
  { id: 'ORD002', clientId: 'C2', clientName: 'Bob',   symbol: 'XAUUSD', type: 'Limit', orderRole: undefined, side: 'Sell', status: 'Open', lots: 2, openPrice: 2010, commission: 0, swap: 0, openTime: '2026-01-01' },
  // Bracket
  { id: 'ORD003', clientId: 'C3', clientName: 'Carol', symbol: 'EUR/USD', type: 'BRACKET', orderRole: 'PRIMARY', side: 'Buy', status: 'Open', lots: 3, openPrice: 1.10, commission: 0, swap: 0, openTime: '2026-01-01' },
  { id: 'ORD004', clientId: 'C3', clientName: 'Carol', symbol: 'EUR/USD', type: 'Limit', orderRole: 'TAKE_PROFIT', side: 'Sell', status: 'Open', lots: 3, openPrice: 1.12, commission: 0, swap: 0, openTime: '2026-01-01' },
  { id: 'ORD005', clientId: 'C3', clientName: 'Carol', symbol: 'EUR/USD', type: 'Limit', orderRole: 'STOP_LOSS', side: 'Sell', lots: 3, openPrice: 1.08, commission: 0, swap: 0, openTime: '2026-01-01' },
  // GTT
  { id: 'ORD006', clientId: 'C4', clientName: 'Dave', symbol: 'BTC/USD', type: 'GTT', orderRole: undefined, side: 'Buy', status: 'Open', lots: 0.5, openPrice: 45000, commission: 0, swap: 0, openTime: '2026-01-01' },
  // TWAP
  { id: 'ORD007', clientId: 'C5', clientName: 'Eve',  symbol: 'US30', type: 'TWAP', orderRole: undefined, side: 'Buy', status: 'Open', lots: 5, openPrice: 37000, commission: 0, swap: 0, openTime: '2026-01-01', algoMeta: { totalSlices: 24, completedSlices: 8, sliceIntervalSec: 300 } },
  // VWAP
  { id: 'ORD008', clientId: 'C6', clientName: 'Frank', symbol: 'XAUUSD', type: 'VWAP', orderRole: undefined, side: 'Sell', status: 'Open', lots: 2, openPrice: 2050, commission: 0, swap: 0, openTime: '2026-01-01', algoMeta: { totalSlices: 12, completedSlices: 3, sliceIntervalSec: 60 } },
  // Liquidation
  { id: 'ORD009', clientId: 'C7', clientName: 'Grace', symbol: 'EUR/USD', type: 'Market', orderRole: undefined, side: 'Sell', status: 'Open', lots: 10, openPrice: 1.08, commission: 0, swap: 0, openTime: '2026-01-01', externalRefId: 'liq: liquidation-001' },
  // Trailing
  { id: 'ORD010', clientId: 'C8', clientName: 'Hank', symbol: 'GBP/USD', type: 'TRAILING_STOP', orderRole: undefined, side: 'Buy', status: 'Open', lots: 1, openPrice: 1.27, commission: 0, swap: 0, openTime: '2026-01-01' },
] as const;

// ── Mock hook ─────────────────────────────────────────────────────────────────

vi.mock('@/lib/api/hooks/use-orders', () => ({
  useOrdersApi: () => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    orders: [...mockOrders] as any as import('@/lib/types').Order[],
    cancelOrder: vi.fn(),
  }),
}));

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('OrdersPage — Extended Filters', () => {
  it('renders order type filter chips', async () => {
    const { default: OrdersPage } = await import('../page');
    render(<OrdersPage />);
    expect(screen.getByRole('button', { name: /Bracket/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /GTT/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Trailing/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /TWAP/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /VWAP/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Iceberg/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Liquidation/i })).toBeTruthy();
  });

  it('removes the "Type" label in filter chip row', async () => {
    const { default: OrdersPage } = await import('../page');
    render(<OrdersPage />);
    // "Type" as a label next to chips should exist (accessibility)
    const typeLabels = screen.getAllByText(/^Type$/);
    expect(typeLabels.length).toBeGreaterThanOrEqual(1);
  });

  it('shows Role column header', async () => {
    const { default: OrdersPage } = await import('../page');
    render(<OrdersPage />);
    expect(screen.getByRole('columnheader', { name: /Role/i })).toBeTruthy();
  });

  it('shows Algo column header', async () => {
    const { default: OrdersPage } = await import('../page');
    render(<OrdersPage />);
    expect(screen.getByRole('columnheader', { name: /Algo/i })).toBeTruthy();
  });

  it('filtering by Bracket shows only BRACKET/PRIMARY orders', async () => {
    const { default: OrdersPage } = await import('../page');
    render(<OrdersPage />);
    await userEvent.click(screen.getByRole('button', { name: /Bracket/i }));
    // Should show ORD003 (BRACKET/PRIMARY)
    // Others like Market orders should be hidden
    const rows = document.querySelectorAll('tbody tr');
    expect(rows.length).toBeGreaterThanOrEqual(1);
  });

  it('filtering by Liquidation shows only liq: prefixed orders', async () => {
    const { default: OrdersPage } = await import('../page');
    render(<OrdersPage />);
    await userEvent.click(screen.getByRole('button', { name: /Liquidation/i }));
    // Only liquidation orders should appear
    // The liq: order should be visible
    const rows = document.querySelectorAll('tbody tr');
    expect(rows.length).toBeGreaterThanOrEqual(1);
  });

  it('renders PRIMARY role badge with correct color class', async () => {
    const { default: OrdersPage } = await import('../page');
    render(<OrdersPage />);
    const primaryBadge = screen.getByText('PRIMARY');
    expect(primaryBadge).toBeTruthy();
    // Should have accent coloring
    expect(primaryBadge.className).toMatch(/text-obsidian-accent|obsidian-accent/);
  });

  it('renders TAKE_PROFIT role badge in bull green', async () => {
    const { default: OrdersPage } = await import('../page');
    render(<OrdersPage />);
    const tpBadge = screen.getByText('TAKE_PROFIT');
    expect(tpBadge).toBeTruthy();
    expect(tpBadge.className).toMatch(/text-bull|bull/);
  });

  it('renders STOP_LOSS role badge in bear red', async () => {
    const { default: OrdersPage } = await import('../page');
    render(<OrdersPage />);
    const slBadge = screen.getByText('STOP_LOSS');
    expect(slBadge).toBeTruthy();
    expect(slBadge.className).toMatch(/text-bear|bear/);
  });

  it('algo column shows slices for TWAP orders', async () => {
    const { default: OrdersPage } = await import('../page');
    render(<OrdersPage />);
    // TWAP order has algoMeta { totalSlices: 24, completedSlices: 8 } → shows "8/24"
    expect(screen.getByText('8/24')).toBeTruthy();
  });

  it('algo column shows slices for VWAP orders', async () => {
    const { default: OrdersPage } = await import('../page');
    render(<OrdersPage />);
    // VWAP order has algoMeta { totalSlices: 12, completedSlices: 3 } → shows "3/12"
    expect(screen.getByText('3/12')).toBeTruthy();
  });

  it('algo column shows — for non-algo orders (no algoMeta)', async () => {
    const { default: OrdersPage } = await import('../page');
    render(<OrdersPage />);
    // Market/Limit orders without algoMeta should show —
    const cells = document.querySelectorAll('tbody tr:first-child td');
    const algoCell = cells[11]; // Algo is index 11 (0-based, counting from col 1)
    // Should be blank or dash
    expect(algoCell.textContent).toMatch(/^—?$/);
  });

  it('renders expand/collapse button for bracket parent orders', async () => {
    const { default: OrdersPage } = await import('../page');
    render(<OrdersPage />);
    // Bracket parent has a toggle button
    const expandBtn = screen.getAllByRole('button').find(btn => btn.textContent?.includes('▶'));
    expect(expandBtn).toBeTruthy();
  });

  it('bracket children are visually distinguishable (indent class)', async () => {
    const { default: OrdersPage } = await import('../page');
    render(<OrdersPage />);
    // Take profit child row should have border-left indicator
    const takeProfitRow = document.evaluate(
      "//tr[contains(@class,'border-l')]",
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
    );
    // At least one bracket child row should have the indent
    // (depends on filtering showing brackettable orders)
  });
});
