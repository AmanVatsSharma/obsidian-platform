/**
 * File:        apps/dealer-workstation/src/app/page.tsx
 * Module:      dealer-workstation · Root
 * Purpose:     Full-screen Bloomberg-style dealing terminal. Renders the 3-column
 *              CSS Grid shell, mounts all panels, and wires up global keyboard
 *              shortcuts (A/R/Q/Tab/Esc/?).
 *
 * Exports:
 *   - default DealerTerminal() — root page component
 *
 * Depends on:
 *   - mock-data-context   — DeskState via useDeskData()
 *   - confirm-modal       — emergency action confirm gate
 *   - toast-container     — global notification stack
 *   - kb-overlay          — keyboard shortcut reference overlay
 *
 * Key invariants:
 *   - overflow: hidden on every container — terminal never scrolls at page level
 *   - min-width 1440px enforced on .desk-shell; narrower viewports get horizontal scroll
 *   - Emergency actions (HALT/WIDEN/SUSPEND/FLATTEN) require typed confirmation
 *   - Keyboard listener attached to window (not a div) so no focus prerequisite
 *
 * Side-effects:
 *   - window.addEventListener('keydown', …) — global keyboard shortcuts
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

'use client';

import { useEffect, useState } from 'react';
import { useDeskData }      from '../lib/mock-data-context';
import { CmdBar }           from '../components/desk-shell/cmd-bar';
import { StatusBar }        from '../components/desk-shell/status-bar';
import { OrderQueue }       from '../components/left-rail/order-queue';
import { ClientWatchlist }  from '../components/left-rail/client-watchlist';
import { PriceBoard }       from '../components/price-board/price-board';
import { Workspace }        from '../components/workspace/workspace';
import { RightRail }        from '../components/right-rail/right-rail';
import { ConfirmModal }     from '../components/shared/confirm-modal';
import { ToastContainer }   from '../components/shared/toast-container';
import { KbOverlay }        from '../components/shared/kb-overlay';

type EmergencyAction = 'HALT' | 'WIDEN' | 'SUSPEND' | 'FLATTEN';

export default function DealerTerminal() {
  const {
    pendingOrders,
    focusedOrderIdx,
    setFocusedOrderIdx,
    acceptOrder,
    rejectOrder,
    requoteOrder,
    setHaltTrading,
    setSpreadMultiplier,
    spreadMultiplier,
    addToast,
  } = useDeskData();

  const [emergencyAction, setEmergencyAction] = useState<EmergencyAction | null>(null);
  const [showKbOverlay,   setShowKbOverlay]   = useState(false);

  /* Global keyboard shortcuts — attached to window so no focus needed */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      switch (e.key) {
        case 'a':
        case 'A': {
          const order = pendingOrders[focusedOrderIdx];
          if (order) acceptOrder(order.id);
          break;
        }
        case 'r':
        case 'R': {
          const order = pendingOrders[focusedOrderIdx];
          if (order) rejectOrder(order.id);
          break;
        }
        case 'q':
        case 'Q': {
          const order = pendingOrders[focusedOrderIdx];
          if (order) {
            requoteOrder(order.id, order.marketPrice);
            addToast({ type: 'warn', icon: '↔', title: 'Requote Sent', msg: `${order.symbol} → ${order.clientName}` });
          }
          break;
        }
        case 'Tab': {
          e.preventDefault();
          if (pendingOrders.length > 0) {
            setFocusedOrderIdx((focusedOrderIdx + 1) % pendingOrders.length);
          }
          break;
        }
        case 'Escape': {
          setFocusedOrderIdx(-1);
          setShowKbOverlay(false);
          setEmergencyAction(null);
          break;
        }
        case '?': {
          setShowKbOverlay(v => !v);
          break;
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pendingOrders, focusedOrderIdx, acceptOrder, rejectOrder, requoteOrder, setFocusedOrderIdx, addToast]);

  function handleEmergencyConfirm(action: EmergencyAction) {
    setEmergencyAction(null);
    switch (action) {
      case 'HALT':
        setHaltTrading(true);
        addToast({ type: 'reject', icon: '🛑', title: 'TRADING HALTED', msg: 'All order processing suspended.' });
        break;
      case 'WIDEN':
        setSpreadMultiplier(spreadMultiplier === 1 ? 3 : 1);
        addToast({ type: 'warn', icon: '⚡', title: 'SPREADS WIDENED', msg: 'Client spreads set to 3× market.' });
        break;
      case 'SUSPEND':
        addToast({ type: 'warn', icon: '⏸', title: 'AUTO-ACCEPT SUSPENDED', msg: 'All orders require manual dealing.' });
        break;
      case 'FLATTEN':
        addToast({ type: 'warn', icon: '⚡', title: 'FLATTEN IN PROGRESS', msg: 'Closing all net positions via LP1.' });
        break;
    }
  }

  return (
    <>
      <div className="desk-shell">
        <CmdBar onEmergency={action => setEmergencyAction(action as EmergencyAction)} onShowKb={() => setShowKbOverlay(v => !v)} />

        <div className="desk-body">
          {/* Left rail: order queue + client watchlist */}
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-surface)', borderRight: '2px solid var(--border-md)' }}>
            <OrderQueue />
            <ClientWatchlist />
          </div>

          {/* Center: price board + 6-tab workspace */}
          <div className="desk-center">
            <PriceBoard />
            <Workspace />
          </div>

          <RightRail />
        </div>

        <StatusBar />
      </div>

      <ToastContainer />
      {showKbOverlay   && <KbOverlay onClose={() => setShowKbOverlay(false)} />}
      {emergencyAction && (
        <ConfirmModal
          action={emergencyAction}
          onConfirm={() => handleEmergencyConfirm(emergencyAction)}
          onCancel={() => setEmergencyAction(null)}
        />
      )}
    </>
  );
}
