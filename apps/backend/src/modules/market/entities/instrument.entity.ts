/**
 * @file src/modules/market/entities/instrument.entity.ts
 * @module market
 * @description Instrument entity across equities/forex/crypto with exchange linkage
 * @author BharatERP
 * @created 2025-09-19
 */

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('instruments')
@Index('idx_instruments_symbol_exchange', ['symbol', 'exchangeCode'])
export class InstrumentEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id!: string;

  @Column({ name: 'exchange_code', type: 'varchar', length: 16 })
  exchangeCode!: string; // references exchanges.code

  @Column({ name: 'symbol', type: 'varchar', length: 64 })
  symbol!: string; // e.g., INFY, AAPL, EURUSD, BTCUSDT

  @Column({ name: 'type', type: 'varchar', length: 16 })
  type!: 'EQUITY' | 'FOREX' | 'CRYPTO' | 'FNO' | 'ETF';

  @Column({ name: 'display_name', type: 'varchar', length: 128 })
  displayName!: string;

  @Column({
    name: 'tick_size',
    type: 'numeric',
    precision: 18,
    scale: 8,
    default: 0.01,
  })
  tickSize!: string;

  @Column({
    name: 'lot_size',
    type: 'numeric',
    precision: 18,
    scale: 4,
    default: 1,
  })
  lotSize!: string;

  @Column({ name: 'meta', type: 'jsonb', nullable: true })
  meta?: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
