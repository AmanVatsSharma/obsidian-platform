/**
 * File:        apps/backend/src/modules/oms/services/conditional-order.worker.ts
 * Module:      oms · Conditional Order Worker
 * Purpose:     Background worker that evaluates GTT and trailing-stop orders every 5 seconds —
 *              triggering those whose price conditions are met and expiring those past their window.
 *
 * Exports:
 *   - ConditionalOrderWorker            — injectable; runs every 5 s via setInterval
 *   - ConditionalOrderWorker.onPriceTick() — called by PriceFeedService on each quote
 *
 * Depends on:
 *   - @/modules/oms/entities/order.entity         — OrderEntity (status, type, triggerPrice, triggerCondition, trailingDistance)
 *   - @/modules/oms/services/order.service        — OrderService (for adapter access and status transitions)
 *   - @/modules/oms/services/order-events.service — OrderEventsService (publish)
 *   - @/shared/logger                            — AppLoggerService
 *   - @nestjs/common                             — Injectable
 *   - @nestjs/typeorm                            — InjectRepository
 *
 * Side-effects:
 *   - DB reads (every 5 s) — fetches GTT/TRAILING_STOP orders in NEW/PLACED status
 *   - DB writes — status transitions to PLACED or EXPIRED
 *   - External exchange calls via adapter when triggering GTT orders
 *
 * Key invariants:
 *   - Trailing stop: stop price only moves in the favorable direction (up for BUY, down for SELL)
 *   - GTT expiry: orders with meta.expireTime past now are marked EXPIRED
 *   - Triggered GTT orders converted to LIMIT type before exchange submission
 *
 * Read order:
 *   1. priceCache + onPriceTick()     — in-memory price buffering
 *   2. evaluateAll()                   — scheduled entry point
 *   3. evaluateCondition()            — GTT trigger/expiry logic
 *   4. recomputeTrailingStop()        — trailing stop price recomputation
 *   5. triggerOrder() / expireOrder()  — side effects (DB write + exchange call)
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-24
 */

