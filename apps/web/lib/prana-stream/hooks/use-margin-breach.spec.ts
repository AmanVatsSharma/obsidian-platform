/**
 * @file apps/web/lib/prana-stream/hooks/use-margin-breach.spec.ts
 * @module web/prana-stream
 * @description Tests for the useMarginBreach hook
 * @author BharatERP
 * @created 2026-06-10
 * @last-updated 2026-06-10
 */

import { act, renderHook } from '@testing-library/react';
import { useMarginBreach } from './use-margin-breach';
import type { MarginBreachPayload, RealtimeEvent } from '../types';

type Listener = (event: any) => void;

function makeMockClient() {
  const listeners = new Map<string, Set<Listener>>();
  return {
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    on: jest.fn((event: string, listener: Listener) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(listener);
      return () => listeners.get(event)?.delete(listener);
    }),
    __dispatch: (event: string, payload: any) => {
      listeners.get(event)?.forEach((fn) => fn(payload));
    },
  };
}

let mockClient: ReturnType<typeof makeMockClient>;

jest.mock('../prana-provider', () => ({
  usePranaStream: () => ({
    client: mockClient,
    status: 'connected',
    isReady: true,
  }),
}));

describe('useMarginBreach', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = makeMockClient();
  });

  it('starts with no breach', () => {
    const { result } = renderHook(() => useMarginBreach());
    expect(result.current.breach).toBeNull();
    expect(result.current.isBlocking).toBe(false);
  });

  it('updates when a margin.breach event arrives', () => {
    const { result } = renderHook(() => useMarginBreach());
    const breach: MarginBreachPayload = {
      accountId: 'a1',
      requiredMargin: '10000',
      availableCash: '8000',
      shortfall: '2000',
      severity: 'warning',
      ts: new Date().toISOString(),
    };
    act(() => {
      mockClient.__dispatch('margin.breach', { data: breach } as RealtimeEvent<MarginBreachPayload>);
    });
    expect(result.current.breach).toEqual(breach);
    expect(result.current.isBlocking).toBe(false);
  });

  it('marks critical/breach severity as blocking', () => {
    const { result } = renderHook(() => useMarginBreach());
    const breach: MarginBreachPayload = {
      accountId: 'a1',
      requiredMargin: '10000',
      availableCash: '500',
      shortfall: '9500',
      severity: 'critical',
      ts: new Date().toISOString(),
    };
    act(() => {
      mockClient.__dispatch('margin.breach', { data: breach } as RealtimeEvent<MarginBreachPayload>);
    });
    expect(result.current.isBlocking).toBe(true);
  });

  it('dismiss clears local state', () => {
    const { result } = renderHook(() => useMarginBreach());
    const breach: MarginBreachPayload = {
      accountId: 'a1',
      requiredMargin: '10000',
      availableCash: '0',
      shortfall: '10000',
      severity: 'breach',
      ts: new Date().toISOString(),
    };
    act(() => {
      mockClient.__dispatch('margin.breach', { data: breach } as RealtimeEvent<MarginBreachPayload>);
    });
    expect(result.current.breach).toEqual(breach);
    act(() => {
      result.current.dismiss();
    });
    expect(result.current.breach).toBeNull();
  });
});
