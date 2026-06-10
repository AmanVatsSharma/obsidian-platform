/**
 * File:        apps/backend/src/shared/outbox/outbox.service.ts
 * Module:      shared/outbox
 * Purpose:     Transactional outbox service for cross-module events.
 *              Provides append (default) and appendWithManager (transactional)
 *              methods. The outbox pattern guarantees that domain writes
 *              (orders, ledger rows) and event publishes (realtime push, Kafka)
 *              commit atomically.
 *
 * Exports:
 *   - OutboxService.append(topic, payload, tenantId?)     — non-transactional
 *   - OutboxService.appendWithManager(manager, ...)      — transaction-participating
 *   - OutboxService.fetchPending(limit)                   — for worker
 *   - OutboxService.markPublished(id)                    — for worker
 *   - OutboxService.markFailed(id, error)                 — for worker
 *
 * Depends on:
 *   - typeorm EntityManager + Repository<OutboxEntity>
 *   - AppLoggerService
 *
 * Side-effects:
 *   - DB writes (insert into outbox_entity)
 *
 * Key invariants:
 *   - appendWithManager MUST be called inside the caller's dataSource.transaction
 *     so the outbox row commits atomically with the business write.
 *   - append (no manager) is for fire-and-forget convenience — do NOT use for
 *     order/position/ledger events where atomicity is required.
 *   - The OutboxWorkerSkeleton polls fetchPending every 5s, processes via local
 *     handlers first, then falls back to IMessagePublisher.
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-10
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AppLoggerService } from '../logger';
import { OutboxEntity } from './entities/outbox.entity';

@Injectable()
export class OutboxService {
  constructor(
    @InjectRepository(OutboxEntity)
    private readonly repo: Repository<OutboxEntity>,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(OutboxService.name);
  }

  /**
   * Append a message to the outbox in its own implicit transaction.
   * Use this only when atomicity with a business write is NOT required.
   * For OMS/Accounts events, prefer appendWithManager(manager, ...).
   */
  async append(
    topic: string,
    payload: Record<string, unknown>,
    tenantId?: string | null,
  ): Promise<OutboxEntity> {
    const entity = this.repo.create({
      topic,
      payload,
      tenantId: tenantId ?? null,
      status: 'PENDING',
    });
    const saved = await this.repo.save(entity);
    this.logger.debug('Outbox appended (non-transactional)', { id: saved.id, topic });
    return saved;
  }

  /**
   * Append a message to the outbox using the caller's transaction manager.
   * The outbox row will commit atomically with any other writes made via
   * the same `manager`. This is the correct pattern for OMS/Accounts
   * events that must reach the client in the same DB transaction as the
   * business write.
   *
   * @param entityManager  the caller's dataSource.transaction(manager => ...)
   * @param topic          outbox topic (e.g. 'oms.order.updated')
   * @param payload        event payload
   * @param tenantId       optional tenant scope
   */
  async appendWithManager(
    entityManager: EntityManager,
    topic: string,
    payload: Record<string, unknown>,
    tenantId?: string | null,
  ): Promise<OutboxEntity> {
    const repo = entityManager.getRepository(OutboxEntity);
    const entity = repo.create({
      topic,
      payload,
      tenantId: tenantId ?? null,
      status: 'PENDING',
    });
    const saved = await repo.save(entity);
    this.logger.debug('Outbox appended (transactional)', { id: saved.id, topic });
    return saved;
  }

  /**
   * Fetch pending messages for processing.
   */
  async fetchPending(limit = 100): Promise<OutboxEntity[]> {
    return this.repo.find({
      where: { status: 'PENDING' },
      order: { createdAt: 'ASC' },
      take: limit,
    });
  }

  /**
   * Mark message as published.
   */
  async markPublished(id: string): Promise<void> {
    await this.repo.update(id, { status: 'PUBLISHED' });
  }

  /**
   * Mark message as failed with error. Retries on next tick.
   */
  async markFailed(id: string, error: string): Promise<void> {
    const entity = await this.repo.findOne({ where: { id } });
    if (entity) {
      entity.status = 'FAILED';
      entity.lastError = error;
      entity.lastAttemptAt = new Date();
      entity.retryCount += 1;
      await this.repo.save(entity);
    }
  }
}