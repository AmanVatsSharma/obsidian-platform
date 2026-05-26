/**
 * @file src/shared/messaging/messaging.module.ts
 * @module shared/messaging
 * @description Global messaging module providing IMessagePublisher backed by Redis Pub/Sub.
 *              Phase 4 upgrade path: swap RedisPublisher for KafkaPublisher by changing the
 *              useClass below — all consumers stay the same.
 * @author BharatERP
 * @created 2026-02-19
 * @last-updated 2026-05-22
 */

import { Module } from '@nestjs/common';
import { RedisPublisher } from './redis.publisher';

export const MESSAGE_PUBLISHER = 'IMessagePublisher';

@Module({
  imports: [],
  providers: [
    RedisPublisher,
    { provide: MESSAGE_PUBLISHER, useClass: RedisPublisher },
  ],
  exports: [MESSAGE_PUBLISHER, RedisPublisher],
})
export class MessagingModule {}