/**
 * File:        apps/web/features/trading-terminal/components/trading-workstation.spec.tsx
 * Module:      web · trading-terminal · Tests
 * Purpose:     Unit + dispatch tests for the onTradeSubmit bridge in
 *              trading-workstation.tsx. Verifies the new branch from bead
 *              obsidian-81v: TWAP / VWAP / ICEBERG payloads are dispatched to
 *              submitAlgoOrderToOms (which POSTs /api/orders/algo) and that
 *              MARKET / LIMIT payloads still route to the GraphQL
 *              usePlaceOrderMutation. Also covers the defensive type guard
 *              for malformed algo payloads.
 *
 * Exports:
 *   - none (test suite)
 *
 * Depends on:
 *   - ./trading-workstation — system under test (TradingWorkstation)
 *   - @/shared/fetch-with-auth — mocked to capture the algo REST call
 *   - @/gql/hooks — Apollo hooks mocked to avoid ApolloProvider wiring
 *   - @/features/trading-terminal/lib/workstation-api — submitAlgoOrderToOms
 *     (real implementation; small enough to exercise end-to-end)
 *   - @testing-library/react — render() for component tests
 *   - @testing-library/jest-dom — toHaveBeenCalledWith matcher
 *
 * Side-effects:
 *   - Reads/mutates process.env.NEXT_PUBLIC_DEFAULT_TRADING_ACCOUNT_ID per test
 *   - No filesystem, no real network — fetchWithAuth is mocked
 *
 * Key invariants:
 *   - Test runner note: the project memory documents that `npx jest` at the
 *     monorepo root falls back to babel-jest, which cannot parse TS `import type`.
 *     This spec is structured so it can be run with the project-local jest
 *     config when the per-project test target is wired (bead obsidian-e9g).
 *     In the interim, type soundness is proven by `npx tsc --noEmit -p apps/web`.
 *
 * Read order:
 *   1. Mocks (Apollo hooks + fetchWithAuth)
 *   2. happy-path algo dispatch (TWAP / VWAP / ICEBERG)
 *   3. defensive type guard (missing lots, missing slices, ICEBERG displayQty)
 *   4. regular MARKET path still hits GraphQL
 *
 * Author:       BharatERP
 * Last-updated: 2026-06-03
 */

import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { ReactNode } from 'react';

// ─── Mocks ─────────────────────────────────────────────────────────────────

// Apollo hooks: the real ones need an ApolloProvider; we mock them at the
// boundary the component uses (the codegen barrel) and capture mutation calls.
const mockPlaceOrderMock = jest.fn();
jest.mock('@/gql/hooks', () => ({
  useGetInstrumentsQuery: () => ({ data: { instruments: [] }, loading: false, error: undefined }),
  useGetAccountBalanceQuery: () => ({ data: undefined, loading: false, error: undefined }),
  useGetOrdersQuery: () => ({ data: { orders: { data: [] } }, loading: false, error: undefined }),
  useGetPositionsQuery: () => ({ data: { positions: { data: [] } }, loading: false, error: undefined }),
  useGetQuoteQuery: () => ({ data: undefined, loading: false, error: undefined }),
  usePlaceOrderMutation: () => [mockPlaceOrderMock, { loading: false }],
}));

// fetchWithAuth: replaced with a jest.fn that records the (path, init) calls.
// This is the only side-effect channel we want to spy on for the algo REST call.
const mockFetchWithAuthMock = jest.fn();
jest.mock('@/shared/fetch-with-auth', () => ({
  fetchWithAuth: (path: string, init?: RequestInit) => mockFetchWithAuthMock(path, init),
}));

// Lib: TradingWorkstation renders the lib's <OrderEntry /> + a real submit
// path. We mock the lib entry point so the test controls the onTradeSubmit
// callback without depending on the lib's internal DOM (the test will
// extract the callback via the prop the wrapper passes down).
const onTradeSubmitRef: { current: ((payload: unknown) => Promise<unknown>) | null } = { current: null };
jest.mock('@obsidian/trading-ui', () => {
  const React = jest.requireActual('react') as typeof import('react');
  return {
    TradingWorkstation: function StubTradingWorkstation(props: {
      onTradeSubmit?: (payload: unknown) => Promise<unknown>;
      fetchJson?: unknown;
      // Surface a test affordance so we can invoke onTradeSubmit from the test.
      __test_captureOnTradeSubmit?: (cb: unknown) => void;
    }) {
      onTradeSubmitRef.current = props.onTradeSubmit ?? null;
      return React.createElement('div', { 'data-testid': 'lib-stub' });
    },
  };
});

