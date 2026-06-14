/**
 * File:        apps/web/features/mobile-terminal/components/mobile-workstation.spec.tsx
 * Module:      Mobile Terminal · Tests
 * Purpose:     Unit tests for the MobileWorkstation data adapter.
 *             Tests: auth detection, empty states, error surfacing, mutations.
 *
 * Depends on:
 *   - ./mobile-workstation — system under test
 *   - @testing-library/react — component rendering
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-12
 */

import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// ─────────────────────────────────────────────────────────────────────────────
// Mock implementations at module boundary — avoid ApolloProvider wiring
// ─────────────────────────────────────────────────────────────────────────

// Mock auth - uses default value for mockReset in resetMocks
const mockUseAuth = jest.fn(() => ({ accessToken: null }));

// Apollo hooks (instruments + quote polling)
const emptyApolloQuery = () => ({ data: undefined, loading: false, error: undefined, refetch: jest.fn() });
const mockUseGetInstrumentsQuery = jest.fn(emptyApolloQuery);
const mockUseGetQuoteQuery = jest.fn(emptyApolloQuery);

// Apollo mutations
const mockPlaceOrderFn = jest.fn();
const mockCancelOrderFn = jest.fn();
const mockUsePlaceOrderMutation = jest.fn(() => [mockPlaceOrderFn, { loading: false, error: undefined }]);
const mockUseCancelOrderMutation = jest.fn(() => [mockCancelOrderFn, { loading: false, error: undefined }]);

// PranaStream live-data hooks
const emptyPranaState = () => ({ data: [] as any[], loading: false, error: null as string | null });
const mockUseOpenOrders = jest.fn(emptyPranaState);
const mockUsePositionPnL = jest.fn(emptyPranaState);
const mockUsePortfolioEquity = jest.fn(() => ({
  data: null,
  loading: false,
  error: null,
}));

jest.mock('@/shared/providers/auth-provider', () => ({
  useAuth: (...args: unknown[]) => (mockUseAuth as (...a: unknown[]) => unknown)(...args),
}));

jest.mock('@/gql/hooks', () => ({
  useGetInstrumentsQuery: (...args: unknown[]) => (mockUseGetInstrumentsQuery as (...a: unknown[]) => unknown)(...args),
  useGetQuoteQuery: (...args: unknown[]) => (mockUseGetQuoteQuery as (...a: unknown[]) => unknown)(...args),
  usePlaceOrderMutation: (...args: unknown[]) => (mockUsePlaceOrderMutation as (...a: unknown[]) => unknown)(...args),
  useCancelOrderMutation: (...args: unknown[]) => (mockUseCancelOrderMutation as (...a: unknown[]) => unknown)(...args),
}));

