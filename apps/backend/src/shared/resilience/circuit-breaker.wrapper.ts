/**
 * @file src/shared/resilience/circuit-breaker.wrapper.ts
 * @module shared/resilience
 * @description Circuit breaker wrapper for fault isolation
 * @author BharatERP
 * @created 2026-02-19
 *
 * Exports:
 *   - CircuitState           — 'CLOSED' | 'OPEN' | 'HALF_OPEN' type alias
 *   - CircuitBreakerOptions   — interface for configuring the breaker
 *   - CircuitBreaker          — class: new CircuitBreaker(key, options).execute(fn)
 *
 * Depends on:
 *   - AppError               — from @/common/errors/app-error (thrown on OPEN state)
 *
 * Side-effects:
 *   - In-memory state (not persistent — circuit resets on app restart)
 *
 * Key invariants:
 *   - execute() re-throws original error after recording failure
 *   - Circuit state is per-key (one breaker per external dependency)
 */

import { AppError } from '../../common/errors/app-error';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  /** Failure threshold before opening (default 5) */
  failureThreshold?: number;
  /** Time in ms before attempting half-open (default 30000) */
  resetTimeoutMs?: number;
  /** Success count in half-open to close (default 1) */
  successThreshold?: number;
}

/**
 * In-memory circuit breaker for a single key/operation.
 */
export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures = 0;
  private successes = 0;
  private lastOpenAt?: number;

  constructor(
    private readonly key: string,
    private readonly options: CircuitBreakerOptions = {},
  ) {}

  getState(): CircuitState {
    this.maybeTransition();
    return this.state;
  }

  private maybeTransition(): void {
    const { failureThreshold = 5, resetTimeoutMs = 30000, successThreshold = 1 } =
      this.options;

    if (this.state === 'OPEN' && this.lastOpenAt) {
      if (Date.now() - this.lastOpenAt >= resetTimeoutMs) {
        this.state = 'HALF_OPEN';
        this.successes = 0;
      }
    } else if (this.state === 'HALF_OPEN' && this.successes >= successThreshold) {
      this.state = 'CLOSED';
      this.failures = 0;
    }
  }

  recordSuccess(): void {
    this.maybeTransition();
    if (this.state === 'HALF_OPEN') {
      this.successes++;
    } else if (this.state === 'CLOSED') {
      this.failures = 0;
    }
  }

  recordFailure(): void {
    this.maybeTransition();
    const threshold = this.options.failureThreshold ?? 5;
    if (this.state === 'CLOSED') {
      this.failures++;
      if (this.failures >= threshold) {
        this.state = 'OPEN';
        this.lastOpenAt = Date.now();
      }
    } else if (this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      this.lastOpenAt = Date.now();
    }
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.maybeTransition();
    if (this.state === 'OPEN') {
      throw new AppError('RESOURCE_UNAVAILABLE', `Circuit breaker OPEN for ${this.key}`);
    }
    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (err) {
      this.recordFailure();
      throw err;
    }
  }
}
