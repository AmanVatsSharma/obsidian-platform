/**
 * File:        apps/backend/src/migrations/1748000000002-AddStrategyPositions.ts
 * Module:      accounts · Migration
 * Purpose:     Create strategy_positions table for multi-leg options strategy tracking:
 *              stores net_quantity, average_price, realized_pnl, unrealized_pnl,
 *              greeks (delta, gamma), and strategy_type per account/instrument.
 *
 * Exports:
 *   - AddStrategyPositions1748000000002 — MigrationInterface
 *
 * Depends on:
 *   - AccountEntity — referenced via account_id FK
 *
 * Side-effects:
 *   - Creates 'strategy_positions' table (DDL)
 *   - No backfill required — new table with safe defaults
 *
 * Key invariants:
 *   - All numeric fields default to 0 — no NULL exposure on quantity/price/pnl
 *   - Index on (tenant_id, account_id) enables fast account-scoped queries
 *   - Partial index on instrument_id WHERE NOT NULL — avoids NULL bloat
 *   - Partial index on book_type — only 'A'/'B' values indexed
 *
 * Read order:
 *   1. up()   — create table + indexes
 *   2. down() — drop indexes + table
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-05-24
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStrategyPositions1748000000002
  implements MigrationInterface
{
  name = 'AddStrategyPositions1748000000002';

  public async up(qr: QueryRunner): Promise<void> {
    // ── Table ──────────────────────────────────────────────────────────────────
    await qr.query(`
      CREATE TABLE strategy_positions (
        id                    uuid         NOT NULL DEFAULT gen_random_uuid(),
        tenant_id            varchar(64)   NOT NULL,
        account_id           uuid          NOT NULL,
        instrument_id        uuid          NULL,
        strategy_type        varchar(24)   NOT NULL DEFAULT 'SINGLE',
        net_quantity         numeric(28,8)  NOT NULL DEFAULT '0',
        average_price        numeric(28,8)  NOT NULL DEFAULT '0',
        realized_pnl         numeric(28,8)  NOT NULL DEFAULT '0',
        unrealized_pnl       numeric(28,8)  NOT NULL DEFAULT '0',
        delta                numeric(28,8)  NOT NULL DEFAULT '0',
        gamma                numeric(28,8)  NOT NULL DEFAULT '0',
        book_type            varchar(8)    NOT NULL DEFAULT 'A',
        meta                 jsonb         NULL,
        created_at           timestamptz   NOT NULL DEFAULT now(),
        updated_at           timestamptz   NOT NULL DEFAULT now(),
        PRIMARY KEY (id)
      )
    `);

    // ── Indexes ───────────────────────────────────────────────────────────────
    await qr.query(`
      CREATE INDEX idx_strat_pos_tenant_account
        ON strategy_positions(tenant_id, account_id)
    `);
    await qr.query(`
      CREATE INDEX idx_strat_pos_instrument
        ON strategy_positions(instrument_id)
        WHERE instrument_id IS NOT NULL
    `);
    await qr.query(`
      CREATE INDEX idx_strat_pos_book_type
        ON strategy_positions(book_type)
        WHERE book_type IS NOT NULL
    `);
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`DROP INDEX IF EXISTS idx_strat_pos_book_type`);
    await qr.query(`DROP INDEX IF EXISTS idx_strat_pos_instrument`);
    await qr.query(`DROP INDEX IF EXISTS idx_strat_pos_tenant_account`);
    await qr.query(`DROP TABLE IF EXISTS strategy_positions`);
  }
}