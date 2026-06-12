/**
 * @file src/modules/realtime/prana-stream/events/contracts.ts
 * @module realtime/prana-stream
 * @description Realtime event contracts.
 *              Add new event types to the union as the system grows.
 * @author BharatERP
 * @created 2025-09-24
 * @last-updated 2026-06-10
 */

export type RealtimeEventName =
  | 'watchlist.tick'
  | 'order.updated'
  | 'position.updated'
  | 'account.updated'
  | 'margin.breach';

export type RealtimeEvent<T> = {
  type: RealtimeEventName;
  userId: string;
  requestId?: string;
  seq: number;
  ts: string;
  data: T;
  v: 1;
};

/**
 * Margin breach payload — emitted when a user's account falls below the
 * required margin (e.g. due to a large adverse move or a new order).
 * The client renders a blocking modal/sound and disables new orders
 * until the breach is cleared.
 */
export type MarginBreachPayload = {
  accountId: string;
  /** Required margin in account currency. */
  requiredMargin: string;
  /** Available cash in account currency. */
  availableCash: string;
  /** Shortfall = max(0, requiredMargin - availableCash). */
  shortfall: string;
  /**
   * Severity — controls the client behavior:
   *   'warning'   — shortfall < 20% of required, client shows toast
   *   'critical'  — shortfall < 5% of required, client shows blocking modal
   *   'breach'    — availableCash <= 0, client squares off (live)
   */
  severity: 'warning' | 'critical' | 'breach';
  /** The trigger that caused the breach (e.g. order id, position). */
  triggeredBy?: { kind: 'order' | 'position'; id: string };
  /** When the breach was detected. */
  ts: string;
};
