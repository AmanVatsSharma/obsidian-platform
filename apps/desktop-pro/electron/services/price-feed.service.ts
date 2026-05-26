/**
 * File:        apps/desktop-pro/electron/services/price-feed.service.ts
 * Module:      desktop-pro · Services · Price Feed
 * Purpose:     Singleton Socket.IO client in the main process — receives ticks and fans them out
 *              to all renderer windows via ipcMain so N windows share one backend connection.
 *
 * Exports:
 *   - PriceFeedService — class with connect, disconnect, subscribe, unsubscribe
 *
 * Depends on:
 *   - socket.io-client — io
 *   - electron — BrowserWindow
 *
 * Side-effects:
 *   - Opens one persistent WebSocket to the Obsidian backend realtime gateway
 *   - Calls webContents.send('feed:tick:<symbol>', tick) on every registered renderer window
 *
 * Key invariants:
 *   - One Socket.IO connection for the entire app — never one per window
 *   - subscribe() is idempotent for the same symbol
 *   - Dead windows are filtered out before broadcast
 *   - Token injected via setToken() before connect() is called by auth flow
 *
 * Read order:
 *   1. PriceFeedService.connect — socket setup + event handlers
 *   2. broadcast — fan-out logic
 *   3. subscribe/unsubscribe — symbol registry
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

import { BrowserWindow } from 'electron';
import { io, type Socket } from 'socket.io-client';

export class PriceFeedService {
  private socket: Socket | null = null;
  private token: string | null = null;
  private subscribedSymbols = new Set<string>();

  setToken(token: string): void {
    this.token = token;
    if (this.socket?.connected) {
      this.socket.disconnect();
      this.connect();
    }
  }

  connect(url = process.env['OBSIDIAN_WS_URL'] ?? 'http://localhost:3000'): void {
    if (this.socket?.connected) return;

    this.socket = io(url, {
      auth: this.token ? { token: this.token } : undefined,
      transports: ['websocket'],
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity,
    });

    this.socket.on('connect', () => {
      for (const symbol of this.subscribedSymbols) {
        this.socket?.emit('subscribe', { symbol });
      }
    });

    this.socket.on('price:tick', (tick: { symbol: string; [k: string]: unknown }) => {
      this.broadcast(`feed:tick:${tick.symbol}`, tick);
    });

    this.socket.on('disconnect', (reason: string) => {
      if (reason === 'io server disconnect') {
        setTimeout(() => this.socket?.connect(), 2000);
      }
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  subscribe(symbol: string): void {
    this.subscribedSymbols.add(symbol);
    this.socket?.emit('subscribe', { symbol });
  }

  unsubscribe(symbol: string): void {
    this.subscribedSymbols.delete(symbol);
    this.socket?.emit('unsubscribe', { symbol });
  }

  private broadcast(channel: string, payload: unknown): void {
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) {
        win.webContents.send(channel, payload);
      }
    }
  }
}
