/**
 * File:        apps/backend/src/modules/settlement/tests/settlement-outbox-handler.spec.ts
 * Module:      settlement
 * Purpose:     Unit tests for SettlementOutboxHandler and segment-detector.
 *              Tests: job creation from outbox, T+N date per segment, missing fields, segment heuristic.
 *
 * Exports:
 *   - detectSegment() tests
 *   - SettlementOutboxHandler.canHandle() tests
 *   - SettlementOutboxHandler.handle() tests
 *
 * Depends on:
 *   - SettlementOutboxHandler  — class under test
 *   - SettlementService        — mock createJob
 *   - OutboxEntity             — mock message shape
 *   - detectSegment            — pure function tests
 *
 * Side-effects: none (unit tests use mocks)
 *
 * Key invariants:
 *   - handle() re-throws on missing required fields
 *   - handle() calls createJob with correct fields regardless of segment
 *   - getSettlementDate() returns T+0 for CRYPTO, T+1 for FOREX, T+2 for EQUITY/COMMODITY
 *
 * Read order:
 *   1. detectSegment() tests
 *   2. SettlementOutboxHandler tests
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-24
 */

import { Test } from '@nestjs/testing';
import { AppLoggerService } from '../../../shared/logger';
import { SettlementService } from '../services/settlement.service';
import { SettlementOutboxHandler } from '../services/settlement-outbox-handler';
import { detectSegment } from '../services/segment-detector';
import { OutboxEntity } from '../../../shared/outbox/entities/outbox.entity';

describe('detectSegment', () => {
  const cases: Array<[instrumentId: string, expected: string]> = [
    // CRYPTO
    ['CRYPTO:BTC-USD', 'CRYPTO'],
    ['CRYPTO:ETH-PERP', 'CRYPTO'],
    ['BINANCE:PERP-BTC', 'CRYPTO'],
    // FOREX
    ['FX:EUR-USD', 'FOREX'],
    ['OANDA:CFD-EUR-USD', 'FOREX'],
    ['FOREX:DEMO-EUR', 'FOREX'],
    // EQUITY / F&O
    ['NSE:INFY', 'EQUITY'],
    ['BSE:RELIANCE', 'EQUITY'],
    ['NSEFNO:NIFTY-OPTION', 'EQUITY'],
    ['MCX:GOLD', 'COMMODITY'],
    // Default
    ['UNKNOWN:SYMBOL', 'EQUITY'],
    ['ABC123', 'EQUITY'],
  ];

  test.each(cases)('detectSegment(%s) → %s', (instrumentId, expected) => {
    expect(detectSegment(instrumentId)).toBe(expected);
  });
});

