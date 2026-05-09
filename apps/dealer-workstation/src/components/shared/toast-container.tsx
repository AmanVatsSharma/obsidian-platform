/**
 * File:        apps/dealer-workstation/src/components/shared/toast-container.tsx
 * Module:      dealer-workstation · Shared
 * Purpose:     Fixed toast notification stack — accept (green), reject (red), warn (amber), info.
 *
 * Exports:
 *   - ToastContainer() — reads toasts from DeskContext; renders the fixed stack in top-right
 *
 * Side-effects: none (dismissal is handled by context)
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

'use client';

import { useDeskData } from '../../lib/mock-data-context';

export function ToastContainer() {
  const { toasts, dismissToast } = useDeskData();

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type} ${t.exiting ? 'exit' : ''}`}>
          <span style={{ fontSize: 16, flexShrink: 0, color: t.type === 'accept' ? 'var(--bull)' : t.type === 'reject' ? 'var(--bear)' : 'var(--warn)' }}>
            {t.icon}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-data)', fontSize: 11, fontWeight: 700, color: 'var(--fg1)', marginBottom: 2 }}>
              {t.title}
            </div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--fg2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {t.msg}
            </div>
          </div>
          <button
            onClick={() => dismissToast(t.id)}
            style={{ fontSize: 12, color: 'var(--fg3)', flexShrink: 0, cursor: 'pointer', background: 'none', border: 'none', padding: '0 2px' }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
