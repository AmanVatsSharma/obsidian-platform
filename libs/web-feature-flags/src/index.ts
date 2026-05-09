/**
 * @file libs/web-feature-flags/src/index.ts
 * @module web-feature-flags
 * @description Feature flag contracts for tenant-aware web surfaces
 * @author BharatERP
 * @created 2026-02-17
 */

export type FeatureFlagBag = Record<string, boolean>;

export function isFeatureEnabled(flags: FeatureFlagBag, key: string): boolean {
  return Boolean(flags[key]);
}
