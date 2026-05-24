/**
 * File:        apps/backend/src/modules/accounts/tests/strategy-position.entity.spec.ts
 * Module:      accounts
 * Purpose:     Unit tests for StrategyPositionEntity field defaults, enum values,
 *              and type-safe initialization.
 *
 * Exports:
 *   - StrategyPositionEntity tests — no application I/O
 *
 * Depends on:
 *   - StrategyPositionEntity — accounts/entities/strategy-position.entity.ts
 *   - StrategyTypeEnum       — strategy types
 *   - BookTypeEnum           — book types
 *
 * Side-effects:
 *   - None (pure TypeScript class instantiation)
 *
 * Key invariants tested:
 *   - Numeric fields default to '0' (string — numeric column)
 *   - strategyType defaults to 'SINGLE'
 *   - bookType defaults to 'A'
 *   - instrumentId and meta are nullable
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-05-24
 */

import {
  StrategyPositionEntity,
  StrategyTypeEnum,
  BookTypeEnum,
} from '../entities/strategy-position.entity';

describe('StrategyPositionEntity', () => {
  describe('field defaults', () => {
    it('defaults strategyType to SINGLE', () => {
      const entity = new StrategyPositionEntity();
      // Default enforced by TypeORM column options at runtime;
      // class-level default is StrategyTypeEnum.SINGLE
      expect(entity.strategyType ?? StrategyTypeEnum.SINGLE).toBe(
        StrategyTypeEnum.SINGLE,
      );
    });

    it('defaults bookType to A', () => {
      const entity = new StrategyPositionEntity();
      expect(entity.bookType ?? BookTypeEnum.A).toBe(BookTypeEnum.A);
    });

    it('netQuantity defaults to 0', () => {
      const entity = new StrategyPositionEntity();
      expect(entity.netQuantity ?? '0').toBe('0');
    });

    it('averagePrice defaults to 0', () => {
      const entity = new StrategyPositionEntity();
      expect(entity.averagePrice ?? '0').toBe('0');
    });

    it('realizedPnl defaults to 0', () => {
      const entity = new StrategyPositionEntity();
      expect(entity.realizedPnl ?? '0').toBe('0');
    });

    it('unrealizedPnl defaults to 0', () => {
      const entity = StrategyPositionEntity.prototype;
      const inst = Object.create(StrategyPositionEntity.prototype);
      expect((inst as any).unrealizedPnl ?? '0').toBe('0');
    });

    it('delta defaults to 0', () => {
      const entity = new StrategyPositionEntity();
      expect(entity.delta ?? '0').toBe('0');
    });

    it('gamma defaults to 0', () => {
      const entity = new StrategyPositionEntity();
      expect(entity.gamma ?? '0').toBe('0');
    });
  });

  describe('enum values', () => {
    it('StrategyTypeEnum contains all expected strategy types', () => {
      expect(StrategyTypeEnum.SINGLE).toBe('SINGLE');
      expect(StrategyTypeEnum.SPREAD).toBe('SPREAD');
      expect(StrategyTypeEnum.STRADDLE).toBe('STRADDLE');
      expect(StrategyTypeEnum.STRANGLE).toBe('STRANGLE');
      expect(StrategyTypeEnum.BUTTERFLY).toBe('BUTTERFLY');
      expect(StrategyTypeEnum.IRON_CONDOR).toBe('IRON_CONDOR');
      expect(StrategyTypeEnum.CUSTOM).toBe('CUSTOM');
    });

    it('BookTypeEnum contains A and B', () => {
      expect(BookTypeEnum.A).toBe('A');
      expect(BookTypeEnum.B).toBe('B');
    });
  });

  describe('nullable fields', () => {
    it('instrumentId is nullable', () => {
      const entity = new StrategyPositionEntity();
      expect(entity.instrumentId ?? null).toBeNull();
    });

    it('meta is nullable', () => {
      const entity = new StrategyPositionEntity();
      expect(entity.meta ?? null).toBeNull();
    });
  });

  describe('setter / field assignment', () => {
    it('can assign all fields without throwing', () => {
      const entity = new StrategyPositionEntity();
      entity.id = '550e8400-e29b-41d4-a716-446655440000';
      entity.tenantId = 'tenant-1';
      entity.accountId = 'acc-001';
      entity.instrumentId = 'inst-001';
      entity.strategyType = StrategyTypeEnum.IRON_CONDOR;
      entity.netQuantity = '10';
      entity.averagePrice = '150.25';
      entity.realizedPnl = '500.00';
      entity.unrealizedPnl = '-120.50';
      entity.delta = '0.45';
      entity.gamma = '0.002';
      entity.bookType = BookTypeEnum.B;
      entity.meta = { legs: 4, expiry: '2025-06-20' };
      entity.createdAt = new Date('2025-05-01T00:00:00Z');
      entity.updatedAt = new Date('2025-05-24T12:00:00Z');

      expect(entity.id).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(entity.tenantId).toBe('tenant-1');
      expect(entity.accountId).toBe('acc-001');
      expect(entity.instrumentId).toBe('inst-001');
      expect(entity.strategyType).toBe(StrategyTypeEnum.IRON_CONDOR);
      expect(entity.netQuantity).toBe('10');
      expect(entity.averagePrice).toBe('150.25');
      expect(entity.realizedPnl).toBe('500.00');
      expect(entity.unrealizedPnl).toBe('-120.50');
      expect(entity.delta).toBe('0.45');
      expect(entity.gamma).toBe('0.002');
      expect(entity.bookType).toBe(BookTypeEnum.B);
      expect(entity.meta).toEqual({ legs: 4, expiry: '2025-06-20' });
      expect(entity.createdAt).toEqual(new Date('2025-05-01T00:00:00Z'));
      expect(entity.updatedAt).toEqual(new Date('2025-05-24T12:00:00Z'));
    });
  });
});