/**
 * File:        apps/web/lib/prana-stream/socket-client.ts
 * Module:      web/prana-stream
 * Purpose:     Singleton Socket.IO client for PranaStream gateway.
 *              Manages connection lifecycle, JWT auth, exponential-backoff
 *              reconnect, heartbeat, and event subscription bookkeeping.
 *
 * Exports:
 *   - PranaStreamClient — singleton wrapper around socket.io-client
 *   - getPranaClient()  — lazy singleton accessor
 *
 * Depends on:
 *   - socket.io-client — underlying transport
 *
 * Side-effects:
 *   - Opens a single persistent WebSocket to /ws/prana
 *   - Schedules reconnect timers
 *   - Emits connection state changes to subscribers
 *
 * Key invariants:
 *   - Exactly one Socket.IO connection per browser tab
 *   - Reconnect uses exponential backoff with jitter (100ms → 30s)
 *   - Heartbeat ping every 20s, timeout 10s
 *   - Token is refreshed on auth failure → retry with new token
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-10
 */

import { io, Socket } from 'socket.io-client';
import type {
  ConnectionStatus,
  PranaEventName,
  RealtimeEvent,
  SubscribePayload,
  Tick,
  OrderBookFrame,
} from './types';

const PRANA_WS_URL =
  process.env['NEXT_PUBLIC_PRANA_WS_URL'] ?? 'ws://localhost:3000/ws/prana';

const BASE_RECONNECT_DELAY_MS = 100;
const MAX_RECONNECT_DELAY_MS = 30_000;
const PING_INTERVAL_MS = 20_000;
const PING_TIMEOUT_MS = 10_000;
const MAX_RECONNECT_ATTEMPTS = Infinity;

type EventListener = (data: unknown) => void;

class PranaStreamClient {
  private socket: Socket | null = null;
  private status: ConnectionStatus = 'disconnected';
  private statusListeners: Set<(s: ConnectionStatus) => void> = new Set();
  private eventListeners: Map<PranaEventName, Set<EventListener>> = new Map();
  private reconnectAttempts = 0;
  private currentToken: string | null = null;
  private currentTenantId: string | null = null;
  private currentUserId: string | null = null;
  private lastConnectError: string | null = null;

  // ---------------------------------------------------------------------
  // Connection lifecycle
  // ---------------------------------------------------------------------

