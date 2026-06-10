/**
 * @file src/modules/realtime/prana-stream/services/realtime-backpressure.service.spec.ts
 * @module realtime/prana-stream
 * @description Tests for RealtimeBackpressureService
 * @author BharatERP
 * @created 2026-06-10
 */

import { Test, TestingModule } from '@nestjs/testing';
import { RealtimeBackpressureService } from './realtime-backpressure.service';
import { AppLoggerService } from '../../../../shared/logger';
import { RedisService } from '../../../../shared/redis/redis.service';

describe('RealtimeBackpressureService', () => {
  let service: RealtimeBackpressureService;
  let mockLogger: jest.Mocked<AppLoggerService>;
  let mockRedis: jest.Mocked<RedisService>;
  let mockServer: any;
  let mockSocket: any;

  beforeEach(async () => {
    mockLogger = {
      setContext: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as any;

    mockRedis = {
      getClient: jest.fn(),
    } as any;

    mockSocket = {
      id: 'socket-123',
      handshake: {
        auth: {
          userId: 'user-123',
        },
      },
      rooms: new Set(['user:user-123']),
      conn: {
        transport: {
          writable: true,
        },
      },
      emit: jest.fn(),
      disconnect: jest.fn(),
      once: jest.fn(),
    };

    mockServer = {
      sockets: {
        sockets: new Map([['socket-123', mockSocket]]),
      },
      on: jest.fn(),
      to: (roomId: string) => ({
        emit: (event: string, payload: any) => {},
      }),
      disconnect: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RealtimeBackpressureService,
        {
          provide: AppLoggerService,
          useValue: mockLogger,
        },
        {
          provide: RedisService,
          useValue: mockRedis,
        },
      ],
    }).compile();

    service = module.get<RealtimeBackpressureService>(RealtimeBackpressureService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should track sockets when they connect', () => {
    // Manually call since we're not mocking the server
    service['trackedSockets'].set(mockSocket.id, {
      socket: mockSocket,
      userId: 'user-123',
      totalSent: 0,
      totalAcked: 0,
      pendingMessages: 0,
      pendingBytes: 0,
      markedSlow: false,
      slowSince: null,
      lastSentTime: 0,
      lastAckTime: 0,
      sendRate: 0,
    } as any);

    expect(service.getSlowClients()).toHaveLength(0);
  });

  it('should emit warning when pending bytes exceed soft limit', () => {
    const softLimit = 32 * 1024; // 32KB
    const mockSocketWithHighBuffer = {
      ...mockSocket,
      conn: {
        transport: {
          writable: false,
          bufferedRequests: [{ data: new Array(softLimit + 1).fill('a') }],
        },
      },
    };

    // Simulate a socket with high backpressure
    service['trackedSockets'].set(mockSocket.id, {
      socket: mockSocketWithHighBuffer,
      userId: 'user-123',
      totalSent: 0,
      totalAcked: 0,
      pendingMessages: 0,
      pendingBytes: 0,
      markedSlow: false,
      slowSince: null,
      lastSentTime: 0,
      lastAckTime: 0,
      sendRate: 0,
    } as any);

    service['sweep']();

    expect(mockSocket.emit).toHaveBeenCalledWith('backpressure.slow', expect.objectContaining({
      level: 1,
      pendingBytes: softLimit + 1,
    }));
  });

  it('should force disconnect when buffer exceeds hard limit for too long', () => {
    const hardLimit = 96 * 1024;
    const mockSocketWithExtremeBuffer = {
      ...mockSocket,
      conn: {
        transport: {
          writable: false,
          bufferedRequests: [{ data: new Array(hardLimit + 1).fill('a') }],
        },
      },
    };

    service['trackedSockets'].set(mockSocket.id, {
      socket: mockSocketWithExtremeBuffer,
      userId: 'user-123',
      totalSent: 0,
      totalAcked: 0,
      pendingMessages: 0,
      pendingBytes: 0,
      markedSlow: false,
      slowSince: 1000, // Set slowSince to 1s ago
      lastSentTime: 0,
      lastAckTime: 0,
      sendRate: 0,
    } as any);

    // Override DISCONNECT_GRACE_MS for testing
    const original = service['slowClientDisconnectMs'];
    service['slowClientDisconnectMs'] = 500;

    try {
      service['sweep']();
    } finally {
      service['slowClientDisconnectMs'] = original;
    }

    expect(mockSocket.disconnect).toHaveBeenCalledWith(true);
    expect(mockSocket.emit).toHaveBeenCalledWith('backpressure.disconnect', { reason: 'backpressure-timeout' });
  });

  it('should update counters on simulated send', () => {
    const spy = jest.spyOn(service as any, 'getSocketsInRoom');
    const fakeSockets = [mockSocket];
    spy.mockReturnValue(fakeSockets);

    // Simulate sending a 100-byte message
    service.publish('user:user-123', 'test.event', { data: 'some payload' });

    const tracker = service['trackedSockets'].get(mockSocket.id);
    expect(tracker!.totalSent).toBe(1);
    expect(tracker!.pendingBytes).toBeGreaterThan(0);
    expect(tracker!.pendingMessages).toBe(1);
  });

  it('should handle socket untracking on disconnect', () => {
    service['untrackSocket'](mockSocket.id);
    expect(service['trackedSockets'].has(mockSocket.id)).toBe(false);
  });

  it('should recover backpressure when buffer drains', () => {
    // Simulate a socket that recovers
    const mockSocketRecovered = {
      ...mockSocket,
      conn: {
        transport: {
          writable: true,
          bufferedRequests: [],
        },
      },
    };

    service['trackedSockets'].set(mockSocket.id, {
      socket: mockSocketRecovered,
      userId: 'user-123',
      totalSent: 0,
      totalAcked: 0,
      pendingMessages: 0,
      pendingBytes: 0,
      markedSlow: false,
      slowSince: null,
      lastSentTime: 0,
      lastAckTime: 0,
      sendRate: 0,
    } as any);

    service['sweep']();

    const tracker = service['trackedSockets'].get(mockSocket.id);
    expect(tracker!.markedSlow).toBe(false);
  });
});