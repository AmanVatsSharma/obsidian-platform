/**
 * File:        apps/backend/src/modules/settlement/services/settlement-outbox-handler.ts
 * Module:      settlement
 * Purpose:     Outbox message handler that creates settlement jobs from execution events.
 *              Processes 'settlement.job.create' outbox messages in the OutboxWorker.
 *
 * Exports:
 *   - SettlementOutboxHandler               — @Injectable handler for settlement.job.create
 *
 * Depends on:
 *   - SettlementService          — creates settlement jobs
 *   - OutboxEntity               — message shape (topic + payload)
 *   - detectSegment()            — infers segment from instrumentId
 *   - AppLoggerService           — structured logging with requestId
 *
 * Side-effects:
 *   - DB write: SettlementJobEntity created
 *
 * Key invariants:
 *   - Stateless — no state retained between calls
 *   - Does NOT publish to message broker — only writes DB
 *   - Settles T+N based on segment: CRYPTO=T+0, FOREX=T+1, EQUITY/COMMODITY=T+2
 *   - Errors are logged and re-thrown so OutboxWorker marks the message FAILED
 *
 * Read order:
 *   1. SettlementOutboxHandler (constructor + DI)
 *   2. canHandle() — topic filter
 *   3. handle()    — main processing
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-24
 */

import { Injectable } from '@nestjs/common';
import { OutboxEntity } from '../../../shared/outbox/entities/outbox.entity';
import { AppLoggerService } from '../../../shared/logger';
import { SettlementService } from './settlement.service';
import { detectSegment, Segment } from './segment-detector';

interface SettlementJobPayload {
  executionId: string;
  accountId: string;
  instrumentId: string;
  quantity: string;
  price: string;
  fees?: string;
  tradeDate?: string;
  segment?: string;
  currency?: string;
  tenantId?: string;
}

@Injectable()
export class SettlementOutboxHandler {
  constructor(
    private readonly settlementService: SettlementService,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(SettlementOutboxHandler.name);
  }

  /** Returns true only for settlement.job.create messages. */
  canHandle(topic: string): boolean {
    return topic === 'settlement.job.create';
  }

  /**
   * Handles the outbox message: parses payload, computes settlement date,
   * and creates a SettlementJobEntity via SettlementService.
   */
  async handle(msg: OutboxEntity): Promise<void> {
    this.logger.debug('handle:start', { msgId: msg.id, topic: msg.topic });

    const payload = msg.payload as SettlementJobPayload;

    if (!payload.executionId || !payload.accountId || !payload.instrumentId) {
      throw new Error(
        `[SettlementOutboxHandler] Missing required fields in settlement.job.create payload: ` +
        `executionId=${payload.executionId}, accountId=${payload.accountId}, instrumentId=${payload.instrumentId}`,
      );
    }

    const segment: Segment = payload.segment
      ? (payload.segment as Segment)
      : detectSegment(payload.instrumentId);

    const tradeDate = payload.tradeDate
      ? new Date(payload.tradeDate)
      : new Date();

    const settlementDate = SettlementService.getSettlementDate(tradeDate, segment);
    const currency = payload.currency ?? 'INR';
    const amount = this.computeAmount(payload);

    const tenantId = payload.tenantId ?? (msg.tenantId as string);

    await this.settlementService.createJob({
      tenantId,
      accountId: payload.accountId,
      tradeDate: tradeDate.toISOString().slice(0, 10),
      amount,
      currency: currency as 'USD' | 'INR' | 'EUR' | 'AED' | 'GBP',
    });

    this.logger.debug('handle:end', {
      msgId: msg.id,
      executionId: payload.executionId,
      segment,
      settlementDate: settlementDate.toISOString().slice(0, 10),
      amount,
      currency,
    });
  }

  /**
   * Computes the settlement amount from execution price * quantity + fees.
   */
  private computeAmount(payload: SettlementJobPayload): string {
    const qty = parseFloat(payload.quantity ?? '0');
    const px = parseFloat(payload.price ?? '0');
    const fees = parseFloat(payload.fees ?? '0');
    return (qty * px + fees).toFixed(4);
  }
}