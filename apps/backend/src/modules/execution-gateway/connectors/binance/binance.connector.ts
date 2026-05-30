/**
 * File:        src/modules/execution-gateway/connectors/binance/binance.connector.ts
 * Module:      execution-gateway
 * Purpose:     Binance execution connector for crypto CEX trading
 *
 * Exports:
 *   - BinanceConnector — Binance REST + HMAC-signed request adapter
 *
 * Depends on:
 *   - @/shared/logger — AppLoggerService for structured logging
 *
 * Side-effects:
 *   - HTTP calls to Binance API (order, account, market endpoints)
 *
 * Key invariants:
 *   - Binance API URL configurable via BINANCE_API_URL (default: api.binance.com)
 *   - HMAC-SHA256 signature on all authenticated endpoints
 *   - Symbols follow format BTCUSDT, ETHUSDT etc.
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-24
 */

import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '../../../../shared/logger';
import { AppError } from '../../../../common/errors/app-error';
import { BaseExecutionConnector } from '../base/base-execution.connector';
import {
  BalanceSnapshot,
  ConnectorFamily,
  GatewayCancelOrderRequest,
  GatewayModifyOrderRequest,
  GatewayOrderRequest,
  GatewayOrderResponse,
  PositionSnapshot,
  SessionState,
  SymbolDefinition,
  WebhookEnvelope,
} from '../contracts/execution-gateway.contract';

interface BinanceOrderPayload {
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT';
  quantity?: string;
  price?: string;
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
}

interface BinanceOrderResponse {
  orderId: number;
  symbol: string;
  status: 'NEW' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELED' | 'REJECTED' | 'EXPIRED';
  executedQty: string;
  price: string;
  type: string;
  side: string;
}

@Injectable()
export class BinanceConnector extends BaseExecutionConnector {
  readonly family: ConnectorFamily = 'CRYPTO_CEX';

  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;

  constructor(logger: AppLoggerService) {
    super(logger);
    this.apiUrl = process.env.BINANCE_API_URL || 'https://api.binance.com';
    this.apiKey = process.env.BINANCE_API_KEY || '';
    this.apiSecret = process.env.BINANCE_API_SECRET || '';
    this.logger.setContext(BinanceConnector.name);
  }

