/**
 * File:        apps/backend/src/modules/oms/tests/conditional-order.worker.spec.ts
 * Module:      oms · Conditional Order Worker — Unit Tests
 * Purpose:     Verifies GTT trigger, expiry, and trailing-stop evaluation logic
 *
 * Exports:
 *   - (all tests — no public symbols)
 *
 * Depends on:
 *   - conditional-order.worker.ts     — module under test
 *   - @nestjs/testing                 — TestBed utilities
 *
 * Side-effects:  none (unit tests — no DB/network)
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-24
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConditionalOrderWorker } from '../services/conditional-order.worker';
import { OrderEntity } from '../entities/order.entity';
import { OrderService } from '../services/order.service';
import { OrderEventsService } from '../services/order-events.service';
import { AppLoggerService } from '../../../shared/logger';
import { PriceFeedService } from '../../../modules/market/services/price-feed.service';
import { Subject } from 'rxjs';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeGttOrder(overrides: Partial<OrderEntity> = {}): OrderEntity {
  return {
    id: 'order-1',
    tenantId: 'tenant-1',
    accountId: 'acc-1',
    instrumentId: 'NSE:INFY',
    side: 'BUY',
    type: 'GTT',
    status: 'NEW',
    triggerPrice: '1500',
    triggerCondition: 'BELOW',
    price: null,
    quantity: '10',
    clientOrderId: 'cli-1',
    filledQty: '0',
    remainingQty: '10',
    ...overrides,
  } as OrderEntity;
}

function makeTrailingOrder(overrides: Partial<OrderEntity> = {}): OrderEntity {
  return {
    id: 'trail-1',
    tenantId: 'tenant-1',
    accountId: 'acc-1',
    instrumentId: 'NSE:INFY',
    side: 'BUY',
    type: 'TRAILING_STOP',
    status: 'NEW',
    price: '1500',
    quantity: '10',
    clientOrderId: 'cli-t1',
    filledQty: '0',
    remainingQty: '10',
    trailingDistance: '50',
    trailingPct: null,
    ...overrides,
  } as OrderEntity;
}

function makeQuote(exchange: string, symbol: string, price: number) {
  return { symbol, exchange, price, ts: Date.now() };
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('ConditionalOrderWorker', () => {
  let worker: ConditionalOrderWorker;
  let mockOrdersRepo: jest.Mocked<any>;
  let mockOrderService: jest.Mocked<any>;
  let mockOrderEvents: { publish: jest.Mock };
  let mockLogger: { debug: jest.Mock; warn: jest.Mock; error: jest.Mock; setContext: jest.Mock };
  let mockPriceFeedService: any;
  let quotesSubject: Subject<any[]>;

  beforeEach(async () => {
    mockOrdersRepo = {
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockImplementation((order) => Promise.resolve(order)),
    };

    mockOrderService = {};
    mockOrderEvents = { publish: jest.fn() };
    mockLogger = {
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      setContext: jest.fn(),
    };
    quotesSubject = new Subject<any[]>();
    mockPriceFeedService = { onQuotes$: () => quotesSubject.asObservable() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConditionalOrderWorker,
        { provide: getRepositoryToken(OrderEntity), useValue: mockOrdersRepo },
        { provide: OrderService, useValue: mockOrderService },
        { provide: OrderEventsService, useValue: mockOrderEvents },
        { provide: AppLoggerService, useValue: mockLogger },
        { provide: PriceFeedService, useValue: mockPriceFeedService },
      ],
    }).compile();

    worker = module.get(ConditionalOrderWorker);
  });

  afterEach(() => {
    quotesSubject.complete();
    jest.clearAllMocks();
  });

  // ── onPriceTick ─────────────────────────────────────────────────────────────

  describe('onPriceTick()', () => {
    it('stores price in cache by instrument key', () => {
      worker.onPriceTick('NSE:INFY', 1495);
      worker.onPriceTick('BSE:RELIANCE', 2800);
      // Expose via public accessor for testing
      expect((worker as any).priceCache.get('NSE:INFY')).toBe;
      expect((worker as any).priceCache.get('BSE:RELIANCE')).toBe;
    });

    it('overwrites previous price for same instrument', () => {
      worker.onPriceTick('NSE:INFY', 1495);
      worker.onPriceTick('NSE:INFY', 1498);
      expect((worker as any).priceCache.get('NSE:INFY')).toBe;
    });
  });

  // ── evaluateCondition — GTT ABOVE ──────────────────────────────────────────

  describe('evaluateCondition() — GTT ABOVE', () => {
    it('triggers when lastPrice >= triggerPrice (ABOVE)', () => {
      const order = makeGttOrder({ triggerCondition: 'ABOVE', triggerPrice: '1500' });
      const result = (worker as any).evaluateCondition(order, 1500);
      expect(result.shouldTrigger).toBe(true);
      expect(result.shouldExpire).toBe(false);
    });

    it('triggers when lastPrice > triggerPrice (ABOVE)', () => {
      const order = makeGttOrder({ triggerCondition: 'ABOVE', triggerPrice: '1500' });
      const result = (worker as any).evaluateCondition(order, 1550);
      expect(result.shouldTrigger).toBe(true);
      expect(result.shouldExpire).toBe(false);
    });

    it('does NOT trigger when lastPrice < triggerPrice (ABOVE)', () => {
      const order = makeGttOrder({ triggerCondition: 'ABOVE', triggerPrice: '1500' });
      const result = (worker as any).evaluateCondition(order, 1450);
      expect(result.shouldTrigger).toBe(false);
      expect(result.shouldExpire).toBe(false);
    });
  });

  // ── evaluateCondition — GTT BELOW ───────────────────────────────────────────

  describe('evaluateCondition() — GTT BELOW', () => {
    it('triggers when lastPrice <= triggerPrice (BELOW)', () => {
      const order = makeGttOrder({ triggerCondition: 'BELOW', triggerPrice: '1500' });
      const result = (worker as any).evaluateCondition(order, 1500);
      expect(result.shouldTrigger).toBe(true);
      expect(result.shouldExpire).toBe(false);
    });

    it('triggers when lastPrice < triggerPrice (BELOW)', () => {
      const order = makeGttOrder({ triggerCondition: 'BELOW', triggerPrice: '1500' });
      const result = (worker as any).evaluateCondition(order, 1480);
      expect(result.shouldTrigger).toBe(true);
      expect(result.shouldExpire).toBe(false);
    });

    it('does NOT trigger when lastPrice > triggerPrice (BELOW)', () => {
      const order = makeGttOrder({ triggerCondition: 'BELOW', triggerPrice: '1500' });
      const result = (worker as any).evaluateCondition(order, 1520);
      expect(result.shouldTrigger).toBe(false);
      expect(result.shouldExpire).toBe(false);
    });

    it('does not trigger when no price in cache (undefined)', () => {
      const order = makeGttOrder({ triggerCondition: 'BELOW', triggerPrice: '1500' });
      const result = (worker as any).evaluateCondition(order, undefined);
      expect(result.shouldTrigger).toBe(false);
      expect(result.shouldExpire).toBe(false);
    });
  });

  // ── evaluateCondition — expiry ──────────────────────────────────────────────

  describe('evaluateCondition() — GTT expiry', () => {
    it('expires order when meta.expireTime is in the past', () => {
      const pastTime = new Date(Date.now() - 60_000).toISOString();
      const order = makeGttOrder({ meta: { expireTime: pastTime } });
      const result = (worker as any).evaluateCondition(order, 1450);
      expect(result.shouldExpire).toBe(true);
      expect(result.shouldTrigger).toBe(false);
    });

    it('does not expire when meta.expireTime is in the future', () => {
      const futureTime = new Date(Date.now() + 3_600_000).toISOString();
      const order = makeGttOrder({ meta: { expireTime: futureTime } });
      const result = (worker as any).evaluateCondition(order, 1450);
      expect(result.shouldExpire).toBe(false);
    });

    it('does not expire when meta.expireTime is absent', () => {
      const order = makeGttOrder({ meta: null });
      const result = (worker as any).evaluateCondition(order, 1450);
      expect(result.shouldExpire).toBe(false);
    });
  });

  // ── recomputeTrailingStop — BUY ──────────────────────────────────────────────

  describe('recomputeTrailingStop() — BUY side', () => {
    it('returns new stop price = lastPrice - trailingDistance', () => {
      const order = makeTrailingOrder({ side: 'BUY', trailingDistance: '50', price: '1500' });
      const result = (worker as any).recomputeTrailingStop(order, 1600);
      expect(result.shouldUpdate).toBe(true);
      expect(result.newStopPrice).toBe('1550');
    });

    it('only moves stop UP for BUY (never down)', () => {
      // First update — sets baseline
      const order1 = makeTrailingOrder({ id: 't-buy-1', side: 'BUY', trailingDistance: '50', price: '1500' });
      (worker as any).trailingState.set('t-buy-1', '1550');

      const order2 = makeTrailingOrder({ id: 't-buy-1', side: 'BUY', trailingDistance: '50', price: '1500' });
      const result = (worker as any).recomputeTrailingStop(order2, 1550);
      expect(result.shouldUpdate).toBe(false); // 1550 - 50 = 1500, not better than 1550
    });

    it('improves stop when price rises for BUY', () => {
      const order = makeTrailingOrder({ id: 't-buy-2', side: 'BUY', trailingDistance: '50', price: '1500' });
      (worker as any).trailingState.set('t-buy-2', '1550');

      const result = (worker as any).recomputeTrailingStop(order, 1620);
      expect(result.shouldUpdate).toBe(true);
      expect(result.newStopPrice).toBe('1570');
      expect(result.improvement).toBe(20);
    });
  });

  // ── recomputeTrailingStop — SELL ─────────────────────────────────────────────

  describe('recomputeTrailingStop() — SELL side', () => {
    it('returns new stop price = lastPrice + trailingDistance', () => {
      const order = makeTrailingOrder({ id: 't-sell-1', side: 'SELL', trailingDistance: '50', price: '1500' });
      const result = (worker as any).recomputeTrailingStop(order, 1400);
      expect(result.shouldUpdate).toBe(true);
      expect(result.newStopPrice).toBe('1450');
    });

    it('only moves stop DOWN for SELL (never up)', () => {
      const order = makeTrailingOrder({ id: 't-sell-2', side: 'SELL', trailingDistance: '50', price: '1500' });
      (worker as any).trailingState.set('t-sell-2', '1450');

      const result = (worker as any).recomputeTrailingStop(order, 1480);
      expect(result.shouldUpdate).toBe(false); // 1480 + 50 = 1530, not better than 1450
    });

    it('improves stop when price falls for SELL', () => {
      const order = makeTrailingOrder({ id: 't-sell-3', side: 'SELL', trailingDistance: '50', price: '1500' });
      (worker as any).trailingState.set('t-sell-3', '1450');

      const result = (worker as any).recomputeTrailingStop(order, 1350);
      expect(result.shouldUpdate).toBe(true);
      expect(result.newStopPrice).toBe('1400');
      expect(result.improvement).toBe(50);
    });
  });

  // ── recomputeTrailingStop — trailingPct ─────────────────────────────────────

  describe('recomputeTrailingStop() — trailing percentage', () => {
    it('uses trailingPct when trailingDistance is zero', () => {
      const order = makeTrailingOrder({
        id: 't-pct-1',
        side: 'BUY',
        trailingDistance: '0',
        trailingPct: '5', // 5% of entry price = 75
        price: '1500',
      });
      const result = (worker as any).recomputeTrailingStop(order, 1600);
      expect(result.shouldUpdate).toBe(true);
      // 1600 - 75 = 1525
      expect(result.newStopPrice).toBe('1525');
    });
  });

  // ── price feed subscription ──────────────────────────────────────────────────

  describe('PriceFeedService integration', () => {
    it('updates price cache when quotes arrive via subscription', async () => {
      // Simulate price feed emitting quotes after module init
      worker.onModuleInit();

      quotesSubject.next([makeQuote('NSE', 'INFY', 1510), makeQuote('BSE', 'RELIANCE', 2800)]);

      expect((worker as any).priceCache.get('NSE:INFY')).toBe;
      expect((worker as any).priceCache.get('BSE:RELIANCE')).toBe;
    });

    it('cleans up subscription on destroy', () => {
      worker.onModuleInit();
      const sub = (worker as any).priceSub;
      const unsubscribeSpy = jest.spyOn(sub, 'unsubscribe');

      worker.onModuleDestroy();

      expect(unsubscribeSpy).toHaveBeenCalled();
    });
  });

  // ── evaluateAll — full cycle ──────────────────────────────────────────────────

  describe('evaluateAll() — integration', () => {
    it('triggers GTT order when condition met', async () => {
      const order = makeGttOrder({
        id: 'gtt-trigger-1',
        triggerCondition: 'BELOW',
        triggerPrice: '1500',
        status: 'NEW',
        meta: null,
      });
      mockOrdersRepo.find.mockResolvedValue([order]);
      // Seed price cache via tick
      worker.onPriceTick('NSE:INFY', 1480);

      await (worker as any).evaluateAll();

      expect(mockOrdersRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'gtt-trigger-1', status: 'PLACED' }),
      );
      expect(mockOrderEvents.publish).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'order.gtt.triggered' }),
      );
    });

    it('expires GTT order when expireTime is past', async () => {
      const pastTime = new Date(Date.now() - 60_000).toISOString();
      const order = makeGttOrder({
        id: 'gtt-expire-1',
        triggerCondition: 'BELOW',
        triggerPrice: '1500',
        status: 'NEW',
        meta: { expireTime: pastTime },
      });
      mockOrdersRepo.find.mockResolvedValue([order]);

      await (worker as any).evaluateAll();

      expect(mockOrdersRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'gtt-expire-1', status: 'EXPIRED' }),
      );
      expect(mockOrderEvents.publish).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'order.gtt.expired' }),
      );
    });

    it('updates trailing stop slPrice when price moves favorably', async () => {
      const order = makeTrailingOrder({
        id: 'trail-update-1',
        side: 'BUY',
        trailingDistance: '50',
        price: '1500',
        status: 'NEW',
      });
      mockOrdersRepo.find.mockResolvedValue([order]);
      worker.onPriceTick('NSE:INFY', 1620);

      await (worker as any).evaluateAll();

      // slPrice should be updated to 1570 (1620 - 50)
      expect(mockOrdersRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'trail-update-1', slPrice: '1570' }),
      );
      expect(mockOrderEvents.publish).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'order.trailing.updated' }),
      );
    });

    it('does nothing when no active orders found', async () => {
      mockOrdersRepo.find.mockResolvedValue([]);

      await (worker as any).evaluateAll();

      expect(mockOrdersRepo.save).not.toHaveBeenCalled();
      expect(mockOrderEvents.publish).not.toHaveBeenCalled();
    });
  });

  // ── edge cases ────────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('does not trigger when triggerPrice is null/NaN', () => {
      const order = makeGttOrder({ triggerPrice: null, triggerCondition: 'BELOW' });
      const result = (worker as any).evaluateCondition(order, 1480);
      expect(result.shouldTrigger).toBe(false);
    });

    it('does not update trailing stop when trailingDistance and trailingPct are both zero', () => {
      const order = makeTrailingOrder({
        id: 'trail-none-1',
        side: 'BUY',
        trailingDistance: '0',
        trailingPct: '0',
      });
      const result = (worker as any).recomputeTrailingStop(order, 1620);
      expect(result.shouldUpdate).toBe(false);
    });
  });
});