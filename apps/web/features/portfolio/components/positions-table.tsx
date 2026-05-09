/**
 * @file positions-table.tsx
 * @module web
 * @description Open positions table with color-coded P&L for the portfolio view.
 * @author BharatERP
 * @created 2026-04-16
 */

import type { OpenPosition } from '../../trading-terminal/lib/types';
import { fmt, pnlSign } from '../../trading-terminal/lib/format-utils';

function pnlColor(n: number) {
  return n >= 0 ? 'text-[var(--bull)]' : 'text-[var(--bear)]';
}

function sideBadge(type: 'BUY' | 'SELL') {
  return type === 'BUY'
    ? 'bg-[var(--bull)]/10 text-[var(--bull)]'
    : 'bg-[var(--bear)]/10 text-[var(--bear)]';
}

export function PositionsTable({ positions }: { positions: OpenPosition[] }) {
  if (positions.length === 0) {
    return <p className="py-6 text-center text-sm text-obsidian-faint">No open positions.</p>;
  }

  return (
    <div className="overflow-x-auto" data-testid="positions-table">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-obsidian-border text-left text-xs uppercase tracking-wider text-obsidian-faint">
            <th className="px-3 py-2">Symbol</th>
            <th className="px-3 py-2">Side</th>
            <th className="px-3 py-2 text-right">Lots</th>
            <th className="px-3 py-2 text-right">Open Price</th>
            <th className="px-3 py-2 text-right">Current</th>
            <th className="px-3 py-2 text-right">P&L</th>
            <th className="px-3 py-2 text-right">P&L %</th>
            <th className="px-3 py-2 text-right">Margin</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((p) => (
            <tr key={p.id} className="border-b border-obsidian-border/50 hover:bg-obsidian-muted/50" data-testid={`position-row-${p.id}`}>
              <td className="px-3 py-2 font-mono font-medium">{p.symbol}</td>
              <td className="px-3 py-2">
                <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-semibold ${sideBadge(p.type)}`}>
                  {p.type}
                </span>
              </td>
              <td className="px-3 py-2 text-right font-mono">{p.lots}</td>
              <td className="px-3 py-2 text-right font-mono">{p.openPrice}</td>
              <td className="px-3 py-2 text-right font-mono">{p.currentPrice}</td>
              <td className={`px-3 py-2 text-right font-mono font-medium ${pnlColor(p.pnl)}`}>
                {pnlSign(p.pnl)}${fmt(Math.abs(p.pnl))}
              </td>
              <td className={`px-3 py-2 text-right font-mono ${pnlColor(p.pnlPct)}`}>
                {pnlSign(p.pnlPct)}{fmt(Math.abs(p.pnlPct))}%
              </td>
              <td className="px-3 py-2 text-right font-mono text-obsidian-secondary">${fmt(p.margin)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
