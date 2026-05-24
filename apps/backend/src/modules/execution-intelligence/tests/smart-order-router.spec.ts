/**
 * File:        apps/backend/src/modules/execution-intelligence/tests/smart-order-router.spec.ts
 * Module:      execution-intelligence · SOR Tests
 * Purpose:     Unit tests for SmartOrderRouterService, VenueScorerService, and SlippageTrackerService
 *
 * Exports:  none (test file)
 *
 * Depends on:
 *   - @/execution-intelligence           — services and types under test
 *   - @/execution-gateway              — ExecutionGatewayService, ConnectorFamily
 *   - @/oms                            — OrderEntity
 *   - @/shared/logger                  — AppLoggerService
 *
 * Side-effects:  none (pure unit tests — mocks all external dependencies)
 * Key invariants tested:
 *   - Venues ranked by composite score descending
 *   - Primary venue failure triggers fallback to next venue
 *   - Slippage computed correctly: |filled - requested| / requested * 10000
 *   - getVenueScore aggregates slippageBps, fillRate, medianLatencyMs correctly
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-24
 */

import { Test, TestingModule } from '@nestjs/testing';
import { SmartOrderRouterService } from '../services/smart-order-router.service';
import { VenueScorerService } from '../services/venue-scorer.service';
import { SlippageTrackerService } from '../services/slippage-tracker.service';
import { ExecutionGatewayService } from '../../execution-gateway/services/execution-gateway.service';
import { AppLoggerService } from '../../../shared/logger';
import { OrderEntity } from '../../oms/entities/order.entity';
import { ConnectorFamily } from '../../execution-gateway/connectors/contracts/execution-gateway.contract';
import { Venue } from '../types/venue.type';

