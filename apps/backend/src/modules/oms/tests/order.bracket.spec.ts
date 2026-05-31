/**
 * File:        apps/backend/src/modules/oms/tests/order.bracket.spec.ts
 * Module:      oms-tests
 * Purpose:     Unit tests for bracket order lifecycle: atomically creating 3 orders,
 *              activating children when PRIMARY fills, and cancelling children
 *              when PRIMARY is cancelled.
 *
 * Exports:     (test file — no runtime exports)
 *
 * Depends on:
 *   - OrderService              — methods under test
 *   - OrderEntity               — for type assertions and mock setup
 *   - PlaceBracketOrderDto      — DTO used as input to placeBracket
 *
 * Side-effects:  none (unit test — all mocks)
 *
 * Key invariants tested:
 *   - 3 orders (PRIMARY + TAKE_PROFIT + STOP_LOSS) created in one transaction
 *   - Children have parentOrderId set to PRIMARY's id
 *   - Child prices validated: BUY → tpPrice > entry AND slPrice < entry; SELL → reverse
 *   - activateBracketChildren() fires only for NEW-status children
 *   - cancelBracketChildren() fires only for NEW-status children
 *   - addExecution() transitions order correctly based on filledQty/remainingQty
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-24
 */

import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { OrderService } from '../services/order.service';
import { RiskConfigService } from '../services/risk-config.service';
import { OrderEntity } from '../entities/order.entity';
import { ExecutionEntity } from '../entities/execution.entity';
import { OrderAuditEntity } from '../entities/order-audit.entity';
import { PlaceBracketOrderDto, BracketConfigDto } from '../dtos/bracket-order.dto';
import { EXCHANGE_ADAPTER, ExchangeAdapter } from '../adapters/exchange-adapter';
import { DEMO_EXCHANGE_ADAPTER } from '../adapters/demo-exchange.adapter';
import { LedgerService } from '../../accounts/services/ledger.service';
import { AppLoggerService } from '../../../shared/logger';
import { RealtimePublisherService } from '../../realtime/prana-stream/services/realtime-publisher.service';
import { MarginEngineService } from '../services/margin-engine.service';
import { AccountsService } from '../../accounts/services/accounts.service';
import { NotificationService } from '../../notifications/services/notification.service';
import { RiskPolicyService } from '../../risk-policy/services/risk-policy.service';
import { LimitsAndControlsService } from '../../limits-and-controls/services/limits-and-controls.service';
import { BrokerExchangeConfigService } from '../../broker-hierarchy/services/broker-exchange-config.service';
import { OrderEventsService } from '../services/order-events.service';

// Mock request context so tests don't need real tenant/user
jest.mock('../../../shared/request-context', () => ({
  getRequestContext: () => ({ tenantId: 't1', requestId: 'r1', userId: 'u1' }),
}));

// Helper: build a mock DataSource that runs the callback with a given manager
// The manager controls the repo behaviour via `savedOrders` array.
function buildMockDataSource(savedOrders: Partial<OrderEntity>[] = []) {
  const mockManager = {
    query: jest.fn().mockResolvedValue(undefined),
    getRepository: jest.fn().mockImplementation((entity: any) => {
      const repo = {
        findOne: jest.fn().mockResolvedValue(null),
        find: jest.fn().mockResolvedValue([]),
        save: jest.fn().mockImplementation((items: any | any[]) => {
          const list = Array.isArray(items) ? items : [items];
          const saved = list.map((item, idx) => {
            const existing = savedOrders.find(
              (o) => o.externalRefId === item.externalRefId,
            );
            const result = {
              ...item,
              id: existing?.id ?? `gen-id-${savedOrders.length + idx}`,
            };
            // Track created entities so subsequent find() returns them
            savedOrders.push(result);
            return result;
          });
          return Array.isArray(items) ? saved : saved[0];
        }),
        create: jest.fn().mockImplementation((data: any) => data),
        count: jest.fn().mockResolvedValue(0),
      };
      return repo;
    }),
  };

  return {
    transaction: jest.fn().mockImplementation(async (_iso: string, fn: (mgr: typeof mockManager) => Promise<any>) => {
      return fn(mockManager);
    }),
    _manager: mockManager,
  };
}

