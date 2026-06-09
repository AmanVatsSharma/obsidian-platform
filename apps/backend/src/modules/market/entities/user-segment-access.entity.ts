/**
 * File:        apps/backend/src/modules/market/entities/user-segment-access.entity.ts
 * Module:      market · Segment Access
 * Purpose:     Per-user segment access control — which segments a user can trade,
 *              with per-type restrictions and value limits.
 *
 * Exports:
 *   - UserSegmentAccessEntity — TypeORM entity
 *
 * Key invariants:
 *   - Unique (userId, segment) — one access record per segment per user
 *   - allowedTypes: comma-separated list of InstrumentType
 *   - maxOrderValue: optional INR limit per order
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-09
 */

import {
  Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';
import { InstrumentSegment } from './instrument.entity';

@Entity({ name: 'user_segment_access' })
@Index(['userId', 'segment'], { unique: true })
@Index(['userId'])
@Index(['segment'])
export class UserSegmentAccessEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'enum', enum: InstrumentSegment })
  segment!: InstrumentSegment;

  @Column({ type: 'boolean', default: true })
  isEnabled!: boolean;

  /** Comma-separated list of allowed InstrumentType values */
  @Column({ type: 'varchar', length: 256, default: '' })
  allowedTypes!: string;

  /** Comma-separated list of blocked instrument IDs */
  @Column({ type: 'text', default: '' })
  blockedInstrumentIds!: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  maxOrderValue!: number | null;

  @Column({ type: 'int', nullable: true })
  maxOpenPositions!: number | null;

  @Column({ type: 'int', nullable: true })
  maxDailyTrades!: number | null;

  @Column({ type: 'uuid' })
  grantedBy!: string;

  @Column({ type: 'timestamptz' })
  grantedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}