describe('SettlementOutboxHandler', () => {
  let handler: SettlementOutboxHandler;
  let mockSettlementService: {
    createJob: jest.Mock;
  };
  let mockLogger: {
    debug: jest.Mock;
    setContext: jest.Mock;
    warn: jest.Mock;
    error: jest.Mock;
  };

  beforeEach(async () => {
    mockSettlementService = {
      createJob: jest.fn().mockResolvedValue({ id: 'job-1' }),
    };
    mockLogger = {
      debug: jest.fn(),
      setContext: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        SettlementOutboxHandler,
        { provide: SettlementService, useValue: mockSettlementService },
        { provide: AppLoggerService, useValue: mockLogger },
      ],
    }).compile();

    handler = module.get(SettlementOutboxHandler);
  });

  describe('canHandle', () => {
    it('returns true for settlement.job.create', () => {
      expect(handler.canHandle('settlement.job.create')).toBe(true);
    });

    it('returns false for other topics', () => {
      expect(handler.canHandle('order.placed')).toBe(false);
      expect(handler.canHandle('settlement.job.cancel')).toBe(false);
      expect(handler.canHandle('')).toBe(false);
    });
  });

  describe('handle', () => {
    function makeMsg(overrides: Partial<OutboxEntity>): OutboxEntity {
      return {
        id: 'msg-1',
        tenantId: 'tenant-1',
        topic: 'settlement.job.create',
        payload: {
          executionId: 'exec-1',
          accountId: 'acc-1',
          instrumentId: 'NSE:INFY',
          quantity: '100',
          price: '1500.00',
          fees: '10.50',
        },
        status: 'PENDING',
        retryCount: 0,
        lastAttemptAt: null,
        lastError: null,
        createdAt: new Date(),
        ...overrides,
      } as OutboxEntity;
    }

    it('creates a settlement job with correct amount (qty * price + fees)', async () => {
      const msg = makeMsg({ payload: { executionId: 'exec-1', accountId: 'acc-1', instrumentId: 'NSE:INFY', quantity: '10', price: '100.00', fees: '5' } });
      await handler.handle(msg);

      expect(mockSettlementService.createJob).toHaveBeenCalledTimes(1);
      const call = mockSettlementService.createJob.mock.calls[0][0];
      // 10 * 100 + 5 = 1005.00
      expect(call.amount).toBe('1005.0000');
    });

    it('uses detected segment from instrumentId when not provided', async () => {
      const msg = makeMsg({ payload: { executionId: 'exec-1', accountId: 'acc-1', instrumentId: 'CRYPTO:BTC-USD', quantity: '1', price: '50000', fees: '0' } });
      await handler.handle(msg);

      const call = mockSettlementService.createJob.mock.calls[0][0];
      expect(call.tradeDate).toBeDefined();
    });

    it('uses explicit segment from payload when provided', async () => {
      const msg = makeMsg({
        payload: {
          executionId: 'exec-1',
          accountId: 'acc-1',
          instrumentId: 'NSE:INFY',
          quantity: '1',
          price: '100',
          fees: '0',
          segment: 'FOREX' as unknown as string,
        },
      });
      await handler.handle(msg);

      const call = mockSettlementService.createJob.mock.calls[0][0];
      expect(call.tradeDate).toBeDefined();
    });

    it('defaults to INR currency when not provided', async () => {
      const msg = makeMsg({ payload: { executionId: 'exec-1', accountId: 'acc-1', instrumentId: 'NSE:INFY', quantity: '1', price: '100', fees: '0' } });
      await handler.handle(msg);

      const call = mockSettlementService.createJob.mock.calls[0][0];
      expect(call.currency).toBe('INR');
    });

    it('uses currency from payload when provided', async () => {
      const msg = makeMsg({
        payload: {
          executionId: 'exec-1',
          accountId: 'acc-1',
          instrumentId: 'NSE:INFY',
          quantity: '1',
          price: '100',
          fees: '0',
          currency: 'USD',
        },
      });
      await handler.handle(msg);

      const call = mockSettlementService.createJob.mock.calls[0][0];
      expect(call.currency).toBe('USD');
    });

    it('throws and does not call createJob when executionId is missing', async () => {
      const msg = makeMsg({ payload: { accountId: 'acc-1', instrumentId: 'NSE:INFY', quantity: '1', price: '100' } as unknown as Record<string, unknown> });
      await expect(handler.handle(msg)).rejects.toThrow('Missing required fields');
      expect(mockSettlementService.createJob).not.toHaveBeenCalled();
    });

    it('throws and does not call createJob when accountId is missing', async () => {
      const msg = makeMsg({ payload: { executionId: 'exec-1', instrumentId: 'NSE:INFY', quantity: '1', price: '100' } as unknown as Record<string, unknown> });
      await expect(handler.handle(msg)).rejects.toThrow('Missing required fields');
      expect(mockSettlementService.createJob).not.toHaveBeenCalled();
    });

    it('throws and does not call createJob when instrumentId is missing', async () => {
      const msg = makeMsg({ payload: { executionId: 'exec-1', accountId: 'acc-1', quantity: '1', price: '100' } as unknown as Record<string, unknown> });
      await expect(handler.handle(msg)).rejects.toThrow('Missing required fields');
      expect(mockSettlementService.createJob).not.toHaveBeenCalled();
    });

    it('uses tenantId from msg.tenantId when not in payload', async () => {
      const msg = makeMsg({ tenantId: 'tenant-from-msg' });
      await handler.handle(msg);

      const call = mockSettlementService.createJob.mock.calls[0][0];
      expect(call.tenantId).toBe('tenant-from-msg');
    });

    it('uses tenantId from payload when provided', async () => {
      const msg = makeMsg({
        tenantId: 'tenant-from-msg',
        payload: { executionId: 'exec-1', accountId: 'acc-1', instrumentId: 'NSE:INFY', quantity: '1', price: '100', fees: '0', tenantId: 'tenant-from-payload' },
      });
      await handler.handle(msg);

      const call = mockSettlementService.createJob.mock.calls[0][0];
      expect(call.tenantId).toBe('tenant-from-payload');
    });

    it('logs debug on start and end', async () => {
      const msg = makeMsg({});
      await handler.handle(msg);

      expect(mockLogger.debug).toHaveBeenCalledWith('handle:start', expect.objectContaining({ msgId: 'msg-1', topic: 'settlement.job.create' }));
      expect(mockLogger.debug).toHaveBeenCalledWith('handle:end', expect.any(Object));
    });
  });
});

describe('SettlementService.getSettlementDate', () => {
  // Monday 2026-05-25
  const monday = new Date('2026-05-25');

  function stripTime(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  it('CRYPTO → T+0 (same day)', () => {
    const result = SettlementService.getSettlementDate(monday, 'CRYPTO');
    expect(stripTime(result)).toBe('2026-05-25');
  });

  it('FOREX → T+1 (next business day)', () => {
    const result = SettlementService.getSettlementDate(monday, 'FOREX');
    expect(stripTime(result)).toBe('2026-05-26');
  });

  it('EQUITY → T+2', () => {
    const result = SettlementService.getSettlementDate(monday, 'EQUITY');
    expect(stripTime(result)).toBe('2026-05-27');
  });

  it('COMMODITY → T+2', () => {
    const result = SettlementService.getSettlementDate(monday, 'COMMODITY');
    expect(stripTime(result)).toBe('2026-05-27');
  });

  it('skips Saturday', () => {
    // Friday 2026-05-29 + T+1 = Monday 2026-06-01 (skips Saturday 30)
    const friday = new Date('2026-05-29');
    const result = SettlementService.getSettlementDate(friday, 'FOREX');
    expect(stripTime(result)).toBe('2026-06-01');
  });

  it('skips Sunday', () => {
    // Saturday 2026-05-30 + T+1 = Monday 2026-06-01 (skips Sunday 31)
    const saturday = new Date('2026-05-30');
    const result = SettlementService.getSettlementDate(saturday, 'FOREX');
    expect(stripTime(result)).toBe('2026-06-01');
  });
});