// ─── System under test ────────────────────────────────────────────────────

import { TradingWorkstation } from './trading-workstation';
import { submitAlgoOrderToOms } from '@/features/trading-terminal/lib/workstation-api';
import type { PlaceUiOrder } from '@/features/trading-terminal/lib/workstation-api';

// ─── Test helpers ─────────────────────────────────────────────────────────

const TEST_INSTRUMENT = {
  symbol: 'EURUSD',
  name: 'EUR / USD',
  bid: 1.0845,
  ask: 1.0846,
  change: 0,
  changePct: 0,
  high: 1.09,
  low: 1.08,
  spread: 0.6,
  pip: 0.0001,
  category: 'forex' as const,
  digits: 5,
  instrumentId: 'inst-eurusd-uuid',
};

function makeUiOrder(overrides: Partial<PlaceUiOrder> = {}): PlaceUiOrder {
  return {
    side: 'buy',
    type: 'MARKET',
    lots: '1.00',
    sl: '',
    tp: '',
    price: '',
    instrument: TEST_INSTRUMENT,
    ...overrides,
  };
}

function renderWorkstation() {
  return render(<TradingWorkstation />);
}

type TradeResult = { ok: true; detail?: string } | { ok: false; message: string };

async function invoke(payload: PlaceUiOrder): Promise<TradeResult> {
  expect(onTradeSubmitRef.current).toBeTruthy();
  return onTradeSubmitRef.current!(payload) as Promise<TradeResult>;
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe('trading-workstation onTradeSubmit dispatch bridge', () => {
  const originalAccountId = process.env.NEXT_PUBLIC_DEFAULT_TRADING_ACCOUNT_ID;

  beforeEach(() => {
    mockPlaceOrderMock.mockReset();
    mockFetchWithAuthMock.mockReset();
    onTradeSubmitRef.current = null;
    process.env.NEXT_PUBLIC_DEFAULT_TRADING_ACCOUNT_ID = 'acc-test-uuid';
  });

  afterEach(() => {
    if (originalAccountId === undefined) {
      delete process.env.NEXT_PUBLIC_DEFAULT_TRADING_ACCOUNT_ID;
    } else {
      process.env.NEXT_PUBLIC_DEFAULT_TRADING_ACCOUNT_ID = originalAccountId;
    }
  });

  it('renders the lib wrapper', () => {
    renderWorkstation();
    expect(screen.getByTestId('lib-stub')).toBeInTheDocument();
  });

  // ── Algo path ───────────────────────────────────────────────────────────

  it('routes TWAP orders to submitAlgoOrderToOms (REST /api/orders/algo)', async () => {
    // Configure the real fetchWithAuth to return a known algo parent.
    // The real submitAlgoOrderToOms will make a POST to /api/orders/algo and we
    // capture that fetch call to assert the body shape.
    mockFetchWithAuthMock.mockResolvedValue({ id: 'algo-parent-1' });

    renderWorkstation();
    const result = await invoke(
      makeUiOrder({
        type: 'TWAP',
        algoType: 'TWAP',
        lots: '100.00',
        slices: 10,
        durationMinutes: 30,
      }),
    );

    expect(result).toEqual({ ok: true, detail: '{"id":"algo-parent-1"}' });
    // The REST call went to /api/orders/algo with the right body shape.
    expect(mockFetchWithAuthMock).toHaveBeenCalledWith(
      '/api/orders/algo',
      expect.objectContaining({ method: 'POST' }),
    );
    const [, init] = mockFetchWithAuthMock.mock.calls[0]!;
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.algoType).toBe('TWAP');
    expect(body.totalQuantity).toBe('100.00');
    expect(body.sliceCount).toBe(10);

    // GraphQL path was NOT used.
    expect(mockPlaceOrderMock).not.toHaveBeenCalled();
  });

  it('routes VWAP orders via algoType discriminator (no fall-through to GraphQL)', async () => {
    mockFetchWithAuthMock.mockResolvedValue({ id: 'algo-parent-vwap' });

    renderWorkstation();
    const result = await invoke(
      makeUiOrder({
        type: 'VWAP',
        algoType: 'VWAP',
        lots: '500.00',
        slices: 5,
        durationMinutes: 30,
        priceLimit: '1.0850',
      }),
    );

    expect(result.ok).toBe(true);
    expect(mockFetchWithAuthMock).toHaveBeenCalledWith('/api/orders/algo', expect.anything());
    expect(mockPlaceOrderMock).not.toHaveBeenCalled();
  });

  it('routes ICEBERG orders via algoType discriminator', async () => {
    mockFetchWithAuthMock.mockResolvedValue({ id: 'algo-parent-iceberg' });

    renderWorkstation();
    const result = await invoke(
      makeUiOrder({
        type: 'ICEBERG',
        algoType: 'ICEBERG',
        lots: '1000.00',
        displayQty: 25,
        priceLimit: '1.0850',
      }),
    );

        expect(result.ok).toBe(true);
    expect(mockFetchWithAuthMock).toHaveBeenCalledWith('/api/orders/algo', expect.anything());
    expect(mockPlaceOrderMock).not.toHaveBeenCalled();
  });

  it('falls back to mapping type through resolveApiType when algoType is not set', async () => {
    // Some callers (notably the lib's plain OrderEntry) only set `type`.
    // The dispatcher must still detect algo from the mapped api type.
    mockFetchWithAuthMock.mockResolvedValue({ id: 'algo-parent-mapped' });

    renderWorkstation();
    const result = await invoke(
      // No algoType set — type alone must trigger the algo path.
      makeUiOrder({ type: 'TWAP', lots: '50.00' }),
    );

    // Without slices, the type guard should reject with a clear message.
    expect(result).toEqual({ ok: false, message: 'TWAP requires slices >= 2.' });
    expect(mockPlaceOrderMock).not.toHaveBeenCalled();
    // The fetch must NOT be made for a malformed payload.
    expect(mockFetchWithAuthMock).not.toHaveBeenCalled();
  });

  // ── Defensive type guard ────────────────────────────────────────────────

  it('rejects algo orders with missing/zero totalQuantity before hitting the network', async () => {
    renderWorkstation();
    const result = await invoke(
      makeUiOrder({ type: 'TWAP', algoType: 'TWAP', lots: '0', slices: 5 }),
    );

    expect(result).toEqual({ ok: false, message: 'TWAP orders require totalQuantity > 0.' });
    expect(mockFetchWithAuthMock).not.toHaveBeenCalled();
    expect(mockPlaceOrderMock).not.toHaveBeenCalled();
  });

  it('rejects TWAP/VWAP orders with slices < 2', async () => {
    renderWorkstation();
    const result = await invoke(
      makeUiOrder({ type: 'VWAP', algoType: 'VWAP', lots: '10.00', slices: 1 }),
    );

    expect(result).toEqual({ ok: false, message: 'VWAP requires slices >= 2.' });
    expect(mockFetchWithAuthMock).not.toHaveBeenCalled();
  });

  it('rejects ICEBERG orders with displayQty < 1', async () => {
    renderWorkstation();
    const result = await invoke(
      makeUiOrder({ type: 'ICEBERG', algoType: 'ICEBERG', lots: '100.00', displayQty: 0 }),
    );

    expect(result).toEqual({ ok: false, message: 'Iceberg displayQty must be >= 1.' });
    expect(mockFetchWithAuthMock).not.toHaveBeenCalled();
  });

  // ── Regular path (non-regression) ───────────────────────────────────────

  it('routes MARKET orders to the GraphQL usePlaceOrderMutation (non-regression)', async () => {
    mockPlaceOrderMock.mockResolvedValue({
      errors: undefined,
      data: { placeOrder: { id: 'ord-market-1', status: 'PENDING' } },
    });

    renderWorkstation();
    const result = await invoke(makeUiOrder({ type: 'Market', lots: '1.00' }));

    expect(result.ok).toBe(true);
    expect(mockPlaceOrderMock).toHaveBeenCalledTimes(1);
    const args = mockPlaceOrderMock.mock.calls[0]![0] as { variables: { input: { type: string } } };
    expect(args.variables.input.type).toBe('MARKET');
    expect(mockFetchWithAuthMock).not.toHaveBeenCalled();
  });

  it('rejects orders with no accountId configured (defensive)', async () => {
    process.env.NEXT_PUBLIC_DEFAULT_TRADING_ACCOUNT_ID = '';
    renderWorkstation();
    const result = await invoke(makeUiOrder({ type: 'Market' }));

    expect(result).toEqual({ ok: false, message: 'Set NEXT_PUBLIC_DEFAULT_TRADING_ACCOUNT_ID.' });
    expect(mockPlaceOrderMock).not.toHaveBeenCalled();
    expect(mockFetchWithAuthMock).not.toHaveBeenCalled();
  });
});

// Silence unused-import warning for the re-exported helper — it documents
// the contract this spec exercises.
void submitAlgoOrderToOms;
void (null as ReactNode);
