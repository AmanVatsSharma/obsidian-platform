/**
 * File:        apps/web/features/trading-terminal/components/trading-workstation.tsx
 * Module:      web · trading-terminal · Platform Wrapper
 * Purpose:     Web platform adapter — wires Next.js auth, Apollo Client GraphQL
 *              hooks, and env vars into the platform-agnostic TradingWorkstation.
 *
 * Exports:
 *   - TradingWorkstation({ mobileHref?, forceMobileLayout? }) → ReactNode
 *
 * Depends on:
 *   - @obsidian/trading-ui — TradingWorkstation (lib), Instrument, PlaceUiOrder
 *   - @/shared/providers/auth-provider — useAuth (web-only auth context)
 *   - @/shared/fetch-with-auth — fetchWithAuth (auth-aware REST helper, signed FetchJsonFn)
 *   - @/features/trading-terminal/lib/workstation-api — submitAlgoOrderToOms, resolveApiType, PlaceUiOrder (web-extended)
 *   - @/gql/hooks/useInstruments — instrument catalogue hook (pollInterval: 5000)
 *   - @/gql/hooks/useAccountBalance — account balance hook
 *   - @/gql/hooks/usePlaceOrder — order submission mutation hook
 *   - @/gql/hooks/useOrders — pending orders hook (PENDING status)
 *   - @/gql/hooks/usePositions — open positions hook
 *   - @/gql/hooks/useQuotes — live price snapshot hook (pollInterval: 2000)
 *   - nanoid — clientOrderId generation
 *
 * Side-effects:
 *   - Network calls via Apollo Client (useInstruments + useAccountBalance queries,
 *     placeOrder mutation + useOrders + usePositions + useQuote)
 *   - REST calls via fetchWithAuth (fetchJson prop) for /market/watchlists, /api/orders,
 *     and /api/orders/algo (TWAP / VWAP / ICEBERG)
 *
 * Key invariants:
 *   - accessToken absent → auth header is omitted (unauthenticated mode)
 *   - NEXT_PUBLIC_DEFAULT_TRADING_ACCOUNT_ID injected via Apollo variable
 *   - AccountSummaryPanel receives live balance from useAccountBalance (falls back to mock)
 *   - TradingWorkstation receives onTradeSubmit (GraphQL-compatible bridge)
 *   - TradingWorkstation receives fetchJson = fetchWithAuth (real REST, NOT a noop stub)
 *   - onTradeSubmit dispatches TWAP / VWAP / ICEBERG to submitAlgoOrderToOms (REST);
 *     MARKET / LIMIT to usePlaceOrderMutation (GraphQL)
 *   - Algo kind is resolved from uiOrder.algoType first, else mapped from uiOrder.type
 *     via resolveApiType (lib's PlaceUiOrder has no algoType field — only the web-extended
 *     type does, so the type-mapping fallback keeps the algo path exercisable today)
 *   - ApolloProviderWrapper is already mounted in layout.tsx — no double-wrapping
 *   - QuoteUpdater polls active instrument every 2 s; full injection into lib prices is P4
 *
 * Read order:
 *   1. TradingWorkstation — Apollo hooks wiring + onTradeSubmit bridge
 *   2. QuoteUpdater — live price polling for the active instrument
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-03
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { TradingWorkstation as TradingWorkstationLib } from '@obsidian/trading-ui';
import { fetchWithAuth } from '@/shared/fetch-with-auth';
import { useGetInstrumentsQuery } from '@/gql/hooks';
import { useGetAccountBalanceQuery } from '@/gql/hooks';
import { usePlaceOrderMutation } from '@/gql/hooks';
import { useGetOrdersQuery } from '@/gql/hooks';
import { useGetPositionsQuery } from '@/gql/hooks';
import { useGetQuoteQuery } from '@/gql/hooks';
import { nanoid } from 'nanoid';
import { submitAlgoOrderToOms, resolveApiType } from '@/features/trading-terminal/lib/workstation-api';
import { useCandles } from '@/lib/prana-stream/hooks/use-candles';
import { useOrderBookDepth } from '@/lib/prana-stream/hooks/use-orderbook-depth';
import type { PlaceUiOrder } from '@/features/trading-terminal/lib/workstation-api';
import type { Instrument } from '@obsidian/trading-ui';
import type { OpenPosition } from '@obsidian/trading-ui';
import type { PendingOrder } from '@obsidian/trading-ui';
import type { Candle } from '@/lib/prana-stream/hooks/use-candles';
import type { OrderBookFrame } from '@/lib/prana-stream/types';

export function TradingWorkstation({
  mobileHref = '/m/workstation',
  forceMobileLayout = false,
}: {
  mobileHref?: string;
  forceMobileLayout?: boolean;
}) {
  const accountId = process.env.NEXT_PUBLIC_DEFAULT_TRADING_ACCOUNT_ID ?? '';

  // GraphQL data hooks — instrument catalogue + account balance snapshot
  // pollInterval: 5000 keeps the instrument catalogue fresh every 5s (live prices via QuoteUpdater below)
  const { data: instrumentsData } = useGetInstrumentsQuery({
    variables: {},
    pollInterval: 5000,
  });

  const { data: balanceData } = useGetAccountBalanceQuery({
    variables: { accountId },
    skip: !accountId,
  });

  // Parse balance strings into numeric values for TradingWorkstation's balance prop.
  const parsedBalance = useMemo(() => {
    if (!balanceData?.accountBalance) return null;
    const b = balanceData.accountBalance;
    const parseNum = (v: string) => parseFloat(v) ?? 0;
    return {
      numericEquity: parseNum(b.equity),
      numericBuyingPower: parseNum(b.buyingPower),
      numericUnrealizedPnl: parseNum(b.unrealizedPnl),
    };
  }, [balanceData]);

  // PlaceOrder mutation hook — wired into the onTradeSubmit bridge
  const [placeOrderMutation] = usePlaceOrderMutation();

  // Positions query — fetches real open positions from GraphQL (OMS)
  const { data: positionsData } = useGetPositionsQuery({
    variables: { accountId: accountId || undefined, limit: 100 },
  });

  // Pending orders query — fetches PENDING orders only for the orders tab
  const { data: ordersData } = useGetOrdersQuery({
    variables: { accountId, status: 'PENDING', limit: 100 },
  });

  // Map GraphQL Position[] (from useGetPositionsQuery) to the OpenPosition[] shape
  // that BottomTabsPanel's PositionsTable expects.
  // The lib's TradingWorkstation manages its own positions state, but we seed it
  // from real data and let tick simulation keep currentPrice/pnl live.
  const openPositions: OpenPosition[] = useMemo(() => {
    const gqlPositions = positionsData?.positions?.data ?? [];
    if (!gqlPositions.length) return [];
    return gqlPositions.map((p) => {
      // Look up the instrument in the catalogue to get the symbol for display
      const inst = instrumentsData?.instruments?.find((i) => i.id === p.instrumentId);
      return {
        id: p.instrumentId,
        symbol: inst?.symbol ?? p.instrumentId,
        type: p.netQty >= 0 ? 'BUY' : 'SELL',
        lots: Math.abs(p.netQty),
        openPrice: p.avgPrice,
        currentPrice: p.lastPrice,
        sl: '',
        tp: '',
        pnl: p.mtmPnl,
        pnlPct: 0,
        swap: 0,
        commission: 0,
        openTime: '',
        margin: 0,
      } satisfies OpenPosition;
    });
  }, [positionsData, instrumentsData]);

  // Map GraphQL Order[] (from useGetOrdersQuery) to the PendingOrder[] shape that BottomTabsPanel's
  // OrdersTable expects. GQL Order uses `quantity` (number) and `price` (number | null);
  // PendingOrder (from @obsidian/trading-ui) uses `lots` (number), `price` (number), `distance`,
  // `sl`, `tp` (all numbers). We look up the instrument symbol from the catalogue for display.
  const pendingOrders: PendingOrder[] = useMemo(() => {
    const gqlOrders = ordersData?.orders?.data ?? [];
    if (!gqlOrders.length) return [];
    return gqlOrders.map((o) => {
      const inst = instrumentsData?.instruments?.find((i) => i.id === o.instrumentId);
      return {
        id: o.id,
        symbol: inst?.symbol ?? o.instrumentId,
        type: o.type,
        orderRole: null,
        parentOrderId: null,
        side: o.side as 'BUY' | 'SELL',
        lots: o.quantity,
        price: o.price ?? 0,
        sl: o.slPrice ?? 0,
        tp: o.tpPrice ?? 0,
        distance: 0,
        status: o.status,
        created: o.createdAt,
        expiry: undefined,
        algoMeta: undefined,
      };
    });
  }, [ordersData, instrumentsData]);

  // Transform parsedBalance (numeric) into the shape TradingWorkstation's balance prop expects.
  const liveBalance = useMemo(() => {
    if (!parsedBalance) return undefined;
    const b = balanceData?.accountBalance;
    return {
      equity: parsedBalance.numericEquity,
      freeMargin: parsedBalance.numericBuyingPower,
      margin: parseFloat(b?.lockedCash ?? '0') || 0,
      unrealizedPnl: parsedBalance.numericUnrealizedPnl,
      realizedPnlToday: 0,
      balance: parseFloat(b?.totalCash ?? '0') || 0,
      currency: b?.currency ?? 'USD',
      accountId,
      accountType: 'Trading',
      leverage: '1:100',
    };
  }, [parsedBalance, balanceData, accountId]);

  // Dispatch bridge — routes to the algo REST endpoint for TWAP/VWAP/ICEBERG
  // (backend has no GraphQL algoOrder mutation), and to usePlaceOrderMutation
  // for all other types.
  //
  // The lib's `PlaceUiOrder` (from @obsidian/trading-ui) does NOT carry an
  // `algoType` discriminator — it only exposes the 7 base fields. The local
  // web `PlaceUiOrder` extends it with `algoType` + algo params so the local
  // `OrderEntry` (with progressive disclosure) can populate them. Until that
  // form is wired into the lib's panel, we ALSO fall back to detecting algo
  // by mapping `uiOrder.type` through `resolveApiType` so the path is exercised
  // even when callers only set the plain `type` string (e.g. 'TWAP').
  type TradeResult = { ok: true; detail?: string } | { ok: false; message: string };
  const onTradeSubmit = useMemo<(uiOrder: PlaceUiOrder) => Promise<TradeResult>>(
    () =>
      async (uiOrder) => {
        if (!accountId) {
          return { ok: false, message: 'Set NEXT_PUBLIC_DEFAULT_TRADING_ACCOUNT_ID.' };
        }
        const instrumentId = uiOrder.instrument?.instrumentId;
        if (!instrumentId) {
          return { ok: false, message: 'No instrument selected.' };
        }

        // ── Algo path (TWAP / VWAP / ICEBERG) → POST /api/orders/algo ─────────
        // Resolve the algo kind from the explicit `algoType` discriminator first
        // (set by the local web OrderEntry) and fall back to mapping `type`.
        const algoKind =
          uiOrder.algoType ?? (() => {
            const mapped = resolveApiType(uiOrder.type);
            return mapped === 'TWAP' || mapped === 'VWAP' || mapped === 'ICEBERG'
              ? mapped
              : undefined;
          })();

        if (algoKind) {
          // Defensive type guard: catch malformed payloads before they reach the
          // OMS so the user sees a clear "AppError-style" message rather than a
          // 400 from the backend or, worse, a silent fall-through to GraphQL.
          if (!uiOrder.lots || parseFloat(uiOrder.lots) <= 0) {
            return { ok: false, message: `${algoKind} orders require totalQuantity > 0.` };
          }
          if (algoKind !== 'ICEBERG' && (uiOrder.slices ?? 0) < 2) {
            return { ok: false, message: `${algoKind} requires slices >= 2.` };
          }
          if (algoKind === 'ICEBERG' && (uiOrder.displayQty ?? uiOrder.slices ?? 0) < 1) {
            return { ok: false, message: 'Iceberg displayQty must be >= 1.' };
          }
          return submitAlgoOrderToOms(fetchWithAuth, { ...uiOrder, algoType: algoKind });
        }

        // ── Regular path → GraphQL usePlaceOrderMutation ──────────────────────
        const apiType: 'MARKET' | 'LIMIT' = uiOrder.type === 'Market' ? 'MARKET' : 'LIMIT';
        const side: 'BUY' | 'SELL' = uiOrder.side === 'buy' ? 'BUY' : 'SELL';

        let price: string | undefined;
        if (apiType === 'LIMIT') {
          const p =
            uiOrder.price ||
            (uiOrder.instrument ? String(uiOrder.side === 'buy' ? uiOrder.instrument.ask : uiOrder.instrument.bid) : '');
          const n = parseFloat(p);
          if (!p || Number.isNaN(n)) {
            return { ok: false, message: 'Limit orders need a valid price.' };
          }
          price = n.toFixed(Math.min(8, (uiOrder.instrument?.digits ?? 5) + 2));
        }

        const input = {
          accountId,
          instrumentId,
          side,
          type: apiType,
          quantity: (parseFloat(uiOrder.lots) || 0).toFixed(2),
          ...(price ? { price } : {}),
          timeInForce: 'DAY',
          clientOrderId: `web-${nanoid(10)}`,
          externalRefId: '',
        };

        try {
          const result = await placeOrderMutation({ variables: { input } });
          if (result.errors?.length) {
            return { ok: false, message: result.errors[0].message };
          }
          if (result.data?.placeOrder) {
            const { status } = result.data.placeOrder;
            if (status === 'REJECTED' || status === 'CANCELLED') {
              return { ok: false, message: `Order ${status.toLowerCase()}` };
            }
            return { ok: true, detail: JSON.stringify(result.data.placeOrder) };
          }
          return { ok: false, message: 'Order placement returned no data.' };
        } catch (e: unknown) {
          return { ok: false, message: e instanceof Error ? e.message : 'Order request failed.' };
        }
      },
    [accountId, placeOrderMutation],
  );

  // fetchWithAuth is structurally a FetchJsonFn — same (path, init?) → Promise<unknown>
  // signature, no adapter wrapper needed. Powers the lib's mergeApiWatchlistInstruments
  // (/market/watchlists) and submitOrderToOms (/api/orders) REST paths.

  // Track the active instrument selected in the lib so live data can be wired.
  const [activeInstrument, setActiveInstrument] = useState<Instrument | null>(null);
  const [activeTimeframe, setActiveTimeframe] = useState<string>('5m');

  // ---------------------------------------------------------------------------
  // LiveDataBridge — pulls candles + DOM from PranaStream for the active
  // instrument and feeds them into the lib via the new `candles` and
  // `domFrame` props. Disables the lib's local simulators.
  // ---------------------------------------------------------------------------
  function LiveDataBridge({
    instrument,
    timeframe,
    onCandles,
    onDomFrame,
  }: {
    instrument: Instrument | null;
    timeframe: string;
    onCandles: (candles: Candle[]) => void;
    onDomFrame: (frame: OrderBookFrame | null) => void;
  }) {
    const exchange = (instrument as { exchangeCode?: string })?.exchangeCode ?? 'forex';
    const symbol = instrument?.symbol ?? '';

    // 1) PranaStream candles — falls back to a random seed inside the hook itself.
    const { series: candleSeries } = useCandles({
      exchange,
      symbol,
      tf: timeframe,
      basePrice: instrument?.bid ?? 1.08452,
    });

    useEffect(() => {
      onCandles(candleSeries);
    }, [candleSeries, onCandles]);

    // 2) PranaStream order book depth (real DOM from execution-gateway)
    const domFrame = useOrderBookDepth(exchange, symbol);

    useEffect(() => {
      onDomFrame(domFrame);
    }, [domFrame, onDomFrame]);

    return null;
  }

  // ---------------------------------------------------------------------------
  // QuoteUpdater — polls the active instrument every 2 s via Apollo pollInterval.
  // This is the legacy hook; the new PranaStream flow is LiveDataBridge above.
  // ---------------------------------------------------------------------------
  function QuoteUpdater({ instrument }: { instrument: Instrument | null }) {
    const exchange = (instrument as { exchangeCode?: string })?.exchangeCode ?? 'forex';
    const symbol = instrument?.symbol ?? '';

    useGetQuoteQuery({
      variables: { exchange, symbol },
      // Only poll when an instrument is selected; stop when null to avoid unnecessary requests
      pollInterval: instrument ? 2000 : 0,
    });

    return null;
  }

  // Lift the live candles + DOM into state so they can be passed to the lib.
  const [candles, setCandles] = useState<Candle[]>([]);
  const [domFrame, setDomFrame] = useState<OrderBookFrame | null>(null);

  // Stable callbacks to prevent LiveDataBridge's useEffect from re-firing on every render.
  const handleCandles = useMemo(() => (c: Candle[]) => setCandles(c), []);
  const handleDomFrame = useMemo(() => (f: OrderBookFrame | null) => setDomFrame(f), []);

  return (
    <>
      {/* LiveDataBridge streams live candles + DOM from PranaStream into the lib. */}
      <LiveDataBridge
        instrument={activeInstrument}
        timeframe={activeTimeframe}
        onCandles={handleCandles}
        onDomFrame={handleDomFrame}
      />
      <QuoteUpdater instrument={activeInstrument} />
      <TradingWorkstationLib
        fetchJson={fetchWithAuth}
        mobileHref={mobileHref}
        forceMobileLayout={forceMobileLayout}
        balance={liveBalance}
        onTradeSubmit={onTradeSubmit}
        positions={openPositions}
        pendingOrders={pendingOrders}
        onInstrumentChange={setActiveInstrument}
        candles={candles}
        domFrame={domFrame}
      />
    </>
  );
}