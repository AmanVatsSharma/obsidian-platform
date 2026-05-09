/**
 * File:        libs/trading-ui/src/panels/toast-container.tsx
 * Module:      trading-ui · Panels
 * Purpose:     Stacked transient toasts for trade-feedback notifications.
 *
 * Exports:
 *   - ToastContainer({ toasts }) → ReactNode
 *
 * Depends on:
 *   - ../types/instrument — ToastItem
 *
 * Side-effects:
 *   - none (toast lifecycle managed by parent TradingWorkstation)
 *
 * Key invariants:
 *   - Toast items are keyed by numeric id (Date.now()); parent must filter expired items
 *
 * Read order:
 *   1. ToastContainer — trivial render
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

'use client';

import type { ToastItem } from '../types/instrument';

export function ToastContainer({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          <div className="toast-icon" />
          <div>
            <div className="toast-text">{t.text}</div>
            {t.sub ? <div className="toast-sub">{t.sub}</div> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
