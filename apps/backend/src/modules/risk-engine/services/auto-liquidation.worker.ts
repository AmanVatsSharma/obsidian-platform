/**
 * File:        apps/backend/src/modules/risk-engine/services/auto-liquidation.worker.ts
 * Module:      risk-engine · Auto-Liquidation Worker
 * Purpose:     Runs every 30 seconds via setInterval — checks open positions across
 *              all accounts, computes margin level (equity / usedMargin × 100), and
 *              dispatches liquidation intents via OrderEventsService when thresholds breach.
 *
 * Exports:
 *   - AutoLiquidationWorker            — injectable; starts on module init
 *   - AutoLiquidationWorker.handleCron()  — scheduled evaluation
 *   - AutoLiquidationWorker.getMarginLevel(accountId) — margin level computation
 *   - AutoLiquidationWorker.liquidateAll(accountId, positions)   — dispatch all close intents
 *   - AutoLiquidationWorker.liquidateBiggestPosition(accountId, positions) — dispatch worst close
 *
 * Depends on:
 *   - AccountsService           — list active LIVE accounts
 *   - BalancesService         — equity / usedMargin for margin level
 *   - StrategyPositionService  — open positions per account
 *   - OrderEventsService       — dispatches liquidation.dispatch events; OMS subscribes
 *   - NotificationService      — alerts on liquidation triggers
 *   - AppLoggerService        — structured logging with requestId
 *
 * Side-effects:
 *   - DB reads every 30 s (accounts, balances, positions)
 *   - Publishes liquidation.dispatch events consumed by OmsModule
 *
 * Key invariants:
 *   - Margin level bands: < 75% → liquidateAll | 75–100% → liquidateBiggest | > 100% → OK
 *   - Liquidation orders are MARKET — no price limit
 *   - Positions sorted by unrealizedPnl ASC (worst loss first) when choosing biggest
 *
 * Read order:
 *   1. handleCron()           — entry point, 30 s interval
 *   2. getMarginLevel()       — equity / usedMargin × 100
 *   3. liquidateAll()         — dispatch close intent for all positions
 *   4. liquidateBiggestPosition() — dispatch close intent for worst position only
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-24
 */

import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { AppLoggerService } from '../../../shared/logger';
import { AccountsService } from '../../accounts/services/accounts.service';
import { BalancesService } from '../../accounts/services/balances.service';
import { StrategyPositionService } from '../../accounts/services/strategy-position.service';
// Dispatches liquidation intent via OrderEvents — avoids circular import with OmsModule.
// OmsModule subscribes to 'liquidation.dispatch' and places MARKET orders.
import { OrderEventsService } from '../../oms/services/order-events.service';
import { NotificationService } from '../../notifications/services/notification.service';

interface Position {
  instrumentId: string;
  netQuantity: number;
  unrealizedPnl?: number;
}