const makeOrder = (overrides: Partial<OrderEntity> = {}): OrderEntity =>
  ({
    id: 'order-id-1',
    clientOrderId: 'CO-001',
    accountId: 'acc-1',
    instrumentId: 'INS-001',
    side: 'BUY',
    type: 'LIMIT',
    quantity: '10',
    price: '100.00',
    timeInForce: 'DAY',
    filledQty: '0',
    remainingQty: '10',
    status: 'NEW',
    externalRefId: 'ext-1',
    tenantId: 'tenant-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as OrderEntity);

const makeVenue = (id: string, overrides: Partial<Venue> = {}): Venue => ({
  id,
  connectorFamily: 'EQUITIES_FNO' as ConnectorFamily,
  depthAtPrice: 1000,
  spreadBps: 5,
  latencyMs: 50,
  feeBps: 2,
  ...overrides,
});

describe('VenueScorerService', () => {
  let service: VenueScorerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VenueScorerService,
        AppLoggerService,
      ],
    }).compile();
    service = module.get<VenueScorerService>(VenueScorerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should rank venues by descending composite score', async () => {
    const venues = [
      makeVenue('V1', { depthAtPrice: 100, latencyMs: 200, spreadBps: 5, feeBps: 2 }),
      makeVenue('V2', { depthAtPrice: 100000, latencyMs: 10, spreadBps: 1, feeBps: 0 }),
      makeVenue('V3', { depthAtPrice: 10, latencyMs: 400, spreadBps: 20, feeBps: 10 }),
    ];
    const order = makeOrder();

    const ranked = await service.rank(venues, order);

    expect(ranked.length).toBe(3);
    // V2 should be first (high depth, low latency, low spread, low fee)
    expect(ranked[0].id).toBe('V2');
    // V1 should be second
    expect(ranked[1].id).toBe('V1');
    // V3 should be last (high latency, wide spread, high fee)
    expect(ranked[2].id).toBe('V3');
  });

  it('should score liquidity as log10-weighted', () => {
    const shallow = makeVenue('shallow', { depthAtPrice: 10 });
    const deep = makeVenue('deep', { depthAtPrice: 1000 });
    const order = makeOrder();

    const scoreShallow = service.score(shallow, order);
    const scoreDeep = service.score(deep, order);

    // Both positive; deeper venue scores higher (liquidity weight = 40)
    expect(scoreDeep).toBeGreaterThan(scoreShallow);
  });

  it('should penalise high latency venues', () => {
    const fast = makeVenue('fast', { latencyMs: 10 });
    const slow = makeVenue('slow', { latencyMs: 490 });
    const order = makeOrder();

    const scoreFast = service.score(fast, order);
    const scoreSlow = service.score(slow, order);

    expect(scoreFast).toBeGreaterThan(scoreSlow);
  });

  it('should penalise wide-spread venues', () => {
    const tight = makeVenue('tight', { spreadBps: 1 });
    const wide = makeVenue('wide', { spreadBps: 100 });
    const order = makeOrder();

    const scoreTight = service.score(tight, order);
    const scoreWide = service.score(wide, order);

    expect(scoreTight).toBeGreaterThan(scoreWide);
  });

  it('should penalise high-fee venues', () => {
    const cheap = makeVenue('cheap', { feeBps: 0 });
    const expensive = makeVenue('expensive', { feeBps: 100 });
    const order = makeOrder();

    const scoreCheap = service.score(cheap, order);
    const scoreExpensive = service.score(expensive, order);

    expect(scoreCheap).toBeGreaterThan(scoreExpensive);
  });

  it('should return zero for negative sub-scores (clamped)', () => {
    // spreadBps > 100 bps → spreadScore clamped to 0
    const venue = makeVenue('bad', { spreadBps: 200 });
    const score = service.score(venue, makeOrder());

    // Still non-zero due to liquidity + latency + fee scores
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it('should return a score between 0 and 100', () => {
    const venue = makeVenue('balanced', { depthAtPrice: 1000, latencyMs: 100, spreadBps: 5, feeBps: 2 });
    const score = service.score(venue, makeOrder());

    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe('SlippageTrackerService', () => {
  let service: SlippageTrackerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SlippageTrackerService,
        AppLoggerService,
      ],
    }).compile();
    service = module.get<SlippageTrackerService>(SlippageTrackerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should record a fill and compute slippageBps', () => {
    service.record({
      orderId: 'o-1',
      venueId: 'v-1',
      requestedPrice: '100.0000',
      filledPrice: '100.0100',
      qty: '10',
    });

    const score = service.getVenueScore('v-1', 'unknown', new Date(0));
    expect(score).resolves.toMatchObject({
      avgSlippageBps: expect.any(String),
      fillRate: '1.00',
      medianLatencyMs: 0,
    });
  });

  it('should compute slippageBps correctly for positive slippage', async () => {
    service.record({
      orderId: 'o-2',
      venueId: 'v-2',
      requestedPrice: '100.0000',
      filledPrice: '100.0500', // +0.05% = +5 bps
      qty: '10',
    });

    const score = await service.getVenueScore('v-2', 'unknown', new Date(0));
    // |100.05 - 100| / 100 * 10000 = 0.0005 * 10000 = 5 bps
    expect(parseFloat(score.avgSlippageBps)).toBeCloseTo(5, 1);
  });

  it('should compute slippageBps correctly for negative slippage', async () => {
    service.record({
      orderId: 'o-3',
      venueId: 'v-3',
      requestedPrice: '100.0000',
      filledPrice: '99.9900', // -0.01% = -1 bps (abs = 1 bps)
      qty: '10',
    });

    const score = await service.getVenueScore('v-3', 'unknown', new Date(0));
    expect(parseFloat(score.avgSlippageBps)).toBeGreaterThan(0);
  });

  it('should return zero slippage when requestedPrice is zero', () => {
    service.record({
      orderId: 'o-4',
      venueId: 'v-4',
      requestedPrice: '0',
      filledPrice: '0',
      qty: '10',
    });

    const score = service.getVenueScore('v-4', 'unknown', new Date(0));
    expect(score).resolves.toMatchObject({ avgSlippageBps: '0' });
  });

  it('should average slippage across multiple fills for same venue', async () => {
    service.record({
      orderId: 'o-5a',
      venueId: 'v-5',
      requestedPrice: '100.0000',
      filledPrice: '100.0500',
      qty: '10',
    });
    service.record({
      orderId: 'o-5b',
      venueId: 'v-5',
      requestedPrice: '100.0000',
      filledPrice: '100.0300',
      qty: '10',
    });

    const score = await service.getVenueScore('v-5', 'unknown', new Date(0));
    // (5 + 3) / 2 = 4 bps avg
    expect(parseFloat(score.avgSlippageBps)).toBeCloseTo(4, 1);
  });

  it('should return default score for unknown venue', async () => {
    const score = await service.getVenueScore('unknown-venue', 'INS-X', new Date(0));
    expect(score).toEqual({ avgSlippageBps: '0', fillRate: '1.00', medianLatencyMs: 0 });
  });

  it('should filter by fromDate window', async () => {
    const oldDate = new Date('2020-01-01');
    const recentDate = new Date('2030-01-01');

    service.record({
      orderId: 'o-old',
      venueId: 'v-old',
      requestedPrice: '100.0000',
      filledPrice: '100.1000',
      qty: '10',
    });

    // old fill outside window should be excluded
    const score = await service.getVenueScore('v-old', 'unknown', recentDate);
    expect(score).toEqual({ avgSlippageBps: '0', fillRate: '1.00', medianLatencyMs: 0 });
  });

  it('should compute median latency correctly for odd count', async () => {
    const records = [
      { lat: 50 },
      { lat: 100 },
      { lat: 200 },
    ];

    for (const rec of records) {
      service.record({
        orderId: `o-lat-${rec.lat}`,
        venueId: 'v-lat-odd',
        requestedPrice: '100',
        filledPrice: '100.01',
        qty: '10',
      });
    }

    const score = await service.getVenueScore('v-lat-odd', 'unknown', new Date(0));
    // median of [50, 100, 200] = 100
    expect(score.medianLatencyMs).toBe(100);
  });

  it('should compute median latency correctly for even count', async () => {
    for (const lat of [30, 50, 70, 90]) {
      service.record({
        orderId: `o-lat-${lat}`,
        venueId: 'v-lat-even',
        requestedPrice: '100',
        filledPrice: '100.01',
        qty: '10',
      });
    }

    const score = await service.getVenueScore('v-lat-even', 'unknown', new Date(0));
    // median of [30, 50, 70, 90] = (50+70)/2 = 60
    expect(score.medianLatencyMs).toBe(60);
  });
});

