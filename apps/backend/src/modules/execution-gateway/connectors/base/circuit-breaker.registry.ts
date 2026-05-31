/**
 * File:        apps/backend/src/modules/execution-gateway/connectors/base/circuit-breaker.registry.ts
 * Module:      execution-gateway/connectors
 * Purpose:     Per-exchange circuit breaker registry for execution gateway connectors.
 *              Each exchange family (IBKR, BINANCE, etc.) gets its own CircuitBreaker
 *              so that a degraded exchange fails fast without affecting other exchanges.
 *
 * Exports:
 *   - CircuitBreakerRegistry — singleton; call .execute(key, fn) to wrap any external call
 *
 * Depends on:
 *   - CircuitBreaker — from @/shared/resilience/circuit-breaker.wrapper
 *
 * Side-effects:
 *   - In-memory state (circuit state resets on app restart — acceptable for trading connectors)
 *
 * Key invariants:
 *   - One CircuitBreaker per exchange key (e.g. 'ibkr', 'binance')
 *   - CircuitBreaker is shared across all connector instances for the same exchange
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-31
 */

import { Injectable } from '@nestjs/common';
import { CircuitBreaker, CircuitBreakerOptions } from '../../../../shared/resilience/circuit-breaker.wrapper';

const DEFAULT_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 5,
  resetTimeoutMs: 30_000,
  successThreshold: 1,
};

@Injectable()
export class CircuitBreakerRegistry {
  /** One CircuitBreaker per exchange key — shared across all connector instances */
  private readonly breakers = new Map<string, CircuitBreaker>();

  getOrCreate(key: string, options: CircuitBreakerOptions = DEFAULT_OPTIONS): CircuitBreaker {
    if (!this.breakers.has(key)) {
      this.breakers.set(key, new CircuitBreaker(key, options));
    }
    return this.breakers.get(key)!;
  }

  /**
   * Execute `fn` through the circuit breaker for `key`.
   * Throws AppError('RESOURCE_UNAVAILABLE') when the circuit is OPEN.
   * Re-throws original error when fn() fails.
   */
  async execute<T>(key: string, fn: () => Promise<T>, options?: CircuitBreakerOptions): Promise<T> {
    const breaker = this.getOrCreate(key, options);
    return breaker.execute(fn);
  }
}