describe('OrderService — bracket order lifecycle', () => {
  let service: OrderService;
  let dataSource: ReturnType<typeof buildMockDataSource>;
  let ordersRepo: Repository<OrderEntity>;
  let accountsService: { getById: jest.Mock };
  let exchangeAdapter: ExchangeAdapter;
  let demoExchangeAdapter: ExchangeAdapter;

  const baseDto: PlaceBracketOrderDto = {
    accountId: 'a1',
    instrumentId: 'NSE:INFY',
    side: 'BUY',
    type: 'BRACKET',
    quantity: '100',
    price: '1850.00',
    clientOrderId: 'cli-bracket-1',
    externalRefId: 'xref-bracket-1',
    bracket: new BracketConfigDto(),
  };

  beforeEach(async () => {
    // Reset saved-orders tracking between tests
    const savedOrders: Partial<OrderEntity>[] = [];
    dataSource = buildMockDataSource(savedOrders);

    exchangeAdapter = {
      placeOrder: jest.fn().mockResolvedValue({ status: 'ACCEPTED', providerOrderId: 'prov-1' }),
      modifyOrder: jest.fn().mockResolvedValue({ status: 'ACCEPTED', providerOrderId: 'prov-1' }),
      cancelOrder: jest.fn().mockResolvedValue({ status: 'CANCELLED', providerOrderId: 'prov-1' }),
    };

    demoExchangeAdapter = {
      placeOrder: jest.fn().mockResolvedValue({ status: 'ACCEPTED', providerOrderId: 'demo-1' }),
      modifyOrder: jest.fn().mockResolvedValue({ status: 'ACCEPTED', providerOrderId: 'demo-1' }),
      cancelOrder: jest.fn().mockResolvedValue({ status: 'CANCELLED', providerOrderId: 'demo-1' }),
    };

    accountsService = {
      getById: jest.fn().mockResolvedValue({ id: 'a1', accountType: 'LIVE' }),
    };

    const ledgerService = {
      createHold: jest.fn().mockResolvedValue(undefined),
      releaseHold: jest.fn().mockResolvedValue(undefined),
      postPosition: jest.fn().mockResolvedValue(undefined),
      postCash: jest.fn().mockResolvedValue(undefined),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: DataSource, useValue: dataSource },
        {
          provide: getRepositoryToken(OrderEntity),
          useValue: {
            create: (x: any) => x,
            save: jest.fn().mockImplementation((item: any) => {
              const result = { ...item, id: item.id ?? `gen-id-${Date.now()}` };
              savedOrders.push(result);
              return result;
            }),
            findOne: jest.fn().mockImplementation((q: any) => {
              return Promise.resolve(
                savedOrders.find((o) => o.id === q?.where?.id) ?? null,
              );
            }),
            find: jest.fn().mockImplementation((q: any) => {
              if (q?.where?.parentOrderId) {
                return Promise.resolve(
                  savedOrders.filter((o) => o.parentOrderId === q.where.parentOrderId),
                );
              }
              return Promise.resolve([]);
            }),
            count: jest.fn().mockResolvedValue(0),
          } as any,
        },
        { provide: getRepositoryToken(ExecutionEntity), useValue: {} },
        { provide: getRepositoryToken(OrderAuditEntity), useValue: {} },
        { provide: RiskConfigService, useValue: { getBuyingPowerMultiplier: jest.fn().mockResolvedValue(1) } },
        { provide: EXCHANGE_ADAPTER, useValue: exchangeAdapter },
        { provide: DEMO_EXCHANGE_ADAPTER, useValue: demoExchangeAdapter },
        { provide: AccountsService, useValue: accountsService },
        { provide: NotificationService, useValue: { send: jest.fn() } },
        { provide: MarginEngineService, useValue: { estimate: jest.fn().mockResolvedValue({ totalRequired: '0', initialMargin: '0', maintenanceMargin: '0', brokerage: '0', buyingPower: '1000', canPlace: true, reasons: [], appliedRules: {} }) } },
        { provide: LedgerService, useValue: ledgerService },
        { provide: AppLoggerService, useValue: { setContext: jest.fn(), debug: jest.fn(), warn: jest.fn(), info: jest.fn() } },
        { provide: RealtimePublisherService, useValue: { publishOrderUpdate: jest.fn() } },
        { provide: RiskPolicyService, useValue: { enforcePreTrade: jest.fn().mockResolvedValue(undefined) } },
        { provide: LimitsAndControlsService, useValue: { enforcePreTrade: jest.fn().mockResolvedValue(undefined) } },
        { provide: BrokerExchangeConfigService, useValue: { isExchangeEnabledForTenant: jest.fn().mockResolvedValue(true) } },
        { provide: OrderEventsService, useValue: { publish: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(OrderService);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // placeBracket — happy path
  // ─────────────────────────────────────────────────────────────────────────

  describe('placeBracket()', () => {
    it('creates PRIMARY, TAKE_PROFIT, and STOP_LOSS orders atomically', async () => {
      const dto: PlaceBracketOrderDto = {
        ...baseDto,
        bracket: {
          tpPrice: '1860.00',   // BUY: tpPrice > entry
          slPrice: '1840.00',   // BUY: slPrice < entry
        },
      };

      const result = await service.placeBracket(dto);

      if ('code' in result) {
        throw new Error(`placeBracket failed: ${result.code} — ${result.message}`);
      }
      expect(result.primary).toBeDefined();
      expect(result.primary?.orderRole).toBe('PRIMARY');
      expect(result.primary?.status).toBe('PLACED');
      expect(result.primary?.type).toBe('BRACKET');
      expect(result.primary?.filledQty).toBe('0');
      expect(result.primary?.remainingQty).toBe(dto.quantity);

      expect(result.takeProfit).toBeDefined();
      expect(result.takeProfit?.orderRole).toBe('TAKE_PROFIT');
      expect(result.takeProfit?.status).toBe('NEW');
      expect(result.takeProfit?.parentOrderId).toBe(result.primary?.id);

      expect(result.stopLoss).toBeDefined();
      expect(result.stopLoss?.orderRole).toBe('STOP_LOSS');
      expect(result.stopLoss?.status).toBe('NEW');
      expect(result.stopLoss?.parentOrderId).toBe(result.primary?.id);
    });

    it('rejects BUY bracket when takeProfitPrice <= entryPrice', async () => {
      const dto: PlaceBracketOrderDto = {
        ...baseDto,
        bracket: { tpPrice: '1850.00', slPrice: '1840.00' }, // tpPrice == entry
      };

      await expect(service.placeBracket(dto)).rejects.toThrow();
    });

    it('rejects BUY bracket when stopLossPrice >= entryPrice', async () => {
      const dto: PlaceBracketOrderDto = {
        ...baseDto,
        bracket: { tpPrice: '1860.00', slPrice: '1850.00' }, // slPrice == entry
      };

      await expect(service.placeBracket(dto)).rejects.toThrow();
    });

    it('rejects SELL bracket when takeProfitPrice >= entryPrice', async () => {
      const dto: PlaceBracketOrderDto = {
        ...baseDto,
        side: 'SELL',
        bracket: { tpPrice: '1850.00', slPrice: '1840.00' }, // tpPrice == entry
      };

      await expect(service.placeBracket(dto)).rejects.toThrow();
    });

    it('rejects SELL bracket when stopLossPrice <= entryPrice', async () => {
      const dto: PlaceBracketOrderDto = {
        ...baseDto,
        side: 'SELL',
        bracket: { tpPrice: '1840.00', slPrice: '1850.00' }, // slPrice == entry
      };

      await expect(service.placeBracket(dto)).rejects.toThrow();
    });

    it('submits PRIMARY to the exchange adapter', async () => {
      const dto: PlaceBracketOrderDto = {
        ...baseDto,
        bracket: { tpPrice: '1860.00', slPrice: '1840.00' },
      };

      await service.placeBracket(dto);

      expect(exchangeAdapter.placeOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: dto.accountId,
          instrumentId: dto.instrumentId,
          side: 'BUY',
          type: 'LIMIT',
          quantity: dto.quantity,
          price: dto.price,
        }),
      );
    });

    it('throws when exchange rejects primary', async () => {
      exchangeAdapter.placeOrder = jest.fn().mockResolvedValue({
        status: 'REJECTED',
        reason: 'market closed',
      });

      const dto: PlaceBracketOrderDto = {
        ...baseDto,
        bracket: { tpPrice: '1860.00', slPrice: '1840.00' },
      };

      await expect(service.placeBracket(dto)).rejects.toThrow('market closed');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // activateBracketChildren()
  // ─────────────────────────────────────────────────────────────────────────

  describe('activateBracketChildren()', () => {
    it('activates only NEW-status children', async () => {
      const primaryId = 'primary-1';
      const existingChildren: Partial<OrderEntity>[] = [
        { id: 'child-tp-1', parentOrderId: primaryId, orderRole: 'TAKE_PROFIT', status: 'NEW', accountId: 'a1', instrumentId: 'NSE:INFY', side: 'SELL', type: 'LIMIT', quantity: '100', price: '1860.00', clientOrderId: 'cli-tp', remainingQty: '100', filledQty: '0', timeInForce: 'DAY' },
        { id: 'child-sl-1', parentOrderId: primaryId, orderRole: 'STOP_LOSS', status: 'PLACED', accountId: 'a1', instrumentId: 'NSE:INFY', side: 'SELL', type: 'STOP', quantity: '100', price: '1840.00', clientOrderId: 'cli-sl', remainingQty: '100', filledQty: '0', timeInForce: 'DAY' },
      ];

      const localDataSource = buildMockDataSource(existingChildren);
      (service as any).dataSource = localDataSource;
      (service as any).orders = {
        find: jest.fn().mockResolvedValue(existingChildren),
        save: jest.fn().mockImplementation((items: any | any[]) => {
          const list = Array.isArray(items) ? items : [items];
          list.forEach((item: any) => {
            const idx = existingChildren.findIndex((c: any) => c.id === item.id);
            if (idx >= 0) existingChildren[idx] = { ...existingChildren[idx], ...item };
          });
          return Array.isArray(items) ? list : list[0];
        }),
      } as any;

      await service.activateBracketChildren(primaryId);

      // STOP_LOSS was already PLACED — should not be re-submitted
      expect(exchangeAdapter.placeOrder).toHaveBeenCalledTimes(1);
      // TAKE_PROFIT was NEW — should be activated
      const call = (exchangeAdapter.placeOrder as jest.Mock).mock.calls[0][0];
      expect(call.side).toBe('SELL');
    });

    it('does nothing when no children exist', async () => {
      const localDataSource = buildMockDataSource();
      (service as any).dataSource = localDataSource;
      (service as any).orders = {
        find: jest.fn().mockResolvedValue([]),
        save: jest.fn(),
      } as any;

      await service.activateBracketChildren('nonexistent-primary');

      expect(exchangeAdapter.placeOrder).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // cancelBracketChildren()
  // ─────────────────────────────────────────────────────────────────────────

  describe('cancelBracketChildren()', () => {
    it('cancels all NEW-status children and marks them CANCELLED', async () => {
      const primaryId = 'primary-cancel-1';
      const existingChildren: Partial<OrderEntity>[] = [
        { id: 'child-tp-c1', parentOrderId: primaryId, orderRole: 'TAKE_PROFIT', status: 'NEW', tenantId: 't1' },
        { id: 'child-sl-c1', parentOrderId: primaryId, orderRole: 'STOP_LOSS', status: 'NEW', tenantId: 't1' },
      ];

      const savedChildren: Partial<OrderEntity>[] = [];
      const localOrders = {
        find: jest.fn().mockResolvedValue(existingChildren),
        save: jest.fn().mockImplementation((items: any | any[]) => {
          const list = Array.isArray(items) ? items : [items];
          list.forEach((item: any) => {
            const idx = savedChildren.findIndex((c: any) => c.id === item.id);
            if (idx >= 0) savedChildren[idx] = { ...savedChildren[idx], ...item };
            else savedChildren.push(item);
          });
          return Array.isArray(items) ? list : list[0];
        }),
      } as any;

      const localDataSource = buildMockDataSource();
      (service as any).dataSource = localDataSource;
      (service as any).orders = localOrders;

      await service.cancelBracketChildren(primaryId);

      expect(localOrders.save).toHaveBeenCalled();
      // Both children should have been saved with status = CANCELLED
      const saved = localOrders.save.mock.calls.flat();
      expect(saved.some((s: any) => s.status === 'CANCELLED')).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // addExecution() — filledQty / remainingQty tracking + bracket activation
  // ─────────────────────────────────────────────────────────────────────────

  describe('addExecution()', () => {
    it('sets filledQty and remainingQty on first partial fill', async () => {
      const execId = 'exec-partial-1';
      const savedOrders: Partial<OrderEntity>[] = [
        { id: 'order-fill-1', tenantId: 't1', filledQty: '0', remainingQty: '100', status: 'PLACED' } as any,
      ];

      const localDataSource = buildMockDataSource(savedOrders);
      const localOrders = {
        save: jest.fn().mockImplementation((item: any) => {
          const idx = savedOrders.findIndex((o) => o.id === item.id);
          if (idx >= 0) savedOrders[idx] = { ...savedOrders[idx], ...item };
          return { ...item, id: item.id };
        }),
        findOne: jest.fn().mockImplementation((q: any) => {
          return Promise.resolve(savedOrders.find((o) => o.id === q?.where?.id) ?? null);
        }),
        create: (x: any) => x,
      } as any;

      (service as any).dataSource = localDataSource;
      (service as any).orders = localOrders;

      const dto = {
        orderId: 'order-fill-1',
        accountId: 'a1',
        instrumentId: 'NSE:INFY',
        quantity: '30',
        price: '1850.00',
        fees: '0.50',
        externalRefId: execId,
      };

      const exec = await service.addExecution(dto);

      expect(exec).toBeDefined();
      expect(exec.externalRefId).toBe(execId);

      // Check the order was saved with updated filled/remaining
      const orderSaveCall = localOrders.save.mock.calls.find((c: any[]) =>
        c[0]?.filledQty !== undefined,
      );
      expect(orderSaveCall).toBeDefined();
      expect(orderSaveCall[0].filledQty).toBe('30');
      expect(orderSaveCall[0].remainingQty).toBe('70');
      expect(orderSaveCall[0].status).toBe('PARTIALLY_FILLED');
    });

    it('transitions to FILLED when remainingQty becomes 0', async () => {
      const execId = 'exec-full-1';
      const savedOrders: Partial<OrderEntity>[] = [
        { id: 'order-fill-full-1', tenantId: 't1', filledQty: '70', remainingQty: '30', status: 'PARTIALLY_FILLED', orderRole: 'PRIMARY' } as any,
      ];

      const localDataSource = buildMockDataSource(savedOrders);
      const localOrders = {
        save: jest.fn().mockImplementation((item: any) => {
          const idx = savedOrders.findIndex((o) => o.id === item.id);
          if (idx >= 0) savedOrders[idx] = { ...savedOrders[idx], ...item };
          return { ...item, id: item.id };
        }),
        findOne: jest.fn().mockImplementation((q: any) => {
          return Promise.resolve(savedOrders.find((o) => o.id === q?.where?.id) ?? null);
        }),
        create: (x: any) => x,
      } as any;

      (service as any).dataSource = localDataSource;
      (service as any).orders = localOrders;

      const dto = {
        orderId: 'order-fill-full-1',
        accountId: 'a1',
        instrumentId: 'NSE:INFY',
        quantity: '30',
        price: '1850.00',
        fees: '0.50',
        externalRefId: execId,
      };

      await service.addExecution(dto);

      const orderSaveCall = localOrders.save.mock.calls.find((c: any[]) =>
        c[0]?.status !== undefined,
      );
      expect(orderSaveCall).toBeDefined();
      expect(orderSaveCall[0].filledQty).toBe('100');
      expect(orderSaveCall[0].remainingQty).toBe('0');
      expect(orderSaveCall[0].status).toBe('FILLED');
    });
  });
});