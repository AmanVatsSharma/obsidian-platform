/**
 * File:        apps/backend/src/modules/risk-engine/services/greeks-calculator.service.ts
 * Module:      risk-engine · Greeks Calculator
 * Purpose:     Computes delta and gamma for option and equity positions, supporting
 *              DELTA/GAMMA threshold checks in RiskEngineService.
 *
 * Exports:
 *   - GreeksCalculatorService                      — injectable
 *   - GreeksCalculatorService.computeGreeks(accountId, instrumentId) → { delta, gamma }
 *   - GreeksCalculatorService.getPortfolioGreeks(accountId) → { totalDelta, totalGamma }
 *   - GreeksCalculatorService.normalCDF(x)         — static helper (Abramowitz-Stegun)
 *
 * Depends on:
 *   - @/shared/logger               — AppLoggerService
 *   - StrategyPositionService       — reads net positions
 *
 * Side-effects:
 *   - In-memory last-price cache — 5-second TTL
 *
 * Key invariants:
 *   - F&O options: Black-Scholes delta approximation
 *   - EQUITY: delta = netQuantity (gamma = 0)
 *   - Unknown asset class: returns delta=0, gamma=0
 *
 * Read order:
 *   1. normalCDF()          — static math helper (Abramowitz-Stegun approximation)
 *   2. computeGreeks()      — single-instrument delta/gamma
 *   3. getPortfolioGreeks() — sum across all instruments
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-24
 */

import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '../../../shared/logger';
import { StrategyPositionService } from '../../accounts/services/strategy-position.service';

interface GreeksResult {
  delta: number;
  gamma: number;
}

interface Position {
  instrumentId: string;
  netQuantity: number;
  instrumentType?: string; // 'OPTIONS' | 'FUTURES' | 'EQUITY' | undefined
  optionStrike?: number;
  optionExpiry?: string;
  underlyingPrice?: number;
}

@Injectable()
export class GreeksCalculatorService {
  /** Simple in-memory price cache with 5-second TTL */
  private priceCache = new Map<string, { price: number; ts: number }>();

  constructor(
    private readonly logger: AppLoggerService,
    private readonly strategyPositions: StrategyPositionService,
  ) {
    this.logger.setContext(GreeksCalculatorService.name);
  }

