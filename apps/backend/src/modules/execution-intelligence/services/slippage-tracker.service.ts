/**
 * File:        apps/backend/src/modules/execution-intelligence/services/slippage-tracker.service.ts
 * Module:      execution-intelligence · Slippage Tracking
 * Purpose:     Records fill data and aggregates venue performance scores over time
 *
 * Exports:
 *   - SlippageTrackerService           — @Injectable service
 *   - record(input) → void             — records a single fill and computes slippage
 *   - getVenueScore(venueId, instrumentId, fromDate) → VenueScore
 *
 * Depends on:
 *   - decimal                         — Decimal.js for precise slippage arithmetic
 *   - VenueScore                      — return type
 *
 * Side-effects:
 *   - In-memory Map storage (keyed by venueId:instrumentId); swap for Redis later
 *   - No external HTTP / DB calls in this initial version
 *
 * Key invariants:
 *   - slippageBps = abs(filledPrice - requestedPrice) / requestedPrice * 10000
 *   - fillRate = fills / total attempts for the window
 *   - Median latency computed via sorted array mid-point
 *
 * Read order:
 *   1. record() — per-fill slippage computation
 *   2. getVenueScore() — aggregation over a time window
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-24
 */

import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '../../../shared/logger';
import { VenueScore } from '../types/venue.type';

/** Internal record stored per fill */
interface FillRecord {
  orderId: string;
  venueId: string;
  instrumentId: string;
  requestedPrice: string;
  filledPrice: string;
  slippageBps: string;
  latencyMs: number;
  filledAt: Date;
}

@Injectable()
export class SlippageTrackerService {
  private readonly records: FillRecord[] = [];

  constructor(private readonly logger: AppLoggerService) {
    this.logger.setContext(SlippageTrackerService.name);
  }

  /**
   * Records a single fill and stores it in memory.
   * Slippage is computed as: |filled - requested| / requested * 10000 bps.
   * Uses Decimal.js for precision.
   */
  record(input: {
    orderId: string;
    venueId: string;
    requestedPrice: string;
    filledPrice: string;
    qty: string;
  }): void {
    const Decimal = require('decimal.js');
    const filled = new Decimal(input.filledPrice);
    const requested = new Decimal(input.requestedPrice);

    const slippageBps =
      requested.isZero()
        ? '0'
        : filled.minus(requested).abs().div(requested).times.toFixed(4);

    this.records.push({
      orderId: input.orderId,
      venueId: input.venueId,
      instrumentId: 'unknown', // TODO: resolve from order lookup
      requestedPrice: input.requestedPrice,
      filledPrice: input.filledPrice,
      slippageBps,
      latencyMs: 0,
      filledAt: new Date(),
    });

    this.logger.debug('record:slippage', { orderId: input.orderId, venueId: input.venueId, slippageBps });
  }

  /**
   * Aggregates fill records for a venue + instrument within the given time window.
   * Returns VenueScore with avgSlippageBps, fillRate, and medianLatencyMs.
   */
  async getVenueScore(
    venueId: string,
    instrumentId: string,
    fromDate: Date,
  ): Promise<VenueScore> {
    const window = this.records.filter(
      (r) =>
        r.venueId === venueId &&
        (instrumentId === 'unknown' || r.instrumentId === instrumentId) &&
        r.filledAt >= fromDate,
    );

    if (window.length === 0) {
      return { avgSlippageBps: '0', fillRate: '1.00', medianLatencyMs: 0 };
    }

    const Decimal = require('decimal.js');
    const slippageValues = window.map((r) => new Decimal(r.slippageBps));
    const avgSlippageBps = slippageValues
      .reduce((sum, v) => sum.plus(v), new Decimal(0))
      .div(slippageValues.length)
      .toFixed(4);

    const sortedLatencies = [...window].sort((a, b) => a.latencyMs - b.latencyMs);
    const mid = Math.floor(sortedLatencies.length / 2);
    const medianLatencyMs =
      sortedLatencies.length % 2 === 0
        ? Math.round((sortedLatencies[mid - 1].latencyMs + sortedLatencies[mid].latencyMs) / 2)
        : sortedLatencies[mid].latencyMs;

    // fillRate is derived from fill records vs all attempts — simplified to 1.00 here
    const fillRate = '1.00';

    this.logger.debug('getVenueScore:result', { venueId, instrumentId, avgSlippageBps, fillRate, medianLatencyMs });
    return { avgSlippageBps, fillRate, medianLatencyMs };
  }
}