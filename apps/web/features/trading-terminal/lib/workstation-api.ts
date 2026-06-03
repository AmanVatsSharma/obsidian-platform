/**
 * File:        apps/web/features/trading-terminal/lib/workstation-api.ts
 * Module:      web-trading
 * Purpose:     Merge `/market/watchlists` data with mock catalogue; optional OMS
 *              submit via `/api/orders`, `/api/orders/bracket`, and `/api/orders/algo`.
 *
 * Exports:
 *   - FetchJsonFn                                       — injectable fetch (web: fetch+auth)
 *   - PlaceUiOrder                                      — UI order payload (includes algo fields)
 *   - mergeApiWatchlistInstruments(fn, base) → Instrument[]   — prepend OMS watchlist rows
 *   - submitOrderToOms(fn, ui) → Result                 — POST PlaceOrderDto
 *   - submitAlgoOrderToOms(fn, ui) → Result             — POST /api/orders/algo (TWAP/VWAP/ICEBERG)
 *   - submitBracketOrderToOms(fn, ui) → Result          — POST /api/orders/bracket
 *   - fetchOrderBookDepth(fn, symbol, levels?) → OrderBookDepth
 *
 * Depends on:
 *   - nanoid — client order ID generation
 *
 * Side-effects:
 *   - Network calls via fetchJson (REST against /api/orders, /api/orders/bracket, /api/orders/algo)
 *
 * Key invariants:
 *   - submitAlgoOrderToOms accepts only TWAP / VWAP / ICEBERG; other types return { ok: false }
 *   - For TWAP/VWAP, sliceCount >= 2; for ICEBERG, sliceCount is the visible qty per slice (>= 1)
 *   - VWAP / ICEBERG require priceLimit (falls back to bid/ask if not supplied)
 *   - All three submit helpers return the same { ok, detail | message } envelope; never throw
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-03
 */

import { nanoid } from 'nanoid';
import type {
  Instrument,
  OrderTypeExtended,
  TriggerCondition,
  PlaceBracketOrderRequest,
  OrderBookDepth,
  OrderBookLevel,
} from './types';

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
  /**
   * Algo type discriminator. Set by the form when type is TWAP / VWAP / ICEBERG.
   * The dispatch bridge routes to submitAlgoOrderToOms when this is one of those three.
   */
  algoType?: 'TWAP' | 'VWAP' | 'ICEBERG';
  /** TWAP / VWAP: number of slices. ICEBERG: visible qty per slice. */
  slices?: number;
  /** TWAP / VWAP: total duration in minutes. */
  durationMinutes?: number;
  /** ICEBERG: visible quantity per slice. (Same slot as slices — prefer slices for ICEBERG.) */
  displayQty?: number;
  /** VWAP / ICEBERG: limit price for child orders. Falls back to bid/ask. */
  priceLimit?: string;
  /** GTT trigger price — passed through for non-algo GTT orders. */
  triggerPrice?: string;
  triggerCondition?: 'ABOVE' | 'BELOW';
  /** Trailing-stop controls. */
  trailingDistance?: string;
  trailingPct?: string;
};

/**
 * Map UI type label to API OrderTypeExtended value.
 * Unrecognised labels default to LIMIT (covers legacy "Limit" / "Stop" / "Market" strings).
 */
function resolveApiType(uiType: string): OrderTypeExtended {
  const map: Record<string, OrderTypeExtended> = {
    Market: 'MARKET',
    Limit: 'LIMIT',
    Stop: 'STOP',
    GTT: 'GTT',
    Trailing: 'TRAILING_STOP',
    Iceberg: 'ICEBERG',
    TWAP: 'TWAP',
    VWAP: 'VWAP',
  };
  return map[uiType] ?? 'LIMIT';
}

/**
 * POST PlaceOrderDto (non-bracket) to backend.
 * Handles MARKET/LIMIT/STOP/GTT/TRAILING_STOP/ICEBERG/TWAP/VWAP payloads.
 */