jest.mock('@/lib/prana-stream', () => ({
  useOpenOrders: (...args: unknown[]) => (mockUseOpenOrders as (...a: unknown[]) => unknown)(...args),
  usePositionPnL: (...args: unknown[]) => (mockUsePositionPnL as (...a: unknown[]) => unknown)(...args),
  usePortfolioEquity: (...args: unknown[]) => (mockUsePortfolioEquity as (...a: unknown[]) => unknown)(...args),
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

// ─────────────────────────────────────────────────────────────────────────
// Reset helpers
// ─────────────────────────────────────────────────────────────────────────

function resetMocks() {
  mockUseAuth.mockReset().mockImplementation(() => ({ accessToken: null }));
  mockUseGetInstrumentsQuery.mockReset().mockImplementation(emptyApolloQuery);
  mockUseGetQuoteQuery.mockReset().mockImplementation(emptyApolloQuery);
  mockUsePlaceOrderMutation.mockReset().mockImplementation(() => [mockPlaceOrderFn, { loading: false, error: undefined }]);
  mockUseCancelOrderMutation.mockReset().mockImplementation(() => [mockCancelOrderFn, { loading: false, error: undefined }]);
  mockUseOpenOrders.mockReset().mockImplementation(emptyPranaState);
  mockUsePositionPnL.mockReset().mockImplementation(emptyPranaState);
  mockUsePortfolioEquity.mockReset().mockImplementation(() => ({ data: null, loading: false, error: null }));
}

function setupHappyPath() {
  mockUseAuth.mockReturnValue({ accessToken: 'test-token' } as any);
  mockUseGetInstrumentsQuery.mockReturnValue({ data: { instruments: MOCK_INSTRUMENTS }, loading: false, error: undefined } as any);
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
  beforeEach(() => {
    resetMocks();
  });

  // ── Test 1: Loading state when instrument catalogue is loading ──────

  it('renders loading=true when instrument catalogue is loading', async () => {
    mockUseAuth.mockReturnValue({ accessToken: 'test-token' } as any);
    mockUseGetInstrumentsQuery.mockReturnValue({ data: undefined, loading: true, error: undefined } as any);

    render(<MobileWorkstation />);

    expect(screen.getByTestId('loading')).toHaveTextContent('true');
  });

  // ── Test 2: Empty state when unauthenticated ────────────────────────────

  it('uses empty data when useAuth() returns null token', async () => {
    mockUseAuth.mockReturnValue({ accessToken: null });

    render(<MobileWorkstation />);

    expect(screen.getByTestId('auth')).toHaveTextContent('false');
  });

  // ── Test 3: Real data when authenticated ────────────────────────

  it('renders real data when authenticated', async () => {
    setupHappyPath();

    render(<MobileWorkstation />);

    expect(screen.getByTestId('auth')).toHaveTextContent('true');
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('instruments')).toHaveTextContent('2');
  });

  // ── Test 4: Error surfacing from instrument hook ────────────────────────

  it('surfaces error from instruments query', async () => {
    mockUseAuth.mockReturnValue({ accessToken: 'test-token' } as any);
    mockUseGetInstrumentsQuery.mockReturnValue({ data: undefined, loading: false, error: { message: 'Network Error' } } as any);

    render(<MobileWorkstation />);

    expect(screen.getByTestId('error')).toHaveTextContent('Network Error');
  });

  // ── Test 5: placeOrder mutation ────────────────────────────────

  it('placeOrder calls the mutation hook', async () => {
    const mockMutation = jest.fn().mockResolvedValue({
      errors: undefined,
      data: { placeOrder: { id: 'ord-1', status: 'PENDING' } },
    });
    mockUseAuth.mockReturnValue({ accessToken: 'test-token' } as any);
    mockUseGetInstrumentsQuery.mockReturnValue({ data: { instruments: MOCK_INSTRUMENTS }, loading: false, error: undefined } as any);
    mockUseGetQuoteQuery.mockReturnValue({ data: undefined, loading: false, error: undefined } as any);
    mockUsePlaceOrderMutation.mockReturnValue([mockMutation, { loading: false, error: undefined }] as any);
    mockUseCancelOrderMutation.mockReturnValue([jest.fn(), { loading: false, error: undefined }] as any);

    render(<MobileWorkstation />);

    await waitFor(async () => {
      await screen.getByTestId('place-order').click();
    });

    expect(mockMutation).toHaveBeenCalled();
  });

  // ── Test 6: cancelOrder mutation ──────────────────────────────

  it('cancelOrder calls the mutation hook with order id', async () => {
    const mockCancelMutation = jest.fn().mockResolvedValue({
      errors: undefined,
      data: { id: 'ord-1', status: 'CANCELLED' },
    });
    mockUseAuth.mockReturnValue({ accessToken: 'test-token' } as any);
    mockUseGetInstrumentsQuery.mockReturnValue({ data: { instruments: MOCK_INSTRUMENTS }, loading: false, error: undefined } as any);
    mockUseGetQuoteQuery.mockReturnValue({ data: undefined, loading: false, error: undefined } as any);
    mockUsePlaceOrderMutation.mockReturnValue([jest.fn(), { loading: false, error: undefined }] as any);
    mockUseCancelOrderMutation.mockReturnValue([mockCancelMutation, { loading: false, error: undefined }] as any);

    render(<MobileWorkstation />);

    await waitFor(async () => {
      await screen.getByTestId('cancel-order').click();
    });

    expect(mockCancelMutation).toHaveBeenCalledWith({ variables: { orderId: 'o1' } });
  });
});
