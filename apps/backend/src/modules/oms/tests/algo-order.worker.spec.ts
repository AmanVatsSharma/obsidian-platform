/**
 * File:        apps/backend/src/modules/oms/tests/algo-order.worker.spec.ts
 * Module:      oms · Algo Order Worker — Unit Tests
 * Purpose:     Verifies TWAP / VWAP / ICEBERG slice computation, dispatch, and fill propagation
 *
 * Exports:
 *   - (all tests — no public symbols)
 *
 * Depends on:
 *   - algo-order.worker.ts    — module under test
 *   - @nestjs/testing          — TestBed utilities
 *   - @nestjs/typeorm          — getRepositoryToken
 *
 * Side-effects:  none (unit tests — no DB/network)
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-24
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AlgoOrderWorker } from '../services/algo-order.worker';
import { OrderEntity } from '../entities/order.entity';
import { OrderAuditEntity } from '../entities/order-audit.entity';
import { AppLoggerService } from '../../../shared/logger';
import { ExchangeAdapter, EXCHANGE_ADAPTER } from '../adapters/exchange-adapter';
import { DemoExchangeAdapter, DEMO_EXCHANGE_ADAPTER } from '../adapters/demo-exchange.adapter';
import { AccountsService } from '../../accounts/services/accounts.service';
import { OrderEventsService } from '../services/order-events.service';

// Mock getRequestContext before importing the worker
jest.mock('../../../shared/request-context', () => ({
  getRequestContext: jest.fn().mockReturnValue({ tenantId: 'tenant-1', userId: 'user-1' }),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeAlgoOrder(overrides: Partial<OrderEntity> & { algoType: 'TWAP' | 'VWAP' | 'ICEBERG' }): OrderEntity {
  return {
    id: 'order-1',
    tenantId: 'tenant-1',
    accountId: 'acc-1',
    instrumentId: 'NSE:INFY',
    side: 'BUY',
    type: overrides.algoType,
    status: 'PARTIALLY_FILLED',
    price: '1500',
    quantity: '100',
    clientOrderId: 'cli-1',
    externalRefId: 'ext-1',
    filledQty: '0',
    remainingQty: '100',
    algoType: overrides.algoType,
    algoMeta: {
      totalSlices: 3,
      slicesCompleted: 0,
      sliceCount: 3,
      durationMinutes: 60,
      nextSliceTime: null,
      ...overrides.algoMeta,
    },
    timeInForce: 'DAY',
    ...overrides,
  } as OrderEntity;
}

// ─── computeTwapSlices tests ─────────────────────────────────────────────────

describe('AlgoOrderWorker.computeTwapSlices', () => {
  describe('TWAP equal slices', () => {
    it('should split 100 into 3 equal slices', () => {
      const slices = AlgoOrderWorker.computeTwapSlices('100', 3);
      expect(slices).toHaveLength(3);
      // All slices should be non-zero
      slices.forEach((s) => {
        expect(parseFloat(s.qty)).toBeGreaterThan(0);
      });
      // Sum should equal total
      const sum = slices.reduce((acc, s) => acc + parseFloat(s.qty), 0);
      expect(sum).toBeCloseTo(100, 5);
    });

    it('should split 60 into 4 equal slices (60/4 = 15 exactly)', () => {
      const slices = AlgoOrderWorker.computeTwapSlices('60', 4);
      expect(slices).toHaveLength(4);
      slices.forEach((s) => expect(s.qty).toBe('15.00000000'));
    });

    it('should split 100 into 2 equal slices', () => {
      const slices = AlgoOrderWorker.computeTwapSlices('100', 2);
      expect(slices).toHaveLength(2);
      // Sum should be 100
      const sum = slices.reduce((acc, s) => acc + parseFloat(s.qty), 0);
      expect(sum).toBeCloseTo(100, 5);
    });

    it('should split a fractional total correctly', () => {
      const slices = AlgoOrderWorker.computeTwapSlices('10.5', 3);
      expect(slices).toHaveLength(3);
      const sum = slices.reduce((acc, s) => acc + parseFloat(s.qty), 0);
      expect(sum).toBeCloseTo(10.5, 5);
    });
  });

  describe('TWAP remainder distribution', () => {
    it('should distribute remainder to last slice when not divisible', () => {
      const slices = AlgoOrderWorker.computeTwapSlices('100', 3);
      // 100 / 3 = 33.33333333... remainder = 100 - 33.33333333*2 = 33.33333334
      expect(slices[0].qty).toBe('33.33333333');
      expect(slices[1].qty).toBe('33.33333333');
      const sum = parseFloat(slices[0].qty) + parseFloat(slices[1].qty);
      const last = parseFloat(slices[2].qty);
      expect(last).toBeCloseTo(100 - sum, 8);
      expect(slices[2].index).toBe(2);
    });

    it('should handle remainder = 1 (1% slice in 3-way split of 100)', () => {
      const slices = AlgoOrderWorker.computeTwapSlices('100', 3);
      const sum = slices.reduce((acc, s) => acc + parseFloat(s.qty), 0);
      expect(sum).toBe(100);
    });

    it('should give entire remainder to last slice', () => {
      const slices = AlgoOrderWorker.computeTwapSlices('7', 3);
      expect(slices).toHaveLength(3);
      const sum = slices.reduce((acc, s) => acc + parseFloat(s.qty), 0);
      expect(sum).toBe(7);
    });
  });

  describe('index assignment', () => {
    it('should assign sequential index values starting at 0', () => {
      const slices = AlgoOrderWorker.computeTwapSlices('30', 5);
      slices.forEach((s, i) => expect(s.index).toBe(i));
    });
  });
});

// ─── recordChildFill tests ────────────────────────────────────────────────────

describe('AlgoOrderWorker.recordChildFill', () => {
  let worker: AlgoOrderWorker;
  let mockOrdersRepo: jest.Mocked<any>;
  let mockAuditsRepo: jest.Mocked<any>;
  let mockLogger: jest.Mocked<any>;
  let mockExchange: jest.Mocked<any>;
  let mockDemoExchange: jest.Mocked<any>;
  let mockAccountsService: jest.Mocked<any>;
  let mockOrderEvents: jest.Mocked<any>;

  beforeEach(async () => {
    mockOrdersRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    };
    mockAuditsRepo = {
      create: jest.fn().mockReturnValue({}),
      save: jest.fn(),
    };
    mockLogger = {
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      setContext: jest.fn(),
    };
    mockExchange = { placeOrder: jest.fn() };
    mockDemoExchange = { placeOrder: jest.fn() };
    mockAccountsService = { getById: jest.fn() };
    mockOrderEvents = { publish: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlgoOrderWorker,
        { provide: getRepositoryToken(OrderEntity), useValue: mockOrdersRepo },
        { provide: getRepositoryToken(OrderAuditEntity), useValue: mockAuditsRepo },
        { provide: AppLoggerService, useValue: mockLogger },
        { provide: EXCHANGE_ADAPTER, useValue: mockExchange },
        { provide: DEMO_EXCHANGE_ADAPTER, useValue: mockDemoExchange },
        { provide: AccountsService, useValue: mockAccountsService },
        { provide: OrderEventsService, useValue: mockOrderEvents },
      ],
    }).compile();

    worker = module.get<AlgoOrderWorker>(AlgoOrderWorker);
  });

  it('should update parent remainingQty when child fills', async () => {
    const parent = makeAlgoOrder({ algoType: 'TWAP' });
    mockOrdersRepo.findOne.mockResolvedValue(parent);

    await worker.recordChildFill('parent-1', '25');

    expect(mockOrdersRepo.save).toHaveBeenCalled();
    const saved = mockOrdersRepo.save.mock.calls[0][0] as OrderEntity;
    expect(saved.remainingQty).toBe('75');
    expect(saved.filledQty).toBe('25');
    expect(saved.status).toBe('PARTIALLY_FILLED');
  });

  it('should transition parent to FILLED when remainingQty reaches 0', async () => {
    const parent = makeAlgoOrder({ algoType: 'VWAP', remainingQty: '25', filledQty: '75' });
    mockOrdersRepo.findOne.mockResolvedValue(parent);

    await worker.recordChildFill('parent-1', '25');

    const saved = mockOrdersRepo.save.mock.calls[0][0] as OrderEntity;
    expect(saved.status).toBe('FILLED');
    expect(saved.remainingQty).toBe('0');
    expect(saved.filledQty).toBe('100');
  });

  it('should not go negative when child fill exceeds remainingQty', async () => {
    const parent = makeAlgoOrder({ algoType: 'ICEBERG', remainingQty: '10', filledQty: '0' });
    mockOrdersRepo.findOne.mockResolvedValue(parent);

    await worker.recordChildFill('parent-1', '15');

    const saved = mockOrdersRepo.save.mock.calls[0][0] as OrderEntity;
    expect(saved.remainingQty).toBe('0');
    expect(saved.status).toBe('FILLED');
  });

  it('should publish ALGO_CHILD_FILL_RECORDED event', async () => {
    const parent = makeAlgoOrder({ algoType: 'TWAP' });
    mockOrdersRepo.findOne.mockResolvedValue(parent);

    await worker.recordChildFill('parent-1', '10');

    expect(mockOrderEvents.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'order.algo.child_fill_recorded',
        payload: expect.objectContaining({
          parentOrderId: 'parent-1',
          childFilledQty: '10',
        }),
      }),
    );
  });

  it('should warn and return if parent order not found', async () => {
    mockOrdersRepo.findOne.mockResolvedValue(null);

    await worker.recordChildFill('nonexistent-id', '10');

    expect(mockOrdersRepo.save).not.toHaveBeenCalled();
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'recordChildFill: parent not found',
      { parentOrderId: 'nonexistent-id' },
    );
  });
});

// ─── dispatchNextSlice — algo child order fields ─────────────────────────────

describe('AlgoOrderWorker.dispatchNextSlice — order fields', () => {
  let worker: AlgoOrderWorker;
  let mockOrdersRepo: jest.Mocked<any>;
  let mockAuditsRepo: jest.Mocked<any>;
  let mockLogger: jest.Mocked<any>;
  let mockExchange: jest.Mocked<any>;
  let mockDemoExchange: jest.Mocked<any>;
  let mockAccountsService: jest.Mocked<any>;
  let mockOrderEvents: jest.Mocked<any>;

  beforeEach(async () => {
    mockOrdersRepo = {
      find: jest.fn(),
      create: jest.fn((data) => data),
      save: jest.fn().mockImplementation((entity) => Promise.resolve({ id: `child-${Date.now()}`, ...entity })),
      findOne: jest.fn(),
    };
    mockAuditsRepo = { create: jest.fn().mockReturnValue({}), save: jest.fn() };
    mockLogger = { debug: jest.fn(), warn: jest.fn(), error: jest.fn(), setContext: jest.fn() };
    mockExchange = { placeOrder: jest.fn().mockResolvedValue({ status: 'PLACED', providerOrderId: 'prov-1' }) };
    mockDemoExchange = { placeOrder: jest.fn() };
    mockAccountsService = {
      getById: jest.fn().mockResolvedValue({ accountType: 'LIVE' }),
    };
    mockOrderEvents = { publish: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlgoOrderWorker,
        { provide: getRepositoryToken(OrderEntity), useValue: mockOrdersRepo },
        { provide: getRepositoryToken(OrderAuditEntity), useValue: mockAuditsRepo },
        { provide: AppLoggerService, useValue: mockLogger },
        { provide: EXCHANGE_ADAPTER, useValue: mockExchange },
        { provide: DEMO_EXCHANGE_ADAPTER, useValue: mockDemoExchange },
        { provide: AccountsService, useValue: mockAccountsService },
        { provide: OrderEventsService, useValue: mockOrderEvents },
      ],
    }).compile();

    worker = module.get<AlgoOrderWorker>(AlgoOrderWorker);
  });

  it('should set parentOrderId on child TWAP order', async () => {
    const parent = makeAlgoOrder({ algoType: 'TWAP', id: 'parent-twap-1' });
    mockOrdersRepo.create.mockImplementation((data) => data);

    // Trigger dispatch via evaluateAll by setting nextSliceTime in the past
    const pastTime = Date.now() - 1000;
    parent.algoMeta = {
      totalSlices: 3,
      slicesCompleted: 0,
      sliceCount: 3,
      durationMinutes: 60,
      nextSliceTime: pastTime,
    };

    mockOrdersRepo.find.mockResolvedValue([parent]);

    await worker.evaluateAll();

    const created = mockOrdersRepo.create.mock.results[0]?.value;
    expect(created.parentOrderId).toBe('parent-twap-1');
  });

  it('should set orderRole=PRIMARY on child ICEBERG order', async () => {
    const parent = makeAlgoOrder({ algoType: 'ICEBERG', id: 'parent-ice-1', remainingQty: '50' });
    parent.algoMeta = {
      totalSlices: 5,
      slicesCompleted: 0,
      sliceCount: 10,
      durationMinutes: 60,
      nextSliceTime: null,
    };

    mockOrdersRepo.find.mockResolvedValue([parent]);

    await worker.evaluateAll();

    const created = mockOrdersRepo.create.mock.results[0]?.value;
    expect(created.orderRole).toBe('PRIMARY');
  });

  it('TWAP child should be type MARKET', async () => {
    const parent = makeAlgoOrder({ algoType: 'TWAP', id: 'parent-twap-2' });
    const pastTime = Date.now() - 1000;
    parent.algoMeta = {
      totalSlices: 3,
      slicesCompleted: 0,
      sliceCount: 3,
      durationMinutes: 60,
      nextSliceTime: pastTime,
    };

    mockOrdersRepo.find.mockResolvedValue([parent]);

    await worker.evaluateAll();

    const created = mockOrdersRepo.create.mock.results[0]?.value;
    expect(created.type).toBe('MARKET');
  });

  it('VWAP child should be type LIMIT', async () => {
    const parent = makeAlgoOrder({ algoType: 'VWAP', id: 'parent-vwap-1', price: '1500' });
    const pastTime = Date.now() - 1000;
    parent.algoMeta = {
      totalSlices: 3,
      slicesCompleted: 0,
      sliceCount: 3,
      durationMinutes: 60,
      nextSliceTime: pastTime,
    };

    mockOrdersRepo.find.mockResolvedValue([parent]);

    await worker.evaluateAll();

    const created = mockOrdersRepo.create.mock.results[0]?.value;
    expect(created.type).toBe('LIMIT');
    expect(created.price).toBe('1500');
  });

  it('should set algoMeta.isChildOfAlgo: true on child', async () => {
    const parent = makeAlgoOrder({ algoType: 'ICEBERG', id: 'parent-ice-2', remainingQty: '50' });
    parent.algoMeta = {
      totalSlices: 5,
      slicesCompleted: 0,
      sliceCount: 10,
      durationMinutes: 60,
      nextSliceTime: null,
    };

    mockOrdersRepo.find.mockResolvedValue([parent]);

    await worker.evaluateAll();

    const created = mockOrdersRepo.create.mock.results[0]?.value;
    expect(created.algoMeta['isChildOfAlgo']).toBe(true);
    expect(created.algoMeta['sliceIndex']).toBe(0);
  });

  it('ICEBERG slice quantity should equal sliceCount (visible qty)', async () => {
    const parent = makeAlgoOrder({
      algoType: 'ICEBERG',
      id: 'parent-ice-3',
      remainingQty: '100',
    });
    parent.algoMeta = {
      totalSlices: 5,
      slicesCompleted: 0,
      sliceCount: 15, // visible qty = 15
      durationMinutes: 60,
      nextSliceTime: null,
    };

    mockOrdersRepo.find.mockResolvedValue([parent]);

    await worker.evaluateAll();

    const created = mockOrdersRepo.create.mock.results[0]?.value;
    // 100 remaining, 15 visible → slice should be 15 (min of the two)
    expect(parseFloat(created.quantity)).toBe(15);
  });

  it('should not dispatch beyond totalSlices', async () => {
    const parent = makeAlgoOrder({
      algoType: 'TWAP',
      id: 'parent-twap-3',
      remainingQty: '33.33333333',
    });
    // All slices completed
    parent.algoMeta = {
      totalSlices: 3,
      slicesCompleted: 3,
      sliceCount: 3,
      durationMinutes: 60,
      nextSliceTime: Date.now() - 1000,
    };

    mockOrdersRepo.find.mockResolvedValue([parent]);

    await worker.evaluateAll();

    // create should not be called since slicesCompleted === totalSlices
    expect(mockOrdersRepo.create).not.toHaveBeenCalled();
  });

  it('should not dispatch if nextSliceTime is in the future (TWAP)', async () => {
    const parent = makeAlgoOrder({ algoType: 'TWAP', id: 'parent-twap-4' });
    const futureTime = Date.now() + 60_000;
    parent.algoMeta = {
      totalSlices: 3,
      slicesCompleted: 0,
      sliceCount: 3,
      durationMinutes: 60,
      nextSliceTime: futureTime,
    };

    mockOrdersRepo.find.mockResolvedValue([parent]);

    await worker.evaluateAll();

    expect(mockOrdersRepo.create).not.toHaveBeenCalled();
  });
});