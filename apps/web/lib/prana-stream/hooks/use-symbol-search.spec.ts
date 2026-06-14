/**
 * @file apps/web/lib/prana-stream/hooks/use-symbol-search.spec.ts
 * @module web/prana-stream
 * @description Tests for useSymbolSearch hook (live symbol search).
 *
 * Covers:
 *   - Initial state and isLoading transitions
 *   - touch() → manual subscribe
 *   - Auto-touch top N results on search resolve
 *   - Drop auto subs when results change
 *   - Manual (touch) subs survive a search replace
 *   - Inactivity expiry closes the sub
 *   - maxActive cap evicts the oldest auto sub
 *   - getLivePrice returns tick data only for live keys
 *   - Unmount closes all open subscriptions
 *
 * @author BharatERP
 * @created 2026-06-10
 * @last-updated 2026-06-10
 */

import { act, renderHook } from '@testing-library/react';
import { useSymbolSearch } from './use-symbol-search';
import type { SymbolSearchResult } from './use-symbol-search';
import type { Tick } from '../types';

type Listener = (data: unknown) => void;

function makeMockClient() {
  const listeners = new Map<string, Set<Listener>>();
  return {
    subscribeWatchlist: jest.fn(),
    unsubscribeWatchlist: jest.fn(),
    on: jest.fn((event: string, listener: Listener) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(listener);
      return () => listeners.get(event)?.delete(listener);
    }),
    /** Test helper — dispatch a fake tick event. */
    __dispatchTicks: (ticks: Tick[]) => {
      listeners.get('watchlist.ticks')?.forEach((fn) => fn(ticks));
    },
  };
}

const SAMPLE_RESULTS: SymbolSearchResult[] = [
  { exchange: 'NSE', symbol: 'INFY', name: 'Infosys' },
  { exchange: 'NSE', symbol: 'TCS', name: 'Tata Consultancy' },
  { exchange: 'NSE', symbol: 'WIPRO', name: 'Wipro' },
  { exchange: 'NSE', symbol: 'HCL', name: 'HCL Tech' },
];

const fetcher = jest.fn(async (q: string, _limit: number) => {
  // Return all results for an empty query, or a substring match otherwise.
  // Empty-string check mirrors the production defaultSearch behavior.
  if (!q) return SAMPLE_RESULTS;
  return SAMPLE_RESULTS.filter((r) => r.symbol.toLowerCase().includes(q.toLowerCase()));
});

let mockClient: ReturnType<typeof makeMockClient>;

jest.mock('../prana-provider', () => ({
  usePranaStream: () => ({
    client: mockClient,
    status: 'connected',
    isReady: true,
  }),
}));

