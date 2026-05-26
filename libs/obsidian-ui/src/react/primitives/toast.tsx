/**
 * File:        libs/obsidian-ui/src/react/primitives/toast.tsx
 * Module:      obsidian-ui · Primitives
 * Purpose:     App-wide toast / snackbar system. Mounts a fixed bottom-right stack and
 *              exposes a `useToast()` push function. Styled to match the design's
 *              `.toast` rules (bull/bear/warn/accent variants with semantic icons).
 *
 * Exports:
 *   - ToastProvider     — wrap app root once
 *   - useToast()        — returns a push function: (input: ToastInput) => string (id)
 *   - dismissToast(id)  — manual dismissal helper (returned from useToast as well)
 *   - ToastKind, ToastInput
 *
 * Depends on:
 *   - lucide-react       — kind-based icon (Check, X, AlertTriangle, Info)
 *   - ../utils/cn
 *
 * Side-effects:
 *   - Mounts a fixed-position div at bottom-right when ToastProvider is rendered.
 *   - Schedules setTimeout for auto-dismiss; cleared on unmount of the provider.
 *
 * Key invariants:
 *   - Toast ids are non-cryptographic — `Math.random().toString(36).slice(2)`. Sufficient
 *     for visual de-duping; not a security primitive.
 *   - Default duration is 3500ms; overridable per toast.
 *   - Toaster lives outside the app's normal stacking context (z-index 9999) so it works
 *     above modals (which use 9000).
 *   - The hook throws if used outside ToastProvider — caller bug detection at dev time.
 *
 * Read order:
 *   1. ToastKind / ToastInput types — what callers pass
 *   2. ToastProvider                — state + auto-dismiss + DOM mount
 *   3. useToast hook                — caller surface
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

'use client';

import { AlertTriangle, Check, Info, X } from 'lucide-react';
import * as React from 'react';

import { cn } from '../utils/cn';

export type ToastKind = 'bull' | 'bear' | 'warn' | 'accent';

export type ToastInput = {
  title: string;
  detail?: string;
  kind?: ToastKind;
  /** ms before auto-dismiss; default 3500. */
  duration?: number;
};

type ToastEntry = ToastInput & { id: string };

type ToastContextValue = {
  push: (input: ToastInput) => string;
  dismiss: (id: string) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastEntry[]>([]);
  const timersRef = React.useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = React.useCallback((id: string) => {
    const t = timersRef.current.get(id);
    if (t) clearTimeout(t);
    timersRef.current.delete(id);
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const push = React.useCallback(
    (input: ToastInput) => {
      const id = Math.random().toString(36).slice(2);
      const entry: ToastEntry = { id, kind: 'accent', duration: 3500, ...input };
      setToasts((prev) => [...prev, entry]);
      const handle = setTimeout(() => dismiss(id), entry.duration);
      timersRef.current.set(id, handle);
      return id;
    },
    [dismiss],
  );

  React.useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  const value = React.useMemo<ToastContextValue>(() => ({ push, dismiss }), [push, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}

const KIND_BORDER: Record<ToastKind, string> = {
  bull:   'border-[color:rgba(16,217,150,0.4)]',
  bear:   'border-[color:rgba(255,59,92,0.4)]',
  warn:   'border-[color:rgba(245,158,11,0.4)]',
  accent: 'border-[color:var(--border-md)]',
};

const KIND_ICON_BG: Record<ToastKind, string> = {
  bull:   'bg-[color:var(--bull-dim)]   text-[color:var(--bull)]',
  bear:   'bg-[color:var(--bear-dim)]   text-[color:var(--bear)]',
  warn:   'bg-[color:var(--warn-dim)]   text-[color:var(--warn)]',
  accent: 'bg-[color:var(--accent-dim)] text-[color:var(--accent)]',
};

function KindIcon({ kind }: { kind: ToastKind }) {
  switch (kind) {
    case 'bull':
      return <Check size={12} strokeWidth={2.5} />;
    case 'bear':
      return <X size={12} strokeWidth={2.5} />;
    case 'warn':
      return <AlertTriangle size={12} strokeWidth={2.5} />;
    default:
      return <Info size={12} strokeWidth={2.5} />;
  }
}

function ToastViewport({ toasts }: { toasts: readonly ToastEntry[] }) {
  if (typeof document === 'undefined') return null;
  return (
    <div
      role="region"
      aria-label="Notifications"
      className="pointer-events-none fixed bottom-5 right-5 z-[9999] flex flex-col gap-2"
    >
      {toasts.map((t) => {
        const kind: ToastKind = t.kind ?? 'accent';
        return (
          <div
            key={t.id}
            role="status"
            aria-live="polite"
            className={cn(
              'pointer-events-auto flex min-w-[240px] items-center gap-[10px] rounded-r-md border bg-[color:var(--bg-panel)] px-[14px] py-[10px] shadow-obs-float',
              'animate-[obsidian-toast-slide_250ms_ease]',
              KIND_BORDER[kind],
            )}
          >
            <span
              className={cn(
                'flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full',
                KIND_ICON_BG[kind],
              )}
            >
              <KindIcon kind={kind} />
            </span>
            <div className="min-w-0">
              <div className="text-[12px] font-semibold text-[color:var(--fg1)]">{t.title}</div>
              {t.detail && (
                <div className="mt-[2px] font-mono text-[11px] text-[color:var(--fg2)]">
                  {t.detail}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