  /**
   * Sign a Binance request using HMAC-SHA256.
   * Appends signature as query param for GET, or body for POST.
   */
  private async hmacSign(params: Record<string, string | number>): Promise<string> {
    const queryString = Object.entries(params)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&');

    const keyBytes = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(this.apiSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );

    const signature = await crypto.subtle.sign('HMAC', keyBytes, new TextEncoder().encode(queryString));
    return Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private async signedRequest<T>(
    method: 'GET' | 'POST' | 'DELETE',
    path: string,
    params?: Record<string, string | number>,
  ): Promise<T> {
    const recvWindow = 5000;
    const timestamp = Date.now();
    const allParams: Record<string, string | number> = { recvWindow, timestamp, ...(params ?? {}) };
    const signature = await this.hmacSign(allParams);

    const queryString = Object.entries(allParams)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&');

    const url = `${this.apiUrl}${path}?${queryString}&signature=${signature}`;

    this.logger.debug('binance.signedRequest', { method, path });

    const headers: Record<string, string> = {
      'X-MBX-APIKEY': this.apiKey,
    };

    try {
      const response = await fetch(url, {
        method,
        headers,
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => 'Unknown error');
        this.logger.error(`binance.signedRequest:httpError status=${response.status} body=${errorBody}`);
        throw new AppError('EXCHANGE_DOWN', `Binance API error ${response.status}: ${errorBody}`);
      }

      return response.json() as Promise<T>;
    } catch (err) {
      this.logger.debug('binance.signedRequest:networkError', { error: (err as Error).message });
      throw err;
    }
  }

  private mapSymbolToBinance(instrumentId: string): string {
    // instrumentId: CRYPTO:BTCUSDT or just BTCUSDT
    return instrumentId.replace('CRYPTO:', '').toUpperCase();
  }

  private mapTimeInForce(tif: GatewayOrderRequest['timeInForce']): BinanceOrderPayload['timeInForce'] {
    const map: Record<GatewayOrderRequest['timeInForce'], BinanceOrderPayload['timeInForce']> = {
      DAY: 'GTC',
      IOC: 'IOC',
      GTC: 'GTC',
      FOK: 'FOK',
    };
    return map[tif] ?? 'GTC';
  }

  private mapStatus(status: BinanceOrderResponse['status']): GatewayOrderResponse['status'] {
    const map: Record<BinanceOrderResponse['status'], GatewayOrderResponse['status']> = {
      NEW: 'ACCEPTED',
      PARTIALLY_FILLED: 'PENDING',
      FILLED: 'ACCEPTED',
      CANCELED: 'CANCELLED',
      REJECTED: 'REJECTED',
      EXPIRED: 'REJECTED',
    };
    return map[status] ?? 'REJECTED';
  }

  async placeOrder(request: GatewayOrderRequest): Promise<GatewayOrderResponse> {
    this.logger.debug('binance.placeOrder:start', request);

    try {
      const payload: BinanceOrderPayload = {
        symbol: this.mapSymbolToBinance(request.instrumentId),
        side: request.side,
        type: request.type,
        quantity: request.quantity,
        price: request.price,
        timeInForce: request.type === 'LIMIT' ? this.mapTimeInForce(request.timeInForce) : undefined,
      };

      const binanceResp = await this.signedRequest<BinanceOrderResponse>('POST', '/api/v3/order', payload as unknown as Record<string, string | number>);

      const providerOrderId = String(binanceResp.orderId);
      this.logger.debug('binance.placeOrder:end', { providerOrderId, status: binanceResp.status });

      return {
        providerOrderId,
        status: this.mapStatus(binanceResp.status),
        filledQty: binanceResp.executedQty,
        price: binanceResp.price,
        message: binanceResp.status,
      };
    } catch (err) {
      this.logger.debug(`binance.placeOrder:caught ${(err as Error).message}`);
      return {
        providerOrderId: this.orderId('binance', request.clientOrderId),
        status: 'REJECTED',
        reason: (err as Error).message,
      };
    }
  }

  async modifyOrder(request: GatewayModifyOrderRequest): Promise<GatewayOrderResponse> {
    this.logger.debug('binance.modifyOrder:start', request);

    try {
      const params: Record<string, string | number> = {
        orderId: Number(request.providerOrderId),
        quantity: request.quantity ?? '',
        price: request.price ?? '',
      };

      const binanceResp = await this.signedRequest<BinanceOrderResponse>('POST', '/api/v3/order', params);

      return {
        providerOrderId: request.providerOrderId,
        status: this.mapStatus(binanceResp.status),
      };
    } catch (err) {
      return { providerOrderId: request.providerOrderId, status: 'REJECTED', reason: (err as Error).message };
    }
  }

  async cancelOrder(request: GatewayCancelOrderRequest): Promise<GatewayOrderResponse> {
    this.logger.debug('binance.cancelOrder:start', request);

    try {
      const params: Record<string, string | number> = {
        orderId: Number(request.providerOrderId),
      };

      const binanceResp = await this.signedRequest<BinanceOrderResponse>('DELETE', '/api/v3/order', params);

      return {
        providerOrderId: request.providerOrderId,
        status: this.mapStatus(binanceResp.status),
      };
    } catch (err) {
      return { providerOrderId: request.providerOrderId, status: 'REJECTED', reason: (err as Error).message };
    }
  }

  async getPositions(tenantId: string, accountId: string): Promise<PositionSnapshot[]> {
    this.logger.debug('binance.getPositions', { tenantId, accountId });

    try {
      const resp = await this.signedRequest<{
        positions: Array<{ symbol: string; positionAmt: string; entryPrice: string }>;
      }>('GET', '/api/v3/account', { recvWindow: 5000, timestamp: Date.now() });

      return (resp.positions ?? [])
        .filter((p) => parseFloat(p.positionAmt) !== 0)
        .map((p) => ({
          accountId,
          instrumentId: `CRYPTO:${p.symbol}`,
          quantity: p.positionAmt,
          averagePrice: p.entryPrice,
        }));
    } catch {
      return [];
    }
  }

  async getBalances(tenantId: string, accountId: string): Promise<BalanceSnapshot[]> {
    this.logger.debug('binance.getBalances', { tenantId, accountId });

    try {
      const resp = await this.signedRequest<{
        balances: Array<{ asset: string; free: string; locked: string }>;
      }>('GET', '/api/v3/account', { recvWindow: 5000, timestamp: Date.now() });

      return resp.balances
        .filter((b) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
        .map((b) => ({
          accountId,
          currency: b.asset,
          available: b.free,
          utilizedMargin: b.locked,
        }));
    } catch {
      return [];
    }
  }

  async listSymbols(): Promise<SymbolDefinition[]> {
    this.logger.debug('binance.listSymbols');

    try {
      const resp = await this.signedRequest<{
        symbols: Array<{ symbol: string; tickSize: string; filters: Array<{ filterType: string; stepSize?: string }> }>;
      }>('GET', '/api/v3/exchangeInfo', { recvWindow: 5000, timestamp: Date.now() });

      return resp.symbols
        .filter((s) => s.symbol.endsWith('USDT'))
        .map((s) => {
          const lotSizeFilter = s.filters.find((f) => f.filterType === 'LOT_SIZE');
          return {
            instrumentId: `CRYPTO:${s.symbol}`,
            exchange: 'BINANCE',
            tickSize: s.tickSize,
            lotSize: lotSizeFilter?.stepSize ?? '0',
          };
        });
    } catch {
      return [];
    }
  }

  async getSession(): Promise<SessionState> {
    this.logger.debug('binance.getSession');

    try {
      await this.signedRequest('GET', '/api/v3/account', { recvWindow: 5000, timestamp: Date.now() });
      return {
        connectorFamily: this.family,
        status: 'CONNECTED',
        updatedAt: new Date().toISOString(),
      };
    } catch {
      return { connectorFamily: this.family, status: 'DISCONNECTED', updatedAt: new Date().toISOString() };
    }
  }

  async handleWebhook(payload: WebhookEnvelope): Promise<void> {
    this.logger.debug('binance.handleWebhook', payload);
  }
}