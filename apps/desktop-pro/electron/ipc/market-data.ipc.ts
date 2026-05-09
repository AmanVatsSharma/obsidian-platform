/**
 * File:        apps/desktop-pro/electron/ipc/market-data.ipc.ts
 * Module:      desktop-pro · IPC · Market Data
 * Purpose:     IPC handlers for price feed subscribe/unsubscribe — bridges renderer to PriceFeedService.
 *
 * Exports:
 *   - registerMarketDataIpc(ipcMain, priceFeed) → void
 *
 * Depends on:
 *   - ../services/price-feed.service — PriceFeedService singleton
 *
 * Side-effects:
 *   - Registers 'feed:subscribe' and 'feed:unsubscribe' ipcMain handles
 *   - Causes PriceFeedService to open/close subscriptions on the Socket.IO connection
 *
 * Key invariants:
 *   - PriceFeedService fan-outs ticks back to renderers via webContents.send('feed:tick:<symbol>')
 *   - Multiple renderer windows share one Socket.IO connection (main owns the socket)
 *
 * Read order:
 *   1. registerMarketDataIpc — subscribe/unsubscribe handlers
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

import type { IpcMain } from 'electron';
import type { PriceFeedService } from '../services/price-feed.service';

export function registerMarketDataIpc(ipcMain: IpcMain, priceFeed: PriceFeedService): void {
  ipcMain.handle('feed:subscribe', (_event: unknown, symbol: string) => {
    priceFeed.subscribe(symbol);
  });

  ipcMain.handle('feed:unsubscribe', (_event: unknown, symbol: string) => {
    priceFeed.unsubscribe(symbol);
  });
}
