/**
 * File:        apps/backend/src/modules/execution-intelligence/types/venue.type.ts
 * Module:      execution-intelligence · Types
 * Purpose:     Venue and SOR (Smart Order Router) response type definitions
 *
 * Exports:
 *   - Venue                            — venue descriptor with scoring inputs
 *   - SORResponse                     — Smart Order Router routing result
 *   - VenueScore                      — aggregated performance metrics for a venue
 *
 * Depends on:
 *   - @/execution-gateway             — ConnectorFamily enum
 *
 * Side-effects:  none (pure type definitions)
 * Key invariants:
 *   - Venue.depthAtPrice, spreadBps, latencyMs, feeBps are raw market inputs
 *   - SlippageBps is stored as string to preserve decimal precision (e.g. "0.15")
 *
 * Read order:
 *   1. Venue — scoring inputs
 *   2. SORResponse — routing output
 *   3. VenueScore — post-trade aggregation
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-24
 */

import { ConnectorFamily } from '../../execution-gateway/connectors/contracts/execution-gateway.contract';
import { GatewayOrderResponse } from '../../execution-gateway/connectors/contracts/execution-gateway.contract';

/**
 * Venue descriptor used for Smart Order Routing decisions.
 * Each field feeds the VenueScorerService composite score.
 */
export interface Venue {
  /** Unique identifier for the venue (e.g. "NSE-1", "COINBASE") */
  id: string;
  /** Which connector family this venue maps to */
  connectorFamily: ConnectorFamily;
  /** Simulated depth / notional liquidity at the order's target price */
  depthAtPrice: number;
  /** Bid-ask spread in basis points (bps) */
  spreadBps: number;
  /** Estimated round-trip latency in milliseconds */
  latencyMs: number;
  /** All-in fee in basis points (bps) */
  feeBps: number;
}

/**
 * Response from the Smart Order Router — which venue was selected and with what outcome.
 */
export interface SORResponse {
  /** Venue that filled (or failed through) this order */
  venueId: string;
  /** Raw gateway response from the connector */
  result: GatewayOrderResponse;
  /** Slippage in basis points vs requested price, e.g. "0.15" */
  slippageBps: string;
}

/**
 * Aggregated performance record for a venue over a time window.
 * Computed by SlippageTrackerService from recorded fill data.
 */
export interface VenueScore {
  /** Average slippage in bps, e.g. "0.12" */
  avgSlippageBps: string;
  /** Fraction of orders filled, e.g. "0.97" */
  fillRate: string;
  /** Median observed latency in ms */
  medianLatencyMs: number;
}