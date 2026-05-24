/**
 * File:        apps/backend/src/modules/accounts/entities/strategy-position.entity.ts
 * Module:      accounts
 * Purpose:     Per-account strategy-level position tracking for options and multi-leg
 *              strategies: stores net_quantity, average_price, realized/unrealized PnL,
 *              greeks (delta, gamma), and strategy_type.
 *
 * Exports:
 *   - StrategyPositionEntity     — main entity
 *   - StrategyTypeEnum           — 'SINGLE' | 'SPREAD' | 'STRADDLE' | 'STRANGLE' |
 *                                  'BUTTERFLY' | 'IRON_CONDOR' | 'CUSTOM'
 *   - BookTypeEnum              — 'A' | 'B'
 *
 * Depends on:
 *   - @nestjs/graphql            — ObjectType, Field decorators
 *   - typeorm                    — Column, CreateDateColumn, Entity, Index,
 *                                  PrimaryGeneratedColumn, UpdateDateColumn
 *
 * Side-effects:
 *   - None (read-only entity class, no I/O)
 *
 * Key invariants:
 *   - net_quantity and average_price default to '0' — strategy always has a value
 *   - instrument_id is nullable — supports book-level aggregation rows with no instrument
 *   - strategy_type defaults to 'SINGLE' — backward-compatible base case
 *   - meta is jsonb — opaque to GraphQL, no @Field decorator
 *
 * Read order:
 *   1. StrategyTypeEnum / BookTypeEnum — enum definitions
 *   2. StrategyPositionEntity         — entity columns + field decorators
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-05-24
 */

import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum StrategyTypeEnum {
  SINGLE = 'SINGLE',
  SPREAD = 'SPREAD',
  STRADDLE = 'STRADDLE',
  STRANGLE = 'STRANGLE',
  BUTTERFLY = 'BUTTERFLY',
  IRON_CONDOR = 'IRON_CONDOR',
  CUSTOM = 'CUSTOM',
}

registerEnumType(StrategyTypeEnum, {
  name: 'StrategyTypeEnum',
  description: 'Options strategy classification',
});

export enum BookTypeEnum {
  A = 'A',
  B = 'B',
}

registerEnumType(BookTypeEnum, {
  name: 'BookTypeEnum',
  description: 'Trading book designation',
});

@ObjectType()
@Entity('strategy_positions')
@Index('idx_strat_pos_tenant_account', ['tenantId', 'accountId'])
@Index('idx_strat_pos_instrument', ['instrumentId'], {
  where: 'instrument_id IS NOT NULL',
})
@Index('idx_strat_pos_book_type', ['bookType'], {
  where: 'book_type IS NOT NULL',
})
export class StrategyPositionEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id!: string;

  @Field(() => String)
  @Column({ name: 'tenant_id', type: 'varchar', length: 64 })
  tenantId!: string;

  @Field(() => ID)
  @Column({ name: 'account_id', type: 'uuid' })
  accountId!: string;

  @Field(() => ID, { nullable: true })
  @Column({ name: 'instrument_id', type: 'uuid', nullable: true })
  instrumentId?: string | null;

  @Field(() => StrategyTypeEnum)
  @Column({
    name: 'strategy_type',
    type: 'varchar',
    length: 24,
    default: StrategyTypeEnum.SINGLE,
  })
  strategyType!: StrategyTypeEnum;

  @Field(() => String)
  @Column({
    name: 'net_quantity',
    type: 'numeric',
    precision: 28,
    scale: 8,
    default: '0',
  })
  netQuantity!: string;

  @Field(() => String)
  @Column({
    name: 'average_price',
    type: 'numeric',
    precision: 28,
    scale: 8,
    default: '0',
  })
  averagePrice!: string;

  @Field(() => String)
  @Column({
    name: 'realized_pnl',
    type: 'numeric',
    precision: 28,
    scale: 8,
    default: '0',
  })
  realizedPnl!: string;

  @Field(() => String)
  @Column({
    name: 'unrealized_pnl',
    type: 'numeric',
    precision: 28,
    scale: 8,
    default: '0',
  })
  unrealizedPnl!: string;

  @Field(() => String)
  @Column({
    name: 'delta',
    type: 'numeric',
    precision: 28,
    scale: 8,
    default: '0',
  })
  delta!: string;

  @Field(() => String)
  @Column({
    name: 'gamma',
    type: 'numeric',
    precision: 28,
    scale: 8,
    default: '0',
  })
  gamma!: string;

  @Field(() => BookTypeEnum)
  @Column({ name: 'book_type', type: 'varchar', length: 8, default: 'A' })
  bookType!: BookTypeEnum;

  // meta is jsonb — opaque to GraphQL, no @Field
  @Column({ name: 'meta', type: 'jsonb', nullable: true })
  meta?: Record<string, unknown> | null;

  @Field(() => Date)
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}