/**
 * File:        apps/backend/src/modules/oms/entities/order.entity.ts
 * Module:      oms · Order Entity
 * Purpose:     Core order entity representing client orders placed through the OMS
 *
 * Exports:
 *   - OrderEntity                      — order row; @ObjectType + @Entity for both GraphQL + TypeORM
 *   - OrderRejectionCode               — enum of rejection reason codes
 *   - OrderRejectionError              — GraphQL object returned on order rejection (not thrown)
 *
 * Depends on:
 *   - typeorm                          — @Column, @Entity, @Index, @Unique, @PrimaryGeneratedColumn
 *   - @nestjs/graphql                  — @Field, @ObjectType decorators
 *
 * Side-effects:  none (pure data entity)
 * Key invariants:
 *   - clientOrderId is unique per tenant (UX constraint)
 *   - externalRefId is unique per tenant (idempotency key)
 *   - slPrice/tpPrice are optional; when set, slPrice < price for BUY, slPrice > price for SELL
 *
 * Read order:
 *   1. OrderEntity — data shape
 *   2. OrderRejectionError — rejection payload for GraphQL union
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-24
 */

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { Field, ID, Float, ObjectType, registerEnumType } from '@nestjs/graphql';

/**
 * Rejection reason codes returned via OrderRejectionError union.
 * Thrown AppErrors map to these codes via OmsResolver.mapCode().
 */
export enum OrderRejectionCode {
  INSUFFICIENT_BUYING_POWER = 'INSUFFICIENT_BUYING_POWER',
  INVALID_INSTRUMENT = 'INVALID_INSTRUMENT',
  EXCHANGE_NOT_ENABLED = 'EXCHANGE_NOT_ENABLED',
  POSITION_LIMIT_EXCEEDED = 'POSITION_LIMIT_EXCEEDED',
  RISK_CHECK_FAILED = 'RISK_CHECK_FAILED',
  EXCHANGE_REJECTED = 'EXCHANGE_REJECTED',
  UNKNOWN = 'UNKNOWN',
}
registerEnumType(OrderRejectionCode, { name: 'OrderRejectionCode' });

/**
 * GraphQL object returned by placeOrder when the order is rejected.
 * Unlike a thrown AppError, this is a typed member of the PlaceOrderResult union
 * so Apollo can read it as a successful HTTP response with __typename = 'OrderRejectionError'.
 */
@ObjectType()
export class OrderRejectionError {
  @Field(() => OrderRejectionCode)
  code: OrderRejectionCode;

  @Field()
  message: string;

  @Field({ nullable: true })
  externalRefId?: string;
}

/**
 * Union type for placeOrder return — either a placed order or a typed rejection.
 * Apollo caches whichever member is returned; callers check __typename in onCompleted.
 */
@ObjectType()
@Entity('orders')
@Index('idx_orders_tenant_account_status', ['tenantId', 'accountId', 'status'])
@Unique('ux_orders_client_id', ['tenantId', 'clientOrderId'])
@Unique('ux_orders_external_ref', ['tenantId', 'externalRefId'])
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  @Field(() => ID)
  id!: string;

  @Column({ name: 'tenant_id', type: 'varchar', length: 64 })
  @Field()
  tenantId!: string;

  @Column({ name: 'account_id', type: 'uuid' })
  @Field(() => ID)
  accountId!: string;

  @Column({ name: 'instrument_id', type: 'uuid' })
  @Field(() => ID)
  instrumentId!: string;

  @Column({ name: 'side', type: 'varchar', length: 8 })
  @Field(() => String)
  side!: 'BUY' | 'SELL';

  @Column({ name: 'type', type: 'varchar', length: 16 })
  @Field(() => String)
  type!: 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT' | 'GTT' | 'TRAILING_STOP' | 'ICEBERG' | 'TWAP' | 'VWAP' | 'BRACKET';

  @Column({ name: 'quantity', type: 'numeric', precision: 28, scale: 8 })
  @Field(() => Float)
  quantity!: string;

  @Column({ name: 'price', type: 'numeric', precision: 28, scale: 8, nullable: true })
  @Field(() => Float, { nullable: true })
  price?: string | null;

  /** Stop-loss price — optional, validated by OMS service */
  @Column({ name: 'sl_price', type: 'numeric', precision: 28, scale: 8, nullable: true })
  @Field(() => Float, { nullable: true })
  slPrice?: string | null;

  /** Take-profit price — optional, validated by OMS service */
  @Column({ name: 'tp_price', type: 'numeric', precision: 28, scale: 8, nullable: true })
  @Field(() => Float, { nullable: true })
  tpPrice?: string | null;

  @Column({ name: 'time_in_force', type: 'varchar', length: 16, default: 'DAY' })
  @Field(() => String)
  timeInForce!: 'DAY' | 'IOC' | 'GTC' | 'FOK';

  // ── Bracket / conditional / algo order fields ──────────────────────────────
  @Column({ name: 'parent_order_id', type: 'uuid', nullable: true })
  @Index('idx_orders_parent')
  @Field({ nullable: true })
  parentOrderId?: string | null;

  @Column({ name: 'order_role', type: 'varchar', length: 16, nullable: true })
  @Index('idx_orders_role')
  @Field({ nullable: true })
  orderRole?: 'PRIMARY' | 'TAKE_PROFIT' | 'STOP_LOSS' | null;

  @Column({ name: 'trigger_price', type: 'numeric', precision: 28, scale: 8, nullable: true })
  @Field(() => Float, { nullable: true })
  triggerPrice?: string | null;

  @Column({ name: 'trigger_condition', type: 'varchar', length: 16, nullable: true })
  @Field({ nullable: true })
  triggerCondition?: 'ABOVE' | 'BELOW' | null;

  @Column({ name: 'trailing_dist', type: 'numeric', precision: 28, scale: 8, nullable: true })
  @Field(() => Float, { nullable: true })
  trailingDistance?: string | null;

  @Column({ name: 'trailing_pct', type: 'numeric', precision: 8, scale: 4, nullable: true })
  @Field(() => Float, { nullable: true })
  trailingPct?: string | null;

  @Column({ name: 'filled_qty', type: 'numeric', precision: 28, scale: 8 })
  @Field(() => Float)
  filledQty!: string;

  @Column({ name: 'remaining_qty', type: 'numeric', precision: 28, scale: 8 })
  @Field(() => Float)
  remainingQty!: string;

  @Column({ name: 'algo_type', type: 'varchar', length: 24, nullable: true })
  @Index('idx_orders_algo_type')
  @Field({ nullable: true })
  algoType?: 'TWAP' | 'VWAP' | 'ICEBERG' | null;

  @Column({ name: 'algo_meta', type: 'jsonb', nullable: true })
  @Field({ nullable: true })
  algoMeta?: Record<string, unknown> | null;

  @Column({ name: 'status', type: 'varchar', length: 24, default: 'NEW' })
  @Field(() => String)
  status!: 'NEW' | 'PLACED' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELLED' | 'REJECTED' | 'EXPIRED';

  @Column({ name: 'client_order_id', type: 'varchar', length: 64 })
  @Field()
  clientOrderId!: string;

  @Column({ name: 'external_ref_id', type: 'varchar', length: 128 })
  @Field()
  externalRefId!: string;

  @Column({ name: 'hold_ref', type: 'varchar', length: 128, nullable: true })
  @Field({ nullable: true })
  holdRef?: string | null;

  @Column({ name: 'meta', type: 'jsonb', nullable: true })
  meta?: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  @Field()
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  @Field()
  updatedAt!: Date;
}