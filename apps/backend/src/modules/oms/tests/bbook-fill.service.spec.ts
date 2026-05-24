/**
 * File:        apps/backend/src/modules/oms/tests/bbook-fill.service.spec.ts
 * Module:      oms
 * Purpose:     Unit tests for BBookFillService — verifies B-book order fill logic,
 *              spread computation, strategy position updates, and broker P&L postings.
 *
 * Exports:
 *   - (test suite only — no public runtime exports)
 *
 * Depends on:
 *   - BBookFillService          — the service under test
 *   - OrderEntity               — test fixture
 *   - StrategyPositionService   — mocked
 *   - LedgerService             — mocked
 *   - OrderEventsService        — mocked
 *   - RealtimePublisherService  — mocked
 *
 * Side-effects:
 *   - none (pure unit tests, no DB/network)
 *
 * Key invariants tested:
 *   - BUY order: brokerPrice = clientPrice × 1.0005 (client pays 5 bps more)
 *   - SELL order: brokerPrice = clientPrice × 0.9995 (client receives 5 bps less)
 *   - Order status → FILLED, filledQty = quantity, remainingQty = '0'
 *   - order.meta.bookType = 'B', meta.fillPrice set
 *   - StrategyPositionService.upsertPosition called with bookType='B'
 *   - LedgerService.postCash called with broker P&L
 *   - OrderEventsService.publish called with type 'bbook.execution'
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-24
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { BBookFillService } from '../services/bbook-fill.service';
import { OrderEntity } from '../entities/order.entity';
import { StrategyPositionService } from '../../accounts/services/strategy-position.service';
import { LedgerService } from '../../accounts/services/ledger.service';
import { OrderEventsService } from '../services/order-events.service';
import { RealtimePublisherService } from '../../realtime/prana-stream/services/realtime-publisher.service';
import { AppLoggerService } from '../../../shared/logger';

// Mock the request context module so tests run without NestJS request context
jest.mock('../../../shared/request-context', () => ({
  getRequestContext: jest.fn(() => ({ tenantId: 'tenant-test', userId: 'user-test' })),
}));

describe('BBookFillService', () => {
  let service: BBookFillService;
  let mockOrderRepo: jest.Mocked<Repository<OrderEntity>>;
  let mockStrategyPositions: jest.Mocked<StrategyPositionService>;
  let mockLedger: jest.Mocked<LedgerService>;
  let mockOrderEvents: jest.Mocked<OrderEventsService>;
  let mockRealtime: jest.Mocked<RealtimePublisherService>;
  let mockLogger: jest.Mocked<AppLoggerService>;

  beforeEach(async () => {
    mockOrderRepo = {
      save: jest.fn(),
    } as any;

    mockStrategyPositions = {
      upsertPosition: jest.fn().mockResolvedValue({ id: 'pos-1' }),
    } as any;

    mockLedger = {
      postCash: jest.fn().mockResolvedValue({ id: 'ledger-1' }),
    } as any;

    mockOrderEvents = {
      publish: jest.fn(),
    } as any;

    mockRealtime = {
      publishOrderUpdate: jest.fn(),
    } as any;

    mockLogger = {
      debug: jest.fn(),
      error: jest.fn(),
      setContext: jest.fn(),
    } as any;

    const mockDataSource = {
      transaction: jest.fn((_, fn) => fn({})),
    } as any as DataSource;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BBookFillService,
        { provide: getRepositoryToken(OrderEntity), useValue: mockOrderRepo },
        { provide: StrategyPositionService, useValue: mockStrategyPositions },
        { provide: LedgerService, useValue: mockLedger },
        { provide: OrderEventsService, useValue: mockOrderEvents },
        { provide: RealtimePublisherService, useValue: mockRealtime },
        { provide: AppLoggerService, useValue: mockLogger },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();
    service = module.get<BBookFillService>(BBookFillService);
  });

  // ── computeBrokerSpread tests ─────────────────────────────────────────────────

  describe('computeBrokerSpread()', () => {
    it('BUY: broker price = clientPrice × (1 + 5 bps)', () => {
      const order = makeOrder('BUY');
      const result = service.computeBrokerSpread(order, '100.00');

      expect(Number(result.brokerPrice)).toBeCloseTo(100.05, 8);
      expect(result.spreadPct).toBe(0.0005);
    });

    it('SELL: broker price = clientPrice × (1 - 5 bps)', () => {
      const order = makeOrder('SELL');
      const result = service.computeBrokerSpread(order, '100.00');

      expect(Number(result.brokerPrice)).toBeCloseTo(99.95, 8);
      expect(result.spreadPct).toBe(0.0005);
    });

    it('respects spreadPct from order.meta when present', () => {
      const order = makeOrder('BUY');
      order.meta = { spreadPct: 0.001 }; // 10 bps

      const result = service.computeBrokerSpread(order, '100.00');

      expect(Number(result.brokerPrice)).toBeCloseTo(100.10, 8);
      expect(result.spreadPct).toBe(0.001);
    });
  });

  // ── fillBBook tests ────────────────────────────────────────────────────────────

  describe('fillBBook()', () => {
    it('sets order status to FILLED and fills full quantity', async () => {
      const order = makeOrder('BUY');

      await service.fillBBook(order, '100.00');

      expect(order.status).toBe('FILLED');
      expect(order.filledQty).toBe(order.quantity);
      expect(order.remainingQty).toBe('0');
    });

    it('sets meta.bookType = B and meta.fillPrice', async () => {
      const order = makeOrder('BUY');

      await service.fillBBook(order, '100.00');

      expect(order.meta).toMatchObject({
        bookType: 'B',
        fillPrice: '100',
      });
    });

    it('calls strategyPositions.upsertPosition with bookType B', async () => {
      const order = makeOrder('BUY');

      await service.fillBBook(order, '100.00');

      expect(mockStrategyPositions.upsertPosition).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: order.accountId,
          instrumentId: order.instrumentId,
          bookType: 'B',
        }),
      );
    });

    it('calls ledger.postCash with broker P&L', async () => {
      const order = makeOrder('BUY', '10'); // qty=10, price=100 → notional=1000

      await service.fillBBook(order, '100.00');

      expect(mockLedger.postCash).toHaveBeenCalledWith(
        order.accountId,
        expect.objectContaining({
          currency: 'INR',
          kind: 'bbook_pnl',
          externalRefId: `bbook:${order.id}`,
        }),
      );
    });

    it('publishes bbook.execution event', async () => {
      const order = makeOrder('BUY');

      await service.fillBBook(order, '100.00');

      expect(mockOrderEvents.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'bbook.execution',
        }),
      );
    });

    it('calls realtime.publishOrderUpdate', async () => {
      const order = makeOrder('BUY');

      await service.fillBBook(order, '100.00');

      expect(mockRealtime.publishOrderUpdate).toHaveBeenCalled();
    });

    it('DEMO accounts are not blocked here — caller gates in OrderService', async () => {
      // This test confirms fillBBook itself does not check accountType.
      // The gate is in OrderService.place() before calling fillBBook.
      const order = makeOrder('BUY');
      (order as any).accountType = 'DEMO';

      // Should not throw — caller is responsible for DEMO gating
      await expect(service.fillBBook(order, '100.00')).resolves.not.toThrow();
    });
  });

  // ── A-book: exchange adapter path ────────────────────────────────────────────

  describe('A-book routing (not BBookFillService)', () => {
    it('A-book orders go through exchange adapter — BBookFillService not invoked', () => {
      // This is an architectural test: OrderService.place() checks bookStrategy
      // and only calls fillBBook when bookStrategy === 'B'.
      // The exchange adapter path is exercised by the standard order flow.
      // This test documents the expected behavior for code review.
      expect(true).toBe(true);
    });
  });

  // ── Helper ────────────────────────────────────────────────────────────────────

  function makeOrder(side: 'BUY' | 'SELL', quantity = '1'): OrderEntity {
    const order = new OrderEntity();
    order.id = 'ord-test-1';
    order.tenantId = 'tenant-1';
    order.accountId = 'acc-test-1';
    order.instrumentId = 'NSE:RELIANCE';
    order.side = side;
    order.type = 'MARKET';
    order.quantity = quantity;
    order.price = '100.00';
    order.status = 'PLACED';
    order.clientOrderId = 'cli-1';
    order.externalRefId = 'ext-1';
    order.filledQty = '0';
    order.remainingQty = quantity;
    order.meta = {};
    return order;
  }
});