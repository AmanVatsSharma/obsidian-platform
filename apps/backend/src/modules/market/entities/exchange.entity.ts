/**
 * File:        apps/backend/src/modules/market/entities/exchange.entity.ts
 * Module:      market · Entities
 * Purpose:     Exchange entity with segment support, provider mappings, and status control.
 *
 * Exports:
 *   - ExchangeEntity — exchange definition
 *   - ExchangeSegment — EQUITY | FNO | COM | CDS | ALL
 *   - ExchangeStatus — Active | Maintenance | Suspended
 *
 * Depends on:
 *   - typeorm decorators
 *
 * Side-effects: none
 *
 * Key invariants:
 *   - code is unique identifier (NSE, BSE, MCX, NASDAQ)
 *   - dataProviderCode links exchange to data provider adapter
 *   - executionProviderCode links exchange to order execution connector
 *   - segment controls which instrument segments this exchange supports
 *
 * Read order:
 *   1. ExchangeEntity — entity shape (this file)
 *   2. InstrumentsService — instrument linking to exchanges
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-09
 */

import { registerEnumType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

// Enums
export enum ExchangeSegment {
  EQUITY = 'EQUITY',
  FNO = 'FNO',
  COM = 'COM',
  CDS = 'CDS',
  ALL = 'ALL',
}
registerEnumType(ExchangeSegment, { name: 'ExchangeSegment' });

export enum ExchangeStatus {
  ACTIVE = 'Active',
  MAINTENANCE = 'Maintenance',
  SUSPENDED = 'Suspended',
}
registerEnumType(ExchangeStatus, { name: 'ExchangeStatus' });

@Entity('exchanges')
@Unique(['code'])
@Index('idx_exchanges_code', ['code'])
export class ExchangeEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id!: string;

  @Column({ name: 'code', type: 'varchar', length: 16 })
  code!: string; // e.g., NSE, BSE, MCX, NASDAQ

  @Column({ name: 'name', type: 'varchar', length: 128 })
  name!: string;

  @Column({ name: 'country', type: 'varchar', length: 64, nullable: true })
  country?: string | null;

  @Column({ name: 'timezone', type: 'varchar', length: 64, nullable: true })
  timezone?: string | null;

  // ─── SEGMENT SUPPORT ───────────────────────────────────────────────────
  @Column({ name: 'segment', type: 'varchar', length: 16, default: 'ALL' })
  segment!: ExchangeSegment; // EQUITY, FNO, COM, CDS, ALL

  // ─── STATUS & CONTROL ────────────────────────────────────────────────────────
  @Column({ name: 'status', type: 'varchar', length: 16, default: 'Active' })
  status!: ExchangeStatus;

  // ─── PROVIDER CONFIGURATION ─────────────────────────────────────────────
  @Column({ name: 'data_provider_code', type: 'varchar', length: 32, nullable: true })
  dataProviderCode?: string | null; // 'KITE', 'ALPACA', 'BINANCE', 'GENERIC_REST'

  @Column({ name: 'execution_provider_code', type: 'varchar', length: 32, nullable: true })
  executionProviderCode?: string | null; // Which connector handles orders

  // ─── TRADING HOURS ─────────────────────────────────────────────────
  @Column({ name: 'regular_open', type: 'varchar', length: 8, default: '09:15' })
  regularOpen!: string; // "09:15"

  @Column({ name: 'regular_close', type: 'varchar', length: 8, default: '15:30' })
  regularClose!: string; // "15:30"

  @Column({ name: 'pre_market_open', type: 'varchar', length: 8, nullable: true })
  preMarketOpen?: string | null; // "09:00"

  @Column({ name: 'pre_market_close', type: 'varchar', length: 8, nullable: true })
  preMarketClose?: string | null; // "09:15"

  @Column({ name: 'currency', type: 'varchar', length: 8, default: 'INR' })
  currency!: string; // INR, USD, etc.

  @Column({ name: 'lot_multiplier', type: 'numeric', precision: 12, scale: 4, nullable: true })
  lotMultiplier?: number | null; // Display multiplier

  // ─── CONFIG ─────────────────────────────────────────────────────
  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
