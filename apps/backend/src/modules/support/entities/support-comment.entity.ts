/**
 * @file src/modules/support/entities/support-comment.entity.ts
 * @module support
 * @description Support comment entity for ticket thread
 * @author BharatERP
 * @created 2026-02-19
 */

import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('support_comments')
export class SupportCommentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  ticketId!: string;

  @Column({ type: 'uuid' })
  authorId!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ type: 'boolean', default: false })
  isInternal!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
