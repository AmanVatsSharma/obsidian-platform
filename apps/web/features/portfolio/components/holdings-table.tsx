/**
 * @file holdings-table.tsx
 * @module web
 * @description Holdings grid showing instrument allocation, cost basis, and performance.
 * @author BharatERP
 * @created 2026-04-16
 */

import type { Holding } from '../lib/types';
import { fmt, pnlSign } from '../../trading-terminal/lib/format-utils';

function changeColor(n: number) {
  return n >= 0 ? 'text-[var(--bull)]' : 'text-[var(--bear)]';
}

export function HoldingsTable({ holdings }: { holdings: Holding[] }) {
  if (holdings.length === 0) {
    return <p className="py-6 text-center text-sm text-obsidian-faint">No holdings.</p>;
  }

  return (
    <div className="overflow-x-auto" data-testid="holdings-table">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-obsidian-border text-left text-xs uppercase tracking-wider text-obsidian-faint">
            <th className="px-3 py-2">Instrument</th>
            <th className="px-3 py-2 text-right">Quantity</th>
            <th className="px-3 py-2 text-right">Avg Cost</th>
            <th className="px-3 py-2 text-right">Current</th>
            <th className="px-3 py-2 text-right">Value</th>
            <th className="px-3 py-2 text-right">Allocation</th>
            <th className="px-3 py-2 text-right">Change</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((h) => (
            <tr key={h.symbol} className="border-b border-obsidian-border/50 hover:bg-obsidian-muted/50" data-testid={`holding-row-${h.symbol}`}>
              <td className="px-3 py-2">
                <span className="font-mono font-medium">{h.symbol}</span>
                <span className="ml-2 text-xs text-obsidian-secondary">{h.name}</span>
              </td>
              <td className="px-3 py-2 text-right font-mono">{h.quantity.toLocaleString()}</td>
              <td className="px-3 py-2 text-right font-mono">{h.avgCost}</td>
              <td className="px-3 py-2 text-right font-mono">{h.currentPrice}</td>
              <td className="px-3 py-2 text-right font-mono">${fmt(h.value)}</td>
              <td className="px-3 py-2 text-right font-mono text-obsidian-secondary">{fmt(h.allocationPct, 1)}%</td>
              <td className={`px-3 py-2 text-right font-mono ${changeColor(h.changePct)}`}>
                {pnlSign(h.changePct)}{fmt(Math.abs(h.changePct))}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
