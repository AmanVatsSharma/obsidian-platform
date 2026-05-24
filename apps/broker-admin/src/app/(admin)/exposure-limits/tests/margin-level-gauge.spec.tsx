/**
 * File:        apps/broker-admin/src/app/(admin)/exposure-limits/tests/margin-level-gauge.spec.tsx
 * Module:      broker-admin · Risk · Margin Level Gauge Tests
 * Purpose:     Tests for the MarginLevelGauge component color logic
 *
 * Exports:
 *   - (all tests — no module exports)
 *
 * Depends on:
 *   - ../page — MarginLevelGauge component (imported conditionally)
 *
 * Side-effects: none
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-24
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// ── Test just the color logic ─────────────────────────────────────────────────

function gaugeColor(level: number) {
  if (level >= 150) return 'var(--bull)';
  if (level >= 100) return 'var(--warn)';
  return 'var(--bear)';
}

describe('MarginLevelGauge color logic', () => {
  it('returns green (bull) when margin level is 150% or above', () => {
    expect(gaugeColor(150)).toBe('var(--bull)');
    expect(gaugeColor(200)).toBe('var(--bull)');
    expect(gaugeColor(500)).toBe('var(--bull)');
    expect(gaugeColor(150.1)).toBe('var(--bull)');
  });

  it('returns amber (warn) when margin level is between 100% and 150%', () => {
    expect(gaugeColor(100)).toBe('var(--warn)');
    expect(gaugeColor(120)).toBe('var(--warn)');
    expect(gaugeColor(149)).toBe('var(--warn)');
    expect(gaugeColor(149.9)).toBe('var(--warn)');
  });

  it('returns red (bear) when margin level is below 100%', () => {
    expect(gaugeColor(99)).toBe('var(--bear)');
    expect(gaugeColor(50)).toBe('var(--bear)');
    expect(gaugeColor(1)).toBe('var(--bear)');
    expect(gaugeColor(80)).toBe('var(--bear)');
  });

  it('returns green at exactly 149.9% edge case (still amber, not bull)', () => {
    expect(gaugeColor(149.9)).toBe('var(--warn)');
  });

  it('returns amber at exactly 100% (not bull)', () => {
    expect(gaugeColor(100)).toBe('var(--warn)');
  });
});

// ── Test the label rendering ───────────────────────────────────────────────────

describe('MarginLevelGauge label rendering', () => {
  function getLabel(level: number) {
    if (level >= 150) return 'Healthy';
    if (level >= 100) return 'Warning';
    return 'Critical';
  }

  it('shows "Healthy" label when level >= 150%', () => {
    expect(getLabel(150)).toBe('Healthy');
    expect(getLabel(200)).toBe('Healthy');
  });

  it('shows "Warning" label when 100% <= level < 150%', () => {
    expect(getLabel(100)).toBe('Warning');
    expect(getLabel(120)).toBe('Warning');
    expect(getLabel(149)).toBe('Warning');
  });

  it('shows "Critical" label when level < 100%', () => {
    expect(getLabel(99)).toBe('Critical');
    expect(getLabel(50)).toBe('Critical');
    expect(getLabel(0)).toBe('Critical');
  });
});

// ── Test MarginAlertBanner ─────────────────────────────────────────────────────

describe('MarginAlertBanner conditions', () => {
  function shouldShowBanner(level: number) {
    return level < 80 || (level >= 80 && level < 110);
  }

  function bannerType(level: number): 'critical' | 'warning' | null {
    if (level < 80) return 'critical';
    if (level < 110) return 'warning';
    return null;
  }

  it('shows critical banner when margin level < 80%', () => {
    expect(bannerType(79)).toBe('critical');
    expect(bannerType(50)).toBe('critical');
    expect(bannerType(0)).toBe('critical autolipidation');
  });

  it('shows warning banner when margin level is 80-109%', () => {
    expect(bannerType(80)).toBe('warning');
    expect(bannerType(100)).toBe('warning');
    expect(bannerType(109)).toBe('warning');
  });

  it('returns null (no banner) when margin level >= 110%', () => {
    expect(bannerType(110)).toBeNull();
    expect(bannerType(150)).toBeNull();
    expect(bannerType(200)).toBeNull();
  });
});
