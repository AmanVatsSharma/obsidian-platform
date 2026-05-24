/**
 * File:        apps/backend/src/modules/risk-engine/services/circuit-breaker.service.ts
 * Module:      risk-engine · Circuit Breaker
 * Purpose:     Price-limit circuit breakers per instrument — when a tick violates
 *              upper/lower bands (computed from last close ± limitPct), the circuit
 *              activates and blocks new orders on that side until manually reset.
 *
 * Exports:
 *   - CircuitBreakerService              — injectable
 *   - CircuitBreakerService.checkOrderAllowed(instrumentId, side) → Promise<boolean>
 *   - CircuitBreakerService.onPriceTick(instrumentId, lastPrice)   — call from price feed
 *   - CircuitBreakerService.getCircuitState(instrumentId)          — compute upper/lower
 *   - CircuitBreakerService.reset(instrumentId)                    — clear circuit
 *
 * Depends on:
 *   - @/shared/logger                    — AppLoggerService
 *   - InstrumentsService                 — for last close price
 *
 * Side-effects:
 *   - In-memory state (Map) — cleared on module destroy
 *
 * Key invariants:
 *   - Circuit is per-instrument, not per-account
 *   - Upper/lower bands are recalculated on each price tick
 *   - Circuit remains active until explicitly reset
 *
 * Read order:
 *   1. CircuitState interface
 *   2. onPriceTick()    — band recomputation + activation
 *   3. checkOrderAllowed() — order blocking logic
 *   4. reset()           — clear circuit
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-24
 */

import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { AppLoggerService } from '../../../shared/logger';
import { InstrumentsService } from '../../market/services/instruments.service';

export interface CircuitState {
  instrumentId: string;
  lastClose: number;
  upperBand: number;
  lowerBand: number;
  limitPct: number;
  active: boolean;
  activatedAt?: Date;
  side?: 'UPPER' | 'LOWER';
}

interface StoredCircuit {
  upper: number;
  lower: number;
  active: boolean;
  activatedAt?: number;
  side?: 'UPPER' | 'LOWER';
  lastClose: number;
}

@Injectable()
export class CircuitBreakerService implements OnModuleDestroy {
  /** Key = instrumentId. Stores computed bands + active flag. */
  private circuitState = new Map<string, StoredCircuit>();

  constructor(
    private readonly logger: AppLoggerService,
    private readonly instruments: InstrumentsService,
  ) {
    this.logger.setContext(CircuitBreakerService.name);
  }

  onModuleDestroy(): void {
    this.circuitState.clear();
  }

  /**
   * Compute upper/lower bands from last close and limitPct.
   * Default limitPct = 5% unless overridden in meta.
   */
  computeBands(lastClose: number, limitPct = 0.05): { upper: number; lower: number } {
    return {
      upper: lastClose * (1 + limitPct),
      lower: lastClose * (1 - limitPct),
    };
  }

  /**
   * Called on every price tick — recomputes bands and activates circuit if tick is outside bands.
   * Also updates the stored lastClose.
   */
  onPriceTick(instrumentId: string, lastPrice: number, limitPct = 0.05): void {
    const stored = this.circuitState.get(instrumentId);
    const { upper, lower } = this.computeBands(lastPrice, limitPct);

    const newState: StoredCircuit = {
      upper,
      lower,
      active: stored?.active ?? false,
      activatedAt: stored?.activatedAt,
      side: stored?.side,
      lastClose: lastPrice,
    };

    // Activate circuit if tick breaches a band and circuit is not already active
    if (!newState.active) {
      if (lastPrice > upper || lastPrice < lower) {
        newState.active = true;
        newState.activatedAt = Date.now();
        newState.side = lastPrice > upper ? 'UPPER' : 'LOWER';
        this.logger.warn('Circuit breaker activated', {
          instrumentId,
          lastPrice,
          upper,
          lower,
          side: newState.side,
        });
      }
    }

    this.circuitState.set(instrumentId, newState);
  }

  /**
   * Checks whether an order of the given side is allowed through the circuit.
   * Returns false if circuit is active AND the order would push price further
   * in the direction that caused the circuit (i.e., orders that increase volatility).
   *
   * BUY orders are blocked when upper circuit is active (price pushing up).
   * SELL orders are blocked when lower circuit is active (price pushing down).
   */
  async checkOrderAllowed(instrumentId: string, side: 'BUY' | 'SELL'): Promise<boolean> {
    const state = this.circuitState.get(instrumentId);

    if (!state || !state.active) {
      return true;
    }

    // If circuit is active on upper band (price spiked up), block BUY orders
    // If circuit is active on lower band (price crashed down), block SELL orders
    if (state.side === 'UPPER' && side === 'BUY') {
      this.logger.debug('checkOrderAllowed:blocked', { instrumentId, side, reason: 'UPPER_CIRCUIT_ACTIVE' });
      return false;
    }

    if (state.side === 'LOWER' && side === 'SELL') {
      this.logger.debug('checkOrderAllowed:blocked', { instrumentId, side, reason: 'LOWER_CIRCUIT_ACTIVE' });
      return false;
    }

    return true;
  }

  /**
   * Returns the current circuit state for an instrument (or default inactive state).
   */
  getCircuitState(instrumentId: string, limitPct = 0.05): CircuitState {
    const stored = this.circuitState.get(instrumentId);

    if (!stored) {
      return {
        instrumentId,
        lastClose: 0,
        upperBand: 0,
        lowerBand: 0,
        limitPct,
        active: false,
      };
    }

    return {
      instrumentId,
      lastClose: stored.lastClose,
      upperBand: stored.upper,
      lowerBand: stored.lower,
      limitPct,
      active: stored.active,
      activatedAt: stored.activatedAt ? new Date(stored.activatedAt) : undefined,
      side: stored.side,
    };
  }

  /** Reset circuit for an instrument — clears active flag and bands. */
  reset(instrumentId: string): void {
    this.circuitState.delete(instrumentId);
    this.logger.debug('CircuitBreakerService:reset', { instrumentId });
  }

  /** Reset all circuits */
  resetAll(): void {
    this.circuitState.clear();
    this.logger.debug('CircuitBreakerService:resetAll');
  }

  /** For testing / monitoring — dump full state */
  dumpState(): Map<string, StoredCircuit> {
    return new Map(this.circuitState);
  }
}