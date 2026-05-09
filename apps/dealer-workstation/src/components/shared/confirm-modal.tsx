/**
 * File:        apps/dealer-workstation/src/components/shared/confirm-modal.tsx
 * Module:      dealer-workstation · Shared
 * Purpose:     Emergency confirmation modal — requires the dealer to type the action word (HALT /
 *              WIDEN / SUSPEND / FLATTEN) before confirming, preventing accidental triggers.
 *
 * Exports:
 *   - ConfirmModal({ action, onConfirm, onCancel }) — typed-word confirmation overlay
 *
 * Side-effects: none (caller handles the action)
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

'use client';

import { useState } from 'react';

type EmergencyAction = 'HALT' | 'WIDEN' | 'SUSPEND' | 'FLATTEN';

interface ConfirmModalProps {
  action: EmergencyAction;
  onConfirm: () => void;
  onCancel: () => void;
}

const CONFIGS: Record<EmergencyAction, { title: string; msg: string; color: string }> = {
  HALT:    { title: 'HALT ALL TRADING',        msg: 'This will immediately freeze all auto-accepts and stop order processing. Type HALT to confirm.',                            color: 'var(--bear)' },
  WIDEN:   { title: 'WIDEN SPREADS GLOBALLY',  msg: 'Apply emergency spread multiplier of 3× across all instruments for all clients. Type WIDEN to confirm.',                  color: 'var(--warn)' },
  SUSPEND: { title: 'SUSPEND ALL TRADING',     msg: 'Disable all new order placement across the entire platform. Type SUSPEND to confirm.',                                      color: 'var(--bear)' },
  FLATTEN: { title: 'FLATTEN ENTIRE BOOK',     msg: 'Emergency full hedge of all net exposures to LP. This will send multiple hedge orders immediately. Type FLATTEN to confirm.', color: 'var(--bear)' },
};

export function ConfirmModal({ action, onConfirm, onCancel }: ConfirmModalProps) {
  const [val, setVal] = useState('');
  const cfg = CONFIGS[action];
  const valid = val === action;

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(6,8,10,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.15s' }}
      onClick={e => e.target === e.currentTarget && onCancel()}
    >
      <div style={{ background: 'var(--bg-elevated)', border: `1px solid ${cfg.color}`, borderRadius: 'var(--r-xl)', padding: '28px 32px', minWidth: 380, maxWidth: 440, boxShadow: 'var(--shadow-float)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 800, color: cfg.color, letterSpacing: '0.08em', marginBottom: 12 }}>
          ⚠ {cfg.title}
        </div>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--fg2)', lineHeight: 1.6, marginBottom: 20 }}>
          {cfg.msg}
        </div>
        <input
          autoFocus
          placeholder={`Type ${action}`}
          value={val}
          onChange={e => setVal(e.target.value.toUpperCase())}
          style={{ width: '100%', padding: '8px 12px', fontSize: 14, fontFamily: 'var(--font-data)', marginBottom: 16, letterSpacing: '0.1em' }}
        />
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            style={{ flex: 1, padding: '8px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--bg-panel)', color: 'var(--fg2)', fontFamily: 'var(--font-data)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', cursor: 'pointer', textTransform: 'uppercase' }}
          >
            CANCEL
          </button>
          <button
            onClick={() => valid && onConfirm()}
            disabled={!valid}
            style={{ flex: 1, padding: '8px', borderRadius: 'var(--r-md)', border: `1px solid ${cfg.color}`, background: valid ? cfg.color : 'transparent', color: valid ? 'white' : cfg.color, fontFamily: 'var(--font-data)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', cursor: valid ? 'pointer' : 'not-allowed', opacity: valid ? 1 : 0.4, textTransform: 'uppercase', transition: 'all 0.15s' }}
          >
            CONFIRM {action}
          </button>
        </div>
      </div>
    </div>
  );
}
