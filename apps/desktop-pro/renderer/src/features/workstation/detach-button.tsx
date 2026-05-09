/**
 * File:        apps/desktop-pro/renderer/src/features/workstation/detach-button.tsx
 * Module:      desktop-pro · Renderer · Workstation · Detach Button
 * Purpose:     Tear-off button that opens a panel in its own BrowserWindow on any connected monitor.
 *              Calls ntBridge.window.openChart() or openMonitor() to trigger the main-process factory.
 *
 * Exports:
 *   - DetachChartButton({ symbol }) → ReactNode  — opens a chart window for symbol
 *   - DetachMonitorButton({ symbol }) → ReactNode — opens a DOM/monitor window for symbol
 *
 * Depends on:
 *   - react — none (no hooks needed — pure event handler)
 *   - ../../shared/bridge/nt-bridge.d — window.ntBridge (ambient)
 *
 * Side-effects:
 *   - Invokes ntBridge.window.openChart / openMonitor (IPC call to main process)
 *   - Main process either focuses an existing window or creates a new BrowserWindow
 *
 * Key invariants:
 *   - Button is a no-op if ntBridge is absent (e.g., browser dev mode without Electron)
 *   - Title attribute explains the action for discoverability
 *
 * Read order:
 *   1. DetachChartButton
 *   2. DetachMonitorButton
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

export function DetachChartButton({ symbol }: { symbol: string }) {
  return (
    <button
      className="detach-btn"
      onClick={() => window.ntBridge?.window.openChart(symbol)}
      title={`Open ${symbol} chart in a new window`}
      aria-label={`Detach ${symbol} chart`}
    >
      ⬡
    </button>
  );
}

export function DetachMonitorButton({ symbol }: { symbol: string }) {
  return (
    <button
      className="detach-btn"
      onClick={() => window.ntBridge?.window.openMonitor(symbol)}
      title={`Open ${symbol} depth monitor in a new window`}
      aria-label={`Detach ${symbol} monitor`}
    >
      ⬡
    </button>
  );
}
