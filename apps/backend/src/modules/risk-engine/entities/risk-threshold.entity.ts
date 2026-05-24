/**
 * File:        apps/backend/src/modules/risk-engine/entities/risk-threshold.entity.ts
 * Module:      risk-engine
 * Purpose:     Configurable risk thresholds per tenant/account — used by RiskEngineService
 *              to evaluate pre-trade and continuous risk checks and trigger actions
 *              (ALERT, FREEZE_ACCOUNT, LIQUIDATE_ALL, LIQUIDATE_BIGGEST, CIRCUIT_BREAKER).
 *
 * Exports:
 *   - RiskThresholdEntity     — TypeORM entity for risk_thresholds table
 *
 * Depends on:
 *   - @nestjs/typeorm             — @Entity, @Column, decorators
 *   - @nestjs/graphql + type-graphql — @ObjectType, @Field (GraphQL scalar mapping)
 *
 * Side-effects:
 *   - None — entity-only, no direct I/O
 *
 * Key invariants:
 *   - metric + tenantId (+ optionally accountId) form a unique constraint
 *   - action values are finite — RiskEngineService.executeAction() must cover all cases
 *
 * Read order:
 *   1. Entity columns — the data shape
 *   2. Index definitions — performance hints
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-24
 */

import { ObjectType, Field, ID } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type RiskMetric =
  | 'MARGIN_LEVEL'
  | 'EXPOSURE'
  | 'POSITION_LIMIT'
  | 'OPEN_ORDERS'
  | 'DELTA'
  | 'GAMMA';

export type RiskOperator = 'GT' | 'LT' | 'GTE' | 'LTE' | 'EQ';

export type RiskAction =
  | 'ALERT'
  | 'FREEZE_ACCOUNT'
  | 'LIQUIDATE_ALL'
  | 'LIQUIDATE_BIGGEST'
  | 'CIRCUIT_BREAKER';

@ObjectType()
@Entity('risk_thresholds')
@Index('idx_risk_threshold_tenant_metric', ['tenantId', 'metric'])
@Index('idx_risk_threshold_enabled', ['enabled'])
export class RiskThresholdEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id!: string;

  @Field(() => String)
  @Column({ name: 'tenant_id', type: 'varchar', length: 64 })
  tenantId!: string;

  /** Optional account-level override — null means tenant-wide threshold */
  @Field(() => ID, { nullable: true })
  @Column({ name: 'account_id', type: 'uuid', nullable: true })
  accountId?: string | null;

  @Field(() => String)
  @Column({ name: 'metric', type: 'varchar', length: 32 })
  metric!: RiskMetric;

  @Field(() => String)
  @Column({ name: 'operator', type: 'varchar', length: 8 })
  operator!: RiskOperator;

  @Field(() => Number)
  @Column({ name: 'threshold_value', type: 'numeric', precision: 28, scale: 8 })
  thresholdValue!: string;

  @Field(() => String)
  @Column({ name: 'action', type: 'varchar', length: 32 })
  action!: RiskAction;

  @Field(() => Boolean)
  @Column({ name: 'enabled', type: 'boolean', default: true })
  enabled!: boolean;

  /**
   * Flexible metadata — e.g. for CIRCUIT_BREAKER: { limitPct: 0.05, segment: 'intraday' }
   * or for ALERT: { channels: ['email', 'in-app'], cooldownSeconds: 300 }
   */
  @Field(() => String, { nullable: true })
  @Column({ name: 'meta', type: 'jsonb', nullable: true })
  meta?: Record<string, unknown> | null;

  @Field(() => Date)
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}