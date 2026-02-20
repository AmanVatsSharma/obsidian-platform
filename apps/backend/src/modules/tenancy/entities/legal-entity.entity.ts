/**
 * @file src/modules/tenancy/entities/legal-entity.entity.ts
 * @module tenancy
 * @description Legal entity records mapped under tenants for jurisdictional compliance
 * @author BharatERP
 * @created 2026-02-17
 */

import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('legal_entities')
export class LegalEntityEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'varchar', length: 255 })
  legalName!: string;

  @Column({ type: 'varchar', length: 64 })
  registrationNumber!: string;

  @Column({ type: 'varchar', length: 3 })
  countryCode!: string;

  @Column({ type: 'varchar', length: 16, default: 'PRIMARY' })
  type!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
