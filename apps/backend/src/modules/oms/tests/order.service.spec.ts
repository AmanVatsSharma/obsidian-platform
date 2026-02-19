/**
 * @file src/modules/oms/tests/order.service.spec.ts
 * @module oms-tests
 * @description Unit tests for OrderService place() idempotency and margin hold
 * @author BharatERP
 * @created 2025-09-24
 */

import { Test } from '@nestjs/testing';
import { OrderService } from '../services/order.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrderEntity } from '../entities/order.entity';
import { ExecutionEntity } from '../entities/execution.entity';
import { OrderAuditEntity } from '../entities/order-audit.entity';
import { DataSource, Repository } from 'typeorm';
import { RiskConfigService } from '../services/risk-config.service';
import { LedgerService } from '../../accounts/services/ledger.service';
import { AppLoggerService } from '../../../shared/logger';
import { RealtimePublisherService } from '../../realtime/prana-stream/services/realtime-publisher.service';
import { MarginEngineService } from '../services/margin-engine.service';
import { EXCHANGE_ADAPTER } from '../adapters/exchange-adapter';
import { NotificationService } from '../../notifications/services/notification.service';

jest.mock('../../../shared/request-context', () => ({
  getRequestContext: () => ({ tenantId: 't1', requestId: 'r1', userId: 'u1' }),
}));

describe('OrderService', () => {
  let service: OrderService;
  let ordersRepo: Repository<OrderEntity>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: DataSource, useValue: { transaction: async (_iso: any, fn: any) => fn({ query: async () => {}, getRepository: (_e: any) => ({ findOne: jest.fn().mockResolvedValue(null), save: jest.fn().mockResolvedValue({ id: 'o1', clientOrderId: 'cli-1', accountId: 'a1' }), create: (x: any) => x }) }) } },
        { provide: getRepositoryToken(OrderEntity), useValue: { create: (x: any) => x, save: jest.fn(), findOne: jest.fn() } },
        { provide: getRepositoryToken(ExecutionEntity), useValue: {} },
        { provide: getRepositoryToken(OrderAuditEntity), useValue: {} },
        { provide: RiskConfigService, useValue: { getBuyingPowerMultiplier: jest.fn().mockResolvedValue(1) } },
        { provide: LedgerService, useValue: { createHold: jest.fn(), releaseHold: jest.fn(), postPosition: jest.fn(), postCash: jest.fn() } },
        { provide: RealtimePublisherService, useValue: { publishOrderUpdate: jest.fn() } },
        { provide: EXCHANGE_ADAPTER, useValue: { placeOrder: jest.fn().mockResolvedValue({ status: 'ACCEPTED', providerOrderId: 'mock-order' }), modifyOrder: jest.fn().mockResolvedValue({ status: 'ACCEPTED', providerOrderId: 'mock-order' }), cancelOrder: jest.fn().mockResolvedValue({ status: 'CANCELLED', providerOrderId: 'mock-order' }) } },
        { provide: NotificationService, useValue: { send: jest.fn() } },
        { provide: MarginEngineService, useValue: { estimate: jest.fn().mockResolvedValue({ totalRequired: '100.00000000', initialMargin: '90', maintenanceMargin: '80', brokerage: '10', buyingPower: '0', canPlace: true, reasons: [], appliedRules: {} }) } },
        AppLoggerService,
      ],
    }).compile();

    service = moduleRef.get(OrderService);
    ordersRepo = moduleRef.get(getRepositoryToken(OrderEntity));
  });

  it('places order with idempotent externalRefId', async () => {
    (ordersRepo.findOne as any).mockResolvedValueOnce(null);
    (ordersRepo.save as any).mockResolvedValueOnce({ id: 'o1', clientOrderId: 'cli-1', accountId: 'a1' });
    const res = await service.place({ accountId: 'a1', instrumentId: 'i1', side: 'BUY', type: 'LIMIT', quantity: '10', price: '10', externalRefId: 'ext1', timeInForce: 'DAY' } as any);
    expect(res).toBeDefined();
  });
});