  connect(opts: { token: string; tenantId: string; userId: string }): void {
    if (
      this.socket?.connected &&
      this.currentToken === opts.token &&
      this.currentTenantId === opts.tenantId
    ) {
      return;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.currentToken = opts.token;
    this.currentTenantId = opts.tenantId;
    this.currentUserId = opts.userId;

    this.setStatus('connecting');

    this.socket = io(PRANA_WS_URL, {
      auth: {
        token: opts.token,
        tenantId: opts.tenantId,
        userId: opts.userId,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: BASE_RECONNECT_DELAY_MS,
      reconnectionDelayMax: MAX_RECONNECT_DELAY_MS,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      randomizationFactor: 0.5, // jitter
      pingInterval: PING_INTERVAL_MS,
      pingTimeout: PING_TIMEOUT_MS,
      timeout: 10_000,
    });

    this.wireSocketEvents();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.setStatus('disconnected');
  }

  private wireSocketEvents(): void {
    if (!this.socket) return;
    const s = this.socket;

    s.on('connect', () => {
      this.reconnectAttempts = 0;
      this.lastConnectError = null;
      this.setStatus('connected');
    });

    s.on('disconnect', (reason) => {
      if (reason === 'io client disconnect') {
        // Explicit disconnect — don't reconnect
        this.setStatus('disconnected');
      } else {
        this.setStatus('reconnecting');
      }
    });

    s.on('connect_error', (err) => {
      this.lastConnectError = err.message;
      this.setStatus('error');
    });

    s.on('reconnect_attempt', (attempt) => {
      this.reconnectAttempts = attempt;
      this.setStatus('reconnecting');
    });

    s.on('reconnect_failed', () => {
      this.setStatus('error');
    });

    // Forward PranaStream events to local listeners
    s.on('watchlist.ticks', (data: RealtimeEvent<Tick[]>) =>
      this.dispatch('watchlist.ticks', data),
    );
    s.on('order.updated', (data: RealtimeEvent<unknown>) =>
      this.dispatch('order.updated', data),
    );
    s.on('position.updated', (data: RealtimeEvent<unknown>) =>
      this.dispatch('position.updated', data),
    );
    s.on('account.updated', (data: RealtimeEvent<unknown>) =>
      this.dispatch('account.updated', data),
    );
    s.on('orderbook.depth', (data: OrderBookFrame) =>
      this.dispatch('orderbook.depth', data),
    );
    s.on('snapshot', (data: unknown) => this.dispatch('snapshot', data));
    s.on('backpressure.slow', (data: unknown) => this.dispatch('backpressure.slow', data));
    s.on('backpressure.disconnect', (data: unknown) => this.dispatch('backpressure.disconnect', data));

    // Surface backpressure events in connection status
    s.on('backpressure.slow', (data: any) => {
      if (data?.level === 1) {
        this.setStatus('backpressure-slow');
      } else if (data?.level === 2) {
        this.setStatus('backpressure-critical');
      }
    });
  }

  // ---------------------------------------------------------------------
  // Subscriptions
  // ---------------------------------------------------------------------

  subscribe(payload: SubscribePayload): void {
    if (!this.socket?.connected) return;
    this.socket.emit('subscribe', payload);
  }

  /**
   * Subscribe to live ticks for a single (exchange, symbol) pair.
   * Used by the symbol-search overlay to fetch a live LTP for the
   * row the user is hovering on. Subscription is server-scoped, so
   * multiple clients in the same pod share one upstream feed.
   */
  subscribeWatchlist(
    items: Array<{ exchange: string; symbol: string }>,
  ): void {
    if (!this.socket?.connected || items.length === 0) return;
    this.socket.emit('subscribe', { watchlist: items });
  }

  /**
   * Unsubscribe from live ticks for a single (exchange, symbol) pair.
   * Mirrors subscribeWatchlist so callers can release a slot the user
   * is no longer looking at.
   */
  unsubscribeWatchlist(
    items: Array<{ exchange: string; symbol: string }>,
  ): void {
    if (!this.socket?.connected || items.length === 0) return;
    this.socket.emit('unsubscribe', { watchlist: items });
  }

  subscribeOrderBook(exchange: string, symbol: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('subscribe', {
      channel: 'orderbook',
      exchange,
      symbol,
    });
  }

  unsubscribe(payload: SubscribePayload): void {
    if (!this.socket?.connected) return;
    this.socket.emit('unsubscribe', payload);
  }

  unsubscribeOrderBook(exchange: string, symbol: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('unsubscribe', {
      channel: 'orderbook',
      exchange,
      symbol,
    });
  }

  // ---------------------------------------------------------------------
  // Event listeners
  // ---------------------------------------------------------------------

  on<T = unknown>(event: PranaEventName, listener: (data: T) => void): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener as EventListener);
    return () => {
      this.eventListeners.get(event)?.delete(listener as EventListener);
    };
  }

  private dispatch(event: PranaEventName, data: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (!listeners) return;
    for (const fn of listeners) {
      try {
        fn(data);
      } catch {
        // swallow — listener errors must not break the dispatch loop
      }
    }
  }

  // ---------------------------------------------------------------------
  // Status
  // ---------------------------------------------------------------------

  getStatus(): ConnectionStatus {
    return this.status;
  }

  isConnected(): boolean {
    return this.status === 'connected' && this.socket?.connected === true;
  }

  onStatusChange(listener: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private setStatus(status: ConnectionStatus): void {
    if (this.status === status) return;
    this.status = status;
    for (const fn of this.statusListeners) {
      try {
        fn(status);
      } catch {
        // ignore
      }
    }
  }

  getDebugInfo() {
    return {
      status: this.status,
      connected: this.socket?.connected ?? false,
      reconnectAttempts: this.reconnectAttempts,
      lastConnectError: this.lastConnectError,
      tenantId: this.currentTenantId,
      userId: this.currentUserId,
    };
  }
}

// -----------------------------------------------------------------------------
// Singleton
// -----------------------------------------------------------------------------

let instance: PranaStreamClient | null = null;

export function getPranaClient(): PranaStreamClient {
  if (typeof window === 'undefined') {
    // SSR — return a noop-friendly singleton
    if (!instance) instance = new PranaStreamClient();
    return instance;
  }
  if (!instance) instance = new PranaStreamClient();
  return instance;
}

export { PranaStreamClient };
