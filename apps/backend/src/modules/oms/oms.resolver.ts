/**
 * File:        apps/backend/src/modules/oms/oms.resolver.ts
 * Module:      oms · GraphQL
 * Purpose:     GraphQL resolver for OMS — orders and positions via OrderService and PositionsService.
 *
 * Exports:
 *   - OmsResolver — @Query(() => OrderConnection), .order(), .positions(), .position()
 *                   @Mutation(() => OrderEntity) — placeOrder, cancelOrder, modifyOrder
 *
 * Depends on:
 *   - OrderService          — listAll, place, cancel, modify
 *   - PositionsService      — listAll (positions), listPositions (single account)
 *   - @obsidian/backend-auth — JwtAuthGuard
 *   - @obsidian/backend-rbac — TenantGuard, PermissionsGuard, Permissions
 *   - AppLoggerService      — structured logging
 *
 * Side-effects:
 *   - DB writes via place / cancel / modify mutations
 *   - Exchange calls via exchange adapter (resilience wrapped in service)
 *
 * Key invariants:
 *   - All queries are tenant-scoped via TenantGuard + request context
 *   - Mutations require oms:write permission
 *   - Resolver never touches TypeORM directly
 *
 * Read order:
 *   1. OmsResolver — endpoint definitions
 *   2. OrderService — business logic
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-19
 */

import { ObjectType, Field, ID, Int, Float, Resolver, Query, Mutation, Args, Union, createUnionType } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@obsidian/backend-auth';
import { TenantGuard } from '@obsidian/backend-rbac';
import { PermissionsGuard } from '@obsidian/backend-rbac';
import { Permissions } from '@obsidian/backend-rbac';
import { OrderService } from './services/order.service';
import { PositionsService } from './positions/services/positions.service';
import { AppLoggerService } from '../../shared/logger';
import { getRequestContext } from '../../shared/request-context';
import { PlaceOrderDto, CancelOrderDto, ModifyOrderDto } from './dtos/order.dto';
import { OrderEntity, OrderRejectionError } from './entities/order.entity';
import { AppError } from '../../common/errors/app-error';

/* ── GraphQL Unions ────────────────────────────────────────────────────────── */

const PlaceOrderResultUnion = createUnionType({
  name: 'PlaceOrderResult',
  types: () => [OrderEntity, OrderRejectionError] as const,
  resolveType(value: OrderEntity | OrderRejectionError) {
    if ('status' in value) return 'OrderEntity';
    return 'OrderRejectionError';
  },
});

/* ── GraphQL ObjectTypes ─────────────────────────────────────────────────────── */

@ObjectType()
export class OrderConnection {
  @Field(() => [OrderEntity])
  data!: OrderEntity[];

  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  limit!: number;

  @Field(() => Int)
  offset!: number;
}

@ObjectType()
export class PositionRow {
  @Field(() => ID)
  instrumentId!: string;

  @Field(() => Float)
  netQty!: number;

  @Field(() => Float)
  avgPrice!: number;

  @Field(() => Float)
  realizedPnl!: number;

  @Field(() => Float)
  lastPrice!: number;

  @Field(() => Float)
  mtmPnl!: number;

  @Field(() => Float)
  value!: number;
}

@ObjectType()
export class PositionConnection {
  @Field(() => [PositionRow])
  data!: PositionRow[];

  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  limit!: number;

  @Field(() => Int)
  offset!: number;
}

/* ── Resolver ──────────────────────────────────────────────────────────────── */

