/**
 * File:        apps/web/features/mobile-terminal/components/mobile-workstation.spec.tsx
 * Module:      Mobile Terminal · Tests
 * Purpose:     Unit tests for the MobileWorkstation data adapter.
 *             Tests: auth detection, mock fallback, error surfacing, mutations.
 *
 * Depends on:
 *   - ./mobile-workstation — system under test
 *   - @testing-library/react — component rendering
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-07
 */

import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// ─────────────────────────────────────────────────────────────────────────────
// Mock implementations at module boundary — avoid ApolloProvider wiring
// ─────────────────────────────────────────────────────────────────────────

// Mock auth - uses default value for mockReset in resetMocks
const mockUseAuth = jest.fn(() => ({ accessToken: null }));

// Mock functions that return proper Apollo-like response objects
const emptyQuery = () => ({ data: undefined, loading: false, error: undefined });
const mockUseGetInstrumentsQuery = jest.fn(emptyQuery);
const mockUseGetAccountBalanceQuery = jest.fn(emptyQuery);
const mockUseGetOrdersQuery = jest.fn(emptyQuery);
const mockUseGetPositionsQuery = jest.fn(emptyQuery);
const mockUseGetQuoteQuery = jest.fn(emptyQuery);

const mockPlaceOrderFn = jest.fn();
const mockCancelOrderFn = jest.fn();
const mockUsePlaceOrderMutation = jest.fn(() => [mockPlaceOrderFn, { loading: false, error: undefined }]);
const mockUseCancelOrderMutation = jest.fn(() => [mockCancelOrderFn, { loading: false, error: undefined }]);

jest.mock('@/shared/providers/auth-provider', () => ({
  useAuth: (...args: any[]) => mockUseAuth(...args),
}));

jest.mock('@/gql/hooks', () => ({
  useGetInstrumentsQuery: (...args: any[]) => mockUseGetInstrumentsQuery(...args),
  useGetAccountBalanceQuery: (...args: any[]) => mockUseGetAccountBalanceQuery(...args),
  useGetOrdersQuery: (...args: any[]) => mockUseGetOrdersQuery(...args),
  useGetPositionsQuery: (...args: any[]) => mockUseGetPositionsQuery(...args),
  useGetQuoteQuery: (...args: any[]) => mockUseGetQuoteQuery(...args),
  usePlaceOrderMutation: (...args: any[]) => mockUsePlaceOrderMutation(...args),
  useCancelOrderMutation: (...args: any[]) => mockUseCancelOrderMutation(...args),
}));

// Mock nanoid for this file only
jest.mock('nanoid', () => ({ nanoid: () => 'test-client-id-123456' }));

// Mock the dashboard to isolate adapter testing
jest.mock('./mobile-trading-dashboard', () => ({
  MobileTradingDashboard: function MockDashboard({ data, onSetActiveSymbol }: any) {
      // Expose data and callback for assertions
      return (
        <div data-testid="mobile-dashboard">
          <span data-testid="auth">{String(data?.isAuthenticated)}</span>
          <span data-testid="loading">{String(data?.loading)}</span>
          <span data-testid="error">{data?.error || 'null'}</span>
          <span data-testid="instruments">{data?.instruments?.length || 0}</span>
          <span data-testid="positions">{data?.positions?.length || 0}</span>
          <button data-testid="place-order" onClick={() => data?.placeOrder?.({ instrumentId: 'i1', side: 'BUY', type: 'MARKET', quantity: '1.00' })}>
            Place Order
          </button>
          <button data-testid="cancel-order" onClick={() => data?.cancelOrder?.('o1')}>
            Cancel Order
          </button>
        </div>
      );
  },
}));

// ─────────────────────────────────────────────────────────────────────────
// Test data fixtures
// ─────────────────────────────────────────────────────────────────────────

const MOCK_INSTRUMENTS = [
  { id: 'i1', symbol: 'EURUSD', displayName: 'EUR/USD' },
  { id: 'i2', symbol: 'GBPUSD', displayName: 'GBP/USD' },
];

const MOCK_BALANCE = {
  accountBalance: {
    totalCash: '10000',
    equity: '10500',
    lockedCash: '500',
    buyingPower: '9500',
    unrealizedPnl: '500',
  }
};

