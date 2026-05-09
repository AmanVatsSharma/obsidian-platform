/**
 * @file toast-container.tsx
 * @module web-trading
 * @description Stack of transient toasts for workstation trade feedback.
 * @author BharatERP
 * @created 2026-04-03
 */

'use client';

import type { ToastItem } from '../lib/types';

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
