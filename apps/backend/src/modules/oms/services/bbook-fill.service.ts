/**
 * File:        apps/backend/src/modules/oms/services/bbook-fill.service.ts
 * Module:      oms
 * Purpose:     B-book fill engine — internalizes a client market order against the broker's
 *              own book (vs routing to exchange). Computes broker spread, updates the order
 *              to FILLED, updates strategy position, credits broker P&L, and publishes events.
 *
 * Exports:
 *   - BBookFillService            — injectable
 *   - BBookFillService.fillBBook()   — execute client order as B-book fill
 *   - BBookFillService.computeBrokerSpread() — spread arithmetic
 *
 * Depends on:
 *   - OrderEntity                  — order row to update
 *   - StrategyPositionService       — upsert strategy position with bookType='B'
 *   - LedgerService                — credit broker P&L via cash ledger
 *   - OrderEventsService           — publish bbook.execution event
 *   - RealtimePublisherService      — push realtime update
 *   - AppLoggerService             — structured logging
 *   - getRequestContext            — tenantId / userId resolution
 *
 * Side-effects:
 *   - DB writes: OrderEntity (status/filledQty/remainingQty/meta update)
 *   - DB writes: StrategyPositionEntity (upsert via StrategyPositionService)
 *   - DB writes: CashLedgerEntryEntity (broker P&L credit)
 *   - Kafka/Outbox events via OrderEventsService
 *   - WebSocket publish via RealtimePublisherService
 *
 * Key invariants:
 *   - Order is always FILLED in a single shot (no partial B-book fills)
 *   - spreadPct defaults to 5 bps (0.0005); BUY client pays more, SELL client receives less
 *   - Broker P&L = |notionalClient - notionalBroker| for the fill
 *   - DEMO accounts never reach this service (caller gates on accountType)
 *
 * Read order:
 *   1. fillBBook() — orchestration
 *   2. computeBrokerSpread() — spread arithmetic
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-24
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { OrderEntity } from '../entities/order.entity';
import { StrategyPositionService } from '../../accounts/services/strategy-position.service';
import { LedgerService } from '../../accounts/services/ledger.service';
import { OrderEventsService } from './order-events.service';
import { RealtimePublisherService } from '../../realtime/prana-stream/services/realtime-publisher.service';
import { AppLoggerService } from '../../../shared/logger';
import { getRequestContext } from '../../../shared/request-context';

/** 5 basis points = 0.0005 */
const DEFAULT_SPREAD_BPS = 5;