const MOCK_POSITION = { instrumentId: 'i1', netQty: 1000, avgPrice: 1.0800, lastPrice: 1.0845, mtmPnl: 45.00 };

const MOCK_ORDER = {
  id: 'o1',
  instrumentId: 'i1',
  side: 'BUY',
  type: 'MARKET',
  quantity: 1,
  status: 'PENDING',
  createdAt: '2026-06-07T10:00:00Z',
};

// ─────────────────────────────────────────────────────────────────────────
// Reset helpers
// ─────────────────────────────────────────────────────────────────────────

function resetMocks() {
  mockUseAuth.mockReset().mockImplementation(() => ({ accessToken: null }));
  mockUseGetInstrumentsQuery.mockReset().mockImplementation(emptyQuery);
  mockUseGetAccountBalanceQuery.mockReset().mockImplementation(emptyQuery);
  mockUseGetOrdersQuery.mockReset().mockImplementation(emptyQuery);
  mockUseGetPositionsQuery.mockReset().mockImplementation(emptyQuery);
  mockUseGetQuoteQuery.mockReset().mockImplementation(emptyQuery);
  mockUsePlaceOrderMutation.mockReset().mockImplementation(() => [mockPlaceOrderFn, { loading: false, error: undefined }]);
  mockUseCancelOrderMutation.mockReset().mockImplementation(() => [mockCancelOrderFn, { loading: false, error: undefined }]);
}

function setupHappyPath() {
  mockUseAuth.mockReturnValue({ accessToken: 'test-token', tokenId: 't1' } as any);
  mockUseGetInstrumentsQuery.mockReturnValue({ data: { instruments: MOCK_INSTRUMENTS }, loading: false, error: undefined } as any);
  mockUseGetAccountBalanceQuery.mockReturnValue({ data: MOCK_BALANCE, loading: false, error: undefined } as any);
  mockUseGetOrdersQuery.mockReturnValue({ data: { orders: { data: [MOCK_ORDER] } }, loading: false, error: undefined } as any);
  mockUseGetPositionsQuery.mockReturnValue({ data: { positions: { data: [MOCK_POSITION] } }, loading: false, error: undefined } as any);
  mockUseGetQuoteQuery.mockReturnValue({ data: undefined, loading: false, error: undefined } as any);
  mockUsePlaceOrderMutation.mockReturnValue([jest.fn(), { loading: false, error: undefined }] as any);
  mockUseCancelOrderMutation.mockReturnValue([jest.fn(), { loading: false, error: undefined }] as any);
}

// Import after mocks are set up
import { MobileWorkstation } from './mobile-workstation';

// ─────────────────────────────────────────────────────────────────────────
// Test suite
// ─────────────────────────────────────────────────────────────────────────

