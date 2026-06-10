/**
 * File:        apps/backend/src/modules/execution-gateway/connectors/kite/kite-execution.connector.ts
 * Module:      execution-gateway · Kite Connector
 * Purpose:     Kite Connect execution connector for Indian markets.
 *              Supports: NSE, BSE, MCX, NFO, CDS segments.
 *              Order types: MARKET, LIMIT, SL, SLM, BRACKET, COVER.
 *
 * Exports:
 *   - KiteExecutionConnector — implements BaseExecutionConnector for Kite
 *
 * Depends on:
 *   - BaseExecutionConnector — common contract
 *   - DataProviderEntity     — credentials storage
 *   - circuit-breaker.wrapper — resilience
 *
 * Side-effects:
 *   - Outbound HTTPS to https://api.kite.trade
 *   - Order placement, modification, cancellation
 *
 * Key invariants:
 *   - Kite access token required for all operations
 *   - Same token used for data and execution
 *   - Order placement requires valid tradingsymbol
 *   - Exchange must be configured with execution provider KITE
 *
 * Kite API:
 *   POST /api/orders/regular        — place order
 *   PUT  /api/orders/regular/:id    — modify order
 *   DELETE /api/orders/regular/:id  — cancel order
 *   GET  /api/orders               — order list
 *   GET  /api/positions            — positions
 *   GET  /api/holdings             — holdings
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-09
 */

import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppLoggerService } from '../../../../shared/logger';
import { CircuitBreaker } from '../../../../shared/resilience/circuit-breaker.wrapper';
import { withRetry } from '../../../../shared/resilience/retry.wrapper';
import { AppError } from '../../../../common/errors/app-error';
import { BaseExecutionConnector } from '../base/base-execution.connector';
import {
  ConnectorFamily,
  GatewayOrderRequest,
  GatewayOrderResponse,
  GatewayModifyOrderRequest,
  GatewayCancelOrderRequest,
  PositionSnapshot,
  BalanceSnapshot,
  SymbolDefinition,
  SessionState,
  WebhookEnvelope,
} from '../contracts/execution-gateway.contract';
import { DataProviderEntity } from '../../../market/entities/data-provider.entity';

// ─── Kite Types ────────────────────────────────────────────────────────────────

export type KiteExchange = 'NSE' | 'BSE' | 'MCX' | 'NFO' | 'CDS';
export type KiteTransactionType = 'BUY' | 'SELL';
export type KiteOrderType = 'MARKET' | 'LIMIT' | 'SL' | 'SLM';
export type KiteProduct =
  | 'CNC'   // Cash & Carry (delivery)
  | 'NRML'  // Normal (F&O carry forward)
  | 'MIS'   // Intraday
  | 'BO'    // Bracket Order
  | 'CO';   // Cover Order

export type KiteValidity = 'DAY' | 'IOC' | 'TTL';

export interface KitePlaceOrderInput {
  tradingsymbol: string;
  exchange: KiteExchange;
  transactionType: KiteTransactionType;
  orderType: KiteOrderType;
  product: KiteProduct;
  quantity: number;
  price?: number;       // Required for LIMIT, SL
  triggerPrice?: number; // Required for SL, SLM
  tag?: string;         // Up to 20 chars
  validity?: KiteValidity;
  disclosedQuantity?: number;
}

export interface KiteOrderResponse {
  orderId: string;
}

export interface KiteOrder {
  orderId: string;
  tradingsymbol: string;
  exchange: KiteExchange;
  transactionType: KiteTransactionType;
  orderType: KiteOrderType;
  product: KiteProduct;
  quantity: number;
  filledQuantity: number;
  price: number;
  triggerPrice: number;
  averagePrice: number;
  status: string;
  statusMessage: string;
  placedBy: string;
  orderTimestamp: string;
  exchangeTimestamp?: string;
  exchangeOrderId?: string;
  tag?: string;
}

const KITE_BASE = 'https://api.kite.trade';

