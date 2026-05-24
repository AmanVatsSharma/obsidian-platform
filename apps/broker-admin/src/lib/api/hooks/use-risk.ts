/**
 * File:        apps/broker-admin/src/lib/api/hooks/use-risk.ts
 * Module:      broker-admin · Risk API Hooks
 * Purpose:     API hooks for risk/exposure data and risk threshold management
 *
 * Exports:
 *   - useRiskExposure(brokerId)  — GET /admin/risk/exposure → ExposureSnapshot
 *   - useRiskThresholds(tenantId) — GET /admin/risk/thresholds → RiskThreshold[]
 *   - useCreateRiskThreshold()    — POST /admin/risk/thresholds mutation
 *
 * Depends on:
 *   - ../client — apiRequest, ApiError
 *
 * Side-effects:
 *   - GET /admin/risk/exposure on mount
 *   - GET /admin/risk/thresholds on mount
 *   - POST /admin/risk/thresholds on create threshold
 *
 * Key invariants:
 *   - 'use client' safe — browser APIs via apiRequest
 *   - Returns empty arrays on network error so pages are never blank
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-24
 */

import { useCallback, useEffect, useState } from 'react';
import { apiRequest, ApiError } from '../client';
import type { ExposureSnapshot, RiskThreshold, RiskThresholdMetric, RiskOperator, RiskAction } from '@/lib/types';

// ─── GET /admin/risk/exposure ──────────────────────────────────────────────────

interface RiskExposureResult {
  exposure: ExposureSnapshot | null;
  marginLevel: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useRiskExposure(brokerId: string): RiskExposureResult {
  const [exposure, setExposure] = useState<ExposureSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    apiRequest<ExposureSnapshot>(`/admin/risk/exposure?brokerId=${encodeURIComponent(brokerId)}`)
      .then(res => { if (!cancelled) setExposure(res); })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load exposure'); })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [brokerId, tick]);

  return {
    exposure,
    marginLevel: exposure?.marginLevel ?? 0,
    isLoading,
    error,
    refetch,
  };
}

// ─── GET /admin/risk/thresholds ───────────────────────────────────────────────

interface RiskThresholdsResult {
  thresholds: RiskThreshold[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useRiskThresholds(tenantId: string): RiskThresholdsResult {
  const [thresholds, setThresholds] = useState<RiskThreshold[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    apiRequest<RiskThreshold[]>(`/admin/risk/thresholds?tenantId=${encodeURIComponent(tenantId)}`)
      .then(res => { if (!cancelled) setThresholds(Array.isArray(res) ? res : []); })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load thresholds'); })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [tenantId, tick]);

  return { thresholds, isLoading, error, refetch };
}

// ─── POST /admin/risk/thresholds ──────────────────────────────────────────────

export interface CreateRiskThresholdInput {
  tenantId: string;
  accountId?: string;
  metric: RiskThresholdMetric;
  operator: RiskOperator;
  thresholdValue: number;
  action: RiskAction;
  enabled?: boolean;
  meta?: Record<string, unknown>;
}

interface CreateThresholdResult {
  createThreshold: (input: CreateRiskThresholdInput) => Promise<void>;
  isPending: boolean;
  error: string | null;
}

export function useCreateRiskThreshold(
  onSuccess?: (threshold: RiskThreshold) => void,
): CreateThresholdResult {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createThreshold = useCallback(async (input: CreateRiskThresholdInput) => {
    setIsPending(true);
    setError(null);
    try {
      const result = await apiRequest<RiskThreshold>('/admin/risk/thresholds', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      onSuccess?.(result);
    } catch (err) {
      throw new ApiError(
        err instanceof ApiError ? err.message : 'Failed to create risk threshold',
        err instanceof ApiError ? err.code : 'CREATE_THRESHOLD_FAILED',
        err instanceof ApiError ? err.requestId : undefined,
        err instanceof ApiError ? err.status : undefined,
      );
    } finally {
      setIsPending(false);
    }
  }, [onSuccess]);

  return { createThreshold, isPending, error };
}

// ─── GET /admin/risk/var ──────────────────────────────────────────────────────

export interface PortfolioVar {
  var: number;
  confidence: number;
  horizonDays: number;
}

interface PortfolioVarResult {
  data: PortfolioVar | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePortfolioVar(brokerId: string): PortfolioVarResult {
  const [data, setData] = useState<PortfolioVar | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const refetch = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    apiRequest<PortfolioVar>(`/admin/risk/var?brokerId=${encodeURIComponent(brokerId)}`)
      .then(res => { if (!cancelled) setData(res); })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load VAR'); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [brokerId, tick]);

  return { data, isLoading, error, refetch };
}

// ─── GET /admin/risk/greeks ───────────────────────────────────────────────────

export interface GreeksData {
  totalDelta: number;
  totalGamma: number;
  portfolioValue: number;
}

interface GreeksResult {
  data: GreeksData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useGreeks(accountId: string): GreeksResult {
  const [data, setData] = useState<GreeksData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const refetch = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    apiRequest<GreeksData>(`/admin/risk/greeks?accountId=${encodeURIComponent(accountId)}`)
      .then(res => { if (!cancelled) setData(res); })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load Greeks'); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [accountId, tick]);

  return { data, isLoading, error, refetch };
}

// ─── GET /admin/risk/circuit-breakers ────────────────────────────────────────

export type CircuitBreakerStatus = 'ACTIVE' | 'HALTED';

export interface CircuitBreaker {
  symbol: string;
  status: CircuitBreakerStatus;
  haltedAt?: string;
  reason?: string;
}

interface CircuitBreakersResult {
  data: CircuitBreaker[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCircuitBreakers(brokerId: string): CircuitBreakersResult {
  const [data, setData] = useState<CircuitBreaker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const refetch = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    apiRequest<CircuitBreaker[]>(`/admin/risk/circuit-breakers?brokerId=${encodeURIComponent(brokerId)}`)
      .then(res => { if (!cancelled) setData(Array.isArray(res) ? res : []); })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load circuit breakers'); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [brokerId, tick]);

  return { data, isLoading, error, refetch };
}

// ─── GET /admin/risk/liquidation-history ─────────────────────────────────────

export interface LiquidationEvent {
  accountId: string;
  action: string;
  marginLevel: number;
  timestamp: string;
  symbol?: string;
}

interface LiquidationHistoryResult {
  data: LiquidationEvent[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useLiquidationHistory(brokerId: string, limit = 20): LiquidationHistoryResult {
  const [data, setData] = useState<LiquidationEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const refetch = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    apiRequest<LiquidationEvent[]>(
      `/admin/risk/liquidation-history?brokerId=${encodeURIComponent(brokerId)}&limit=${encodeURIComponent(String(limit))}`,
    )
      .then(res => { if (!cancelled) setData(Array.isArray(res) ? res : []); })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load liquidation history'); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [brokerId, limit, tick]);

  return { data, isLoading, error, refetch };
}