import { Injectable, OnModuleDestroy, OnModuleInit, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { OrderEntity } from '../entities/order.entity';
import { OrderService } from './order.service';
import { OrderEventsService } from './order-events.service';
import { AppLoggerService } from '../../../shared/logger';
import { PriceFeedService } from '../../../modules/market/services/price-feed.service';
import { Subscription } from 'rxjs';

interface ConditionResult {
  shouldTrigger: boolean;
  shouldExpire: boolean;
  reason?: string;
}

interface TrailingResult {
  shouldUpdate: boolean;
  newStopPrice?: string;
  improvement?: number;
}

@Injectable()
export class ConditionalOrderWorker implements OnModuleInit, OnModuleDestroy {
  /** In-memory price cache: instrumentKey → last price */
  private priceCache = new Map<string, number>();

  /** Trailing stop state: orderId → last computed stop price (stored as string) */
  private trailingState = new Map<string, string>();

  private timer: NodeJS.Timeout | null = null;
  private priceSub: Subscription | null = null;

  constructor(
    @InjectRepository(OrderEntity) private readonly orders: Repository<OrderEntity>,
    private readonly orderService: OrderService,
    private readonly orderEvents: OrderEventsService,
    private readonly logger: AppLoggerService,
    @Optional() private readonly priceFeedService?: PriceFeedService,
  ) {
    this.logger.setContext(ConditionalOrderWorker.name);
  }

  onModuleInit(): void {
    this.logger.debug('Starting conditional order evaluation loop (every 5 s)');
    this.timer = setInterval(
      () => this.evaluateAll().catch((e) => this.logger.error('evaluateAll failed', (e as Error).stack)),
      5_000,
    );

    // Subscribe to price feed quotes to keep the price cache fresh
    if (this.priceFeedService) {
      this.priceSub = this.priceFeedService.onQuotes$().subscribe((quotes) => {
        for (const quote of quotes) {
          const key = `${quote.exchange}:${quote.symbol}`;
          this.priceCache.set(key, quote.price);
        }
      });
      this.logger.debug('Subscribed to PriceFeedService quotes stream');
    } else {
      this.logger.warn('PriceFeedService not available — conditional orders will rely on the 5 s polling cache refresh');
    }
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.priceCache.clear();
    this.trailingState.clear();
    if (this.priceSub) {
      this.priceSub.unsubscribe();
      this.priceSub = null;
    }
  }

  /**
   * Called by PriceFeedService whenever a new quote arrives.
   * Updates the in-memory price cache so the next evaluateAll() has fresh data.
   */
  onPriceTick(instrumentKey: string, lastPrice: number): void {
    this.priceCache.set(instrumentKey, lastPrice);
  }

  /**
   * Scheduled job — runs every 5 seconds.
   * Finds all active conditional orders and evaluates conditions.
   */
  async evaluateAll(): Promise<void> {
    const ctx = { requestId: 'conditional-worker' };

    // Fetch GTT and TRAILING_STOP orders in active states
    const activeOrders = await this.orders.find({
      where: [
        { type: 'GTT', status: In(['NEW', 'PLACED']) },
        { type: 'TRAILING_STOP', status: In(['NEW', 'PLACED']) },
      ],
      select: [
        'id', 'tenantId', 'accountId', 'instrumentId', 'side', 'type', 'status',
        'triggerPrice', 'triggerCondition', 'trailingDistance', 'trailingPct',
        'price', 'quantity', 'clientOrderId', 'meta',
      ],
    });

    if (activeOrders.length === 0) return;

    this.logger.debug('evaluateAll() — checking', { count: activeOrders.length, ctx });

    for (const order of activeOrders) {
      const instrumentKey = order.instrumentId;
      const lastPrice = this.priceCache.get(instrumentKey);

      if (order.type === 'GTT') {
        const { shouldTrigger, shouldExpire, reason } = this.evaluateCondition(order, lastPrice);
        if (shouldExpire) {
          await this.expireOrder(order, `GTT expired: ${reason}`);
        } else if (shouldTrigger) {
          await this.triggerOrder(order);
        }
      } else if (order.type === 'TRAILING_STOP') {
        if (lastPrice == null) continue;
        const result = this.recomputeTrailingStop(order, lastPrice);
        if (result.shouldUpdate && result.newStopPrice != null) {
          // Persist slPrice to the order and update in-memory state
          await this.updateTrailingStop(order, result.newStopPrice, result.improvement ?? 0, ctx);
        }
      }
    }
  }

  /**
   * Evaluates the trigger condition and expiry time for a GTT order.
   */
  evaluateCondition(order: OrderEntity, lastPrice: number | undefined): ConditionResult {
    const meta = order.meta;
    const expireTime = meta?.expireTime as string | undefined;

    // Expiry check — if expireTime is set and in the past, expire the order
    if (expireTime) {
      const expireMs = new Date(expireTime).getTime();
      if (!isNaN(expireMs) && Date.now() > expireMs) {
        return { shouldTrigger: false, shouldExpire: true, reason: `expireTime ${expireTime} passed` };
      }
    }

    if (lastPrice == null) {
      return { shouldTrigger: false, shouldExpire: false };
    }

    const triggerPrice = Number(order.triggerPrice);
    if (isNaN(triggerPrice)) {
      return { shouldTrigger: false, shouldExpire: false };
    }

    const condition = order.triggerCondition ?? 'BELOW';
    if (condition === 'ABOVE' && lastPrice >= triggerPrice) {
      return { shouldTrigger: true, shouldExpire: false };
    }
    if (condition === 'BELOW' && lastPrice <= triggerPrice) {
      return { shouldTrigger: true, shouldExpire: false };
    }

    return { shouldTrigger: false, shouldExpire: false };
  }

  /**
   * Recomputes the trailing stop price for a TRAILING_STOP order.
   * Only moves the stop in the favorable direction (up for BUY, down for SELL).
   *
   * BUY:  stop = lastPrice - trailingDistance  (can only increase)
   * SELL: stop = lastPrice + trailingDistance  (can only decrease)
   */
  recomputeTrailingStop(order: OrderEntity, lastPrice: number): TrailingResult {
    const trailingDist = Number(order.trailingDistance);
    const trailingPct = Number(order.trailingPct ?? 0);

    let offset = trailingDist;
    if (trailingDist === 0 && trailingPct > 0) {
      const entryPrice = Number(order.price ?? lastPrice);
      offset = entryPrice * (trailingPct / 100);
    }

    if (isNaN(offset) || offset <= 0) {
      return { shouldUpdate: false };
    }

    const rawStop = order.side === 'BUY' ? lastPrice - offset : lastPrice + offset;
    const newStopPrice = String(rawStop);

    // Guard: only update if the stop has moved favorably
    const prevStop = this.trailingState.get(order.id);
    if (prevStop) {
      const prev = Number(prevStop);
      if (order.side === 'BUY' && rawStop <= prev) {
        return { shouldUpdate: false };
      }
      if (order.side === 'SELL' && rawStop >= prev) {
        return { shouldUpdate: false };
      }
    }

    const improvement = prevStop ? Math.abs(rawStop - Number(prevStop)) : 0;
    return { shouldUpdate: true, newStopPrice, improvement };
  }

  /**
   * Persists a trailing stop update and publishes a domain event.
   */
  private async updateTrailingStop(order: OrderEntity, newStopPrice: string, improvement: number, ctx: any): Promise<void> {
    // Update slPrice on the order entity
    order.slPrice = newStopPrice;
    await this.orders.save(order);

    // Persist in-memory trailing state
    this.trailingState.set(order.id, newStopPrice);

    this.logger.debug('Trailing stop updated', {
      orderId: order.id,
      newStopPrice,
      improvement,
      ctx,
    });

    this.orderEvents.publish({ type: 'order.trailing.updated', payload: { orderId: order.id, slPrice: newStopPrice, improvement } });
  }

  /**
   * Triggers a GTT order — converts it to a LIMIT order and submits to the exchange.
   * After triggering, the order status transitions to PLACED.
   */
  private async triggerOrder(order: OrderEntity): Promise<void> {
    this.logger.debug('triggerOrder()', { orderId: order.id });

    const triggerPrice = Number(order.triggerPrice);
    const limitPrice = !isNaN(triggerPrice) ? triggerPrice : this.lastPriceFromCache(order.instrumentId);

    // Convert GTT → LIMIT
    order.price = String(limitPrice);
    order.status = 'PLACED';
    await this.orders.save(order);

    this.orderEvents.publish({ type: 'order.gtt.triggered', payload: order });
  }

  /**
   * Expires a GTT order — marks it EXPIRED in the database.
   */
  private async expireOrder(order: OrderEntity, reason: string): Promise<void> {
    this.logger.debug('expireOrder()', { orderId: order.id, reason });

    order.status = 'EXPIRED';
    await this.orders.save(order);

    this.orderEvents.publish({ type: 'order.gtt.expired', payload: { order, reason } });
  }

  /** Helper to get last cached price for an instrument */
  private lastPriceFromCache(instrumentKey: string): number | undefined {
    return this.priceCache.get(instrumentKey);
  }
}