describe('MobileWorkstation data adapter', () => {
  const originalAccountId = process.env.NEXT_PUBLIC_DEFAULT_TRADING_ACCOUNT_ID;

  beforeEach(() => {
    resetMocks();
    process.env.NEXT_PUBLIC_DEFAULT_TRADING_ACCOUNT_ID = 'acc-test-uuid';
  });

  afterEach(() => {
    if (originalAccountId === undefined) {
      delete process.env.NEXT_PUBLIC_DEFAULT_TRADING_ACCOUNT_ID;
    } else {
      process.env.NEXT_PUBLIC_DEFAULT_TRADING_ACCOUNT_ID = originalAccountId;
    }
  });

  // ── Test 1: Loading state when Apollo hooks pending ───────────────────

  it('renders loading=true when Apollo data is undefined', async () => {
    mockUseAuth.mockReturnValue({ accessToken: 'test-token', tokenId: 't1' } as any);
    mockUseGetInstrumentsQuery.mockReturnValue({ data: undefined, loading: true, error: undefined });

    render(<MobileWorkstation />);

    expect(screen.getByTestId('loading')).toHaveTextContent('true');
  });

  // ── Test 2: Mock fallback when unauthenticated ────────────────────────────────

  it('uses mock data when useAuth() returns null token', async () => {
    mockUseAuth.mockReturnValue({ accessToken: null, tokenId: null });

    render(<MobileWorkstation />);

    expect(screen.getByTestId('auth')).toHaveTextContent('false');
  });

  // ── Test 3: Demo mode when ?demo=1 ────────────────────────────────

  it('uses mock data when demoMode=true even with token', async () => {
    mockUseAuth.mockReturnValue({ accessToken: 'test-token', tokenId: 't1' } as any);

    render(<MobileWorkstation demoMode={true} />);

    expect(screen.getByTestId('auth')).toHaveTextContent('false');
  });

  // ── Test 4: Real data when authenticated ────────────────────────

  it('renders real data when authenticated', async () => {
    setupHappyPath();

    render(<MobileWorkstation />);

    expect(screen.getByTestId('auth')).toHaveTextContent('true');
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('instruments')).toHaveTextContent('2');
  });

  // ── Test 5: Error surfacing from hooks ────────────────────────

  it('surfaces first error from hooks', async () => {
    mockUseAuth.mockReturnValue({ accessToken: 'test-token', tokenId: 't1' } as any);
    mockUseGetInstrumentsQuery.mockReturnValue({ data: undefined, loading: false, error: { message: 'Network Error' } });

    render(<MobileWorkstation />);

    expect(screen.getByTestId('error')).toHaveTextContent('Network Error');
  });

  // ── Test 6: placeOrder mutation ────────────────────────────────

  it('placeOrder calls the mutation hook', async () => {
    const mockMutation = jest.fn().mockResolvedValue({
      errors: undefined,
      data: { placeOrder: { id: 'ord-1', status: 'PENDING' } }
    });
    mockUseAuth.mockReturnValue({ accessToken: 'test-token', tokenId: 't1' } as any);
    mockUseGetInstrumentsQuery.mockReturnValue({ data: { instruments: MOCK_INSTRUMENTS }, loading: false, error: undefined });
    mockUseGetAccountBalanceQuery.mockReturnValue({ data: MOCK_BALANCE, loading: false, error: undefined });
    mockUseGetOrdersQuery.mockReturnValue({ data: { orders: { data: [] } }, loading: false, error: undefined });
    mockUseGetPositionsQuery.mockReturnValue({ data: { positions: { data: [] } }, loading: false, error: undefined });
    mockUseGetQuoteQuery.mockReturnValue({ data: undefined, loading: false, error: undefined });
    mockUsePlaceOrderMutation.mockReturnValue([mockMutation, { loading: false, error: undefined }]);
    mockUseCancelOrderMutation.mockReturnValue([jest.fn(), { loading: false, error: undefined }]);

    render(<MobileWorkstation />);

    await waitFor(async () => {
      await screen.getByTestId('place-order').click();
    });

    expect(mockMutation).toHaveBeenCalled();
  });

  // ── Test 7: cancelOrder mutation ──────────────────────────────

  it('cancelOrder calls the mutation hook with order id', async () => {
    const mockCancelMutation = jest.fn().mockResolvedValue({
      errors: undefined,
      data: { id: 'ord-1', status: 'CANCELLED' }
    });
    mockUseAuth.mockReturnValue({ accessToken: 'test-token', tokenId: 't1' } as any);
    mockUseGetInstrumentsQuery.mockReturnValue({ data: { instruments: MOCK_INSTRUMENTS }, loading: false, error: undefined });
    mockUseGetAccountBalanceQuery.mockReturnValue({ data: MOCK_BALANCE, loading: false, error: undefined });
    mockUseGetOrdersQuery.mockReturnValue({ data: { orders: { data: [] } }, loading: false, error: undefined });
    mockUseGetPositionsQuery.mockReturnValue({ data: { positions: { data: [] } }, loading: false, error: undefined });
    mockUseGetQuoteQuery.mockReturnValue({ data: undefined, loading: false, error: undefined });
    mockUsePlaceOrderMutation.mockReturnValue([jest.fn(), { loading: false }]);
    mockUseCancelOrderMutation.mockReturnValue([mockCancelMutation, { loading: false }]);

    render(<MobileWorkstation />);

    await waitFor(async () => {
      await screen.getByTestId('cancel-order').click();
    });

    expect(mockCancelMutation).toHaveBeenCalledWith({ variables: { orderId: 'o1' } });
  });
});