/**
 * @file workstation-api.ts
 * @module web-trading
 * @description Merge `/market/watchlists` data with mock catalogue; optional OMS submit via `/api/orders`.
 * @author BharatERP
 * @created 2026-04-03
 */

import { nanoid } from 'nanoid';
import type { Instrument } from './types';

type WatchlistRow = { id: string; name: string };
type WatchlistItemRow = { id: string; instrumentId: string };

export type FetchJsonFn = (path: string, init?: RequestInit) => Promise<unknown>;

/** Prepend instruments built from the first server watchlist (symbol is a short id label until quotes API exists). */
export async function mergeApiWatchlistInstruments(
  fetchJson: FetchJsonFn,
  base: Instrument[],
): Promise<Instrument[]> {
  try {
    const lists = (await fetchJson('/market/watchlists')) as WatchlistRow[];
    if (!Array.isArray(lists) || lists.length === 0) {
      return base;
    }
    const first = lists[0];
    const items = (await fetchJson(`/market/watchlists/${first.id}/items`)) as WatchlistItemRow[];
    if (!Array.isArray(items) || items.length === 0) {
      return base;
    }
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

/** POST PlaceOrderDto to backend. Requires env account id and instrument.instrumentId (or NEXT_PUBLIC_DEMO_INSTRUMENT_ID). */
export async function submitOrderToOms(fetchJson: FetchJsonFn, ui: PlaceUiOrder): Promise<{ ok: true; detail?: string } | { ok: false; message: string }> {
  const accountId = process.env.NEXT_PUBLIC_DEFAULT_TRADING_ACCOUNT_ID;
  const demoInstrumentId = process.env.NEXT_PUBLIC_DEMO_INSTRUMENT_ID;
  const instrumentId = ui.instrument?.instrumentId ?? demoInstrumentId;

  if (!accountId) {
    return { ok: false, message: 'Set NEXT_PUBLIC_DEFAULT_TRADING_ACCOUNT_ID for live OMS submit.' };
  }
  if (!instrumentId) {
    return {
      ok: false,
      message: 'Pick a watchlist-backed instrument or set NEXT_PUBLIC_DEMO_INSTRUMENT_ID.',
    };
  }

  const qty = (parseFloat(ui.lots || '0') || 0).toFixed(2);
  if (!/^\d{1,20}(\.\d{1,8})?$/.test(qty)) {
    return { ok: false, message: 'Invalid lot size for OMS quantity string.' };
  }

  const apiType: 'MARKET' | 'LIMIT' = ui.type === 'Market' ? 'MARKET' : 'LIMIT'; // Stop → LIMIT bridge until native STOP exists
  const side: 'BUY' | 'SELL' = ui.side === 'buy' ? 'BUY' : 'SELL';

  let priceStr: string | undefined;
  if (apiType === 'LIMIT') {
    const p =
      ui.price ||
      (ui.instrument ? String(ui.side === 'buy' ? ui.instrument.ask : ui.instrument.bid) : '');
    const n = parseFloat(p);
    if (!p || Number.isNaN(n)) {
      return { ok: false, message: 'Limit/stop-style orders need a valid price for OMS LIMIT mapping.' };
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
    clientOrderId: `web-${nanoid(10)}`,
    externalRefId: `ext-${nanoid(12)}`,
  };

  try {
    const res = await fetchJson('/api/orders', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return { ok: true, detail: JSON.stringify(res) };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'OMS request failed';
    return { ok: false, message: msg };
  }
}
