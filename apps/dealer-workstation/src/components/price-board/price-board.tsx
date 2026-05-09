/**
 * File:        apps/dealer-workstation/src/components/price-board/price-board.tsx
 * Module:      dealer-workstation · Price Board
 * Purpose:     Horizontally scrollable row of price tiles — one tile per instrument.
 *              Fixed at 200px height above the workspace tabs.
 *
 * Exports:
 *   - PriceBoard() — the full 200px scrollable price board
 *
 * Side-effects: none
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

'use client';

import { useDeskData } from '../../lib/mock-data-context';
import { PriceTile } from './price-tile';

export function PriceBoard() {
  const { instruments, bookPositions } = useDeskData();

  return (
    <div style={{ display: 'flex', overflowX: 'auto', background: 'var(--bg-panel)', borderBottom: '2px solid var(--border-md)', height: 200, flexShrink: 0, gap: 1 }}>
      {instruments.map(inst => {
        const bp = bookPositions.find(b => b.symbol === inst.symbol);
        return <PriceTile key={inst.symbol} instrument={inst} bookPosition={bp} />;
      })}
    </div>
  );
}
