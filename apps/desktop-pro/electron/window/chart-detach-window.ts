/**
 * File:        apps/desktop-pro/electron/window/chart-detach-window.ts
 * Module:      desktop-pro · Main · Chart Detach Window
 * Purpose:     BrowserWindow factory for standalone chart panels torn off from the main workstation.
 *              Opens on the monitor nearest the cursor at the time of the detach action.
 *
 * Exports:
 *   - createChartWindow(symbol) → BrowserWindow
 *   - createMonitorWindow(symbol) → BrowserWindow
 *
 * Depends on:
 *   - electron — BrowserWindow, screen
 *   - path — join (for preload path resolution)
 *
 * Side-effects:
 *   - Creates a new BrowserWindow and loads the renderer hash route
 *
 * Key invariants:
 *   - Same contextIsolation/sandbox/no-nodeIntegration security model as the main window
 *   - Window placement uses screen.getCursorScreenPoint() so it opens on the right monitor
 *   - preload path resolves relative to the compiled main bundle location (dist/main/)
 *
 * Read order:
 *   1. makeDetachedWindow — shared factory
 *   2. createChartWindow / createMonitorWindow — typed wrappers
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

import { BrowserWindow, screen } from 'electron';
import { join } from 'path';

const isDev = process.env['NODE_ENV'] === 'development';

function makeDetachedWindow(route: string, title: string, width = 900, height = 640): BrowserWindow {
  const point = screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(point);
  const { x, y, width: dw, height: dh } = display.workArea;

  const win = new BrowserWindow({
    x: x + Math.floor((dw - width) / 2),
    y: y + Math.floor((dh - height) / 2),
    width,
    height,
    title,
    backgroundColor: '#06080A',
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  const url = isDev
    ? `http://localhost:5173/#${route}`
    : `file://${join(__dirname, '../renderer/index.html')}#${route}`;

  void win.loadURL(url);
  win.once('ready-to-show', () => win.show());
  return win;
}

export function createChartWindow(symbol: string): BrowserWindow {
  return makeDetachedWindow(`/detached/chart/${symbol}`, `Chart — ${symbol}`, 1000, 680);
}

export function createMonitorWindow(symbol: string): BrowserWindow {
  return makeDetachedWindow(`/detached/monitor/${symbol}`, `Monitor — ${symbol}`, 480, 600);
}
