/**
 * @file src/modules/market/entities/watchlist-item.entity.ts
 * @module market
 * @description Watchlist item linking user watchlists to instruments
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

@Entity('watchlist_items')
@Index('idx_watchlist_items_watchlist', ['watchlistId'])
export class WatchlistItemEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id!: string;

  @Column({ name: 'watchlist_id', type: 'uuid' })
  watchlistId!: string;

  @Column({ name: 'instrument_id', type: 'uuid' })
  instrumentId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
