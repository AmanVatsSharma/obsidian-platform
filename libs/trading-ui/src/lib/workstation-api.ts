/**
 * File:        libs/trading-ui/src/lib/workstation-api.ts
 * Module:      trading-ui · API
 * Purpose:     Watchlist merge and OMS order submission — decoupled from platform-specific env vars.
 *
 * Exports:
 *   - FetchJsonFn                                  — injectable fetch abstraction (web uses fetch+auth; desktop uses IPC bridge)
 *   - OmsConfig                                    — injectable account/instrument ids (replaces NEXT_PUBLIC_* env vars)
 *   - PlaceUiOrder                                 — order payload shape from the OrderEntry panel
 *   - mergeApiWatchlistInstruments(fn, base) → Instrument[]   — prepend OMS watchlist rows to mock catalogue
 *   - submitOrderToOms(fn, ui, config?) → Result  — POST PlaceOrderDto to backend via injected fetchFn
 *
 * Depends on:
 *   - nanoid — client order ID generation
 *   - ../types/instrument — Instrument type
 *
 * Side-effects:
 *   - Network call via fetchJson (caller-provided)
 *
 * Key invariants:
 *   - fetchJson is fully injected — no direct use of window.fetch, process.env, or localStorage
 *   - submitOrderToOms returns { ok: false, message } on every failure path; never throws
 *   - OmsConfig.accountId must be provided for live OMS submit; absence returns { ok: false }
 *
 * Read order:
 *   1. FetchJsonFn / OmsConfig — understand injection contract
 *   2. submitOrderToOms — core OMS bridge
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

import { nanoid } from 'nanoid';
import type { Instrument } from '../types/instrument';

type WatchlistRow = { id: string; name: string };
type WatchlistItemRow = { id: string; instrumentId: string };

export type FetchJsonFn = (path: string, init?: RequestInit) => Promise<unknown>;

export type OmsConfig = {
  /** Trading account UUID. Required for live OMS submission. */
  accountId?: string;
  /** Fallback instrument ID when active instrument has no OMS backing. */
  demoInstrumentId?: string;
};

export async function mergeApiWatchlistInstruments(
  fetchJson: FetchJsonFn,
  base: Instrument[],
): Promise<Instrument[]> {
  try {
    const lists = (await fetchJson('/market/watchlists')) as WatchlistRow[];
    if (!Array.isArray(lists) || lists.length === 0) return base;
    const first = lists[0];
    const items = (await fetchJson(`/market/watchlists/${first.id}/items`)) as WatchlistItemRow[];
    if (!Array.isArray(items) || items.length === 0) return base;
    const extra: Instrument[] = items.map((it, i) => {
      const id = it.instrumentId || it.id;
      const short = id.length > 8 ? `${id.slice(0, 6)}…` : id;
      const seed = 1.0845 + i * 0.00017;
      return {
        symbol: short,
        name: `WL · ${first.name}`,
        bid: seed,
        ask: seed + 0.00006,
        change: 0,
        changePct: 0,
        high: seed + 0.002,
        low: seed - 0.002,
        spread: 0.6,
        pip: 0.0001,
        category: 'forex',
        digits: 5,
        instrumentId: id,
      };
    });
    return [...extra, ...base];
  } catch {
    return base;
  }
}

export type PlaceUiOrder = {
  side: 'buy' | 'sell';
  type: string;
  lots: string;
  sl: string;
  tp: string;
  price: string;
  instrument: Instrument | null;
};

export async function submitOrderToOms(
  fetchJson: FetchJsonFn,
  ui: PlaceUiOrder,
  config?: OmsConfig,
): Promise<{ ok: true; detail?: string } | { ok: false; message: string }> {
  const { accountId, demoInstrumentId } = config ?? {};
  const instrumentId = ui.instrument?.instrumentId ?? demoInstrumentId;

  if (!accountId) {
    return { ok: false, message: 'No accountId configured for OMS submission.' };
  }
  if (!instrumentId) {
    return { ok: false, message: 'Pick a watchlist-backed instrument or configure demoInstrumentId.' };
  }

  const qty = (parseFloat(ui.lots || '0') || 0).toFixed(2);
  if (!/^\d{1,20}(\.\d{1,8})?$/.test(qty)) {
    return { ok: false, message: 'Invalid lot size for OMS quantity string.' };
  }

  const apiType: 'MARKET' | 'LIMIT' = ui.type === 'Market' ? 'MARKET' : 'LIMIT';
  const side: 'BUY' | 'SELL' = ui.side === 'buy' ? 'BUY' : 'SELL';

  let priceStr: string | undefined;
  if (apiType === 'LIMIT') {
    const p =
      ui.price ||
      (ui.instrument ? String(ui.side === 'buy' ? ui.instrument.ask : ui.instrument.bid) : '');
    const n = parseFloat(p);
    if (!p || Number.isNaN(n)) {
      return { ok: false, message: 'Limit/stop orders require a valid price.' };
    }
    priceStr = n.toFixed(Math.min(8, (ui.instrument?.digits ?? 5) + 2));
  }

  const body = {
    accountId,
    instrumentId,
    side,
    type: apiType,
    quantity: qty,
    ...(priceStr ? { price: priceStr } : {}),
    timeInForce: 'DAY' as const,
    clientOrderId: `nt-${nanoid(10)}`,
    externalRefId: `ext-${nanoid(12)}`,
  };

  try {
    const res = await fetchJson('/api/orders', { method: 'POST', body: JSON.stringify(body) });
    return { ok: true, detail: JSON.stringify(res) };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'OMS request failed';
    return { ok: false, message: msg };
  }
}
