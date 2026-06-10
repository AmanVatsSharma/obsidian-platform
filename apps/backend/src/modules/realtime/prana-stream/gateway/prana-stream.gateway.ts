/**
 * @file src/modules/realtime/prana-stream/gateway/prana-stream.gateway.ts
 * @module realtime/prana-stream
 * @description Socket.IO gateway exposing unified realtime stream endpoint
 * @author BharatERP
 * @created 2025-09-24
 */

import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { AppLoggerService } from '../../../../shared/logger';
import { SubscriptionRegistryService } from '../services/subscription-registry.service';
import { WsJwtGuard } from '../guards/ws-jwt.guard';
import { RealtimeAggregatorService } from '../services/realtime-aggregator.service';
import { RealtimeScaleCoordinatorService } from '../services/realtime-scale-coordinator.service';
import { RealtimeBackpressureService } from '../services/realtime-backpressure.service';

type SubscribePayload = {
  watchlist?: Array<{ exchange: string; symbol: string }>;
  orders?: boolean;
  positions?: boolean;
  accounts?: boolean;
};

type OrderBookSubscribePayload = {
  channel: 'orderbook';
  exchange: string;
  symbol: string;
};

@WebSocketGateway({ namespace: '/ws/prana', cors: { origin: '*' } })
@UseGuards(WsJwtGuard)
export class PranaStreamGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  private server!: Server;

  constructor(
    private readonly logger: AppLoggerService,
    private readonly subs: SubscriptionRegistryService,
    private readonly aggregator: RealtimeAggregatorService,
    private readonly scaleCoordinator: RealtimeScaleCoordinatorService,
    private readonly backpressure: RealtimeBackpressureService,
  ) {
    this.logger.setContext(PranaStreamGateway.name);
  }

  afterInit(): void {
    // Bind the backpressure tracker to the live Socket.IO server. The
    // tracker listens to `connection` / `disconnect` and periodically
    // force-disconnects sockets whose transport buffer is full.
    this.backpressure.attachToServer(this.server);
    this.logger.debug('Backpressure service attached to server');
  }

  handleConnection(client: Socket): void {
    const userId = (client.handshake.auth?.userId as string) || '';
    client.join(`user:${userId}`);
    this.logger.debug('client connected', { userId, id: client.id });
    this.aggregator.bindServer(this.server);
    // Register the session with the scale coordinator so outbox events
    // for this userId are routed to this pod.
    void this.scaleCoordinator.registerInstance(userId, client.id);
    this.aggregator.recomputeMarketSubscriptions().catch(() => undefined);
  }

  handleDisconnect(client: Socket): void {
    const userId = (client.handshake.auth?.userId as string) || '';
    this.subs.removeAll(client.id);
    void this.scaleCoordinator.unregisterInstance(userId, client.id);
    this.logger.debug('client disconnected', { userId, id: client.id });
    this.aggregator.recomputeMarketSubscriptions().catch(() => undefined);
  }

  @SubscribeMessage('unsubscribe')
  async unsubscribe(client: Socket, @MessageBody() payload: SubscribePayload) {
    const userId = (client.handshake.auth?.userId as string) || '';
    await this.subs.remove(client.id, payload);
    await this.aggregator.recomputeMarketSubscriptions();
    return { ok: true };
  }

  /**
   * Unified subscribe handler supporting both domain subscriptions (watchlist/orders/positions/accounts)
   * and orderbook channel subscriptions. Orderbook payloads have channel === 'orderbook'.
   */
  @SubscribeMessage('subscribe')
  async subscribe(client: Socket, @MessageBody() payload: SubscribePayload | OrderBookSubscribePayload) {
    if ((payload as OrderBookSubscribePayload).channel === 'orderbook') {
      const ob = payload as OrderBookSubscribePayload;
      const key = `${ob.exchange}:${ob.symbol}`.toUpperCase();
      client.join(`orderbook:${key}`);
      this.logger.debug('orderbook subscription registered', { key, clientId: client.id });
      return { ok: true, key };
    }
    const p = payload as SubscribePayload;
    const userId = (client.handshake.auth?.userId as string) || '';
    const tenantId = (client.handshake.auth?.tenantId as string) || '';
    await this.subs.apply(client.id, userId, p);
    await this.aggregator.recomputeMarketSubscriptions();
    const snapshots = await this.aggregator.getSnapshots(userId, tenantId, p);
    if (snapshots) client.emit('snapshot', snapshots);
    return { ok: true };
  }
}


