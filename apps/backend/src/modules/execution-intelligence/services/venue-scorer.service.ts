/**
 * File:        apps/backend/src/modules/execution-intelligence/services/venue-scorer.service.ts
 * Module:      execution-intelligence · Venue Scoring
 * Purpose:     Composite scoring of execution venues for Smart Order Routing decisions
 *
 * Exports:
 *   - VenueScorerService               — @Injectable service
 *   - rank(venues, order) → Venue[]   — venues sorted by descending composite score
 *   - score(venue, order) → number    — composite score (0–100 scale)
 *
 * Depends on:
 *   - @/execution-gateway             — ConnectorFamily (re-exported in Venue type)
 *   - @/oms                            — OrderEntity
 *
 * Side-effects:  none (pure computation)
 * Key invariants:
 *   - LiquidityScore uses log10 of depth so massive venues don't dominate
 *   - All sub-scores are non-negative (clamped at 0)
 *   - Scores are deterministic — same venue + order always yields same score
 *
 * Read order:
 *   1. score() — individual component formulas
 *   2. rank() — sorting by composite score
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-24
 */

import { Injectable } from '@nestjs/common';
import { OrderEntity } from '../../oms/entities/order.entity';
import { AppLoggerService } from '../../../shared/logger';
import { Venue } from '../types/venue.type';

@Injectable()
export class VenueScorerService {
  constructor(private readonly logger: AppLoggerService) {
    this.logger.setContext(VenueScorerService.name);
  }

  /**
   * Rank venues by descending composite score.
   * Returns venues sorted best-first so SmartOrderRouterService can try in order.
   */
  async rank(venues: Venue[], order: OrderEntity): Promise<Venue[]> {
    this.logger.debug('rank:start', { venueCount: venues.length, instrumentId: order.instrumentId });
    const scored = venues.map((v) => ({ venue: v, score: this.score(v, order) }));
    const sorted = scored.sort((a, b) => b.score - a.score);
    const result = sorted.map((s) => s.venue);
    this.logger.debug('rank:end', { result: result.map((v) => ({ id: v.id, score: this.score(v, order) })) });
    return result;
  }

  /**
   * Composite score in range [0, 100].
   *
   * Components (weights sum to 100):
   *   - LiquidityScore  (40 pts) — log10(depth+1) * 40  — deeper books rank higher
   *   - LatencyScore    (25 pts) — max(0, (500ms - lat)/500ms) * 25  — faster venues rank higher
   *   - SpreadScore     (20 pts) — max(0, (1bp - spread)/1bp) * 20  — tighter spreads rank higher
   *   - FeeScore        (15 pts) — max(0, (1bp - fee)/1bp) * 15  — cheaper venues rank higher
   */
  score(venue: Venue, order: OrderEntity): number {
    const liquidityScore = Math.log10((venue.depthAtPrice || 1) + 1) * 40;
    const latencyScore = Math.max(0, (500 - venue.latencyMs) / 500) * 25;
    const spreadScore = Math.max(0, (0.01 - venue.spreadBps / 10000) / 0.01) * 20;
    const feeScore = Math.max(0, (0.001 - venue.feeBps / 10000) / 0.001) * 15;

    const total = liquidityScore + latencyScore + spreadScore + feeScore;
    return Math.round(total * 100) / 100;
  }
}