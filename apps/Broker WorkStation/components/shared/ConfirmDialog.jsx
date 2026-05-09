'use client';
import { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';

const ConfirmContext = createContext(null);

export function useConfirm() {
  return useContext(ConfirmContext);
}

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);

  const confirm = useCallback((opts) => {
    return new Promise((resolve) => {
      setDialog({ ...opts, resolve });
    });
  }, []);

  const handleResult = (result) => {
    dialog?.resolve(result);
    setDialog(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {dialog && (
        <ConfirmDialog
          {...dialog}
          onConfirm={() => handleResult(true)}
          onCancel={() => handleResult(false)}
        />
      )}
    </ConfirmContext.Provider>
  );
}

// Countdown hook
function useCountdown(seconds, active) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    if (!active || seconds === 0) { setRemaining(0); return; }
    setRemaining(seconds);
    const interval = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { clearInterval(interval); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [seconds, active]);
  return remaining;
}

export function ConfirmDialog({
  title = 'Are you sure?',
  description,
  impact,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',    // danger | warning | info
  requireTyping = null,  // string — user must type this to confirm
  countdown = 0,         // seconds before confirm button activates
  onConfirm,
  onCancel,
}) {
  const [typed, setTyped] = useState('');
  const cancelRef = useRef(null);
  const remaining = useCountdown(countdown, true);
  const locked = remaining > 0 || (requireTyping && typed !== requireTyping);

  const variantStyles = {
    danger:  { color: 'var(--bear)',   bg: 'var(--bear-muted)',   border: 'var(--bear-dim)' },
    warning: { color: 'var(--warn)',   bg: 'var(--warn-muted)',   border: 'var(--warn-dim)' },
    info:    { color: 'var(--accent)', bg: 'var(--accent-muted)', border: 'var(--border-accent)' },
  };
  const vs = variantStyles[variant] || variantStyles.danger;

  useEffect(() => {
    cancelRef.current?.focus();
    const handler = (e) => { if (e.key === 'Escape') onCancel?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.72)',
      backdropFilter: 'blur(6px)',
      animation: 'fadeIn 0.15s ease',
    }}>
      <div style={{
        background: 'var(--bg-2)',
        border: `1px solid ${vs.border}`,
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-xl)',
        width: 440, margin: '0 20px',
        animation: 'slideUp 0.18s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 20px 16px',
          borderBottom: `1px solid var(--border)`,
          display: 'flex', gap: 12, alignItems: 'flex-start',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: vs.bg, border: `1px solid ${vs.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, color: vs.color, flexShrink: 0,
          }}>
            {variant === 'danger' ? '!' : variant === 'warning' ? '⚠' : 'ℹ'}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
              {title}
            </div>
            {description && (
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {description}
              </div>
            )}
          </div>
        </div>

        {/* Impact warning */}
        {impact && (
          <div style={{
            margin: '16px 20px 0',
            padding: '10px 12px',
            background: vs.bg,
            border: `1px solid ${vs.border}`,
            borderRadius: 8,
            fontSize: 12, color: vs.color, lineHeight: 1.5,
          }}>
            <strong>⚠ Impact: </strong>{impact}
          </div>
        )}

        {/* Type-to-confirm */}
        {requireTyping && (
          <div style={{ padding: '16px 20px 0' }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
              Type <code style={{
                fontFamily: 'var(--font-data)', fontSize: 11,
                background: 'var(--bg-4)', padding: '1px 6px',
                borderRadius: 4, color: vs.color,
              }}>{requireTyping}</code> to confirm:
            </div>
            <input
              className="input"
              value={typed}
              onChange={e => setTyped(e.target.value)}
              placeholder={requireTyping}
              autoFocus
              style={{
                borderColor: typed === requireTyping ? vs.color : undefined,
              }}
            />
          </div>
        )}

        {/* Footer */}
        <div style={{
          padding: '16px 20px', display: 'flex', gap: 8,
          justifyContent: 'flex-end', alignItems: 'center',
        }}>
          {countdown > 0 && remaining > 0 && (
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginRight: 'auto' }}>
              Available in {remaining}s...
            </span>
          )}
          <button
            ref={cancelRef}
            className="btn btn-ghost btn-sm"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            className={`btn btn-sm ${variant === 'info' ? 'btn-primary' : 'btn-danger'}`}
            disabled={locked}
            onClick={onConfirm}
            style={{
              opacity: locked ? 0.4 : 1,
              transition: 'opacity 0.3s',
              position: 'relative',
            }}
          >
            {confirmLabel}
            {countdown > 0 && remaining > 0 && (
              <span style={{
                position: 'absolute', inset: 0,
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 'var(--radius-md)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
              }}>
                {remaining}
              </span>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(16px) scale(0.97); opacity: 0 } to { transform: none; opacity: 1 } }
      `}</style>
    </div>
  );
}
