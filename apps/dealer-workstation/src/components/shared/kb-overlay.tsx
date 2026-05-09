/**
 * File:        apps/dealer-workstation/src/components/shared/kb-overlay.tsx
 * Module:      dealer-workstation · Shared
 * Purpose:     Full-screen keyboard shortcuts reference overlay — triggered by pressing '?' or '/'.
 *
 * Exports:
 *   - KbOverlay({ onClose }) — overlay listing all dealer keyboard shortcuts
 *
 * Side-effects: none
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

interface KbOverlayProps {
  onClose: () => void;
}

const SHORTCUTS: [string, string][] = [
  ['A', 'Accept focused order'],
  ['R', 'Reject focused order'],
  ['Q', 'Requote focused order'],
  ['Tab', 'Next order in queue'],
  ['Shift+Tab', 'Previous order'],
  ['Space', 'Accept + advance focus'],
  ['Esc', 'Deselect / close overlay'],
  ['1–6', 'Focus price tile by index'],
  ['H', 'Open delta hedge panel'],
  ['? / /', 'Show this keyboard guide'],
];

export function KbOverlay({ onClose }: KbOverlayProps) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(6,8,10,0.88)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.15s' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-md)', borderRadius: 'var(--r-xl)', padding: '28px 32px', minWidth: 380, maxWidth: 480, boxShadow: 'var(--shadow-float)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: 'var(--fg1)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            KEYBOARD SHORTCUTS
          </div>
          <button onClick={onClose} style={{ fontSize: 16, color: 'var(--fg3)', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {SHORTCUTS.map(([key, label]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--fg2)' }}>{label}</span>
              <kbd style={{ fontFamily: 'var(--font-data)', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--r-sm)', background: 'var(--bg-panel)', border: '1px solid var(--border-md)', color: 'var(--accent)', letterSpacing: '0.05em' }}>
                {key}
              </kbd>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--fg3)', textAlign: 'center' }}>
          Press Esc or click outside to close
        </div>
      </div>
    </div>
  );
}