@Injectable()
export class BBookFillService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,
    private readonly strategyPositions: StrategyPositionService,
    private readonly ledger: LedgerService,
    private readonly orderEvents: OrderEventsService,
    private readonly realtime: RealtimePublisherService,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(BBookFillService.name);
  }

  /**
   * Fills an order against the broker's B-book (internalization).
   *
   * Steps:
   *   1. Update order status → FILLED, filledQty = quantity, remainingQty = '0'
   *   2. Set order.meta.bookType = 'B', meta.fillPrice = fillPrice
   *   3. Upsert strategy position with bookType='B' via StrategyPositionService
   *   4. Compute broker spread → credit/debit broker P&L via LedgerService
   *   5. Publish 'bbook.execution' event via OrderEventsService
   *   6. Publish realtime update via RealtimePublisherService
   */
  async fillBBook(order: OrderEntity, fillPrice: string): Promise<void> {
    const ctx = getRequestContext();
    this.logger.debug('fillBBook()', { orderId: order.id, fillPrice, ctx });

    const qty = Number(order.quantity);
    const clientPrice = Number(fillPrice);

    // ── Step 1 & 2: update order ───────────────────────────────────────────────
    order.status = 'FILLED';
    order.filledQty = order.quantity;
    order.remainingQty = '0';
    order.meta = {
      ...(order.meta ?? {}),
      bookType: 'B',
      fillPrice: String(clientPrice),
    };
    await this.orderRepo.save(order);

    // ── Step 3: update strategy position ────────────────────────────────────────
    // BUY: netQuantity increases; SELL: netQuantity decreases
    const signedQty = order.side === 'BUY' ? qty : -qty;
    await this.strategyPositions.upsertPosition({
      accountId: order.accountId,
      instrumentId: order.instrumentId,
      netQuantity: signedQty,
      averagePrice: Number(fillPrice),
      bookType: 'B',
    });

    // ── Step 4: compute broker spread and credit P&L ────────────────────────────
    const spreadPct = this.getSpreadPct(order);
    const brokerSpread = this.computeBrokerSpread(order, fillPrice);
    // netBrokerPnl = clientNotional - brokerNotional (signed to broker)
    // BUY: client pays more → broker receives positive P&L
    // SELL: client receives more → broker pays negative P&L (cost)
    const clientNotional = qty * clientPrice;
    const brokerPrice = Number(brokerSpread.brokerPrice);
    const brokerNotional = qty * brokerPrice;
    const netBrokerPnl = clientNotional - brokerNotional; // positive = broker profit
    const direction = netBrokerPnl >= 0 ? 'credit' : 'debit';

    if (Math.abs(netBrokerPnl) > 0.0001) {
      await this.ledger.postCash(order.accountId, {
        amount: String(Math.abs(netBrokerPnl)),
        currency: 'INR',
        direction,
        kind: 'bbook_pnl',
        externalRefId: `bbook:${order.id}`,
        meta: {
          orderId: order.id,
          instrumentId: order.instrumentId,
          side: order.side,
          clientPrice: String(clientPrice),
          brokerPrice: String(brokerPrice),
          spreadPct: String(spreadPct),
          netBrokerPnl: String(netBrokerPnl),
          bookType: 'B',
        },
      } as any);
    }

    // ── Step 5: publish bbook.execution event ───────────────────────────────────
    this.orderEvents.publish({
      type: 'bbook.execution',
      payload: {
        orderId: order.id,
        tenantId: order.tenantId,
        accountId: order.accountId,
        instrumentId: order.instrumentId,
        side: order.side,
        quantity: order.quantity,
        clientPrice: String(clientPrice),
        brokerPrice: String(brokerPrice),
        spreadPct: String(spreadPct),
        netBrokerPnl: String(netBrokerPnl),
        meta: order.meta,
      },
    });

    // ── Step 6: realtime push ───────────────────────────────────────────────────
    this.realtime.publishOrderUpdate(ctx.userId ?? order.accountId, {
      order,
      event: 'bbook.execution',
      brokerPrice: String(brokerPrice),
      spreadPct: String(spreadPct),
    });
  }

  /**
   * Computes the broker's internal fill price given a client order and market price.
   *
   * BUY  client: brokerPrice = clientPrice × (1 + spreadPct)  → client pays more
   * SELL client: brokerPrice = clientPrice × (1 - spreadPct)  → client receives less
   *
   * Returns both the broker price and the spread fraction used.
   */
  computeBrokerSpread(
    order: OrderEntity,
    clientPrice: string,
  ): { brokerPrice: string; spreadPct: number } {
    const spreadPct = this.getSpreadPct(order);
    const px = Number(clientPrice);

    let brokerPrice: number;
    if (order.side === 'BUY') {
      brokerPrice = px * (1 + spreadPct);
    } else {
      brokerPrice = px * (1 - spreadPct);
    }

    // Round to same precision as market prices (8 decimal places)
    return {
      brokerPrice: brokerPrice.toFixed(8),
      spreadPct,
    };
  }

  /**
   * Extracts spreadPct from order.meta, falling back to DEFAULT_SPREAD_BPS.
   */
  private getSpreadPct(order: OrderEntity): number {
    const meta = order.meta;
    if (meta && typeof meta.spreadPct === 'number') {
      return meta.spreadPct;
    }
    return DEFAULT_SPREAD_BPS / 10000; // convert bps to fraction
  }
}