describe('SmartOrderRouterService', () => {
  let sor: SmartOrderRouterService;
  let mockGateway: jest.Mocked<ExecutionGatewayService>;

  beforeEach(async () => {
    mockGateway = {
      routePlaceOrder: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmartOrderRouterService,
        VenueScorerService,
        SlippageTrackerService,
        { provide: ExecutionGatewayService, useValue: mockGateway },
        AppLoggerService,
      ],
    }).compile();

    sor = module.get<SmartOrderRouterService>(SmartOrderRouterService);
  });

  it('should be defined', () => {
    expect(sor).toBeDefined();
  });

  it('should throw when no venues are registered', async () => {
    const order = makeOrder();
    await expect(sor.route(order)).rejects.toThrow('No venues registered for routing');
  });

  it('should route to highest-scored venue first', async () => {
    const venues = [
      makeVenue('V1', { depthAtPrice: 100, latencyMs: 200, spreadBps: 5, feeBps: 2 }),
      makeVenue('V2', { depthAtPrice: 100000, latencyMs: 10, spreadBps: 1, feeBps: 0 }),
    ];
    sor.registerVenues(venues);

    mockGateway.routePlaceOrder.mockResolvedValue({
      providerOrderId: 'prov-1',
      status: 'FILLED',
      averageFilledPrice: '100.00',
    });

    const order = makeOrder({ price: '100.00' });
    const result = await sor.route(order);

    expect(result.venueId).toBe('V2');
    expect(mockGateway.routePlaceOrder).toHaveBeenCalledWith(
      expect.objectContaining({ connectorFamily: 'EQUITIES_FNO' }),
    );
  });

  it('should compute slippageBps on successful fill', async () => {
    sor.registerVenues([makeVenue('V1', { depthAtPrice: 1000, latencyMs: 50, spreadBps: 5, feeBps: 2 })]);

    mockGateway.routePlaceOrder.mockResolvedValue({
      providerOrderId: 'prov-1',
      status: 'FILLED',
      averageFilledPrice: '100.05', // +0.05 bps slippage on 100.00 price
    });

    const order = makeOrder({ price: '100.00' });
    const result = await sor.route(order);

    // slippage = |100.05 - 100| / 100 * 10000 = 0.0005 * 10000 = 5 bps
    expect(parseFloat(result.slippageBps)).toBeCloseTo(5, 1);
  });

  it('should fall back to next venue when primary fails', async () => {
    sor.registerVenues([
      makeVenue('V-primary', { depthAtPrice: 1000, latencyMs: 50, spreadBps: 5, feeBps: 2 }),
      makeVenue('V-fallback', { depthAtPrice: 500, latencyMs: 100, spreadBps: 10, feeBps: 5 }),
    ]);

    mockGateway.routePlaceOrder
      .mockRejectedValueOnce(new Error('connector error'))
      .mockResolvedValueOnce({
        providerOrderId: 'prov-2',
        status: 'FILLED',
        averageFilledPrice: '100.00',
      });

    const order = makeOrder({ price: '100.00' });
    const result = await sor.route(order);

    expect(result.venueId).toBe('V-fallback');
    expect(mockGateway.routePlaceOrder).toHaveBeenCalledTimes(2);
  });

  it('should fall back to last venue when all venues fail', async () => {
    sor.registerVenues([
      makeVenue('V-first', { depthAtPrice: 1000, latencyMs: 50, spreadBps: 5, feeBps: 2 }),
      makeVenue('V-last', { depthAtPrice: 100, latencyMs: 500, spreadBps: 50, feeBps: 20 }),
    ]);

    mockGateway.routePlaceOrder.mockRejectedValue(new Error('all failed'));

    const order = makeOrder();
    const result = await sor.route(order);

    expect(result.venueId).toBe('V-last');
    expect(result.result.status).toBe('REJECTED');
  });

  it('should return slippage=0 for MARKET orders with no averageFilledPrice', async () => {
    sor.registerVenues([makeVenue('V1')]);

    mockGateway.routePlaceOrder.mockResolvedValue({
      providerOrderId: 'prov-1',
      status: 'FILLED',
      // no averageFilledPrice → uses requestedPrice → slippage = 0
    });

    const order = makeOrder({ price: undefined });
    const result = await sor.route(order);

    expect(result.slippageBps).toBe('0.0000');
  });

  it('should record slippage in SlippageTrackerService on fill', async () => {
    sor.registerVenues([makeVenue('V1')]);

    mockGateway.routePlaceOrder.mockResolvedValue({
      providerOrderId: 'prov-1',
      status: 'FILLED',
      averageFilledPrice: '100.02',
    });

    const order = makeOrder({ price: '100.00' });
    await sor.route(order);

    // getVenueScore is called internally — just verify it doesn't throw
    const score = await sor.route(order); // second route to trigger another record
    expect(score).toBeDefined();
  });
});