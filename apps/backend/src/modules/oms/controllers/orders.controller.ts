/**
 * @file src/modules/oms/controllers/orders.controller.ts
 * @module oms
 * @description Orders REST controller
 * @author BharatERP
 * @created 2025-09-19
 */

import { Body, Controller, Get, MessageEvent, Param, Post, Sse, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Permissions } from '../../rbac/decorators/permissions.decorator';
import { PermissionsGuard } from '../../rbac/guards/permissions.guard';
import { TenantGuard } from '../../rbac/guards/tenant.guard';
import { PlaceOrderDto, CancelOrderDto, ModifyOrderDto } from '../dtos/order.dto';
import { PlaceBracketOrderDto } from '../dtos/bracket-order.dto';
import { PlaceAlgoOrderDto } from '../dtos/algo-order.dto';
import { AddExecutionDto } from '../dtos/execution.dto';
import { OrderService } from '../services/order.service';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppLoggerService } from '../../../shared/logger';

@ApiTags('OMS')
@Controller('orders')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class OrdersController {
  constructor(private readonly service: OrderService, private readonly logger: AppLoggerService) {
    this.logger.setContext(OrdersController.name);
  }

  @Post()
  @Permissions('orders:write')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Place order' })
  @ApiBody({
    type: PlaceOrderDto,
    examples: {
      limitBuy: {
        value: {
          accountId: 'acc-uuid',
          instrumentId: 'inst-uuid',
          side: 'BUY',
          type: 'LIMIT',
          quantity: '10',
          price: '123.45',
          timeInForce: 'DAY',
          externalRefId: 'ext-ord-001',
          clientOrderId: 'cli-001',
        },
      },
      marketSell: {
        value: {
          accountId: 'acc-uuid',
          instrumentId: 'inst-uuid',
          side: 'SELL',
          type: 'MARKET',
          quantity: '5',
          timeInForce: 'IOC',
          externalRefId: 'ext-ord-002',
          clientOrderId: 'cli-002',
        },
      },
    },
  })
  place(@Body() dto: PlaceOrderDto) {
    this.logger.debug('place called', dto);
    return this.service.place(dto);
  }

  @Post('cancel')
  @Permissions('orders:write')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Cancel order' })
  @ApiBody({ type: CancelOrderDto, examples: { default: { value: { orderId: 'ord-uuid' } } } })
  cancel(@Body() dto: CancelOrderDto) {
    this.logger.debug('cancel called', dto);
    return this.service.cancel(dto);
  }

  @Post('modify')
  @Permissions('orders:write')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Modify/replace order' })
  @ApiBody({ type: ModifyOrderDto, examples: { default: { value: { orderId: 'ord-uuid', price: '123.45', quantity: '15', timeInForce: 'IOC' } } } })
  modify(@Body() dto: ModifyOrderDto) {
    this.logger.debug('modify called', dto);
    return this.service.modify(dto);
  }

  @Post('bracket')
  @Permissions('orders:write')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Place bracket order (one-triggers-all)' })
  @ApiBody({
    type: PlaceBracketOrderDto,
    examples: {
      bracketBuy: {
        value: {
          accountId: 'acc-uuid',
          instrumentId: 'inst-uuid',
          side: 'BUY',
          type: 'BRACKET',
          quantity: '10',
          price: '123.45',
          timeInForce: 'DAY',
          externalRefId: 'ext-bracket-001',
          clientOrderId: 'cli-bracket-001',
          bracket: {
            tpPrice: '125.00',
            slPrice: '121.00',
          },
        },
      },
      trailingStop: {
        value: {
          accountId: 'acc-uuid',
          instrumentId: 'inst-uuid',
          side: 'BUY',
          type: 'BRACKET',
          quantity: '10',
          price: '123.45',
          timeInForce: 'GTC',
          externalRefId: 'ext-trailing-001',
          clientOrderId: 'cli-trailing-001',
          bracket: {
            trailingDistance: '2.00',
            slPrice: '121.00',
          },
        },
      },
    },
  })
  placeBracket(@Body() dto: PlaceBracketOrderDto) {
    this.logger.debug('placeBracket called', dto);
    return this.service.placeBracket(dto);
  }

  @Get(':orderId/children')
  @Permissions('oms:read')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get bracket child orders for a parent order' })
  @ApiResponse({ status: 200, description: 'Array of child orders (TP/SL legs)' })
  getBracketChildren(@Param('orderId') orderId: string) {
    this.logger.debug('getBracketChildren called', { orderId });
    return this.service.getBracketChildren(orderId);
  }

  @Post('algo')
  @Permissions('orders:write')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Place algo order (TWAP / VWAP / ICEBERG)' })
  @ApiBody({
    type: PlaceAlgoOrderDto,
    examples: {
      twap: {
        value: {
          accountId: 'acc-uuid',
          instrumentId: 'inst-uuid',
          side: 'BUY',
          algoType: 'TWAP',
          totalQuantity: '1000',
          sliceCount: 10,
          durationMinutes: 60,
          clientOrderId: 'cli-algo-001',
          externalRefId: 'ext-algo-001',
        },
      },
      vwap: {
        value: {
          accountId: 'acc-uuid',
          instrumentId: 'inst-uuid',
          side: 'SELL',
          algoType: 'VWAP',
          totalQuantity: '500',
          sliceCount: 5,
          durationMinutes: 30,
          priceLimit: '1500.00',
          clientOrderId: 'cli-algo-002',
          externalRefId: 'ext-algo-002',
        },
      },
      iceberg: {
        value: {
          accountId: 'acc-uuid',
          instrumentId: 'inst-uuid',
          side: 'BUY',
          algoType: 'ICEBERG',
          totalQuantity: '1000',
          sliceCount: 25,
          priceLimit: '1500.00',
          clientOrderId: 'cli-algo-003',
          externalRefId: 'ext-algo-003',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Algo parent order accepted; slices dispatch on worker tick' })
  @ApiResponse({ status: 400, description: 'Validation failed (invalid algoType, sliceCount, etc.)' })
  @ApiResponse({ status: 409, description: 'Duplicate externalRefId with conflicting payload' })
  placeAlgo(@Body() dto: PlaceAlgoOrderDto) {
    this.logger.debug('placeAlgo called', dto);
    return this.service.placeAlgo(dto);
  }

  @Post('executions')
  @Permissions('orders:write')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Add execution' })
  @ApiBody({
    type: AddExecutionDto,
    examples: {
      fill: {
        value: {
          orderId: 'ord-uuid',
          accountId: 'acc-uuid',
          instrumentId: 'inst-uuid',
          quantity: '2',
          price: '124.00',
          fees: '0.25',
          externalRefId: 'exch-abc-123',
        },
      },
    },
  })
  addExecution(@Body() dto: AddExecutionDto) {
    this.logger.debug('addExecution called', dto);
    return this.service.addExecution(dto);
  }

  @Sse('stream')
  @Permissions('orders:read')
  stream(): AsyncIterable<MessageEvent> {
    const source = this.service.onEvents$();
    return {
      [Symbol.asyncIterator]() {
        const iterator = source[Symbol.asyncIterator]?.();
        if (iterator) return iterator as any;
        const queue: any[] = [];
        const sub = source.subscribe((event) => queue.push({ data: event }));
        return {
          next() {
            return new Promise((resolve) => {
              const item = queue.shift();
              if (item) return resolve({ value: item, done: false });
              const unsubscribe = source.subscribe((ev) => {
                unsubscribe.unsubscribe();
                resolve({ value: { data: ev }, done: false });
              });
            });
          },
          return() {
            sub.unsubscribe();
            return Promise.resolve({ value: undefined, done: true });
          },
          throw(err: any) {
            sub.unsubscribe();
            throw err;
          },
          [Symbol.asyncIterator]() { return this; },
        } as AsyncIterator<MessageEvent>;
      },
    } as AsyncIterable<MessageEvent>;
  }
}


