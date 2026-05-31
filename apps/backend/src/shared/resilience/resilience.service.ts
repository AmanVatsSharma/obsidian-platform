/**
 * File:        apps/backend/src/shared/resilience/resilience.service.ts
 * Module:      shared/resilience
 * Purpose:     Unified resilience service wrapping retry + circuit-breaker patterns.
 *              Provides injectable retry() and executeWithBreaker() for all external calls.
 *
 * Exports:
 *   - ResilienceService              — injectable
 *   - ResilienceService.retry<T>(fn, opts?) → Promise<T>
 *   - ResilienceService.executeWithBreaker<T>(key, fn, opts?) → Promise<T>
 *
 * Depends on:
 *   - AppLoggerService              — structured logging
 *   - withRetry() — from retry.wrapper
 *   - CircuitBreaker                — from circuit-breaker.wrapper
 *
 * Side-effects:
 *   - In-memory circuit breaker state (Map per key)
 *
 * Key invariants:
 *   - Each circuit breaker is keyed by a unique string (e.g. "exchange:BINANCE", "broker:IBKR")
 *   - Circuit breaker state is per-process (in-memory); cleared on app restart
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-31
 */

import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '../logger';
import { withRetry, RetryOptions } from './retry.wrapper';
import { CircuitBreaker, CircuitBreakerOptions } from './circuit-breaker.wrapper';

@Injectable()
export class ResilienceService {
  private readonly breakers = new Map<string, CircuitBreaker>();

  constructor(private readonly logger: AppLoggerService) {
    this.logger.setContext('ResilienceService');
  }

  /**
   * Execute an async function with retry logic.
   */
  async retry<T>(fn: () => Promise<T>, opts?: RetryOptions): Promise<T> {
    return withRetry(fn, opts);
  }

  /**
   * Execute an async function through a named circuit breaker.
   * Creates the breaker on first call for a given key; reuses it on subsequent calls.
   */
  async executeWithBreaker<T>(
    key: string,
    fn: () => Promise<T>,
    opts?: CircuitBreakerOptions,
  ): Promise<T> {
    const start = Date.now();
    this.logger.debug({ breakerKey: key }, 'Circuit breaker executing');

    let breaker = this.breakers.get(key);
    if (!breaker) {
      breaker = new CircuitBreaker(key, opts);
      this.breakers.set(key, breaker);
    }

    try {
      const result = await breaker.execute(fn);
      this.logger.debug(
        { breakerKey: key, breakerState: breaker.getState(), durationMs: Date.now() - start },
        'Circuit breaker success',
      );
      return result;
    } catch (err) {
      this.logger.warn(
        { breakerKey: key, breakerState: breaker.getState(), durationMs: Date.now() - start, error: err },
        'Circuit breaker failure',
      );
      throw err;
    }
  }
}
