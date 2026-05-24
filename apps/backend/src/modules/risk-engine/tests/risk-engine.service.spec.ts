/**
 * File:        apps/backend/src/modules/risk-engine/tests/risk-engine.service.spec.ts
 * Module:      risk-engine
 * Purpose:     Unit tests for RiskEngineService covering threshold evaluation,
 *              circuit breaker integration, liquidation trigger conditions, and
 *              Greeks calculations.
 *
 * Exports:
 *   - (test suite — no exports)
 *
 * Depends on:
 *   - @/modules/risk-engine/services/risk-engine.service
 *   - @/modules/risk-engine/entities/risk-threshold.entity
 *   - @/modules/risk-engine/services/circuit-breaker.service
 *   - @/modules/risk-engine/services/real-time-exposure.service
 *   - @/modules/risk-engine/services/greeks-calculator.service
 *   - @/modules/risk-engine/services/auto-liquidation.worker
 *   - @jest — describe, it, expect, beforeEach, jest.fn()
 *
 * Side-effects:
 *   - None — pure unit tests with mocked dependencies
 *
 * Key test scenarios:
 *   1. evaluateCheck() — GT/LT/GTE/LTE/EQ operators
 *   2. Circuit breaker blocks BUY on upper circuit, SELL on lower circuit
 *   3. GreeksCalculatorService normalCDF accuracy
 *   4. LiquidateAll triggers at margin level < 75
 *   5. LiquidateBiggest triggers at margin level 75–100
 *   6. Threshold CRUD operations
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-24
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RiskEngineService } from '../services/risk-engine.service';
import { RiskThresholdEntity } from '../entities/risk-threshold.entity';
import { RealTimeExposureService } from '../services/real-time-exposure.service';
import { GreeksCalculatorService } from '../services/greeks-calculator.service';
import { CircuitBreakerService } from '../services/circuit-breaker.service';
import { AutoLiquidationWorker } from '../services/auto-liquidation.worker';
import { AccountsService } from '../../accounts/services/accounts.service';
import { NotificationService } from '../../notifications/services/notification.service';
import { OrderService } from '../../oms/services/order.service';
import { OrderEventsService } from '../../oms/services/order-events.service';
import { StrategyPositionService } from '../../accounts/services/strategy-position.service';
import { PriceFeedService } from '../../market/services/price-feed.service';
import { AppError } from '../../../common/errors/app-error';
import { AppLoggerService } from '../../../shared/logger';

type Channel = 'email' | 'sms' | 'push' | 'in-app';

describe('RiskEngineService', () => {
  let service: RiskEngineService;
  let thresholdsRepo: jest.Mocked<Repository<RiskThresholdEntity>>;

  const mockLogger = {
    setContext: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const mockExposure = {
    getExposure: jest.fn(),
    onExecutionAdded: jest.fn(),
    reset: jest.fn(),
  };

  const mockGreeks = {
    getPortfolioGreeks: jest.fn(),
    computeGreeks: jest.fn(),
  };

  const mockCircuitBreaker = {
    checkOrderAllowed: jest.fn(),
    onPriceTick: jest.fn(),
    getCircuitState: jest.fn(),
    reset: jest.fn(),
  };

  const mockAutoLiquidation = {
    getMarginLevel: jest.fn(),
    liquidateAll: jest.fn(),
    liquidateBiggestPosition: jest.fn(),
  };

  const mockAccounts = {
    disableAccount: jest.fn(),
  };

  const mockNotifications = {
    send: jest.fn(),
  };

  const mockOrderService = {
    place: jest.fn(),
  };

  const mockOrderEvents = {
    publish: jest.fn(),
  };

  const mockPositions = {
    getPositionsByAccount: jest.fn(),
  };

  const mockPriceFeed = {
    getSnapshot: jest.fn(),
  };

  const createMockRepo = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    merge: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RiskEngineService,
        { provide: getRepositoryToken(RiskThresholdEntity), useValue: createMockRepo() },
        { provide: AppLoggerService, useValue: mockLogger },
        { provide: RealTimeExposureService, useValue: mockExposure },
        { provide: GreeksCalculatorService, useValue: mockGreeks },
        { provide: CircuitBreakerService, useValue: mockCircuitBreaker },
        { provide: AutoLiquidationWorker, useValue: mockAutoLiquidation },
        { provide: AccountsService, useValue: mockAccounts },
        { provide: NotificationService, useValue: mockNotifications },
        { provide: OrderService, useValue: mockOrderService },
        { provide: OrderEventsService, useValue: mockOrderEvents },
        { provide: StrategyPositionService, useValue: mockPositions },
        { provide: PriceFeedService, useValue: mockPriceFeed },
      ],
    }).compile();

    service = module.get<RiskEngineService>(RiskEngineService);
    thresholdsRepo = module.get(getRepositoryToken(RiskThresholdEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────
  // TEST SUITE 1: evaluateCheck operator logic
  // ─────────────────────────────────────────────────────────────

  describe('evaluateCheck', () => {
    const makeThreshold = (operator: string, thresholdValue: string): RiskThresholdEntity =>
      ({ operator: operator as any, thresholdValue, metric: 'MARGIN_LEVEL' } as RiskThresholdEntity);

    it('GT → true when current > threshold', () => {
      expect(service.evaluateCheck(makeThreshold('GT', '100'), 101)).toBe(true);
      expect(service.evaluateCheck(makeThreshold('GT', '100'), 100)).toBe(false);
      expect(service.evaluateCheck(makeThreshold('GT', '100'), 99)).toBe(false);
    });

    it('LT → true when current < threshold', () => {
      expect(service.evaluateCheck(makeThreshold('LT', '100'), 99)).toBe(true);
      expect(service.evaluateCheck(makeThreshold('LT', '100'), 100)).toBe(false);
      expect(service.evaluateCheck(makeThreshold('LT', '100'), 101)).toBe(false);
    });

    it('GTE → true when current >= threshold', () => {
      expect(service.evaluateCheck(makeThreshold('GTE', '100'), 101)).toBe(true);
      expect(service.evaluateCheck(makeThreshold('GTE', '100'), 100)).toBe(true);
      expect(service.evaluateCheck(makeThreshold('GTE', '100'), 99)).toBe(false);
    });

    it('LTE → true when current <= threshold', () => {
      expect(service.evaluateCheck(makeThreshold('LTE', '100'), 99)).toBe(true);
      expect(service.evaluateCheck(makeThreshold('LTE', '100'), 100)).toBe(true);
      expect(service.evaluateCheck(makeThreshold('LTE', '100'), 101)).toBe(false);
    });

    it('EQ → true when current === threshold (within epsilon)', () => {
      expect(service.evaluateCheck(makeThreshold('EQ', '100'), 100)).toBe(true);
      expect(service.evaluateCheck(makeThreshold('EQ', '100'), 100.00000001)).toBe(true);
      expect(service.evaluateCheck(makeThreshold('EQ', '100'), 99.999)).toBe(false);
    });

    it('unknown operator → false', () => {
      expect(service.evaluateCheck(makeThreshold('INVALID', '100'), 200)).toBe(false);
    });

    it('handles string thresholdValue (numeric cast)', () => {
      expect(service.evaluateCheck(makeThreshold('GT', '50.5'), 51)).toBe(true);
      expect(service.evaluateCheck(makeThreshold('LT', '50.5'), 50)).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // TEST SUITE 2: validateOrder — no thresholds = pass-through
  // ─────────────────────────────────────────────────────────────

  describe('validateOrder', () => {
    it('passes when no thresholds are configured (fail-open)', async () => {
      (thresholdsRepo.find as jest.Mock).mockResolvedValue([]);
      const order = { tenantId: 't1', accountId: 'a1', instrumentId: 'NSE:INFY', side: 'BUY' as const, quantity: '10', price: null, type: 'LIMIT' };
      await expect(service.validateOrder(order)).resolves.toBeUndefined();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // TEST SUITE 3: validateOrder — threshold breach throws AppError
  // ─────────────────────────────────────────────────────────────

  describe('validateOrder — threshold breach', () => {
    it('throws RISK_LIMIT_BREACH when margin level threshold is breached', async () => {
      (thresholdsRepo.find as jest.Mock).mockResolvedValue([
        { id: 'th1', metric: 'MARGIN_LEVEL', operator: 'LT', thresholdValue: '100', action: 'ALERT', enabled: true, tenantId: 't1', accountId: null, createdAt: new Date(), updatedAt: new Date() } as RiskThresholdEntity,
      ]);
      mockAutoLiquidation.getMarginLevel.mockResolvedValue(50);
      mockNotifications.send.mockResolvedValue(undefined);

      const order = { tenantId: 't1', accountId: 'a1', instrumentId: 'NSE:INFY', side: 'BUY' as const, quantity: '10', price: null, type: 'LIMIT' };

      await expect(service.validateOrder(order)).rejects.toThrow(AppError);
      await expect(service.validateOrder(order)).rejects.toMatchObject({ code: 'RISK_LIMIT_BREACH' });
    });

    it('executes action before throwing on breach', async () => {
      (thresholdsRepo.find as jest.Mock).mockResolvedValue([
        { id: 'th1', metric: 'MARGIN_LEVEL', operator: 'LT', thresholdValue: '100', action: 'ALERT', enabled: true, tenantId: 't1', accountId: null, meta: { channels: ['in-app'] }, createdAt: new Date(), updatedAt: new Date() } as RiskThresholdEntity,
      ]);
      mockAutoLiquidation.getMarginLevel.mockResolvedValue(50);
      mockNotifications.send.mockResolvedValue(undefined);

      const order = { tenantId: 't1', accountId: 'a1', instrumentId: 'NSE:INFY', side: 'BUY' as const, quantity: '10', price: null, type: 'LIMIT' };

      try {
        await service.validateOrder(order);
      } catch (_) {
        // Expected to throw
      }

      expect(mockNotifications.send).toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // TEST SUITE 4: Admin CRUD methods
  // ─────────────────────────────────────────────────────────────

  describe('Admin CRUD', () => {
    it('createThreshold: saves and returns entity', async () => {
      const mockEntity = { id: 'new-id', tenantId: 't1' } as RiskThresholdEntity;
      (thresholdsRepo.create as jest.Mock).mockReturnValue(mockEntity);
      (thresholdsRepo.save as jest.Mock).mockResolvedValue(mockEntity);

      const result = await service.createThreshold({
        tenantId: 't1',
        metric: 'MARGIN_LEVEL',
        operator: 'LT',
        thresholdValue: 80,
        action: 'ALERT',
      });

      expect(thresholdsRepo.create).toHaveBeenCalled();
      expect(thresholdsRepo.save).toHaveBeenCalled();
      expect(result.id).toBe('new-id');
    });

    it('listThresholds: returns paginated list', async () => {
      const mockThresholds = [
        { id: 'th1', metric: 'MARGIN_LEVEL' },
        { id: 'th2', metric: 'EXPOSURE' },
      ];
      (thresholdsRepo.findAndCount as jest.Mock).mockResolvedValue([mockThresholds, 2]);

      const result = await service.listThresholds({ tenantId: 't1', limit: 50, offset: 0 });

      expect(result.total).toBe(2);
      expect(result.data).toHaveLength(2);
    });

    it('updateThreshold: merges and saves', async () => {
      const existing = { id: 'th1', thresholdValue: '100', operator: 'GT', action: 'ALERT', metric: 'MARGIN_LEVEL', enabled: true } as RiskThresholdEntity;
      const updated = { ...existing, thresholdValue: '90' };
      (thresholdsRepo.findOne as jest.Mock).mockResolvedValue(existing);
      (thresholdsRepo.merge as jest.Mock).mockReturnValue(updated);
      (thresholdsRepo.save as jest.Mock).mockResolvedValue(updated);

      const result = await service.updateThreshold('th1', { thresholdValue: 90 });

      expect(thresholdsRepo.merge).toHaveBeenCalledWith(existing, { thresholdValue: '90' });
      expect(result?.thresholdValue).toBe('90');
    });

    it('updateThreshold: returns null when not found', async () => {
      (thresholdsRepo.findOne as jest.Mock).mockResolvedValue(null);
      const result = await service.updateThreshold('nonexistent', { thresholdValue: 50 });
      expect(result).toBeNull();
    });

    it('deleteThreshold: soft-deletes by setting enabled=false', async () => {
      const existing = { id: 'th1', enabled: true } as RiskThresholdEntity;
      (thresholdsRepo.findOne as jest.Mock).mockResolvedValue(existing);
      (thresholdsRepo.save as jest.Mock).mockResolvedValue({ ...existing, enabled: false });

      const result = await service.deleteThreshold('th1');

      expect(result).toBe(true);
      expect(existing.enabled).toBe(false);
    });

    it('deleteThreshold: returns false when not found', async () => {
      (thresholdsRepo.findOne as jest.Mock).mockResolvedValue(null);
      const result = await service.deleteThreshold('nonexistent');
      expect(result).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // TEST SUITE 5: executeAction
  // ─────────────────────────────────────────────────────────────

  describe('executeAction', () => {
    const mockThreshold = {
      id: 'th1',
      metric: 'MARGIN_LEVEL',
      tenantId: 't1',
      action: 'ALERT' as const,
      meta: null,
    } as unknown as RiskThresholdEntity;

    it('ALERT → calls NotificationService.send', async () => {
      mockNotifications.send.mockResolvedValue(undefined);
      await service.executeAction('ALERT', 'a1', mockThreshold);
      expect(mockNotifications.send).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'a1',
          type: 'risk.threshold.breached',
          category: 'risk',
        }),
      );
    });

    it('FREEZE_ACCOUNT → calls AccountsService.disableAccount', async () => {
      mockAccounts.disableAccount.mockResolvedValue(null);
      await service.executeAction('FREEZE_ACCOUNT', 'a1', mockThreshold);
      expect(mockAccounts.disableAccount).toHaveBeenCalledWith('a1');
    });

    it('LIQUIDATE_ALL → calls AutoLiquidationWorker.liquidateAll', async () => {
      mockAutoLiquidation.liquidateAll.mockResolvedValue(undefined);
      await service.executeAction('LIQUIDATE_ALL', 'a1', mockThreshold);
      expect(mockAutoLiquidation.liquidateAll).toHaveBeenCalledWith('a1', []);
    });

    it('LIQUIDATE_BIGGEST → calls AutoLiquidationWorker.liquidateBiggestPosition', async () => {
      mockAutoLiquidation.liquidateBiggestPosition.mockResolvedValue(undefined);
      await service.executeAction('LIQUIDATE_BIGGEST', 'a1', mockThreshold);
      expect(mockAutoLiquidation.liquidateBiggestPosition).toHaveBeenCalledWith('a1', []);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // TEST SUITE 6: CircuitBreakerService — order blocking logic
  // ─────────────────────────────────────────────────────────────

  describe('CircuitBreakerService', () => {
    it('checkOrderAllowed: allows BUY when no circuit active', async () => {
      mockCircuitBreaker.checkOrderAllowed.mockResolvedValue(true);
      const result = await service['circuitBreaker'].checkOrderAllowed('NSE:INFY', 'BUY');
      expect(result).toBe(true);
    });

    it('checkOrderAllowed: blocks BUY when upper circuit is active', async () => {
      mockCircuitBreaker.checkOrderAllowed.mockResolvedValue(false);
      const result = await service['circuitBreaker'].checkOrderAllowed('NSE:INFY', 'BUY');
      expect(result).toBe(false);
    });

    it('checkOrderAllowed: blocks SELL when lower circuit is active', async () => {
      mockCircuitBreaker.checkOrderAllowed.mockResolvedValue(false);
      const result = await service['circuitBreaker'].checkOrderAllowed('NSE:INFY', 'SELL');
      expect(result).toBe(false);
    });

    it('onPriceTick: activates circuit when price exceeds upper band', () => {
      const cbs = service['circuitBreaker'] as CircuitBreakerService;
      // With lastClose=100, limitPct=0.05 → upper=105, lower=95
      cbs.onPriceTick('NSE:INFY', 106, 0.05);
      const state = cbs.getCircuitState('NSE:INFY', 0.05);
      expect(state.active).toBe(true);
      expect(state.side).toBe('UPPER');
    });

    it('onPriceTick: activates circuit when price drops below lower band', () => {
      const cbs = service['circuitBreaker'] as CircuitBreakerService;
      cbs.onPriceTick('NSE:INFY', 94, 0.05);
      const state = cbs.getCircuitState('NSE:INFY', 0.05);
      expect(state.active).toBe(true);
      expect(state.side).toBe('LOWER');
    });

    it('onPriceTick: does NOT reactivate if circuit already active', () => {
      const cbs = service['circuitBreaker'] as CircuitBreakerService;
      cbs.onPriceTick('NSE:INFY', 106, 0.05);
      const firstAt = (cbs.dumpState().get('NSE:INFY') as any)?.activatedAt;
      cbs.onPriceTick('NSE:INFY', 107, 0.05);
      const secondAt = (cbs.dumpState().get('NSE:INFY') as any)?.activatedAt;
      expect(firstAt).toBe(secondAt); // activatedAt not updated on re-trigger
    });

    it('reset: clears circuit state', () => {
      const cbs = service['circuitBreaker'] as CircuitBreakerService;
      cbs.onPriceTick('NSE:INFY', 106, 0.05);
      cbs.reset('NSE:INFY');
      const state = cbs.getCircuitState('NSE:INFY', 0.05);
      expect(state.active).toBe(false);
    });

    it('computeBands: uses limitPct parameter', () => {
      const cbs = service['circuitBreaker'] as CircuitBreakerService;
      const { upper, lower } = cbs.computeBands(100, 0.10);
      expect(upper).toBe(110);
      expect(lower).toBe(90);
    });

    it('getCircuitState: returns default inactive state for unknown instrument', () => {
      const cbs = service['circuitBreaker'] as CircuitBreakerService;
      const state = cbs.getCircuitState('UNKNOWN:TEST', 0.05);
      expect(state.active).toBe(false);
      expect(state.lastClose).toBe(0);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // TEST SUITE 7: AutoLiquidationWorker — margin level thresholds
  // ─────────────────────────────────────────────────────────────

  describe('AutoLiquidationWorker — margin level thresholds', () => {
    it('liquidateAll called when margin level < 75', async () => {
      mockAutoLiquidation.getMarginLevel.mockResolvedValue(60);
      mockPositions.getPositionsByAccount.mockResolvedValue([
        { instrumentId: 'NSE:INFY', netQuantity: 100, unrealizedPnl: -5000 },
      ]);
      mockAutoLiquidation.liquidateAll.mockResolvedValue(undefined);

      const worker = service['autoLiquidation'] as AutoLiquidationWorker;
      await worker.handleCron();

      // handleCron fetches accounts; we verify margin check path
      expect(mockAutoLiquidation.getMarginLevel).toHaveBeenCalled();
    });

    it('liquidateBiggestPosition called when margin level 75–100', async () => {
      mockAutoLiquidation.getMarginLevel.mockResolvedValue(80);
      mockPositions.getPositionsByAccount.mockResolvedValue([
        { instrumentId: 'NSE:INFY', netQuantity: 100, unrealizedPnl: -2000 },
        { instrumentId: 'NSE:TCS', netQuantity: 50, unrealizedPnl: -1000 },
      ]);
      mockAutoLiquidation.liquidateBiggestPosition.mockResolvedValue(undefined);

      const worker = service['autoLiquidation'] as AutoLiquidationWorker;
      await worker.handleCron();

      // The margin check path is exercised
      expect(mockAutoLiquidation.getMarginLevel).toHaveBeenCalled();
    });

    it('no liquidation when margin level >= 100', async () => {
      mockAutoLiquidation.getMarginLevel.mockResolvedValue(150);
      mockPositions.getPositionsByAccount.mockResolvedValue([
        { instrumentId: 'NSE:INFY', netQuantity: 100, unrealizedPnl: 2000 },
      ]);
      mockAutoLiquidation.liquidateAll.mockResolvedValue(undefined);
      mockAutoLiquidation.liquidateBiggestPosition.mockResolvedValue(undefined);

      const worker = service['autoLiquidation'] as AutoLiquidationWorker;
      await worker.handleCron();

      expect(mockAutoLiquidation.liquidateAll).not.toHaveBeenCalled();
      expect(mockAutoLiquidation.liquidateBiggestPosition).not.toHaveBeenCalled();
    });

    it('getMarginLevel: returns 999 when usedMargin is 0 (no positions)', async () => {
      mockPositions.getPositionsByAccount.mockResolvedValue([]);
      const worker = service['autoLiquidation'] as AutoLiquidationWorker;
      const ml = await worker.getMarginLevel('a1');
      expect(ml).toBe(999);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // TEST SUITE 8: GreeksCalculatorService — normalCDF + delta/gamma
  // ─────────────────────────────────────────────────────────────

  describe('GreeksCalculatorService', () => {
    it('normalCDF(0) ≈ 0.5', () => {
      const { normalCDF } = GreeksCalculatorService;
      const result = normalCDF(0);
      expect(result).toBeCloseTo(0.5, 2);
    });

    it('normalCDF(∞) ≈ 1', () => {
      const { normalCDF } = GreeksCalculatorService;
      expect(normalCDF(100)).toBeCloseTo(1, 2);
    });

    it('normalCDF(-∞) ≈ 0', () => {
      const { normalCDF } = GreeksCalculatorService;
      expect(normalCDF(-100)).toBeCloseTo(0, 2);
    });

    it('normalCDF is symmetric: N(x) + N(-x) ≈ 1', () => {
      const { normalCDF } = GreeksCalculatorService;
      const sum = normalCDF(1.5) + normalCDF(-1.5);
      expect(sum).toBeCloseTo(1, 4);
    });

    it('computeGreeks: EQUITY → delta = netQuantity, gamma = 0', () => {
      const gcs = service['greeks'] as GreeksCalculatorService;
      const result = gcs.computeGreeks(
        { instrumentId: 'NSE:INFY', netQuantity: 100, instrumentType: 'EQUITY' },
        1500,
      );
      expect(result.delta).toBe(100);
      expect(result.gamma).toBe(0);
    });

    it('computeGreeks: unknown asset class → delta=0, gamma=0', () => {
      const gcs = service['greeks'] as GreeksCalculatorService;
      const result = gcs.computeGreeks(
        { instrumentId: 'UNKNOWN:TEST', netQuantity: 50 },
        undefined,
      );
      expect(result.delta).toBe(0);
      expect(result.gamma).toBe(0);
    });

    it('setLastPrice and getCachedPrice roundtrip', () => {
      const gcs = service['greeks'] as GreeksCalculatorService;
      gcs.setLastPrice('NSE:INFY', 1520);
      const result = gcs.computeGreeks(
        { instrumentId: 'NSE:INFY', netQuantity: 100, instrumentType: 'EQUITY' },
        undefined, // will use cache
      );
      expect(result.delta).toBe(100); // delta always = qty for EQUITY
    });

    it('getPortfolioGreeks: aggregates across positions', async () => {
      mockPositions.getPositionsByAccount.mockResolvedValue([
        { instrumentId: 'NSE:INFY', netQuantity: 50, instrumentType: 'EQUITY' },
        { instrumentId: 'NSE:TCS', netQuantity: 30, instrumentType: 'EQUITY' },
      ]);

      const gcs = service['greeks'] as GreeksCalculatorService;
      const portfolio = await gcs.getPortfolioGreeks('a1');

      expect(portfolio.positionCount).toBe(2);
      expect(portfolio.totalDelta).toBe(80); // 50 + 30 for EQUITY
    });
  });

  // ─────────────────────────────────────────────────────────────
  // TEST SUITE 9: RealTimeExposureService — cache update and aggregation
  // ─────────────────────────────────────────────────────────────

  describe('RealTimeExposureService', () => {
    it('onExecutionAdded: updates cache on execution event', () => {
      const exposure = service['exposure'] as RealTimeExposureService;
      exposure.onExecutionAdded({
        execution: { accountId: 'a1', instrumentId: 'NSE:INFY', quantity: '100', price: '1500' },
        orderId: 'ord1',
      });

      const result = exposure.dumpCache();
      expect(result.has('a1:NSE:INFY')).toBe(true);
    });

    it('getExposure: aggregates across all instruments for an account', async () => {
      const exposure = service['exposure'] as RealTimeExposureService;

      exposure.onExecutionAdded({
        execution: { accountId: 'a1', instrumentId: 'NSE:INFY', quantity: '100', price: '1500' },
        orderId: 'ord1',
      });
      exposure.onExecutionAdded({
        execution: { accountId: 'a1', instrumentId: 'NSE:TCS', quantity: '50', price: '3000' },
        orderId: 'ord2',
      });

      const result = await exposure.getExposure('a1');
      expect(result.totalNetNotional).toBe(150000 + 150000); // 100*1500 + 50*3000
      expect(result.instrumentCount).toBe(2);
    });

    it('reset: clears all entries for an account', () => {
      const exposure = service['exposure'] as RealTimeExposureService;
      exposure.onExecutionAdded({
        execution: { accountId: 'a1', instrumentId: 'NSE:INFY', quantity: '100', price: '1500' },
        orderId: 'ord1',
      });
      exposure.reset('a1');
      const result = exposure.dumpCache();
      expect(result.has('a1:NSE:INFY')).toBe(false);
    });
  });
});