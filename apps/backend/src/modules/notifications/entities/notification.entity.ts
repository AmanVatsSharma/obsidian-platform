/**
 * @file src/modules/notifications/entities/notification.entity.ts
 * @module notifications
 * @description Notification log entity for tracking delivery status across channels
 * @author BharatERP
 * @created 2025-01-09
 */

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('notifications')
@Index('idx_notifications_user', ['tenantId', 'userId', 'createdAt'])
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id!: string;

  @Column({ name: 'tenant_id', type: 'varchar', length: 64 })
  tenantId!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'type', type: 'varchar', length: 64 })
  type!: string; // e.g., order.fill, deposit.approved, statement.ready

  @Column({ name: 'channel', type: 'varchar', length: 16 })
  channel!: 'email' | 'sms' | 'push' | 'in-app';

  @Column({ name: 'status', type: 'varchar', length: 16, default: 'pending' })
  status!: 'pending' | 'sent' | 'failed';

  @Column({ name: 'title', type: 'varchar', length: 160 })
  title!: string;

  @Column({ name: 'body', type: 'text' })
  body!: string;

  @Column({ name: 'meta', type: 'jsonb', nullable: true })
  meta?: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

