/**
 * @file src/modules/realtime/prana-stream/tests/prana-stream.aggregator.spec.ts
 * @module realtime/prana-stream
 * @description Tests for RealtimeAggregatorService throttling and diffing
 * @author BharatERP
 * @created 2025-09-24
 * @last-updated 2026-06-10
 */

import { RealtimeAggregatorService } from '../services/realtime-aggregator.service';
import { SubscriptionRegistryService } from '../services/subscription-registry.service';
import { CompositeMarketDataAdapter } from '../adapters/composite-market-data.adapter';
import { AppLoggerService } from '../../../../shared/logger';

describe('RealtimeAggregatorService', () => {
  it('constructs successfully (smoke)', () => {
    const logger = new AppLoggerService();
    const subs = new SubscriptionRegistryService(logger);
    const noopRepo = {} as any;
    const market = {
      onTicks: () => undefined,
      getSnapshot: async () => [],
    } as unknown as CompositeMarketDataAdapter;
    const ltpCache = { getMany: async () => new Map() } as any;
    const eventBuffer = { record: () => 1 } as any;
    const offlineFallback = { isUserOnline: async () => true, recordMissed: async () => undefined } as any;
    const svc = new RealtimeAggregatorService(
      noopRepo, // accountsRepo
      noopRepo, // ordersRepo
      noopRepo, // positionsRepo
      noopRepo, // cashRepo
      noopRepo, // holdsRepo
      logger,
      subs,
      market,
      eventBuffer,
      ltpCache,
      offlineFallback,
    );
    expect(svc).toBeTruthy();
  });
});
