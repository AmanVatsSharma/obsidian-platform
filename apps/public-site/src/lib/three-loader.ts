/**
 * File:        apps/public-site/src/lib/three-loader.ts
 * Module:      public-site · Three.js Lazy Loader
 * Purpose:     Dynamic import wrapper for Three.js. Memoizes the promise so
 *              multiple components can call loadThree() without redundant imports.
 *              Short-circuits to null on Tier 3 devices.
 *
 * Exports:
 *   - loadThree()  — () => Promise<typeof import('three') | null>
 *                    Resolves to the Three.js namespace on Tier 1/2, null on Tier 3.
 *
 * Depends on:
 *   - three                  — npm package (not CDN)
 *   - @/lib/device-tier      — tier detection
 *
 * Side-effects:
 *   - Dynamic import of 'three' on first call (one-time, ~500 KB gzipped)
 *
 * Key invariants:
 *   - Never called on the server — all Three.js components are wrapped in
 *     `next/dynamic({ ssr: false })`
 *   - Promise is shared across all callers via module-level variable
 *   - Returns null (not throws) on Tier 3 — callers must handle the null case
 *
 * Read order:
 *   1. _promise variable — the memoization store
 *   2. loadThree() — entry point
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

import type * as THREE from 'three';
import { DeviceTier } from './device-tier';

let _promise: Promise<typeof THREE | null> | null = null;

export function loadThree(): Promise<typeof THREE | null> {
  if (DeviceTier.isLow()) return Promise.resolve(null);
  if (_promise) return _promise;

  _promise = import('three').then(
    (mod) => mod,
    () => null,
  );

  return _promise;
}
