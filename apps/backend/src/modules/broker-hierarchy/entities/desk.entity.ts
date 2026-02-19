/**
 * @file src/modules/broker-hierarchy/entities/desk.entity.ts
 * @module broker-hierarchy
 * @description Trading desk under branch hierarchy
 * @author BharatERP
 * @created 2026-02-17
 */

import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('broker_desks')
export class DeskEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  branchId!: string;

  @Column({ type: 'varchar', length: 128 })
  deskCode!: string;

  @Column({ type: 'varchar', length: 255 })
  displayName!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