export async function submitOrderToOms(
  fetchJson: FetchJsonFn,
  ui: PlaceUiOrder,
): Promise<{ ok: true; detail?: string } | { ok: false; message: string }> {
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

  const qty = parseFloat(ui.lots || '0');
  if (isNaN(qty) || qty <= 0) {
    return { ok: false, message: 'Quantity must be greater than 0' };
  }
  const qtyStr = qty.toFixed(2);
  if (!/^\d{1,20}(\.\d{1,8})?$/.test(qtyStr)) {
    return { ok: false, message: 'Invalid lot size for OMS quantity string.' };
  }

  const apiType = resolveApiType(ui.type);
  const side: 'BUY' | 'SELL' = ui.side === 'buy' ? 'BUY' : 'SELL';

  // Determine price for LIMIT and STOP orders
  let priceStr: string | undefined;
  if (apiType === 'LIMIT' || apiType === 'STOP') {
    const p = ui.price || (ui.instrument ? String(ui.side === 'buy' ? ui.instrument.ask : ui.instrument.bid) : '');
    const n = parseFloat(p);
    if (!p || Number.isNaN(n)) {
      return { ok: false, message: 'Limit/stop-style orders need a valid price for OMS LIMIT mapping.' };
    }
    priceStr = n.toFixed(Math.min(8, (ui.instrument?.digits ?? 5) + 2));
  }

  const body: Record<string, unknown> = {
    accountId,
    instrumentId,
    side,
    type: apiType,
    quantity: qtyStr,
    timeInForce: 'DAY' as const,
    clientOrderId: `web-${nanoid(10)}`,
    externalRefId: `ext-${nanoid(12)}`,
  };

  if (priceStr) body.price = priceStr;

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

/**
 * POST /api/orders/algo with PlaceAlgoOrderDto for TWAP / VWAP / ICEBERG.
 * Backend persists the parent and AlgoOrderWorker dispatches slices on its 10s tick.
 *
 * Returns the same TradeResult envelope as submitOrderToOms / submitBracketOrderToOms.
 */
export async function submitAlgoOrderToOms(
  fetchJson: FetchJsonFn,
  ui: PlaceUiOrder,
): Promise<{ ok: true; detail?: string } | { ok: false; message: string }> {
  const accountId = process.env.NEXT_PUBLIC_DEFAULT_TRADING_ACCOUNT_ID;
  const demoInstrumentId = process.env.NEXT_PUBLIC_DEMO_INSTRUMENT_ID;
  const instrumentId = ui.instrument?.instrumentId ?? demoInstrumentId;

  if (!accountId) {
    return { ok: false, message: 'Set NEXT_PUBLIC_DEFAULT_TRADING_ACCOUNT_ID for live OMS submit.' };
  }
  if (!instrumentId) {
    return { ok: false, message: 'Pick a watchlist-backed instrument or set NEXT_PUBLIC_DEMO_INSTRUMENT_ID.' };
  }

  const algoType = resolveApiType(ui.type);
  if (algoType !== 'TWAP' && algoType !== 'VWAP' && algoType !== 'ICEBERG') {
    return { ok: false, message: `submitAlgoOrderToOms called with non-algo type: ${algoType}` };
  }

  const qty = parseFloat(ui.lots || '0');
  if (isNaN(qty) || qty <= 0) {
    return { ok: false, message: 'Total quantity must be greater than 0' };
  }
  const qtyStr = qty.toFixed(2);
  if (!/^\d{1,20}(\.\d{1,8})?$/.test(qtyStr)) {
    return { ok: false, message: 'Invalid lot size for OMS quantity string.' };
  }

  // Slice count: TWAP/VWAP use ui.slices; ICEBERG uses ui.displayQty (visible qty per slice).
  let sliceCount: number;
  if (algoType === 'ICEBERG') {
    sliceCount = ui.displayQty ?? ui.slices ?? 0;
    if (sliceCount < 1) return { ok: false, message: 'Iceberg displayQty must be >= 1' };
  } else {
    sliceCount = ui.slices ?? 0;
    if (sliceCount < 2) return { ok: false, message: `${algoType} requires slices >= 2` };
  }

  const body: Record<string, unknown> = {
    accountId,
    instrumentId,
    side: ui.side === 'buy' ? 'BUY' : 'SELL',
    algoType,
    totalQuantity: qtyStr,
    sliceCount,
    clientOrderId: `web-algo-${nanoid(10)}`,
    externalRefId: `ext-algo-${nanoid(12)}`,
  };

  if (ui.durationMinutes != null) body.durationMinutes = ui.durationMinutes;
  if (ui.priceLimit) body.priceLimit = ui.priceLimit;
  else if (algoType === 'ICEBERG' || algoType === 'VWAP') {
    // ICEBERG / VWAP need a priceLimit — fall back to ask/bid.
    const fb = ui.instrument
      ? String(ui.side === 'buy' ? ui.instrument.ask : ui.instrument.bid)
      : '';
    if (fb) body.priceLimit = fb;
    else return { ok: false, message: `${algoType} requires priceLimit` };
  }

  try {
    const res = await fetchJson('/api/orders/algo', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return { ok: true, detail: JSON.stringify(res) };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Algo order request failed';
    return { ok: false, message: msg };
  }
}

/**
 * POST /api/orders/bracket with full bracket order payload.
 * Called when takeProfitPrice or stopLossPrice is present on the order ticket.
 */
export async function submitBracketOrderToOms(
  fetchJson: FetchJsonFn,
  ui: PlaceUiOrder & {
    triggerPrice?: string;
    triggerCondition?: TriggerCondition;
    trailingDistance?: string;
    trailingPct?: string;
    displayQty?: string;
    slices?: number;
    durationMinutes?: number;
  },
): Promise<{ ok: true; detail?: string } | { ok: false; message: string }> {
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

  const qty = parseFloat(ui.lots || '0');
  if (isNaN(qty) || qty <= 0) {
    return { ok: false, message: 'Quantity must be greater than 0' };
  }
  const qtyStr = qty.toFixed(2);
  if (!/^\d{1,20}(\.\d{1,8})?$/.test(qtyStr)) {
    return { ok: false, message: 'Invalid lot size for OMS quantity string.' };
  }

  const apiType = resolveApiType(ui.type);
  const side: 'BUY' | 'SELL' = ui.side === 'buy' ? 'BUY' : 'SELL';

  // Determine price
  let priceStr: string | undefined;
  if (apiType === 'LIMIT' || apiType === 'STOP') {
    const p = ui.price || (ui.instrument ? String(ui.side === 'buy' ? ui.instrument.ask : ui.instrument.bid) : '');
    const n = parseFloat(p);
    if (!p || Number.isNaN(n)) {
      return { ok: false, message: 'Limit/stop-style orders need a valid price.' };
    }
    priceStr = n.toFixed(Math.min(8, (ui.instrument?.digits ?? 5) + 2));
  }

  const digits = ui.instrument?.digits ?? 5;
  const fmtPrice = (v: string) => {
    const n = parseFloat(v);
    if (Number.isNaN(n)) return undefined;
    return n.toFixed(Math.min(8, digits + 2));
  };

  const body: PlaceBracketOrderRequest = {
    accountId,
    instrumentId,
    side,
    type: apiType,
    quantity: qtyStr,
    timeInForce: 'DAY',
    clientOrderId: `web-${nanoid(10)}`,
    externalRefId: `ext-${nanoid(12)}`,
    bracket: {
      takeProfitPrice: fmtPrice(ui.tp) ?? '',
      stopLossPrice: fmtPrice(ui.sl) ?? '',
    },
  };

  if (priceStr) body.price = priceStr;
  if (ui.triggerPrice) body.triggerPrice = ui.triggerPrice;
  if (ui.triggerCondition) body.triggerCondition = ui.triggerCondition;
  if (ui.trailingDistance) body.trailingDistance = ui.trailingDistance;
  if (ui.trailingPct) body.trailingPct = ui.trailingPct;
  if (ui.displayQty) body.displayQty = ui.displayQty;
  if (ui.slices != null) body.slices = ui.slices;
  if (ui.durationMinutes != null) body.durationMinutes = ui.durationMinutes;

  try {
    const res = await fetchJson('/api/orders/bracket', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return { ok: true, detail: JSON.stringify(res) };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Bracket order request failed';
    return { ok: false, message: msg };
  }
}

/**
 * Fetch order book depth snapshot from GET /api/order-book/:symbol/depth.
 * @param fetchJson  Wrapped fetch (handles auth / base URL)
 * @param symbol     Trading symbol e.g. "EURUSD"
 * @param levels     Number of bid/ask levels to return (default 10)
 */
export async function fetchOrderBookDepth(
  fetchJson: FetchJsonFn,
  symbol: string,
  levels = 10,
): Promise<OrderBookDepth> {
  return fetchJson(
    `/order-book/${encodeURIComponent(symbol)}/depth?levels=${levels}`,
  ) as Promise<OrderBookDepth>;
}
