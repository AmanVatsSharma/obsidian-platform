/**
 * File:        apps/backend/src/modules/oms/tests/bracket-order.dto.spec.ts
 * Module:      oms · Bracket Order DTO Validation
 * Purpose:     Unit tests for bracket order price validation rules
 *
 * Tests:
 *   - BUY: tpPrice > entryPrice, slPrice < entryPrice
 *   - SELL: tpPrice < entryPrice, slPrice > entryPrice
 *   - TRAILING_STOP accepts trailingDistance without TP/SL prices
 *   - Missing TP/SL/trailing on non-trailing order is rejected
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-24
 */

import { validate } from 'class-validator';
import { PlaceBracketOrderDto, BracketConfigDto } from '../dtos/bracket-order.dto';

describe('BracketOrderDto validation', () => {
  // Helper — builds a full PlaceBracketOrderDto with sensible defaults
  function make(overrides: Partial<PlaceBracketOrderDto> & { bracket?: Partial<BracketConfigDto> }): PlaceBracketOrderDto {
    const bracketDefaults = new BracketConfigDto();
    const bracket = Object.assign(bracketDefaults, overrides.bracket ?? {});
    const defaults = {
      accountId: 'acc-001',
      instrumentId: 'NSE:INFY',
      side: 'BUY' as const,
      type: 'BRACKET' as const,
      quantity: '10',
      price: '100.00',
      timeInForce: 'DAY' as const,
      externalRefId: 'ext-bracket-001',
      bracket,
    };
    return Object.assign(new PlaceBracketOrderDto(), defaults, overrides);
  }

  // ── BUY side: tpPrice > entryPrice, slPrice < entryPrice ──────────────────

  describe('BUY side', () => {
    it('accepts valid tpPrice > entryPrice and slPrice < entryPrice', async () => {
      const dto = make({ side: 'BUY', price: '100.00', bracket: { tpPrice: '105.00', slPrice: '95.00' } });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('rejects tpPrice <= entryPrice for BUY', async () => {
      const dto = make({ side: 'BUY', price: '100.00', bracket: { tpPrice: '100.00', slPrice: '95.00' } });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      const msg = errors[0].constraints?.bracketPriceConstraint ?? errors[0].constraints?.isIn ?? '';
      expect(msg).toMatch(/tpPrice.*entry/i);
    });

    it('rejects slPrice >= entryPrice for BUY even if tpPrice is valid', async () => {
      const dto = make({ side: 'BUY', price: '100.00', bracket: { tpPrice: '105.00', slPrice: '100.00' } });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      const msg = errors[0].constraints?.bracketPriceConstraint ?? errors[0].constraints?.isIn ?? '';
      expect(msg).toMatch(/slPrice.*entry/i);
    });

    it('accepts BUY bracket with only tpPrice', async () => {
      const dto = make({ side: 'BUY', price: '100.00', bracket: { tpPrice: '105.00' } });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('accepts BUY bracket with only slPrice', async () => {
      const dto = make({ side: 'BUY', price: '100.00', bracket: { slPrice: '95.00' } });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  // ── SELL side: tpPrice < entryPrice, slPrice > entryPrice ────────────────

  describe('SELL side', () => {
    it('accepts valid tpPrice < entryPrice and slPrice > entryPrice', async () => {
      const dto = make({ side: 'SELL', price: '100.00', bracket: { tpPrice: '95.00', slPrice: '105.00' } });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('rejects tpPrice >= entryPrice for SELL', async () => {
      const dto = make({ side: 'SELL', price: '100.00', bracket: { tpPrice: '100.00', slPrice: '105.00' } });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      const msg = errors[0].constraints?.bracketPriceConstraint ?? errors[0].constraints?.isIn ?? '';
      expect(msg).toMatch(/tpPrice.*entry/i);
    });

    it('rejects slPrice <= entryPrice for SELL', async () => {
      const dto = make({ side: 'SELL', price: '100.00', bracket: { tpPrice: '95.00', slPrice: '100.00' } });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      const msg = errors[0].constraints?.bracketPriceConstraint ?? errors[0].constraints?.isIn ?? '';
      expect(msg).toMatch(/slPrice.*entry/i);
    });

    it('accepts SELL bracket with only tpPrice', async () => {
      const dto = make({ side: 'SELL', price: '100.00', bracket: { tpPrice: '95.00' } });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('accepts SELL bracket with only slPrice', async () => {
      const dto = make({ side: 'SELL', price: '100.00', bracket: { slPrice: '105.00' } });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  // ── Trailing stop ─────────────────────────────────────────────────────────

  describe('TRAILING_STOP mode (via trailingDistance)', () => {
    it('accepts BUY bracket with trailingDistance but no tpPrice/slPrice', async () => {
      const dto = make({ side: 'BUY', price: '100.00', bracket: { trailingDistance: '2.00' } });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('accepts SELL bracket with trailingDistance but no tpPrice/slPrice', async () => {
      const dto = make({ side: 'SELL', price: '100.00', bracket: { trailingDistance: '2.00' } });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('accepts bracket with trailingPct (percentage mode)', async () => {
      const dto = make({ side: 'BUY', price: '100.00', bracket: { trailingPct: '2' } });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('accepts trailingDistance combined with a stop-loss', async () => {
      const dto = make({ side: 'BUY', price: '100.00', bracket: { trailingDistance: '2.00', slPrice: '95.00' } });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  // ── Missing TP/SL/trailing ────────────────────────────────────────────────

  describe('rejects bracket without tpPrice, slPrice, or trailing', () => {
    it('rejects empty bracket config', async () => {
      const dto = make({ side: 'BUY', price: '100.00', bracket: {} });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      const msg = errors[0].constraints?.bracketPriceConstraint ?? errors[0].constraints?.isIn ?? '';
      expect(msg).toMatch(/at least one of/i);
    });
  });

  // ── Type field ─────────────────────────────────────────────────────────────

  describe('type field', () => {
    it('type is BRACKET for PlaceBracketOrderDto', () => {
      const dto = make({ bracket: { tpPrice: '105.00' } });
      expect(dto.type).toBe('BRACKET');
    });
  });
});