@Injectable()
export class KiteExecutionConnector
  extends BaseExecutionConnector
  implements OnModuleInit
{
  readonly family: ConnectorFamily = 'KITE_INDIA';

  private apiKey: string | null = null;
  private accessToken: string | null = null;

  constructor(
    logger: AppLoggerService,
    @InjectRepository(DataProviderEntity)
    private readonly providers: Repository<DataProviderEntity>,
  ) {
    super(logger);
    this.logger.setContext(KiteExecutionConnector.name);
  }

  async onModuleInit(): Promise<void> {
    // Load credentials from DB on startup
    const provider = await this.providers.findOne({ where: { code: 'KITE' } });
    if (provider) {
      this.apiKey = provider.apiKey;
      this.accessToken = provider.accessToken;
      this.logger.info('Kite execution connector initialized');
    }
  }

  /** Called when admin updates credentials. */
  updateCredentials(apiKey: string, accessToken: string): void {
    this.apiKey = apiKey;
    this.accessToken = accessToken;
    this.logger.info('Kite execution credentials updated');
  }

  private buildAuthHeader(): string {
    if (!this.apiKey || !this.accessToken) {
      throw new AppError('CREDENTIALS_MISSING', 'Kite credentials not configured');
    }
    return `token ${this.apiKey}:${this.accessToken}`;
  }

  /**
   * Place order on Kite.
   * Supports regular, bracket (BO), and cover (CO) orders.
   */
  async placeOrder(input: KitePlaceOrderInput): Promise<KiteOrderResponse> {
    this.logger.debug('Kite placeOrder', input as any);

    return circuitBreaker(
      'kite.placeOrder',
      () => retryWrapper(
        async () => {
          const url = `${KITE_BASE}/orders/regular`;

          const body = new URLSearchParams();
          body.set('tradingsymbol', input.tradingsymbol);
          body.set('exchange', input.exchange);
          body.set('transaction_type', input.transactionType);
          body.set('order_type', input.orderType);
          body.set('product', input.product);
          body.set('quantity', String(input.quantity));

          if (input.price !== undefined) body.set('price', String(input.price));
          if (input.triggerPrice !== undefined) body.set('trigger_price', String(input.triggerPrice));
          if (input.tag) body.set('tag', input.tag);
          if (input.validity) body.set('validity', input.validity);
          if (input.disclosedQuantity !== undefined) {
            body.set('disclosed_quantity', String(input.disclosedQuantity));
          }

          const res = await fetch(url, {
            method: 'POST',
            headers: {
              Authorization: this.buildAuthHeader(),
              'X-Kite-Version': '3',
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body.toString(),
          });

          if (!res.ok) {
            const errorText = await res.text();
            this.logger.error('Kite placeOrder failed', undefined, { status: res.status, error: errorText });
            throw new AppError('ORDER_FAILED', `Kite order failed: ${errorText}`);
          }

          const data = await res.json() as { data: { order_id: string } };
          return { orderId: data.data.order_id };
        },
        { maxRetries: 2, retryDelay: 500 },
      ),
    );
  }

  /**
   * Modify an existing order.
   * Can change: quantity, price, trigger_price, order_type, validity
   */
  async modifyOrder(orderId: string, changes: {
    quantity?: number;
    price?: number;
    triggerPrice?: number;
    orderType?: KiteOrderType;
    validity?: KiteValidity;
  }): Promise<KiteOrderResponse> {
    this.logger.debug('Kite modifyOrder', { orderId, changes });

    const url = `${KITE_BASE}/orders/regular/${orderId}`;

    const body = new URLSearchParams();
    if (changes.quantity !== undefined) body.set('quantity', String(changes.quantity));
    if (changes.price !== undefined) body.set('price', String(changes.price));
    if (changes.triggerPrice !== undefined) body.set('trigger_price', String(changes.triggerPrice));
    if (changes.orderType) body.set('order_type', changes.orderType);
    if (changes.validity) body.set('validity', changes.validity);

    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: this.buildAuthHeader(),
        'X-Kite-Version': '3',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!res.ok) {
      throw new AppError('ORDER_MODIFY_FAILED', `Kite modify order failed`);
    }

    const data = await res.json() as { data: { order_id: string } };
    return { orderId: data.data.order_id };
  }

  /**
   * Cancel an order.
   */
  async cancelOrder(orderId: string): Promise<KiteOrderResponse> {
    this.logger.debug('Kite cancelOrder', { orderId });

    const url = `${KITE_BASE}/orders/regular/${orderId}`;

    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: this.buildAuthHeader(),
        'X-Kite-Version': '3',
      },
    });

    if (!res.ok) {
      throw new AppError('ORDER_CANCEL_FAILED', `Kite cancel order failed`);
    }

    const data = await res.json() as { data: { order_id: string } };
    return { orderId: data.data.order_id };
  }

  /**
   * Get all orders for the day.
   */
  async getOrders(): Promise<KiteOrder[]> {
    const url = `${KITE_BASE}/orders`;

    const res = await fetch(url, {
      headers: {
        Authorization: this.buildAuthHeader(),
        'X-Kite-Version': '3',
      },
    });

    if (!res.ok) {
      throw new AppError('FETCH_ORDERS_FAILED', 'Failed to fetch Kite orders');
    }

    const data = await res.json() as { data: KiteOrder[] };
    return data.data;
  }

  /**
   * Get net positions.
   */
  async getPositions(): Promise<{
    net: KiteOrder[];
    day: KiteOrder[];
  }> {
    const url = `${KITE_BASE}/portfolio/positions`;

    const res = await fetch(url, {
      headers: {
        Authorization: this.buildAuthHeader(),
        'X-Kite-Version': '3',
      },
    });

    if (!res.ok) {
      throw new AppError('FETCH_POSITIONS_FAILED', 'Failed to fetch Kite positions');
    }

    const data = await res.json() as { data: { net: KiteOrder[]; day: KiteOrder[] } };
    return { net: data.data.net, day: data.data.day };
  }

  /**
   * Get holdings.
   */
  async getHoldings(): Promise<unknown[]> {
    const url = `${KITE_BASE}/portfolio/holdings`;

    const res = await fetch(url, {
      headers: {
        Authorization: this.buildAuthHeader(),
        'X-Kite-Version': '3',
      },
    });

    if (!res.ok) {
      throw new AppError('FETCH_HOLDINGS_FAILED', 'Failed to fetch Kite holdings');
    }

    const data = await res.json() as { data: unknown[] };
    return data.data;
  }

  /**
   * Convert position from MIS to CNC (or vice versa).
   */
  async convertPosition(input: {
    tradingsymbol: string;
    exchange: KiteExchange;
    transactionType: KiteTransactionType;
    positionType: 'overnight' | 'day' | 'custom';
    quantity: number;
    oldProduct: KiteProduct;
    newProduct: KiteProduct;
  }): Promise<void> {
    const url = `${KITE_BASE}/portfolio/positions`;

    const body = new URLSearchParams();
    body.set('tradingsymbol', input.tradingsymbol);
    body.set('exchange', input.exchange);
    body.set('transaction_type', input.transactionType);
    body.set('position_type', input.positionType);
    body.set('quantity', String(input.quantity));
    body.set('old_product', input.oldProduct);
    body.set('new_product', input.newProduct);

    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: this.buildAuthHeader(),
        'X-Kite-Version': '3',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!res.ok) {
      throw new AppError('CONVERT_FAILED', 'Failed to convert Kite position');
    }
  }

  /**
   * Health check - verify credentials work.
   */
  async healthCheck(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
    const start = Date.now();
    try {
      const url = `${KITE_BASE}/user/profile`;
      const res = await fetch(url, {
        headers: {
          Authorization: this.buildAuthHeader(),
          'X-Kite-Version': '3',
        },
      });
      if (!res.ok) {
        return { ok: false, latencyMs: Date.now() - start, error: `HTTP ${res.status}` };
      }
      return { ok: true, latencyMs: Date.now() - start };
    } catch (e) {
      return { ok: false, latencyMs: Date.now() - start, error: (e as Error).message };
    }
  }

  // ─── BaseExecutionConnector Contract Methods ─────────────────────────────

  async placeOrder(request: GatewayOrderRequest): Promise<GatewayOrderResponse> {
    return super.placeOrder(request);
  }

  async modifyOrder(request: GatewayModifyOrderRequest): Promise<GatewayOrderResponse> {
    return super.modifyOrder(request);
  }

  async cancelOrder(request: GatewayCancelOrderRequest): Promise<GatewayOrderResponse> {
    return super.cancelOrder(request);
  }

  async getPositions(tenantId: string, accountId: string): Promise<PositionSnapshot[]> {
    return super.getPositions(tenantId, accountId);
  }

  async getBalances(tenantId: string, accountId: string): Promise<BalanceSnapshot[]> {
    return super.getBalances(tenantId, accountId);
  }

  async listSymbols(): Promise<SymbolDefinition[]> {
    return super.listSymbols();
  }

  async getSession(): Promise<SessionState> {
    return super.getSession();
  }

  async handleWebhook(payload: WebhookEnvelope): Promise<void> {
    return super.handleWebhook(payload);
  }
}