/**
 * @file src/modules/realtime/prana-stream/tests/gateway.gateway.spec.ts
 * @module realtime/prana-stream
 * @description Gateway smoke tests using Nest testing module
 * @author BharatERP
 * @created 2025-09-24
 */

import { Test } from '@nestjs/testing';
import { PranaStreamGateway } from '../gateway/prana-stream.gateway';
import { SubscriptionRegistryService } from '../services/subscription-registry.service';
import { RealtimeAggregatorService } from '../services/realtime-aggregator.service';
import { RealtimeScaleCoordinatorService } from '../services/realtime-scale-coordinator.service';
import { RealtimeBackpressureService } from '../services/realtime-backpressure.service';
import { RealtimeEventBufferService } from '../services/realtime-event-buffer.service';
import { RealtimeOfflineFallbackService } from '../services/realtime-offline-fallback.service';
import { RealtimeTickFanoutService } from '../services/realtime-tick-fanout.service';
import { AppLoggerService } from '../../../../shared/logger';
import { WsJwtGuard } from '../guards/ws-jwt.guard';
import { JwtService } from '@nestjs/jwt';

describe('PranaStreamGateway', () => {
  it('constructs', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PranaStreamGateway,
        SubscriptionRegistryService,
        { provide: RealtimeAggregatorService, useValue: { bindServer: () => {}, getSnapshots: async () => ({}), recomputeMarketSubscriptions: async () => {} } },
        { provide: RealtimeScaleCoordinatorService, useValue: { registerInstance: async () => undefined, unregisterInstance: async () => undefined } },
        { provide: RealtimeBackpressureService, useValue: { attachToServer: () => undefined } },
        { provide: RealtimeEventBufferService, useValue: { record: () => 1, replay: () => [], getLatestSeq: () => 0, pruneOlderThan: () => undefined } },
        { provide: RealtimeOfflineFallbackService, useValue: { flushMissedEvents: async () => [], clearMissed: async () => undefined } },
        { provide: RealtimeTickFanoutService, useValue: { onSubscriptionsChanged: () => {} } },
        { provide: WsJwtGuard, useValue: { canActivate: async () => true } },
        { provide: JwtService, useValue: { verifyAsync: async () => ({ sub: 'u1', tid: 't1' }) } },
        AppLoggerService,
      ],
    }).compile();
    const gw = moduleRef.get(PranaStreamGateway);
    expect(gw).toBeTruthy();
  });
});


