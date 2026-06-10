/**
 * @file src/modules/market/services/ltp-cache.service.spec.ts
 * @module market
 * @description Tests for LtpCacheService
 * @author BharatERP
 * @created 2026-06-10
 */

import { Test, TestingModule } from '@nestjs/testing';
import { LtpCacheService } from './ltp-cache.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { AppLoggerService } from '../../../shared/logger';

describe('LtpCacheService', () => {
  let service: LtpCacheService;
  let mockRedis: any;
  let cache: Map<string, string>;

  beforeEach(async () => {
    cache = new Map();
    mockRedis = {
      getClient: jest.fn().mockReturnValue({
        set: jest.fn(async (key: string, value: string, ...args: any[]) => {
          cache.set(key, value);
          return 'OK';
        }),
        get: jest.fn(async (key: string) => cache.get(key) ?? null),
        mget: jest.fn(async (...keys: string[]) =>
          keys.map((k) => cache.get(k) ?? null),
        ),
        scan: jest.fn(async () => ['0', []]),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LtpCacheService,
        {
          provide: RedisService,
          useValue: mockRedis,
        },
        {
          provide: AppLoggerService,
          useValue: {
            setContext: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
            log: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LtpCacheService>(LtpCacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should set and get an LTP entry', async () => {
    await service.set('NSE', 'INFY', 1500, 1700000000);
    const result = await service.get('NSE', 'INFY');
    expect(result).toEqual({ price: 1500, ts: 1700000000 });
  });

  it('should return null on cache miss', async () => {
    const result = await service.get('NSE', 'UNKNOWN');
    expect(result).toBeNull();
  });

  it('should handle different case inputs as same key', async () => {
    await service.set('nse', 'infy', 1500, 1700000000);
    const result = await service.get('NSE', 'INFY');
    expect(result).toEqual({ price: 1500, ts: 1700000000 });
  });

  it('should batch read with getMany', async () => {
    await service.set('NSE', 'INFY1', 100, 1);
    await service.set('NSE', 'INFY2', 200, 2);
    const result = await service.getMany([
      { exchange: 'NSE', symbol: 'INFY1' },
      { exchange: 'NSE', symbol: 'INFY2' },
      { exchange: 'NSE', symbol: 'INFY3' },
    ]);
    expect(result.size).toBe(2);
    expect(result.get('NSE:INFY1')).toEqual({ price: 100, ts: 1 });
    expect(result.get('NSE:INFY2')).toEqual({ price: 200, ts: 2 });
  });

  it('should handle no Redis gracefully', async () => {
    mockRedis.getClient.mockReturnValue(undefined);
    const setResult = await service.set('NSE', 'INFY', 100, 1);
    expect(setResult).toBeUndefined();
    const getResult = await service.get('NSE', 'INFY');
    expect(getResult).toBeNull();
  });

  it('should return malformed entries as null', async () => {
    cache.set('ltp:NSE:BAD', 'not json');
    const result = await service.get('NSE', 'BAD');
    expect(result).toBeNull();
  });

  it('should build a snapshot object', async () => {
    await service.set('NSE', 'INFY1', 100, 1);
    await service.set('NSE', 'INFY2', 200, 2);
    const snapshot = await service.buildLtpSnapshot([
      { exchange: 'NSE', symbol: 'INFY1' },
      { exchange: 'NSE', symbol: 'INFY2' },
    ]);
    expect(snapshot['NSE:INFY1']).toEqual({ price: 100, ts: 1 });
    expect(snapshot['NSE:INFY2']).toEqual({ price: 200, ts: 2 });
  });
});