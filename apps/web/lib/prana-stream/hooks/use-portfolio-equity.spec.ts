/**
 * File:        apps/web/lib/prana-stream/hooks/use-portfolio-equity.spec.ts
 * Module:      web/prana-stream/hooks
 * Purpose:     Unit tests for the portfolio-equity derivation hook.
 *              Validates the math + selection logic that runs on top of the
 *              raw account + position streams.
 *
 * Exports:
 *   - (test suite only)
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-12
 */

import { renderHook } from '@testing-library/react';
import { useAccountUpdates } from './use-account-updates';
import { usePositionUpdates } from './use-position-updates';
import { usePortfolioEquity } from './use-portfolio-equity';
import type {
  AccountUpdatePayload,
  PositionUpdatePayload,
} from '../types';

jest.mock('./use-account-updates');
jest.mock('./use-position-updates');

const mockedAccount = useAccountUpdates as jest.MockedFunction<typeof useAccountUpdates>;
const mockedPosition = usePositionUpdates as jest.MockedFunction<typeof usePositionUpdates>;

const account = (overrides: Partial<AccountUpdatePayload> = {}): AccountUpdatePayload => ({
  accountId: 'acct-1',
  totalCash: '0',
  lockedCash: '0',
  availableCash: '0',
  ts: '2026-06-12T10:00:00.000Z',
  ...overrides,
});

const position = (overrides: Partial<PositionUpdatePayload> = {}): PositionUpdatePayload => ({
  accountId: 'acct-1',
  instrumentId: 'inst-A',
  netQty: '0',
  averagePrice: '0',
  realizedPnl: '0',
  unrealizedPnl: '0',
  ...overrides,
});

describe('usePortfolioEquity', () => {
  it('returns null when no live account snapshot has arrived', () => {
    mockedAccount.mockReturnValue(new Map());
    mockedPosition.mockReturnValue(new Map());

    const { result } = renderHook(() => usePortfolioEquity());
    expect(result.current).toBeNull();
  });

  it('derives total equity, margin used, and position notional from streams', () => {
    const a = account({
      accountId: 'acct-1',
      totalCash: '100000',
      availableCash: '60000',
      lockedCash: '20000',
    });
    const positions = new Map<string, PositionUpdatePayload>([
      ['acct-1:inst-A', position({ accountId: 'acct-1', instrumentId: 'inst-A', netQty: '100', averagePrice: '50', realizedPnl: '500', unrealizedPnl: '1500' })],
      ['acct-1:inst-B', position({ accountId: 'acct-1', instrumentId: 'inst-B', netQty: '-50', averagePrice: '200', realizedPnl: '-200', unrealizedPnl: '700' })],
      // different account — must be ignored
      ['acct-2:inst-X', position({ accountId: 'acct-2', instrumentId: 'inst-X', netQty: '10', averagePrice: '100', realizedPnl: '0', unrealizedPnl: '0' })],
    ]);

    mockedAccount.mockReturnValue(new Map([['acct-1', a]]));
    mockedPosition.mockReturnValue(positions);

    const { result } = renderHook(() => usePortfolioEquity('acct-1'));
    const eq = result.current!;
    expect(eq).not.toBeNull();
    expect(eq.accountId).toBe('acct-1');
    expect(eq.totalCash).toBe(100000);
    expect(eq.availableCash).toBe(60000);
    expect(eq.lockedCash).toBe(20000);
    // gross notional = 100*50 + 50*200 = 5000 + 10000 = 15000
    expect(eq.grossPositionNotional).toBe(15000);
    // total PnL = (500+1500) + (-200+700) = 2000 + 500 = 2500
    expect(eq.totalPnL).toBe(2500);
    // marginUsed = max(lockedCash=20000, notional*0.1=1500) = 20000
    expect(eq.marginUsed).toBe(20000);
    // marginAvailable = max(0, 60000 - 20000) = 40000
    expect(eq.marginAvailable).toBe(40000);
    // totalEquity = 100000 + 2500 = 102500
    expect(eq.totalEquity).toBe(102500);
    expect(eq.positionCount).toBe(2);
  });

  it('falls back to the most recently updated account when no id is provided', () => {
    const older = account({ accountId: 'acct-old', totalCash: '100', availableCash: '100', ts: '2026-06-12T09:00:00.000Z' });
    const newer = account({ accountId: 'acct-new', totalCash: '500', availableCash: '500', ts: '2026-06-12T10:00:00.000Z' });
    const accounts = new Map<string, AccountUpdatePayload>([
      ['acct-old', older],
      ['acct-new', newer],
    ]);

    mockedAccount.mockReturnValue(accounts);
    mockedPosition.mockReturnValue(new Map());

    const { result } = renderHook(() => usePortfolioEquity());
    expect(result.current?.accountId).toBe('acct-new');
    expect(result.current?.totalEquity).toBe(500);
  });

  it('ignores positions belonging to other accounts', () => {
    const a = account({ accountId: 'acct-1', totalCash: '1000', availableCash: '1000' });
    const positions = new Map<string, PositionUpdatePayload>([
      ['acct-2:inst-A', position({ accountId: 'acct-2', instrumentId: 'inst-A', netQty: '100', averagePrice: '50', realizedPnl: '9999', unrealizedPnl: '9999' })],
    ]);

    mockedAccount.mockReturnValue(new Map([['acct-1', a]]));
    mockedPosition.mockReturnValue(positions);

    const { result } = renderHook(() => usePortfolioEquity('acct-1'));
    expect(result.current?.totalPnL).toBe(0);
    expect(result.current?.positionCount).toBe(0);
  });
});
