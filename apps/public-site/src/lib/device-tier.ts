/**
 * File:        apps/public-site/src/lib/device-tier.ts
 * Module:      public-site · Device Tier Detection
 * Purpose:     Client-side device capability detection that decides which visual
 *              tier to render: full Three.js (Tier 1), lite Three.js (Tier 2),
 *              or CSS/SVG fallbacks only (Tier 3).
 *
 * Exports:
 *   - DeviceTier    — singleton with get/isHigh/isMid/isLow helpers
 *   - detectTier()  — returns 1 | 2 | 3 (convenience function)
 *
 * Depends on:
 *   - none (browser APIs only)
 *
 * Side-effects:
 *   - Reads navigator.deviceMemory, navigator.hardwareConcurrency,
 *     navigator.connection, window.matchMedia — all read-only
 *
 * Key invariants:
 *   - Must only run on the client — never import at module scope in a server component
 *   - Result is memoized: detect() is idempotent after first call
 *   - prefers-reduced-motion → always Tier 3 (accessibility)
 *   - No WebGL support → always Tier 3
 *
 * Read order:
 *   1. DeviceTier singleton — understand the memoized detection logic
 *   2. detectTier() — thin wrapper used by components
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

type Tier = 1 | 2 | 3;

let _cached: Tier | null = null;

function _detect(): Tier {
  if (_cached !== null) return _cached;

  if (typeof window === 'undefined') { _cached = 3; return 3; }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { _cached = 3; return 3; }

  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };

  if (nav.connection?.saveData) { _cached = 3; return 3; }

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) { _cached = 3; return 3; }
  } catch {
    _cached = 3;
    return 3;
  }

  const mem  = nav.deviceMemory ?? 4;
  const cpu  = navigator.hardwareConcurrency ?? 4;
  const conn = nav.connection?.effectiveType ?? '4g';
  const slow = conn === '2g' || conn === 'slow-2g';

  if (slow || mem < 2 || cpu < 2) { _cached = 3; return 3; }
  if (mem >= 4 && cpu >= 4)        { _cached = 1; return 1; }

  _cached = 2;
  return 2;
}

export const DeviceTier = {
  get:    _detect,
  isHigh: () => _detect() === 1,
  isMid:  () => _detect() === 2,
  isLow:  () => _detect() === 3,
};

export function detectTier(): Tier {
  return _detect();
}
