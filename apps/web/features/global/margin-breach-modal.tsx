/**
 * @file margin-breach-modal.tsx
 * @module web · global
 * @description Global margin-breach modal. Subscribes to PranaStream
 *              `margin.breach` events via `useMarginBreach` and renders a
 *              blocking dialog (severity ∈ {critical, breach}) that
 *              prevents further order entry, or a dismissable warning
 *              banner (severity = 'warning').
 *
 *              Mounted in the (trader) layout so it covers every trader page.
 *              Mobile users see the same dialog (full-screen, blocking).
 *
 * Exports:
 *   - MarginBreachModal() → ReactNode — null when no breach
 *
 * Depends on:
 *   - @/lib/prana-stream — useMarginBreach
 *   - @obsidian/obsidian-ui — ObsidianDialog, Button
 *   - next/link — Link to /funds
 *
 * Side-effects:
 *   - Subscribes to the margin.breach PranaStream event
 *   - Renders a fixed overlay (z-index high) when isBlocking is true
 *
 * Key invariants:
 *   - Blocking dialog CANNOT be dismissed by the user; the only escape
 *     is to top up margin or close positions (→ /funds)
 *   - Warning toast is dismissable but the underlying breach is still
 *     tracked server-side
 *
 * Author:      BharatERP
 * @created     2026-06-12
 * @last-updated 2026-06-12
 */

'use client';

import Link from 'next/link';
import { useMarginBreach } from '@/lib/prana-stream';
import { Button, ObsidianDialog } from '@obsidian/obsidian-ui';

export function MarginBreachModal() {
  const { breach, isBlocking, dismiss } = useMarginBreach();

  if (!breach) return null;

  // Non-blocking warning → render a fixed bottom banner. Dismissible.
  if (!isBlocking) {
    return (
      <div
        role="alert"
        data-testid="margin-breach-warning"
        className="fixed bottom-4 left-1/2 z-50 flex max-w-md -translate-x-1/2 items-center gap-3 rounded-obs border border-[color:var(--warning)]/30 bg-obsidian-elevated px-4 py-2 shadow-obs-md"
      >
        <div className="flex-1 text-sm text-obsidian-primary">
          <span className="font-semibold uppercase tracking-wider text-[color:var(--warning)]">
            Margin warning
          </span>{' '}
          — equity is close to the maintenance threshold. Top up soon.
        </div>
        <Link
          href="/funds"
          className="text-xs font-medium text-[color:var(--accent)] hover:underline"
        >
          Top up
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={dismiss}
          data-testid="margin-breach-warning-dismiss"
        >
          Dismiss
        </Button>
      </div>
    );
  }

  // Blocking dialog — cannot be dismissed; only escape is /funds.
  return (
    <ObsidianDialog
      open
      onOpenChange={() => {
        /* no-op — cannot dismiss a blocking breach */
      }}
      trigger={null}
      title={
        breach.severity === 'breach'
          ? 'MARGIN CALL — TRADING HALTED'
          : 'CRITICAL MARGIN ALERT'
      }
      description={
        breach.severity === 'breach'
          ? 'Your account has breached the maintenance margin requirement. Open positions may be force-closed. No new orders can be placed until equity is restored.'
          : 'Margin level is critical. New orders will be rejected by the OMS until you deposit funds or close positions.'
      }
      footer={
        <Link
          href="/funds"
          className="inline-flex items-center justify-center rounded-obs bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-obsidian-primary hover:opacity-90"
          data-testid="margin-breach-topup"
        >
          Top up now
        </Link>
      }
    >
      <div className="flex flex-col gap-2 text-sm text-obsidian-primary">
        <div>
          <span className="text-obsidian-faint">Account:</span>{' '}
          <span className="font-mono">{breach.accountId}</span>
        </div>
        <div>
          <span className="text-obsidian-faint">Required margin:</span>{' '}
          <span className="font-mono">${parseFloat(breach.requiredMargin).toLocaleString()}</span>
        </div>
        <div>
          <span className="text-obsidian-faint">Available cash:</span>{' '}
          <span className="font-mono">${parseFloat(breach.availableCash).toLocaleString()}</span>
        </div>
        <div>
          <span className="text-obsidian-faint">Shortfall:</span>{' '}
          <span className="font-mono text-[color:var(--bear)]">
            ${parseFloat(breach.shortfall).toLocaleString()}
          </span>
        </div>
        {breach.triggeredBy && (
          <div>
            <span className="text-obsidian-faint">Triggered by:</span>{' '}
            <span className="font-mono">
              {breach.triggeredBy.kind} {breach.triggeredBy.id}
            </span>
          </div>
        )}
        <div className="mt-2 text-xs text-obsidian-secondary">
          Detected {new Date(breach.ts).toLocaleString()}. This dialog will remain until
          margin is restored.
        </div>
      </div>
    </ObsidianDialog>
  );
}