@Resolver()
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class OmsResolver {
  constructor(
    private readonly orderService: OrderService,
    private readonly positionsService: PositionsService,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(OmsResolver.name);
  }

  /* ── Queries ────────────────────────────────────────────────────────────── */

  @Query(() => OrderConnection, { name: 'orders' })
  @Permissions('oms:read')
  async orders(
    @Args('accountId', { type: () => ID, nullable: true }) accountId?: string,
    @Args('status', { nullable: true }) status?: string,
    @Args('side', { nullable: true }) side?: 'BUY' | 'SELL',
    @Args('symbol', { nullable: true }) symbol?: string,
    @Args('from', { nullable: true }) from?: string,
    @Args('to', { nullable: true }) to?: string,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number,
  ): Promise<OrderConnection> {
    const result = await this.orderService.listAll({ accountId, status, side, symbol, from, to, limit, offset });
    return { data: result.data, total: result.total, limit: limit ?? 20, offset: offset ?? 0 };
  }

  @Query(() => OrderEntity, { name: 'order', nullable: true })
  @Permissions('oms:read')
  async order(@Args('id', { type: () => ID }) id: string): Promise<OrderEntity | null> {
    this.logger.debug('OmsResolver.order()', { id });
    const ctx = getRequestContext();
    const result = await (this.orderService as any).orders.findOne({
      where: { id, tenantId: ctx.tenantId },
    });
    return result ?? null;
  }

  @Query(() => PositionConnection, { name: 'positions' })
  @Permissions('oms:read')
  async positions(
    @Args('accountId', { type: () => ID, nullable: true }) accountId?: string,
    @Args('currency', { nullable: true }) currency?: string,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number,
  ): Promise<PositionConnection> {
    this.logger.debug('OmsResolver.positions()', { accountId, currency, limit, offset });
    return this.positionsService.listAll({ accountId, currency, limit, offset });
  }

  @Query(() => [PositionRow], { name: 'position' })
  @Permissions('oms:read')
  async position(
    @Args('accountId', { type: () => ID }) accountId: string,
    @Args('currency', { nullable: true }) currency?: string,
  ): Promise<PositionRow[]> {
    this.logger.debug('OmsResolver.position()', { accountId, currency });
    const result = await this.positionsService.listPositions(accountId, currency);
    return result.rows;
  }

  @Query(() => [OrderEntity], { name: 'bracketChildren' })
  @Permissions('oms:read')
  async bracketChildren(@Args('parentOrderId', { type: () => ID }) parentOrderId: string): Promise<OrderEntity[]> {
    this.logger.debug('OmsResolver.bracketChildren()', { parentOrderId });
    return this.orderService.getBracketChildren(parentOrderId);
  }

  /* ── Mutations ──────────────────────────────────────────────────────────── */

  /**
   * Places an order. Returns OrderEntity on success, OrderRejectionError on rejection.
   * Thrown AppErrors (pre-trade validation) and exchange rejections are both
   * converted to OrderRejectionError so Apollo's onCompleted can distinguish
   * success from rejection by reading __typename.
   */
  @Mutation(() => PlaceOrderResultUnion)
  @Permissions('oms:write')
  async placeOrder(@Args('input') dto: PlaceOrderDto) {
    this.logger.debug('OmsResolver.placeOrder()', dto);
    try {
      const result = await this.orderService.place(dto);
      // Service returns { ok, order } on success or { ok: false, code, message } on rejection
      if ('ok' in result) {
        if (!result.ok) {
          const rejection = Object.assign(new OrderRejectionError(), {
            code: this.mapCode((result as { ok: false; code: string }).code),
            message: (result as { ok: false; message: string }).message,
            externalRefId: (result as { ok: false; externalRefId: string }).externalRefId ?? dto.externalRefId,
          });
          return rejection;
        }
        return (result).order;
      }
      return result as OrderEntity;
    } catch (error) {
      const code = error instanceof AppError ? error.code : 'UNKNOWN';
      const message = error instanceof AppError ? error.message : 'Order placement failed';
      const rejection = Object.assign(new OrderRejectionError(), {
        code: this.mapCode(code),
        message,
        externalRefId: dto.externalRefId,
      });
      return rejection;
    }
  }

  private mapCode(code: string): import('./entities/order.entity').OrderRejectionCode {
    const map: Record<string, string> = {
      DUPLICATE_ORDER: 'INSUFFICIENT_BUYING_POWER',
      EXCHANGE_NOT_ENABLED: 'EXCHANGE_NOT_ENABLED',
      RISK_CHECK_FAILED: 'RISK_CHECK_FAILED',
      POSITION_LIMIT_EXCEEDED: 'POSITION_LIMIT_EXCEEDED',
      EXCHANGE_REJECTED: 'EXCHANGE_REJECTED',
      INSUFFICIENT_BUYING_POWER: 'INSUFFICIENT_BUYING_POWER',
      INVALID_INSTRUMENT: 'INVALID_INSTRUMENT',
    };
    return (map[code] ?? 'UNKNOWN') as import('./entities/order.entity').OrderRejectionCode;
  }

  @Mutation(() => OrderEntity, { nullable: true })
  @Permissions('oms:write')
  async cancelOrder(@Args('orderId', { type: () => ID }) orderId: string): Promise<OrderEntity | null> {
    this.logger.debug('OmsResolver.cancelOrder()', { orderId });
    return this.orderService.cancel({ orderId });
  }

  @Mutation(() => OrderEntity, { nullable: true })
  @Permissions('oms:write')
  async modifyOrder(
    @Args('orderId', { type: () => ID }) orderId: string,
    @Args('price', { type: () => Float, nullable: true }) price?: number,
    @Args('quantity', { type: () => Float, nullable: true }) quantity?: number,
  ): Promise<OrderEntity | null> {
    this.logger.debug('OmsResolver.modifyOrder()', { orderId, price, quantity });
    return this.orderService.modify({
      orderId,
      price: price?.toString(),
      quantity: quantity?.toString(),
    });
  }
}