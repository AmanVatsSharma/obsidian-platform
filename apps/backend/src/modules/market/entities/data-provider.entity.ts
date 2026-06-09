/**
 * File:        apps/backend/src/modules/market/entities/data-provider.entity.ts
 * Module:      market · Entities
 * Purpose:     Data provider configuration for multi-provider market data support.
 *              Enables switching between Kite, Alpaca, Binance, etc.
 *
 * Exports:
 *   - DataProviderEntity — provider configuration
 *   - ProviderType — DATA | EXECUTION | BOTH
 *   - ProviderStatus — CONNECTED | DISCONNECTED | ERROR
 *
 * Depends on:
 *   - typeorm decorators
 *   - @nestjs/graphql
 *
 * Side-effects:
 *   - Credentials stored (encrypted at rest in production)
 *
 * Key invariants:
 *   - code uniquely identifies provider (KITE, ALPACA, BINANCE)
 *   - Only one provider per code per tenant
 *   - Health status updated by monitoring service
 *
 * Read order:
 *   1. DataProviderEntity — provider config
 *   2. DataProviderRegistry — provider resolution
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
export enum ProviderType {
  DATA = 'data',
  EXECUTION = 'execution',
  BOTH = 'both',
}
registerEnumType(ProviderType, { name: 'ProviderType' });

export enum ProviderStatus {
  CONNECTED = 'Connected',
  DISCONNECTED = 'Disconnected',
  ERROR = 'Error',
}
registerEnumType(ProviderStatus, { name: 'ProviderStatus' });

@Entity('data_providers')
@Unique(['code'])
@Index('idx_providers_code', ['code'])
export class DataProviderEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id!: string;

  @Column({ name: 'code', type: 'varchar', length: 32 })
  code!: string; // KITE, ALPACA, BINANCE, GENERIC_REST

  @Column({ name: 'name', type: 'varchar', length: 128 })
  name!: string; // "Zerodha Kite Connect"

  // ─── TYPE ─────────────────────────────────────────────────────
  @Column({ name: 'provider_type', type: 'varchar', length: 16, default: 'data' })
  providerType!: ProviderType;

  // ─── CREDENTIALS (encrypted in production) ───────────────────
  @Column({ name: 'api_key', type: 'varchar', length: 256, nullable: true })
  apiKey?: string | null;

  @Column({ name: 'api_secret', type: 'varchar', length: 256, nullable: true })
  apiSecret?: string | null;

  @Column({ name: 'access_token', type: 'varchar', length: 512, nullable: true })
  accessToken?: string | null;

  @Column({ name: 'refresh_token', type: 'varchar', length: 512, nullable: true })
  refreshToken?: string | null;

  @Column({ name: 'webhook_secret', type: 'varchar', length: 256, nullable: true })
  webhookSecret?: string | null;

  // ─── ENDPOINTS ───────────────────────────────────────────────
  @Column({ name: 'base_url', type: 'varchar', length: 256, nullable: true })
  baseUrl?: string | null;

  @Column({ name: 'ws_url', type: 'varchar', length: 256, nullable: true })
  wsUrl?: string | null;

  // ─── RATE LIMITS ────────────────────────────────────────────
  @Column({ name: 'rate_limit_per_second', type: 'int', nullable: true })
  rateLimitPerSecond?: number | null;

  @Column({ name: 'rate_limit_per_minute', type: 'int', nullable: true })
  rateLimitPerMinute?: number | null;

  // ─── HEALTH STATUS ──────────────────────────────────────────
  @Column({ name: 'status', type: 'varchar', length: 16, default: 'Disconnected' })
  status!: ProviderStatus;

  @Column({ name: 'last_health_check', type: 'timestamp', nullable: true })
  lastHealthCheck?: Date | null;

  @Column({ name: 'last_error', type: 'varchar', length: 512, nullable: true })
  lastError?: string | null;

  @Column({ name: 'latency_ms', type: 'int', nullable: true })
  latencyMs?: number | null;

  // ─── STATS ────────────────────────────────────────────────
  @Column({ name: 'instrument_count', type: 'int', default: 0 })
  instrumentCount!: number;

  @Column({ name: 'quote_count_today', type: 'bigint', default: 0 })
  quoteCountToday!: number;

  // ─── EXCHANGE MAPPINGS ─────────────────────────────────
  @Column({ name: 'exchanges', type: 'varchar', length: 256, nullable: true })
  exchanges?: string | null; // Comma-separated: NSE,BSE,MCX

  // Note: execution is handled by your own B-book. Kite is data-only.

  // ─── CONFIG ─────────────────────────────────────────────────────
  @Column({ name: 'is_enabled', type: 'boolean', default: true })
  isEnabled!: boolean;

  @Column({ name: 'priority', type: 'int', default: 0 })
  priority!: number; // Higher = preferred

  @Column({ name: 'meta', type: 'jsonb', nullable: true })
  meta?: Record<string, unknown> | null; // Provider-specific config

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Helper to get exchanges array
  getExchanges(): string[] {
    if (!this.exchanges) return [];
    return this.exchanges.split(',').map(s => s.trim()).filter(Boolean);
  }
}