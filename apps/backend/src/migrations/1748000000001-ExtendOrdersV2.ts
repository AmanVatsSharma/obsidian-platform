/**
 * File:        apps/backend/src/migrations/1748000000001-ExtendOrdersV2.ts
 * Module:      oms · Migration
 * Purpose:     Extend orders table with bracket/conditional/algo fields:
 *              parent_order_id, order_role, trigger_price, trigger_condition,
 *              trailing_dist, trailing_pct, filled_qty, remaining_qty,
 *              algo_type, algo_meta. Backfill existing orders.
 *
 * Exports:
 *   - ExtendOrdersV2 — MigrationInterface
 *
 * Depends on:
 *   - OrderEntity — defined in oms/entities/order.entity.ts
 *
 * Side-effects:
 *   - Alters 'orders' table (nullable columns + indexes)
 *   - Updates existing rows (backfill filledQty/remainingQty)
 *
 * Key invariants:
 *   - All new columns are nullable — zero-breaking-change migration
 *   - Backfill only touches FILLED/CANCELLED/REJECTED orders (safe — no open positions)
 *   - Indexes are partial (WHERE parent_order_id IS NOT NULL) — avoids index bloat
 *
 * Read order:
 *   1. up()   — add columns + indexes + backfill
 *   2. down() — drop indexes + columns (in reverse order)
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-05-24
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExtendOrdersV21748000000001 implements MigrationInterface {
  name = 'ExtendOrdersV21748000000001';

  public async up(qr: QueryRunner): Promise<void> {
    // ── Phase 1: Add nullable columns ──────────────────────────────────────────
    await qr.query(`
      ALTER TABLE orders
        ADD COLUMN parent_order_id uuid NULL,
        ADD COLUMN order_role varchar(16) NULL,
        ADD COLUMN trigger_price numeric(28,8) NULL,
        ADD COLUMN trigger_condition varchar(16) NULL,
        ADD COLUMN trailing_dist numeric(28,8) NULL,
        ADD COLUMN trailing_pct numeric(8,4) NULL,
        ADD COLUMN filled_qty numeric(28,8) NOT NULL DEFAULT '0',
        ADD COLUMN remaining_qty numeric(28,8) NOT NULL,
        ADD COLUMN algo_type varchar(24) NULL,
        ADD COLUMN algo_meta jsonb NULL
    `);

    // ── Phase 2: Add indexes ───────────────────────────────────────────────────
    await qr.query(`
      CREATE INDEX idx_orders_parent
        ON orders(parent_order_id)
        WHERE parent_order_id IS NOT NULL
    `);
    await qr.query(`
      CREATE INDEX idx_orders_role
        ON orders(order_role)
        WHERE order_role IS NOT NULL
    `);
    await qr.query(`
      CREATE INDEX idx_orders_algo_type
        ON orders(algo_type)
        WHERE algo_type IS NOT NULL
    `);
    await qr.query(`
      CREATE INDEX idx_orders_status_filled
        ON orders(status)
        WHERE status IN ('NEW','PLACED','PARTIALLY_FILLED')
    `);

    // ── Phase 3: Backfill existing orders ─────────────────────────────────────
    // FILLED/CANCELLED/REJECTED orders: set filledQty=quantity, remainingQty=0
    // NEW/PLACED orders: set filledQty=0, remainingQty=quantity
    await qr.query(`
      UPDATE orders
      SET
        filled_qty = quantity,
        remaining_qty = '0'
      WHERE status IN ('FILLED', 'CANCELLED', 'REJECTED')
        AND filled_qty = '0'
    `);
    await qr.query(`
      UPDATE orders
      SET
        filled_qty = '0',
        remaining_qty = quantity
      WHERE status IN ('NEW', 'PLACED')
        AND (filled_qty = '0' OR remaining_qty = '0')
    `);
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`DROP INDEX IF EXISTS idx_orders_status_filled`);
    await qr.query(`DROP INDEX IF EXISTS idx_orders_algo_type`);
    await qr.query(`DROP INDEX IF EXISTS idx_orders_role`);
    await qr.query(`DROP INDEX IF EXISTS idx_orders_parent`);
    await qr.query(`
      ALTER TABLE orders
        DROP COLUMN parent_order_id,
        DROP COLUMN order_role,
        DROP COLUMN trigger_price,
        DROP COLUMN trigger_condition,
        DROP COLUMN trailing_dist,
        DROP COLUMN trailing_pct,
        DROP COLUMN filled_qty,
        DROP COLUMN remaining_qty,
        DROP COLUMN algo_type,
        DROP COLUMN algo_meta
    `);
  }
}