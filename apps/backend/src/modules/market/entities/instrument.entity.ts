/**
 * File:        apps/backend/src/modules/market/entities/instrument.entity.ts
 * Module:      market · Entities
 * Purpose:     Instrument entity across equities/forex/crypto with exchange linkage.
 *              Supports multi-provider, multi-segment instruments.
 *
 * Exports:
 *   - InstrumentEntity — exchange-traded instrument record
 *   - InstrumentStatus — Active | Disabled | Halted | Archived
 *   - InstrumentSegment — EQ | FNO | COM | CDS | FX | CRYPTO | INDEX
 *   - InstrumentType — EQUITY | FUTURE | OPTION | ETF | FOREX | CRYPTO | INDEX
 *
 * Depends on:
 *   - @nestjs/graphql — @ObjectType, @Field decorators
 *
 * Side-effects:  none
 *
 * Key invariants:
 *   - symbol + exchangeCode form a unique trading pair
 *   - tickSize and lotSize stored as strings to preserve precision
 *   - status controls visibility; isTradingEnabled controls order placement
 *   - providerCode links instrument to data/execution provider
 *   - segment enables segment-based filtering for user permissions
 *
 * Read order:
 *   1. InstrumentEntity — entity shape (this file)
 *   2. InstrumentsService — CRUD operations
 *   3. ExchangeEntity — exchange definitions linked here
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-09
 */

import { ObjectType, Field, ID, Float, registerEnumType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

// Enums for instrument classification
export enum InstrumentStatus {
  ACTIVE = 'Active',
  DISABLED = 'Disabled',
  HALTED = 'Halted',
  ARCHIVED = 'Archived',
}
registerEnumType(InstrumentStatus, { name: 'InstrumentStatus' });

export enum InstrumentSegment {
  EQ = 'EQ',     // Equity (cash segment)
  FNO = 'FNO',   // Futures & Options
  COM = 'COM',   // Commodities
  CDS = 'CDS',   // Currency derivatives
  FX = 'FX',     // Forex (spot)
  CRYPTO = 'CRYPTO',
  INDEX = 'INDEX',
}
registerEnumType(InstrumentSegment, { name: 'InstrumentSegment' });

export enum InstrumentType {
  EQUITY = 'EQUITY',
  FUTURE = 'FUTURE',
  OPTION = 'OPTION',
  ETF = 'ETF',
  FOREX = 'FOREX',
  CRYPTO = 'CRYPTO',
  INDEX = 'INDEX',
}
registerEnumType(InstrumentType, { name: 'InstrumentType' });

@ObjectType()
@Entity('instruments')
@Index('idx_instruments_symbol_exchange', ['symbol', 'exchangeCode'])
@Index('idx_instruments_exchange_segment', ['exchangeCode', 'segment'])
@Index('idx_instruments_provider', ['providerCode'])
export class InstrumentEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  @Field(() => ID)
  id!: string;

  @Column({ name: 'exchange_code', type: 'varchar', length: 16 })
  @Field()
  exchangeCode!: string; // references exchanges.code

  @Column({ name: 'symbol', type: 'varchar', length: 64 })
  @Field()
  symbol!: string; // e.g., INFY, AAPL, EURUSD, BTCUSDT

  @Column({ name: 'type', type: 'varchar', length: 16, default: 'EQUITY' })
  @Field(() => InstrumentType)
  type!: InstrumentType;

  @Column({ name: 'segment', type: 'varchar', length: 16, default: 'EQ' })
  @Field(() => InstrumentSegment)
  segment!: InstrumentSegment;

  @Column({ name: 'display_name', type: 'varchar', length: 128 })
  @Field()
  displayName!: string;

  // ─── STATUS & CONTROL ──────────────────────────────────────────────────────────
  @Column({ name: 'status', type: 'varchar', length: 16, default: 'Active' })
  @Field(() => InstrumentStatus)
  status!: InstrumentStatus;

  @Column({ name: 'is_trading_enabled', type: 'boolean', default: true })
  isTradingEnabled!: boolean;

  // ─── DERIVATIVES FIELDS (for F&O) ───────────────────────────────────────────────
  @Column({ name: 'base_symbol', type: 'varchar', length: 64, nullable: true })
  baseSymbol?: string | null;

  @Column({ name: 'expiry', type: 'date', nullable: true })
  expiry?: Date | null;

  @Column({ name: 'strike', type: 'numeric', precision: 18, scale: 4, nullable: true })
  strike?: number | null;

  @Column({ name: 'option_type', type: 'varchar', length: 4, nullable: true })
  optionType?: 'CE' | 'PE' | null;

  @Column({ name: 'expiry_label', type: 'varchar', length: 32, nullable: true })
  expiryLabel?: string | null; // e.g., "Dec 2025"

  // ─── TRADING PARAMETERS ────────────────────────────────────────────
  @Column({
    name: 'tick_size',
    type: 'numeric',
    precision: 18,
    scale: 8,
    default: 0.01,
  })
  @Field(() => Float, { nullable: true })
  tickSize?: string;

  @Column({
    name: 'lot_size',
    type: 'numeric',
    precision: 18,
    scale: 4,
    default: 1,
  })
  @Field(() => Float, { nullable: true })
  lotSize?: string;

  @Column({ name: 'contract_size', type: 'numeric', precision: 18, scale: 4, default: 1 })
  contractSize?: string;

  // ─── PROVIDER LINEAGE ────────────────────────────────────────────────────────
  @Column({ name: 'provider_code', type: 'varchar', length: 32, nullable: true })
  providerCode?: string | null; // KITE, ALPACA, BINANCE

  @Column({ name: 'provider_symbol', type: 'varchar', length: 128, nullable: true })
  providerSymbol?: string | null; // Provider's native symbol

  @Column({ name: 'provider_token', type: 'varchar', length: 64, nullable: true })
  providerToken?: string | null; // Provider's instrument token

  // ─── TENANT OVERRIDES ────────────────────────────────────────────────
  @Column({ name: 'spread_override', type: 'numeric', precision: 12, scale: 8, nullable: true })
  spreadOverride?: number | null;

  @Column({ name: 'lot_override', type: 'numeric', precision: 18, scale: 4, nullable: true })
  lotOverride?: number | null;

  @Column({ name: 'leverage_override', type: 'varchar', length: 16, nullable: true })
  leverageOverride?: string | null;

  @Column({ name: 'max_position_override', type: 'numeric', precision: 18, scale: 4, nullable: true })
  maxPositionOverride?: number | null;

  // ─── META ────────────────────────────────────────────────────────────
  @Column({ name: 'meta', type: 'jsonb', nullable: true })
  meta?: Record<string, unknown> | null;
  // ISIN (India), Bloomberg ticker, RIC, CUSIP, etc.

  @CreateDateColumn({ name: 'created_at' })
  @Field()
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  @Field()
  updatedAt!: Date;
}
