'use client';
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

const ToastContext = createContext(null);

let _toastFn = null;
export const toast = {
  success: (msg, opts) => _toastFn?.({ type: 'success', message: msg, ...opts }),
  error:   (msg, opts) => _toastFn?.({ type: 'error',   message: msg, ...opts }),
  warn:    (msg, opts) => _toastFn?.({ type: 'warn',    message: msg, ...opts }),
  info:    (msg, opts) => _toastFn?.({ type: 'info',    message: msg, ...opts }),
};

const TYPE_STYLES = {
  success: { color: 'var(--bull)',   icon: '✓', bg: 'var(--bull-muted)',   border: 'var(--bull-dim)' },
  error:   { color: 'var(--bear)',   icon: '✕', bg: 'var(--bear-muted)',   border: 'var(--bear-dim)' },
  warn:    { color: 'var(--warn)',   icon: '⚠', bg: 'var(--warn-muted)',   border: 'var(--warn-dim)' },
  info:    { color: 'var(--accent)', icon: 'ℹ', bg: 'var(--accent-muted)', border: 'var(--border-accent)' },
};

function ToastItem({ id, type, message, title, duration = 4000, onDismiss }) {
  const [progress, setProgress] = useState(100);
  const [exiting, setExiting] = useState(false);
  const intervalRef = useRef(null);
  const s = TYPE_STYLES[type] || TYPE_STYLES.info;
  const startTime = useRef(Date.now());

  const dismiss = useCallback(() => {
    setExiting(true);
    clearInterval(intervalRef.current);
    setTimeout(() => onDismiss(id), 220);
  }, [id, onDismiss]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime.current;
      const pct = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(pct);
      if (pct <= 0) dismiss();
    }, 40);
    return () => clearInterval(intervalRef.current);
  }, [duration, dismiss]);

  return (
    <div style={{
      display: 'flex', gap: 10, alignItems: 'flex-start',
      background: 'var(--bg-2)', border: `1px solid ${s.border}`,
      borderRadius: 'var(--radius-lg)', padding: '12px 14px',
      boxShadow: 'var(--shadow-lg)', minWidth: 280, maxWidth: 380,
      transform: exiting ? 'translateX(120%)' : 'translateX(0)',
      opacity: exiting ? 0 : 1,
      transition: 'all 220ms cubic-bezier(0.4,0,0.2,1)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* progress bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0,
        height: 2, background: s.color, opacity: 0.6,
        width: `${progress}%`, transition: 'width 40ms linear',
        borderRadius: '0 0 0 var(--radius-lg)',
      }} />

      <div style={{
        width: 20, height: 20, borderRadius: '50%',
        background: s.bg, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 11, color: s.color,
        fontWeight: 700, flexShrink: 0, marginTop: 1,
      }}>
        {s.icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {title && <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{title}</div>}
        <div style={{ fontSize: 12, color: title ? 'var(--text-secondary)' : 'var(--text-primary)', lineHeight: 1.4 }}>{message}</div>
      </div>

      <button onClick={dismiss} style={{
        flexShrink: 0, width: 18, height: 18, borderRadius: 4,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-tertiary)', fontSize: 10, cursor: 'pointer',
        border: 'none', background: 'none', transition: 'color 0.12s',
        marginTop: 1,
      }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
      >✕</button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((opts) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t.slice(-3), { id, ...opts }]);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts(t => t.filter(x => x.id !== id));
  }, []);

  useEffect(() => { _toastFn = addToast; return () => { _toastFn = null; }; }, [addToast]);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div style={{
        position: 'fixed', bottom: 24, right: 24,
        display: 'flex', flexDirection: 'column', gap: 8,
        zIndex: 9999, pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: 'all' }}>
            <ToastItem {...t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  return useCallback((opts) => ctx?.(opts), [ctx]);
}
