/**
 * File:        apps/backend/src/modules/execution-intelligence/services/smart-order-router.service.ts
 * Module:      execution-intelligence · Smart Order Router
 * Purpose:     Routes orders to the best available venue using composite venue scoring and fallback logic
 *
 * Exports:
 *   - SmartOrderRouterService           — @Injectable service
 *   - route(order) → Promise<SORResponse> — routes a single order to the optimal venue
 *   - registerVenues(venues) → void     — registers available venues at bootstrap
 *
 * Depends on:
 *   - @/execution-gateway              — ExecutionGatewayService, GatewayOrderRequest
 *   - @/oms                            — OrderEntity
 *   - @/execution-intelligence         — VenueScorerService, SlippageTrackerService, SORResponse, Venue
 *   - decimal                         — Decimal.js for slippage arithmetic
 *
 * Side-effects:
 *   - Calls ExecutionGatewayService.routePlaceOrder() — external connector call
 *   - Records slippage in SlippageTrackerService after each successful fill
 *
 * Key invariants:
 *   - Venues are tried in descending score order; first successful fill wins
 *   - Fallback to last venue if all venues fail (preserves at-least-attempted semantics)
 *   - slippageBps = |filledPrice - requestedPrice| / requestedPrice * 10000
 *
 * Read order:
 *   1. route() — public entry point
 *   2. tryVenue() — individual venue attempt
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-24
 */

import { Injectable } from '@nestjs/common';
import { OrderEntity } from '../../oms/entities/order.entity';
import { ExecutionGatewayService } from '../../execution-gateway/services/execution-gateway.service';
import { AppLoggerService } from '../../../shared/logger';
import { SlippageTrackerService } from './slippage-tracker.service';
import { VenueScorerService } from './venue-scorer.service';
import { SORResponse, Venue } from '../types/venue.type';
import { GatewayOrderRequest } from '../../execution-gateway/connectors/contracts/execution-gateway.contract';

@Injectable()
export class SmartOrderRouterService {
  private venues: Venue[] = [];

  constructor(
    private readonly gateway: ExecutionGatewayService,
    private readonly scorer: VenueScorerService,
    private readonly slippageTracker: SlippageTrackerService,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(SmartOrderRouterService.name);
  }

  /**
   * Registers the available venues for routing.
   * Should be called once at module bootstrap or via a config provider.
   */
  registerVenues(venues: Venue[]): void {
    this.venues = venues;
    this.logger.debug('registerVenues', { count: venues.length });
  }

  /**
   * Routes a single order to the best venue by composite score.
   * Tries venues in descending score order; records slippage on success.
   * Falls back to the last venue if all primary attempts fail.
   */
  async route(order: OrderEntity): Promise<SORResponse> {
    this.logger.debug('route:start', { orderId: order.clientOrderId, instrumentId: order.instrumentId });

    const ranked = await this.scorer.rank(this.venues, order);
    if (ranked.length === 0) {
      throw new Error('No venues registered for routing');
    }

    let lastResult: SORResponse | null = null;

    for (let i = 0; i < ranked.length; i++) {
      const venue = ranked[i];
      try {
        const result = await this.tryVenue(venue, order, ranked);
        this.logger.debug('route:success', { venueId: venue.id, slippageBps: result.slippageBps });
        return result;
      } catch (err) {
        lastResult = {
          venueId: venue.id,
          result: {
            providerOrderId: '',
            status: 'REJECTED',
          },
          slippageBps: '0',
        };
        this.logger.debug('route:venueFailed', { venueId: venue.id, error: String(err) });
        // continue to next venue
      }
    }

    // Fallback: return last venue result (even if failed — caller handles)
    this.logger.debug('route:allVenuesFailed', { fallbackVenueId: lastResult?.venueId });
    return lastResult!;
  }

  /**
   * Attempts to fill an order at a single venue.
   * Computes slippage vs the order's requested price on success.
   */
  private async tryVenue(venue: Venue, order: OrderEntity, rankedVenues: Venue[]): Promise<SORResponse> {
    const connectorFamily = venue.connectorFamily;
    const requestedPrice = order.price ?? '0';

    const request: GatewayOrderRequest = {
      tenantId: order.tenantId,
      connectorFamily,
      clientOrderId: order.clientOrderId,
      accountId: order.accountId,
      instrumentId: order.instrumentId,
      side: order.side,
      type: order.type as 'MARKET' | 'LIMIT',
      quantity: order.quantity,
      price: order.price,
      timeInForce: order.timeInForce,
    };

    const start = Date.now();
    const gatewayResult = await this.gateway.routePlaceOrder(request);
    const latencyMs = Date.now() - start;

    if (gatewayResult.status === 'FILLED' || gatewayResult.status === 'ACCEPTED') {
      const filledPrice = gatewayResult.averageFilledPrice ?? requestedPrice;
      const slippageBps = this.computeSlippage(requestedPrice, filledPrice);

      this.slippageTracker.record({
        orderId: order.id,
        venueId: venue.id,
        requestedPrice: String(requestedPrice),
        filledPrice: String(filledPrice),
        qty: order.quantity,
      });

      return { venueId: venue.id, result: gatewayResult, slippageBps };
    }

    throw new Error(`Venue ${venue.id} rejected order with status ${gatewayResult.status}`);
  }

  /**
   * Computes slippage in basis points: |filled - requested| / requested * 10000.
   */
  private computeSlippage(requestedPrice: string, filledPrice: string): string {
    const Decimal = require('decimal.js');
    const requested = new Decimal(requestedPrice === 'MARKET' ? '0' : requestedPrice);
    const filled = new Decimal(filledPrice === 'MARKET' ? '0' : filledPrice);

    if (requested.isZero()) return '0';
    return filled.minus(requested).abs().div(requested).times(10000).toFixed(4);
  }
}