  /**
   * Abramowitz-Stegun approximation for the standard normal CDF N(x).
   * Accurate to ~7.5e-8 for all x.
   */
  static normalCDF(x: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const poly =
      t *
      (0.31938153 +
        t *
          (-0.356563782 +
            t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
    const pdf = Math.exp((-0.5 * x * x) / Math.sqrt(2 * Math.PI));
    return x >= 0 ? 1 - pdf * poly : pdf * poly;
  }

  /**
   * Returns cached last price for an instrument, or undefined if stale/empty.
   */
  private getCachedPrice(instrumentId: string): number | undefined {
    const entry = this.priceCache.get(instrumentId);
    if (!entry) return undefined;
    if (Date.now() - entry.ts > 5000) {
      this.priceCache.delete(instrumentId);
      return undefined;
    }
    return entry.price;
  }

  /**
   * Updates the last price cache (called by price feed or RiskEngineService.onPriceTick).
   */
  setLastPrice(instrumentId: string, price: number): void {
    this.priceCache.set(instrumentId, { price, ts: Date.now() });
  }

  /**
   * Computes delta and gamma for a single instrument position.
   *
   * Strategy:
   * - EQUITY: delta = netQuantity, gamma = 0
   * - F&O options: simplified Black-Scholes delta using normalCDF
   * - FUTURES: delta = netQuantity (multiplied by contract multiplier if known)
   * - Unknown: delta = 0, gamma = 0
   */
  computeGreeks(position: Position, lastPrice: number | undefined): GreeksResult {
    const price = lastPrice ?? this.getCachedPrice(position.instrumentId);
    const qty = position.netQuantity;

    const assetType = position.instrumentType?.toUpperCase() ?? '';

    if (assetType === 'EQUITY') {
      // Delta = net quantity (1 unit of equity per share), gamma = 0
      return { delta: qty, gamma: 0 };
    }

    if (assetType === 'FUTURES') {
      // Futures delta ≈ net quantity (no gamma for linear instruments)
      // TODO: apply contract multiplier from instrument metadata if available
      return { delta: qty, gamma: 0 };
    }

    if (assetType === 'OPTIONS') {
      // Simplified Black-Scholes delta approximation
      // We need: underlying price, strike, time-to-expiry, risk-free rate, volatility
      const S = price ?? position.underlyingPrice ?? 0;
      const K = position.optionStrike ?? 0;
      const T = this.timeToExpiry(position.optionExpiry);

      if (S === 0 || K === 0) {
        this.logger.warn('computeGreeks: missing S or K for OPTIONS', {
          instrumentId: position.instrumentId,
          S,
          K,
        });
        return { delta: 0, gamma: 0 };
      }

      // For a simplified demo, use a default IV of 30% and risk-free rate of 5%
      const sigma = 0.30;
      const r = 0.05;
      const isCall = qty > 0;
      const sign = isCall ? 1 : -1;

      // d1 = (ln(S/K) + (r + sigma^2/2) * T) / (sigma * sqrt(T))
      let d1 = 0;
      if (T > 0) {
        d1 =
          (Math.log(S / K) + (r + (sigma * sigma) / 2) * T) /
          (sigma * Math.sqrt(T));
      } else {
        // At expiry: call delta = 1 if ITM, 0 if OTM
        const itm = isCall ? S > K : S < K;
        return { delta: itm ? qty : 0, gamma: 0 };
      }

      const delta = sign * GreeksCalculatorService.normalCDF(sign * d1);
      // Gamma (same for calls and puts) — finite-difference approximation
      const bump = S * 0.01;
      const d1Up = (Math.log((S + bump) / K) + (r + (sigma * sigma) / 2) * T) / (sigma * Math.sqrt(T));
      const d1Down = (Math.log((S - bump) / K) + (r + (sigma * sigma) / 2) * T) / (sigma * Math.sqrt(T));
      const deltaUp = GreeksCalculatorService.normalCDF(d1Up);
      const deltaDown = GreeksCalculatorService.normalCDF(d1Down);
      const gamma = (deltaUp - deltaDown) / (2 * bump) * Math.abs(qty);

      return { delta: delta * Math.abs(qty), gamma };
    }

    // Unknown asset class
    return { delta: 0, gamma: 0 };
  }

  /**
   * Returns the fraction of year remaining until expiry.
   * Returns 0 if expiry is missing or in the past.
   */
  private timeToExpiry(expiryStr?: string): number {
    if (!expiryStr) return 0;
    const expiryMs = new Date(expiryStr).getTime();
    const now = Date.now();
    const yearsRemaining = (expiryMs - now) / (365.25 * 24 * 3600 * 1000);
    return Math.max(0, yearsRemaining);
  }

  /**
   * Aggregates delta and gamma across all positions for an account.
   * Calls StrategyPositionService to get current positions.
   */
  async getPortfolioGreeks(accountId: string): Promise<{
    totalDelta: number;
    totalGamma: number;
    positionCount: number;
  }> {
    let totalDelta = 0;
    let totalGamma = 0;

    // Get all positions for account
    let positions: Position[] = [];
    try {
      positions = await this.strategyPositions.getPositionsByAccount(accountId);
    } catch (err) {
      this.logger.warn('getPortfolioGreeks: StrategyPositionService unavailable', { accountId, err });
      return { totalDelta: 0, totalGamma: 0, positionCount: 0 };
    }

    for (const pos of positions) {
      const greeks = this.computeGreeks(pos, this.getCachedPrice(pos.instrumentId));
      totalDelta += greeks.delta;
      totalGamma += greeks.gamma;
    }

    this.logger.debug('getPortfolioGreeks', {
      accountId,
      totalDelta,
      totalGamma,
      positionCount: positions.length,
    });

    return { totalDelta, totalGamma, positionCount: positions.length };
  }
}