describe('useSymbolSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetcher.mockClear();
    mockClient = makeMockClient();
  });

  it('initializes with empty results, no loading, no error', () => {
    const { result } = renderHook(() => useSymbolSearch('', { fetcher }));
    expect(result.current.results).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.total).toBe(0);
  });

  it('debounce-fetches and populates results on a non-empty query', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() =>
      useSymbolSearch('infy', { debounceMs: 50, fetcher }),
    );

    // While debouncing, loading is true and fetcher not called yet.
    expect(result.current.isLoading).toBe(true);
    expect(fetcher).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(60);
    });

    expect(fetcher).toHaveBeenCalledWith('infy', expect.any(Number));
    expect(result.current.results.map((r) => r.symbol)).toEqual(['INFY']);
    expect(result.current.isLoading).toBe(false);

    jest.useRealTimers();
  });

  it('touch() opens a manual subscription and does not duplicate it', () => {
    const { result } = renderHook(() => useSymbolSearch('infy', { fetcher }));

    act(() => {
      result.current.touch('NSE', 'INFY');
    });
    act(() => {
      result.current.touch('NSE', 'INFY');
    });

    expect(mockClient.subscribeWatchlist).toHaveBeenCalledTimes(1);
    expect(mockClient.subscribeWatchlist).toHaveBeenCalledWith([
      { exchange: 'NSE', symbol: 'INFY' },
    ]);
    expect(result.current.isLive('NSE', 'INFY')).toBe(true);
  });

  it('auto-subscribes the top N results after search resolves', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() =>
      useSymbolSearch('', {
        debounceMs: 10,
        autoTouchTopN: 2,
        fetcher,
      }),
    );

    await act(async () => {
      jest.advanceTimersByTime(20);
    });

    // Top 2 of the 4 matches should have been auto-subscribed.
    expect(mockClient.subscribeWatchlist).toHaveBeenCalledTimes(2);
    expect(result.current.isLive('NSE', 'INFY')).toBe(true);
    expect(result.current.isLive('NSE', 'TCS')).toBe(true);
    expect(result.current.isLive('NSE', 'WIPRO')).toBe(false);
    expect(result.current.isLive('NSE', 'HCL')).toBe(false);

    jest.useRealTimers();
  });

  it('drops auto subs that fell out of the top N when results change', async () => {
    jest.useFakeTimers();
    // Re-render with a new query to swap results.
    const { result, rerender } = renderHook(
      ({ q }) =>
        useSymbolSearch(q, {
          debounceMs: 10,
          autoTouchTopN: 1,
          fetcher,
        }),
      { initialProps: { q: '' } },
    );

    await act(async () => {
      jest.advanceTimersByTime(20);
    });
    expect(result.current.isLive('NSE', 'INFY')).toBe(true);

    // New query that surfaces a different top-1.
    rerender({ q: 'tcs' });
    await act(async () => {
      jest.advanceTimersByTime(20);
    });

    expect(result.current.isLive('NSE', 'INFY')).toBe(false);
    expect(result.current.isLive('NSE', 'TCS')).toBe(true);
    // INFY was unsubscribed from the server.
    expect(mockClient.unsubscribeWatchlist).toHaveBeenCalledWith([
      { exchange: 'NSE', symbol: 'INFY' },
    ]);

    jest.useRealTimers();
  });

  it('manual (touch) subs survive a search replace', async () => {
    jest.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ q }) =>
        useSymbolSearch(q, {
          debounceMs: 10,
          autoTouchTopN: 1,
          fetcher,
        }),
      { initialProps: { q: '' } },
    );

    await act(async () => {
      jest.advanceTimersByTime(20);
    });

    // User pins WIPRO manually — outside the top-1.
    act(() => {
      result.current.touch('NSE', 'WIPRO');
    });
    expect(result.current.isLive('NSE', 'WIPRO')).toBe(true);

    // New search with a different top-1.
    rerender({ q: 'tcs' });
    await act(async () => {
      jest.advanceTimersByTime(20);
    });

    // WIPRO stays alive (manual source), TCS is the new auto top-1.
    expect(result.current.isLive('NSE', 'WIPRO')).toBe(true);
    expect(result.current.isLive('NSE', 'TCS')).toBe(true);

    jest.useRealTimers();
  });

  it('expiry closes the subscription', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() =>
      useSymbolSearch('infy', { debounceMs: 10, inactiveMs: 500, fetcher }),
    );

    act(() => {
      result.current.touch('NSE', 'INFY');
    });
    expect(result.current.isLive('NSE', 'INFY')).toBe(true);

    act(() => {
      jest.advanceTimersByTime(600);
    });
    expect(result.current.isLive('NSE', 'INFY')).toBe(false);
    expect(mockClient.unsubscribeWatchlist).toHaveBeenCalledWith([
      { exchange: 'NSE', symbol: 'INFY' },
    ]);

    jest.useRealTimers();
  });

  it('maxActive cap evicts the oldest auto sub (manual is pinned)', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() =>
      useSymbolSearch('', {
        debounceMs: 10,
        maxActive: 2,
        autoTouchTopN: 4, // tries to open 4 — but cap is 2
        inactiveMs: 10_000,
        fetcher,
      }),
    );

    await act(async () => {
      jest.advanceTimersByTime(20);
    });
    // Top 2 open as auto.
    expect(result.current.isLive('NSE', 'INFY')).toBe(true);
    expect(result.current.isLive('NSE', 'TCS')).toBe(true);

    // WIPRO comes in as a manual touch — should evict the oldest auto (INFY).
    act(() => {
      result.current.touch('NSE', 'WIPRO');
    });
    expect(result.current.isLive('NSE', 'WIPRO')).toBe(true);
    expect(result.current.isLive('NSE', 'INFY')).toBe(false);
    expect(result.current.isLive('NSE', 'TCS')).toBe(true);

    jest.useRealTimers();
  });

  it('getLivePrice returns tick data only for live keys', () => {
    const { result } = renderHook(() => useSymbolSearch('infy', { fetcher }));

    expect(result.current.getLivePrice('NSE', 'INFY')).toBeNull();

    act(() => {
      result.current.touch('NSE', 'INFY');
    });
    act(() => {
      mockClient.__dispatchTicks([
        {
          exchange: 'NSE',
          symbol: 'INFY',
          price: 1500,
          ts: 1234567890,
        },
      ]);
    });

    expect(result.current.getLivePrice('NSE', 'INFY')).toEqual({
      price: 1500,
      receivedAt: 1234567890,
    });
  });

  it('unmount closes all open subscriptions', () => {
    const { result, unmount } = renderHook(() =>
      useSymbolSearch('infy', { maxActive: 5, fetcher }),
    );
    act(() => {
      result.current.touch('NSE', 'INFY');
      result.current.touch('NSE', 'TCS');
    });
    unmount();
    expect(mockClient.unsubscribeWatchlist).toHaveBeenCalledWith([
      { exchange: 'NSE', symbol: 'INFY' },
    ]);
    expect(mockClient.unsubscribeWatchlist).toHaveBeenCalledWith([
      { exchange: 'NSE', symbol: 'TCS' },
    ]);
  });
});
