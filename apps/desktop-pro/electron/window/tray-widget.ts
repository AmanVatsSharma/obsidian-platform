/**
 * File:        apps/desktop-pro/electron/window/tray-widget.ts
 * Module:      desktop-pro · Main · Tray Widget
 * Purpose:     System tray icon with live price/P&L tooltip, context menu for quick actions,
 *              and macOS menu-bar title showing the current instrument bid/ask.
 *
 * Exports:
 *   - TrayWidget — class; call .create(mainWin) then .updatePrice(symbol, bid, ask, pnl)
 *
 * Depends on:
 *   - electron — Tray, Menu, MenuItem, nativeImage, app, BrowserWindow
 *
 * Side-effects:
 *   - Creates a persistent OS tray icon on .create()
 *   - Calls win.webContents.send('quick-order', ...) on BUY/SELL menu actions
 *
 * Key invariants:
 *   - Icon is a minimal 16x16 placeholder PNG (base64); replace with a proper icon
 *     at resources/tray-icon.png for production builds
 *   - On macOS, .setTitle() shows text in the menu bar alongside the icon
 *   - On Windows, .setToolTip() shows the price in the hover tooltip
 *   - Menu is rebuilt only when the main window reference changes; tooltip updates in-place
 *
 * Read order:
 *   1. TrayWidget.create — icon init + menu build
 *   2. TrayWidget.updatePrice — live data refresh
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

import { app, BrowserWindow, Menu, nativeImage, Tray } from 'electron';

// Minimal 16x16 dark square PNG as base64 — replace with branded icon in production.
const ICON_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAC0lEQVQ42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

export class TrayWidget {
  private tray: Tray | null = null;
  private mainWin: BrowserWindow | null = null;

  create(mainWin: BrowserWindow): void {
    this.mainWin = mainWin;
    const icon = nativeImage.createFromDataURL(ICON_DATA_URL);
    this.tray = new Tray(icon.resize({ width: 16, height: 16 }));
    this.tray.setToolTip('Obsidian Pro');
    this.rebuildMenu();

    this.tray.on('click', () => {
      if (!this.mainWin || this.mainWin.isDestroyed()) return;
      if (this.mainWin.isMinimized()) this.mainWin.restore();
      this.mainWin.show();
      this.mainWin.focus();
    });
  }

  updatePrice(symbol: string, bid: number, ask: number, pnlUsd: number): void {
    if (!this.tray || this.tray.isDestroyed()) return;
    const sign = pnlUsd >= 0 ? '+' : '';
    const tooltip = `${symbol}  ${bid.toFixed(5)} / ${ask.toFixed(5)}\nP&L: ${sign}$${pnlUsd.toFixed(2)}`;
    this.tray.setToolTip(tooltip);
    if (process.platform === 'darwin') {
      const pnlColor = pnlUsd >= 0 ? '▲' : '▼';
      this.tray.setTitle(` ${pnlColor} ${sign}$${Math.abs(pnlUsd).toFixed(2)}`);
    }
  }

  destroy(): void {
    if (this.tray && !this.tray.isDestroyed()) this.tray.destroy();
    this.tray = null;
  }

  private rebuildMenu(): void {
    if (!this.tray) return;
    const win = this.mainWin;

    const menu = Menu.buildFromTemplate([
      { label: 'Obsidian Pro', enabled: false },
      { type: 'separator' },
      {
        label: 'Open Terminal',
        click: () => {
          if (!win || win.isDestroyed()) return;
          if (win.isMinimized()) win.restore();
          win.show();
          win.focus();
        },
      },
      { type: 'separator' },
      {
        label: 'Quick BUY',
        click: () => win?.webContents.send('quick-order', { side: 'buy' }),
      },
      {
        label: 'Quick SELL',
        click: () => win?.webContents.send('quick-order', { side: 'sell' }),
      },
      { type: 'separator' },
      {
        label: 'Launch at Login',
        type: 'checkbox',
        checked: app.getLoginItemSettings().openAtLogin,
        click: (item: { checked: boolean }) => {
          app.setLoginItemSettings({ openAtLogin: item.checked });
        },
      },
      { type: 'separator' },
      { label: 'Quit Obsidian', click: () => app.quit() },
    ]);

    this.tray.setContextMenu(menu);
  }
}
