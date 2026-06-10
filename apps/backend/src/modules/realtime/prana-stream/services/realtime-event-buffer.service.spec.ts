/**
 * @file src/modules/realtime/prana-stream/services/realtime-event-buffer.service.spec.ts
 * @module realtime/prana-stream
 * @description Tests for RealtimeEventBufferService
 * @author BharatERP
 * @created 2026-06-10
 */

import { Test, TestingModule } from '@nestjs/testing';
import { RealtimeEventBufferService } from './realtime-event-buffer.service';
import { AppLoggerService } from '../../../../shared/logger';

describe('RealtimeEventBufferService', () => {
  let service: RealtimeEventBufferService;

  beforeEach(async () => {
    const mockLogger = {
      setContext: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RealtimeEventBufferService,
        {
          provide: AppLoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<RealtimeEventBufferService>(RealtimeEventBufferService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should record events and generate sequential seqs', () => {
    const userId = 'user123';
    const seq1 = service.record(userId, 'order.updated', { orderId: 'ord1' });
    const seq2 = service.record(userId, 'position.updated', { positionId: 'pos1' });
    expect(seq1).toBe(1);
    expect(seq2).toBe(2);
  });

  it('should replay events newer than fromSeq', () => {
    const userId = 'user123';
    service.record(userId, 'order.updated', { orderId: 'ord1' }); // seq 1
    service.record(userId, 'position.updated', { positionId: 'pos1' }); // seq 2
    service.record(userId, 'account.updated', { cash: 1000 }); // seq 3

    const replay = service.replay(userId, 1);
    expect(replay.length).toBe(2);
    expect(replay.map((e) => e.eventName)).toEqual([
      'position.updated',
      'account.updated',
    ]);
    expect(replay.map((e) => e.seq)).toEqual([2, 3]);
  });

  it('should return empty array if no newer events', () => {
    const userId = 'user123';
    service.record(userId, 'order.updated', { orderId: 'ord1' });
    const replay = service.replay(userId, 1);
    expect(replay).toEqual([]);
  });

  it('should evict old events when buffer is full', () => {
    // Force capacity to 3 for this test
    const capacity = 3;
    (service as any).capacity = capacity;

    const userId = 'user123';
    service.record(userId, 'order.updated', { orderId: 'ord1' }); // 1
    service.record(userId, 'order.updated', { orderId: 'ord2' }); // 2
    service.record(userId, 'order.updated', { orderId: 'ord3' }); // 3
    service.record(userId, 'order.updated', { orderId: 'ord4' }); // 4

    const replay = service.replay(userId, 0); // Expect all 4 in buffer, but only 3 remain
    expect(replay.length).toBe(3);
    expect(replay.map((e) => (e.data as any).orderId)).toEqual(['ord2', 'ord3', 'ord4']);
  });

  it('should get latest seq for a user', () => {
    const userId = 'user123';
    service.record(userId, 'order.updated', {});
    service.record(userId, 'order.updated', {});
    expect(service.getLatestSeq(userId)).toBe(2);
    expect(service.getLatestSeq('user999')).toBe(0);
  });

  it('should prune events older than or equal to seq', () => {
    const userId = 'user123';
    service.record(userId, 'order.updated', {}); // 1
    service.record(userId, 'order.updated', {}); // 2
    service.record(userId, 'order.updated', {}); // 3

    const pruned = service.pruneOlderThan(userId, 2);
    expect(pruned).toBe(2);
    const latestSeq = service.getLatestSeq(userId);
    expect(latestSeq).toBe(3);

    const replay = service.replay(userId, 0);
    expect(replay.length).toBe(1);
    expect(replay[0].seq).toBe(3);
  });

  it('should return stats for a user', () => {
    const userId = 'user123';
    (service as any).capacity = 10;
    service.record(userId, 'order.updated', {});
    service.record(userId, 'position.updated', {});

    const stats = service.getStats(userId);
    expect(stats.entries).toBe(2);
    expect(stats.capacity).toBe(10);
    expect(stats.latestSeq).toBe(2);
  });

  it('should clear buffer for a user', () => {
    const userId = 'user123';
    service.record(userId, 'order.updated', {});
    service.clear(userId);
    expect(service.getLatestSeq(userId)).toBe(0);
    expect((service as any).buffers.has(userId)).toBe(false);
  });
});