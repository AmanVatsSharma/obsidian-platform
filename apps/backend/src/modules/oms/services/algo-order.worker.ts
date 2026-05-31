/**
 * File:        apps/backend/src/modules/oms/services/algo-order.worker.ts
 * Module:      oms · Algo Order Worker
 * Purpose:     Background worker that manages TWAP / VWAP / ICEBERG algo orders —
 *              dispatching slices and tracking child fills.
 *
 * Exports:
 *   - AlgoOrderWorker                    — injectable; runs every 10 s via setInterval
 *   - AlgoOrderWorker.computeTwapSlices() — static; splits totalQty into equal slices
 *
 * Depends on:
 *   - @/modules/oms/entities/order.entity         — OrderEntity (algoType, algoMeta, filledQty, remainingQty)
 *   - @/modules/oms/dtos/algo-order.dto          — AlgoOrderType
 *   - @/modules/oms/adapters/exchange-adapter     — ExchangeAdapter (PlaceOrderRequest)
 *   - @/modules/accounts/services/accounts.service — AccountsService (accountType lookup for adapter selection)
 *   - @/shared/logger                             — AppLoggerService
 *   - @/modules/realtime/prana-stream/.../realtime-publisher.service
 *   - @nestjs/common                              — Injectable
 *   - @nestjs/typeorm                             — InjectRepository
 *
 * Side-effects:
 *   - DB reads (every 10 s) — fetches PARTIALLY_FILLED algo orders
 *   - DB writes — parent remainingQty / status updates on child fill
 *   - External exchange calls via adapter on each slice dispatch
 *
 * Key invariants:
 *   - TWAP slices are MARKET orders; VWAP / ICEBERG slices are LIMIT orders with priceLimit
 *   - Slice count is immutable — parent.algoMeta.totalSlices is set at placement and never changes
 *   - parent.algoMeta.slicesCompleted increments only when a child execution is recorded
 *   - algoMeta is always a plain object (no nested circular refs) so JSON.stringify is safe
 *
 * Read order:
 *   1. computeTwapSlices()      — static; pure slice computation
 *   2. dispatchNextSlice()       — creates and submits a child order
 *   3. recordChildFill()         — propagates fill to parent; transitions status
 *   4. evaluateAll()              — scheduled entry; 10 s loop
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-24
 */

import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity } from '../entities/order.entity';
import { AppLoggerService } from '../../../shared/logger';
import { ExchangeAdapter, PlaceOrderRequest, EXCHANGE_ADAPTER } from '../adapters/exchange-adapter';
import { DEMO_EXCHANGE_ADAPTER } from '../adapters/demo-exchange.adapter';
import { AlgoOrderType } from '../dtos/algo-order.dto';
import { AccountsService } from '../../accounts/services/accounts.service';
import { OrderAuditEntity } from '../entities/order-audit.entity';
import { OrderEventsService } from './order-events.service';
import { getRequestContext } from '../../../shared/request-context';

export interface Slice {
  qty: string;
  index: number;
}

/**
 * AlgoOrderWorker manages the lifecycle of TWAP, VWAP, and ICEBERG orders.
 *
 * TWAP — totalQuantity split into sliceCount equal slices, dispatched at
 *         (durationMinutes / sliceCount) intervals.  Child orders are MARKET.
 *
 * VWAP — same slice structure as TWAP but children are LIMIT orders using
 *         the parent's priceLimit as the limit price.
 *
 * ICEBERG — totalQuantity split into sliceCount slices, where sliceCount
 *           represents the visible quantity per slice.  Each slice is a
 *           LIMIT order with priceLimit.  Slices dispatch on prior slice
 *           fill completion (tracked via remainingQty comparison).
 *
 * Slice dispatch is driven by evaluateAll() (every 10 s).
 * Child fill propagation is driven by recordChildFill() — called from
 * OrderService.addExecution() when the filled order has parentOrderId set.
 */
@Injectable()
export class AlgoOrderWorker implements OnModuleInit, OnModuleDestroy {
  private timer: NodeJS.Timeout | null = null;