@Injectable()
export class AutoLiquidationWorker implements OnModuleInit, OnModuleDestroy {
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly logger: AppLoggerService,
    private readonly accounts: AccountsService,
    private readonly balances: BalancesService,
    private readonly positions: StrategyPositionService,
    private readonly orderEvents: OrderEventsService,
    private readonly notifications: NotificationService,
  ) {
    this.logger.setContext(AutoLiquidationWorker.name);
  }

  onModuleInit(): void {
    this.logger.debug('auto-liquidation: starting 30 s loop');
    this.timer = setInterval(
      () => this.handleCron().catch((e) =>
        this.logger.error('handleCron failed', (e as Error).stack)
      ),
      30_000,
    );
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  /**
   * Scheduled entry point — evaluates all LIVE accounts with open positions.
   */
  async handleCron(): Promise<void> {
    const ctx = { requestId: 'auto-liquidation-cron' };
    this.logger.debug('handleCron:start', ctx);

    let accounts: any[] = [];
    try {
      accounts = await this.accounts.listByTenant('', undefined).catch(() => []);
    } catch (err) {
      this.logger.warn('handleCron: could not list accounts', { err });
      return;
    }

    const liveAccounts = accounts.filter(
      (a: any) => a.accountType === 'LIVE' && a.status === 'ACTIVE',
    );

    for (const account of liveAccounts) {
      const accountId = account.id as string;
      let accountPositions: Position[] = [];
      try {
        accountPositions = (await this.positions.getPositionsByAccount(accountId)) as Position[];
      } catch {
        this.logger.debug('handleCron: no positions', { accountId });
        continue;
      }

      if (accountPositions.length === 0) continue;

      const marginLevel = await this.getMarginLevel(accountId);
      this.logger.debug('margin-level:check', { accountId, marginLevel });

      if (marginLevel < 75) {
        this.logger.warn('margin-critical: liquidating all positions', { accountId, marginLevel });
        await this.liquidateAll(accountId, accountPositions);
        await this.notify(accountId, 'LIQUIDATE_ALL', marginLevel);
      } else if (marginLevel < 100) {
        this.logger.warn('margin-warning: liquidating biggest position', { accountId, marginLevel });
        await this.liquidateBiggestPosition(accountId, accountPositions);
        await this.notify(accountId, 'LIQUIDATE_BIGGEST', marginLevel);
      }
    }

    this.logger.debug('handleCron:end', ctx);
  }

  /**
   * Margin level = (equity / usedMargin) × 100.
   * Returns 999 if no margin is in use (no open risk).
   */
  async getMarginLevel(accountId: string): Promise<number> {
    let equity = 0;
    let usedMargin = 0;

    try {
      const bal = await this.balances.getBalances(accountId, {});
      equity = Number(bal.availableCash ?? 0);
    } catch {
      this.logger.debug('getMarginLevel: balances unavailable', { accountId });
    }

    try {
      const posList = (await this.positions.getPositionsByAccount(accountId)) as Position[];
      for (const pos of posList) {
        // simplified: usedMargin = abs(unrealizedPnl) × 2 as a rough margin proxy
        usedMargin += Math.abs(Number(pos.unrealizedPnl ?? 0)) * 2;
      }
    } catch {
      this.logger.debug('getMarginLevel: positions unavailable', { accountId });
    }

    if (usedMargin === 0) return 999; // no open risk
    return (equity / usedMargin) * 100;
  }

  /**
   * Dispatches liquidation.intent events for every open position, sorted worst-loss first.
   * OmsModule subscribes to 'liquidation.dispatch' and places MARKET orders.
   */
  async liquidateAll(accountId: string, positions: Position[]): Promise<void> {
    const ctx = { requestId: 'liquidation', accountId };

    const sorted = [...positions]
      .filter((p) => p.netQuantity !== 0)
      .sort((a, b) => (a.unrealizedPnl ?? 0) - (b.unrealizedPnl ?? 0));

    this.logger.warn('liquidateAll: dispatching intents', {
      accountId,
      count: sorted.length,
      ctx,
    });

    for (const pos of sorted) {
      const side = pos.netQuantity > 0 ? 'SELL' : 'BUY';
      const quantity = String(Math.abs(pos.netQuantity));

      // OmsModule listens for this event and places a MARKET liquidation order.
      this.orderEvents.publish({
        type: 'liquidation.dispatch',
        payload: {
          accountId,
          instrumentId: pos.instrumentId,
          side,
          quantity,
          reason: 'LIQUIDATE_ALL',
          externalRefId: `liq:all:${accountId}:${pos.instrumentId}:${Date.now()}`,
        },
      });

      this.logger.debug('liquidateAll: intent dispatched', {
        accountId,
        instrumentId: pos.instrumentId,
        side,
        quantity,
        ctx,
      });
    }
  }

  /**
   * Dispatches a single liquidation.intent for the worst-loss position.
   */
  async liquidateBiggestPosition(accountId: string, positions: Position[]): Promise<void> {
    const ctx = { requestId: 'liquidation-biggest', accountId };

    const sorted = [...positions]
      .filter((p) => p.netQuantity !== 0)
      .sort((a, b) => (a.unrealizedPnl ?? 0) - (b.unrealizedPnl ?? 0));

    const worst = sorted[0];
    if (!worst) {
      this.logger.debug('liquidateBiggestPosition: nothing to close', { accountId });
      return;
    }

    const side = worst.netQuantity > 0 ? 'SELL' : 'BUY';
    const quantity = String(Math.abs(worst.netQuantity));

    this.logger.warn('liquidateBiggestPosition: dispatching intent', {
      accountId,
      instrumentId: worst.instrumentId,
      unrealizedPnl: worst.unrealizedPnl,
      side,
      quantity,
      ctx,
    });

    this.orderEvents.publish({
      type: 'liquidation.dispatch',
      payload: {
        accountId,
        instrumentId: worst.instrumentId,
        side,
        quantity,
        reason: 'LIQUIDATE_BIGGEST',
        externalRefId: `liq:biggest:${accountId}:${worst.instrumentId}:${Date.now()}`,
      },
    });
  }

  private async notify(
    accountId: string,
    action: 'LIQUIDATE_ALL' | 'LIQUIDATE_BIGGEST',
    marginLevel: number,
  ): Promise<void> {
    try {
      await this.notifications.send({
        userId: accountId,
        type: 'margin.liquidation',
        title: 'Margin Liquidation Triggered',
        bodyTemplate: 'Account {{accountId}} triggered {{action}} due to margin level {{marginLevel}}%',
        vars: { accountId, action, marginLevel: marginLevel.toFixed(2) },
        channels: ['in-app', 'email'],
        category: 'risk',
      });
    } catch (err) {
      this.logger.error('notify: failed', { accountId, action, err });
    }
  }
}
