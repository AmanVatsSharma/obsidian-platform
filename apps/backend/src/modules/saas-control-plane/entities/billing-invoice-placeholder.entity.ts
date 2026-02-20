/**
 * @file src/modules/saas-control-plane/entities/billing-invoice-placeholder.entity.ts
 * @module saas-control-plane
 * @description Billing placeholder entity for invoice lifecycle scaffolding
 * @author BharatERP
 * @created 2026-02-17
 */

import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('billing_invoice_placeholders')
export class BillingInvoicePlaceholderEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'varchar', length: 64 })
  invoiceNumber!: string;

  @Column({ type: 'decimal', precision: 20, scale: 4 })
  amount!: string;

  @Column({ type: 'varchar', length: 8 })
  currency!: string;

  @Column({ type: 'varchar', length: 32, default: 'DRAFT' })
  status!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