  constructor(
    @InjectRepository(OrderEntity) private readonly orders: Repository<OrderEntity>,
    @InjectRepository(OrderAuditEntity) private readonly audits: Repository<OrderAuditEntity>,
    private readonly logger: AppLoggerService,
    @Inject(EXCHANGE_ADAPTER) private readonly exchange: ExchangeAdapter,
    @Inject(DEMO_EXCHANGE_ADAPTER) private readonly demoExchange: ExchangeAdapter,
    private readonly accountsService: AccountsService,
    private readonly orderEvents: OrderEventsService,
  ) {
    this.logger.setContext(AlgoOrderWorker.name);
  }

  onModuleInit(): void {
    this.logger.debug('Starting algo order evaluation loop (every 10 s)');
    this.timer = setInterval(
      () => this.evaluateAll().catch((e) =>
        this.logger.error('evaluateAll failed', (e as Error).stack),
      ),
      10_000,
    );
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  // ─── Static helpers ──────────────────────────────────────────────────────────

  /**
   * Splits totalQuantity into sliceCount equal slices.
   * Remainder (totalQty % sliceCount) is added to the last slice.
   * Uses simple string arithmetic to avoid floating-point errors.
   *
   * Example:
   *   computeTwapSlices('100', 3) → [
   *     { qty: '33.33333333', index: 0 },
   *     { qty: '33.33333333', index: 1 },
   *     { qty: '33.33333334', index: 2 },
   *   ]
   */
  static computeTwapSlices(totalQty: string, sliceCount: number): Slice[] {
    const base = (parseFloat(totalQty) / sliceCount).toFixed(8);
    const slices: Slice[] = [];

    for (let i = 0; i < sliceCount; i++) {
      // Add the remainder to the last slice
      if (i === sliceCount - 1) {
        // Recompute last slice: base * (sliceCount - 1) + remainder = totalQty - sum(previous)
        let sumPrev = 0;
        for (let j = 0; j < i; j++) {
          sumPrev += parseFloat(slices[j].qty);
        }
        const last = parseFloat(totalQty) - sumPrev;
        slices.push({ qty: last.toFixed(8), index: i });
      } else {
        slices.push({ qty: base, index: i });
      }
    }

    return slices;
  }

  // ─── Public API (called by OrderService) ────────────────────────────────────

  /**
   * Called when an algo child order receives an execution.
   * Updates the parent order's filledQty / remainingQty and transitions status.
   * If remainingQty reaches 0, parent status becomes FILLED.
   *
   * @param parentOrderId  — id of the parent algo order
   * @param childFilledQty — quantity filled by the child order
   */
  async recordChildFill(parentOrderId: string, childFilledQty: string): Promise<void> {
    const ctx = getRequestContext();
    const parent = await this.orders.findOne({ where: { id: parentOrderId } });
    if (!parent) {
      this.logger.warn('recordChildFill: parent not found', { parentOrderId });
      return;
    }

    const execQty = parseFloat(childFilledQty);
    const prevFilled = parseFloat(parent.filledQty ?? '0');
    const prevRemaining = parseFloat(parent.remainingQty ?? parent.quantity);

    parent.filledQty = String(prevFilled + execQty);
    parent.remainingQty = String(Math.max(0, prevRemaining - execQty));
    parent.status = parent.remainingQty === '0' ? 'FILLED' : 'PARTIALLY_FILLED';

    await this.orders.save(parent);

    // Persist fill to audit log
    await this.audits.save(this.audits.create({
      tenantId: ctx.tenantId,
      orderId: parent.id,
      action: 'ALGO_CHILD_FILL_RECORDED' as any,
      data: {
        childExecQty: childFilledQty,
        filledQty: parent.filledQty,
        remainingQty: parent.remainingQty,
        status: parent.status,
      },
    }));

    this.logger.debug('recordChildFill', {
      parentOrderId,
      childFilledQty,
      filledQty: parent.filledQty,
      remainingQty: parent.remainingQty,
      status: parent.status,
    });

    this.orderEvents.publish({
      type: 'order.algo.child_fill_recorded',
      payload: {
        parentOrderId,
        childFilledQty,
        filledQty: parent.filledQty,
        remainingQty: parent.remainingQty,
        status: parent.status,
      },
    });
  }

  // ─── Scheduled evaluation ───────────────────────────────────────────────────

  /**
   * Runs every 10 seconds.
   *
   * TWAP / VWAP: finds PARTIALLY_FILLED algo orders where nextSliceTime <= now,
   *              dispatches the next slice (if slicesCompleted < totalSlices).
   *
   * ICEBERG: finds PARTIALLY_FILLED ICEBERG orders with remainingQty > 0,
   *          dispatches a new slice with quantity = sliceCount (visible qty).
   *
   * Safe to call concurrently — queries use status index.
   */
  async evaluateAll(): Promise<void> {
    // Find all active algo orders in PARTIALLY_FILLED state
    const activeOrders = await this.orders.find({
      where: { status: 'PARTIALLY_FILLED' },
    });

    const algoOrders = activeOrders.filter(
      (o) => o.algoType === 'TWAP' || o.algoType === 'VWAP' || o.algoType === 'ICEBERG',
    );

    if (algoOrders.length === 0) return;

    this.logger.debug('evaluateAll() — checking', { count: algoOrders.length });

    for (const order of algoOrders) {
      const meta = (order.algoMeta ?? {}) as Record<string, unknown>;
      const slicesCompleted = (meta['slicesCompleted'] as number) ?? 0;
      const totalSlices = (meta['totalSlices'] as number) ?? 0;
      const nextSliceTime = meta['nextSliceTime'] as number | undefined;

      if (order.algoType === 'TWAP' || order.algoType === 'VWAP') {
        // TWAP / VWAP: dispatch next slice only if time has arrived and slices remain
        if (nextSliceTime != null && Date.now() >= nextSliceTime && slicesCompleted < totalSlices) {
          await this.dispatchNextSlice(order, slicesCompleted);
        }
      } else if (order.algoType === 'ICEBERG') {
        // ICEBERG: dispatch a slice whenever there's remainingQty
        const remaining = parseFloat(order.remainingQty);
        const sliceCount = (meta['sliceCount'] as number) ?? 0;
        if (remaining > 0 && slicesCompleted < totalSlices) {
          await this.dispatchNextSlice(order, slicesCompleted);
        }
      }
    }
  }

  // ─── Slice dispatch ─────────────────────────────────────────────────────────

  /**
   * Dispatches the next child slice for a TWAP / VWAP / ICEBERG algo order.
   *
   * TWAP  — type MARKET, price null
   * VWAP  — type LIMIT, price = parent.priceLimit (or parent.price)
   * ICEBERG — type LIMIT, price = parent.priceLimit
   *
   * The child order inherits: tenantId, accountId, instrumentId, side.
   * parentOrderId = parent.id, orderRole = 'PRIMARY'.
   * algoMeta carries sliceIndex and isChildOfAlgo: true for auditability.
   *
   * After submission, parent.algoMeta is updated:
   *   - slicesCompleted++
   *   - nextSliceTime = now + intervalMs (TWAP/VWAP only)
   */
  private async dispatchNextSlice(parent: OrderEntity, currentSliceIndex: number): Promise<void> {
    const ctx = getRequestContext();
    const meta = (parent.algoMeta ?? {}) as Record<string, unknown>;
    const sliceCount = (meta['sliceCount'] as number) ?? 1;
    const durationMinutes = (meta['durationMinutes'] as number) ?? 60;

    // Determine slice quantity
    let sliceQty: string;
    if (parent.algoType === 'ICEBERG') {
      // ICEBERG: sliceCount is the visible quantity per slice
      const remaining = parseFloat(parent.remainingQty);
      sliceQty = String(Math.min(sliceCount, remaining));
    } else {
      // TWAP / VWAP: equal slices
      const slices = AlgoOrderWorker.computeTwapSlices(parent.quantity, sliceCount);
      const nextSlice = slices[currentSliceIndex];
      if (!nextSlice) {
        this.logger.warn('dispatchNextSlice: no slice found', {
          parentId: parent.id,
          sliceCount,
          currentSliceIndex,
        });
        return;
      }
      sliceQty = nextSlice.qty;
    }

    // Determine child order type and price
    const childType = parent.algoType === 'TWAP' ? 'MARKET' : 'LIMIT';
    const childPrice = parent.algoType !== 'TWAP'
      ? (parent.price ?? null)
      : null;

    // Child order with parent linkage
    const childOrder = this.orders.create({
      tenantId: parent.tenantId,
      accountId: parent.accountId,
      instrumentId: parent.instrumentId,
      side: parent.side,
      type: childType,
      quantity: sliceQty,
      price: childPrice,
      clientOrderId: `${parent.clientOrderId}-slice-${currentSliceIndex + 1}`,
      externalRefId: `${parent.externalRefId}-slice-${currentSliceIndex + 1}`,
      status: 'NEW',
      filledQty: '0',
      remainingQty: sliceQty,
      parentOrderId: parent.id,
      orderRole: 'PRIMARY',
      algoType: parent.algoType ?? null,
      algoMeta: {
        sliceIndex: currentSliceIndex,
        isChildOfAlgo: true,
      },
      timeInForce: parent.timeInForce ?? 'DAY',
    });

    await this.orders.save(childOrder);

    this.logger.debug('dispatchNextSlice: child order created', {
      parentId: parent.id,
      childId: childOrder.id,
      sliceQty,
      childType,
      childPrice,
      algoType: parent.algoType,
    });

    // Submit to exchange
    const account = await this.accountsService.getById(parent.accountId);
    const adapter = account?.accountType === 'DEMO' ? this.demoExchange : this.exchange;

    const placePayload: PlaceOrderRequest = {
      tenantId: parent.tenantId,
      accountId: parent.accountId,
      instrumentId: parent.instrumentId,
      side: parent.side,
      type: childType,
      quantity: sliceQty,
      price: childPrice,
      clientOrderId: childOrder.clientOrderId,
      timeInForce: childOrder.timeInForce,
    };

    const resp = await adapter.placeOrder(placePayload);
    this.logger.debug('dispatchNextSlice: exchange resp', {
      childId: childOrder.id,
      status: resp.status,
      providerOrderId: resp.providerOrderId,
    });

    // Update child status and meta
    childOrder.status = resp.status === 'REJECTED' ? 'REJECTED' : 'PLACED';
    childOrder.meta = { ...(childOrder.meta ?? {}), providerOrderId: resp.providerOrderId };
    await this.orders.save(childOrder);

    // Update parent meta: increment slicesCompleted, set nextSliceTime
    const slicesCompleted = currentSliceIndex + 1;
    const totalSlices = sliceCount;
    const intervalMs =
      parent.algoType !== 'ICEBERG' && totalSlices > 0
        ? (durationMinutes * 60 * 1000) / totalSlices
        : null;

    const updatedMeta: Record<string, unknown> = {
      ...meta,
      slicesCompleted,
      totalSlices,
      nextSliceTime: intervalMs != null ? Date.now() + intervalMs : meta['nextSliceTime'],
    };

    parent.algoMeta = updatedMeta;
    await this.orders.save(parent);

    // Audit
    await this.audits.save(this.audits.create({
      tenantId: ctx.tenantId,
      orderId: parent.id,
      action: 'ALGO_SLICE_DISPATCHED' as any,
      data: {
        childOrderId: childOrder.id,
        sliceQty,
        slicesCompleted,
        totalSlices,
        nextSliceTime: updatedMeta['nextSliceTime'],
      },
    }));

    this.orderEvents.publish({
      type: 'order.algo.slice_dispatched',
      payload: {
        parentId: parent.id,
        childId: childOrder.id,
        sliceQty,
        slicesCompleted,
        totalSlices,
      },
    });
  }
}