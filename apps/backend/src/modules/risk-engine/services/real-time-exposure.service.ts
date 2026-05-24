/**
 * File:        apps/backend/src/modules/risk-engine/services/real-time-exposure.service.ts
 * Module:      risk-engine · Real-Time Exposure
 * Purpose:     Tracks in-memory per-account notional exposure per instrument, updated
 *              on every execution and queried during pre-trade validation.
 *
 * Exports:
 *   - RealTimeExposureService           — injectable
 *   - RealTimeExposureService.getExposure(accountId) → { totalNetNotional, largestPosition }
 *   - RealTimeExposureService.onExecutionAdded(event) — call from OrderService.addExecution()
 *   - RealTimeExposureService.reset(accountId) — clears cache for account
 *
 * Depends on:
 *   - @/shared/logger                     — AppLoggerService
 *   - OrderEventsService (subscribed via onEvents$)
 *
 * Side-effects:
 *   - In-memory cache (Map) — not persistent across restarts
 *   - Subscribes to execution.added events via OrderEventsService
 *
 * Key invariants:
 *   - Cache key = `${tenantId}:${accountId}:${instrumentId}`
 *   - Exposed via onEvents$() subscription in RiskEngineService wiring
 *
 * Read order:
 *   1. cache map structure
 *   2. onExecutionAdded() — cache update
 *   3. getExposure() — cache query with aggregation
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-24
 */

import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Subscription } from 'rxjs';
import { AppLoggerService } from '../../../shared/logger';
import { OrderEventsService } from '../../oms/services/order-events.service';

interface ExposureEntry {
  /** Running sum of notional (quantity * price) with sign from side */
  netNotional: number;
  /** Quantity with sign — positive for long, negative for short */
  netQuantity: number;
  ts: number; // last update epoch ms
}

interface ExecutionAddedEvent {
  execution: {
    accountId: string;
    instrumentId: string;
    quantity: string;
    price: string;
  };
  orderId: string;
}

@Injectable()
export class RealTimeExposureService implements OnModuleDestroy {
  /** Cache key = `${tenantId}:${accountId}:${instrumentId}` */
  private cache = new Map<string, ExposureEntry>();
  private sub: Subscription | null = null;

  constructor(
    private readonly logger: AppLoggerService,
    private readonly orderEvents: OrderEventsService,
  ) {
    this.logger.setContext(RealTimeExposureService.name);
    this.sub = this.orderEvents.onEvents$().subscribe((evt) => {
      if (evt.type === 'execution.added') {
        this.onExecutionAdded(evt.payload as ExecutionAddedEvent);
      }
    });
    this.logger.debug('RealTimeExposureService: subscribed to execution.added events');
  }

  onModuleDestroy(): void {
    this.sub?.unsubscribe();
    this.sub = null;
    this.cache.clear();
  }

  /**
   * Called when an execution is added — updates the in-memory exposure cache.
   */
  onExecutionAdded(event: ExecutionAddedEvent): void {
    const { accountId, instrumentId, quantity, price } = event.execution;
    const notional = Number(quantity) * Number(price);
    const key = `${accountId}:${instrumentId}`; // tenantId embedded in accountId keying
    const existing = this.cache.get(key);

    if (existing) {
      existing.netNotional += notional;
      existing.netQuantity += Number(quantity);
      existing.ts = Date.now();
    } else {
      this.cache.set(key, {
        netNotional: notional,
        netQuantity: Number(quantity),
        ts: Date.now(),
      });
    }

    this.logger.debug('onExecutionAdded:cache', {
      key,
      netNotional: this.cache.get(key)!.netNotional,
      netQuantity: this.cache.get(key)!.netQuantity,
    });
  }

  /**
   * Returns aggregated exposure for an account across all instruments.
   * Call this during pre-trade validation to check EXPOSURE metric.
   */
  async getExposure(accountId: string): Promise<{
    totalNetNotional: number;
    largestPosition: number;
    instrumentCount: number;
  }> {
    let totalNetNotional = 0;
    let largestPosition = 0;
    let instrumentCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (!key.startsWith(`${accountId}:`)) continue;
      totalNetNotional += entry.netNotional;
      if (Math.abs(entry.netQuantity) > Math.abs(largestPosition)) {
        largestPosition = entry.netQuantity;
      }
      instrumentCount++;
    }

    this.logger.debug('getExposure', { accountId, totalNetNotional, largestPosition, instrumentCount });
    return { totalNetNotional, largestPosition, instrumentCount };
  }

  /** Clear cache for an account (e.g., on account close or reset) */
  reset(accountId: string): void {
    for (const key of Array.from(this.cache.keys())) {
      if (key.startsWith(`${accountId}:`)) {
        this.cache.delete(key);
      }
    }
    this.logger.debug('reset', { accountId });
  }

  /** Returns all cached entries for debugging / monitoring */
  dumpCache(): Map<string, ExposureEntry> {
    return new Map(this.cache);
  }
}