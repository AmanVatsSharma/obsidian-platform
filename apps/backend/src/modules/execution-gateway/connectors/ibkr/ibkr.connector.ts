/**
 * File:        src/modules/execution-gateway/connectors/ibkr/ibkr.connector.ts
 * Module:      execution-gateway
 * Purpose:     IBKR execution connector for US equities and options
 *
 * Exports:
 *   - IbkrConnector — Interactive Brokers REST API adapter
 *
 * Depends on:
 *   - @/shared/logger — AppLoggerService for structured logging
 *
 * Side-effects:
 *   - HTTP calls to IBKR API (/v1/orders, /v1/accounts, /v1/positions)
 *
 * Key invariants:
 *   - IBKR API URL configurable via IBKR_API_URL env var
 *   - API key via IBKR_API_KEY env var
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

interface IbkrOrderPayload {
  action: 'BUY' | 'SELL';
  totalQuantity: string;
  orderType: 'MKT' | 'LMT' | 'STP' | 'STP_LMT';
  lmtPrice?: string;
  tif: 'DAY' | 'IOC' | 'GTC' | 'FOK';
  account?: string;
  symbol?: string;
  secType?: string;
  exchange?: string;
}

interface IbkrOrderResponse {
  orderId?: string | number;
  status?: string;
  error?: string;
  errorCode?: string;
  faGroup?: string;
  faProfile?: string;
  faAccount?: string;
}

@Injectable()
export class IbkrConnector extends BaseExecutionConnector {
  readonly family: ConnectorFamily = 'US_EQUITIES_OPTIONS';

  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(logger: AppLoggerService) {
    super(logger);
    this.apiUrl = process.env.IBKR_API_URL || 'https://localhost:5000';
    this.apiKey = process.env.IBKR_API_KEY || '';
    this.logger.setContext(IbkrConnector.name);
  }

  private async ibkrRequest<T>(
    method: 'GET' | 'POST' | 'DELETE',
    path: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    const url = `${this.apiUrl}${path}`;
    this.logger.debug('ibkrRequest', { method, url });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => 'Unknown error');
        this.logger.error(`ibkrRequest:httpError status=${response.status} body=${errorBody}`);
        throw new AppError('EXCHANGE_DOWN', `IBKR API error ${response.status}: ${errorBody}`);
      }

      return response.json() as Promise<T>;
    } catch (err) {
      this.logger.debug('ibkrRequest:networkError', { error: (err as Error).message });
      throw err;
    }
  }

  private mapTimeInForce(tif: GatewayOrderRequest['timeInForce']): IbkrOrderPayload['tif'] {
    const map: Record<GatewayOrderRequest['timeInForce'], IbkrOrderPayload['tif']> = {
      DAY: 'DAY',
      IOC: 'IOC',
      GTC: 'GTC',
      FOK: 'IOC',
    };
    return map[tif] ?? 'DAY';
  }

  async placeOrder(request: GatewayOrderRequest): Promise<GatewayOrderResponse> {
    this.logger.debug('ibkr.placeOrder:start', request);

    try {
      const payload: IbkrOrderPayload = {
        action: request.side,
        totalQuantity: request.quantity,
        orderType: request.type === 'MARKET' ? 'MKT' : 'LMT',
        lmtPrice: request.price ?? undefined,
        tif: this.mapTimeInForce(request.timeInForce),
        account: request.accountId,
        symbol: request.instrumentId.replace('US:', ''),
        secType: 'STK',
        exchange: 'SMART',
      };

      const ibkrResp = await this.ibkrRequest<IbkrOrderResponse>('POST', '/v1/orders', payload as unknown as Record<string, unknown>);

      if (ibkrResp.error) {
        this.logger.warn(`ibkr.placeOrder:apiError ${ibkrResp.error}`);
        return {
          providerOrderId: '',
          status: 'REJECTED',
          reason: ibkrResp.error,
        };
      }

      const providerOrderId = String(ibkrResp.orderId ?? this.orderId('ibkr', request.clientOrderId));
      this.logger.debug('ibkr.placeOrder:end', { providerOrderId });
      return {
        providerOrderId,
        status: 'ACCEPTED',
        message: ibkrResp.status ?? null,
      };
    } catch (err) {
      this.logger.debug(`ibkr.placeOrder:caught ${(err as Error).message}`);
      return {
        providerOrderId: this.orderId('ibkr', request.clientOrderId),
        status: 'REJECTED',
        reason: (err as Error).message,
      };
    }
  }

  async modifyOrder(request: GatewayModifyOrderRequest): Promise<GatewayOrderResponse> {
    this.logger.debug('ibkr.modifyOrder:start', request);

    try {
      const payload: Partial<IbkrOrderPayload> = {
        orderType: request.price ? 'LMT' : 'MKT',
        lmtPrice: request.price ?? undefined,
        totalQuantity: request.quantity ?? undefined,
        tif: request.timeInForce ? this.mapTimeInForce(request.timeInForce) : 'DAY',
      };

      const ibkrResp = await this.ibkrRequest<IbkrOrderResponse>(
        'POST',
        `/v1/orders/${request.providerOrderId}`,
        payload,
      );

      if (ibkrResp.error) {
        return { providerOrderId: request.providerOrderId, status: 'REJECTED', reason: ibkrResp.error };
      }

      return { providerOrderId: request.providerOrderId, status: 'ACCEPTED' };
    } catch (err) {
      return { providerOrderId: request.providerOrderId, status: 'REJECTED', reason: (err as Error).message };
    }
  }

  async cancelOrder(request: GatewayCancelOrderRequest): Promise<GatewayOrderResponse> {
    this.logger.debug('ibkr.cancelOrder:start', request);

    try {
      const ibkrResp = await this.ibkrRequest<IbkrOrderResponse>('DELETE', `/v1/orders/${request.providerOrderId}`);

      if (ibkrResp.error) {
        return { providerOrderId: request.providerOrderId, status: 'REJECTED', reason: ibkrResp.error };
      }

      return { providerOrderId: request.providerOrderId, status: 'CANCELLED' };
    } catch (err) {
      return { providerOrderId: request.providerOrderId, status: 'REJECTED', reason: (err as Error).message };
    }
  }

  async getPositions(tenantId: string, accountId: string): Promise<PositionSnapshot[]> {
    this.logger.debug('ibkr.getPositions', { tenantId, accountId });

    try {
      const resp = await this.ibkrRequest<Array<{
        symbol: string;
        position: string;
        avgCost: string;
        account: string;
      }>>('GET', `/v1/accounts/${accountId}/positions`);

      return resp.map((p) => ({
        accountId: p.account,
        instrumentId: `US:${p.symbol}`,
        quantity: p.position,
        averagePrice: p.avgCost,
      }));
    } catch {
      return [];
    }
  }

  async getBalances(tenantId: string, accountId: string): Promise<BalanceSnapshot[]> {
    this.logger.debug('ibkr.getBalances', { tenantId, accountId });

    try {
      const resp = await this.ibkrRequest<{
        cash: Record<string, { available: string; marginUsed: string }>;
      }>('GET', `/v1/accounts/${accountId}/summary`);

      return Object.entries(resp.cash).map(([currency, vals]) => ({
        accountId,
        currency,
        available: vals.available,
        utilizedMargin: vals.marginUsed,
      }));
    } catch {
      return [];
    }
  }

  async listSymbols(): Promise<SymbolDefinition[]> {
    this.logger.debug('ibkr.listSymbols');

    try {
      const resp = await this.ibkrRequest<Array<{
        symbol: string;
        exchange: string;
        tickSize: string;
        lotSize: string;
      }>>('GET', '/v1/securities');

      return resp.map((s) => ({
        instrumentId: `US:${s.symbol}`,
        exchange: s.exchange,
        tickSize: s.tickSize,
        lotSize: s.lotSize,
      }));
    } catch {
      return [];
    }
  }

  async getSession(): Promise<SessionState> {
    this.logger.debug('ibkr.getSession');

    try {
      const resp = await this.ibkrRequest<{ connected: boolean }>('GET', '/v1/session');
      return {
        connectorFamily: this.family,
        status: resp.connected ? 'CONNECTED' : 'DISCONNECTED',
        updatedAt: new Date().toISOString(),
      };
    } catch {
      return { connectorFamily: this.family, status: 'DISCONNECTED', updatedAt: new Date().toISOString() };
    }
  }

  async handleWebhook(payload: WebhookEnvelope): Promise<void> {
    this.logger.debug('ibkr.handleWebhook', payload);
  }
}