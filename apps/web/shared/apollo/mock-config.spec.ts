/**
 * File:        apps/web/shared/apollo/mock-config.spec.ts
 * Module:      web · Shared · Apollo · Tests
 * Purpose:     Unit tests for the mock-mode env-var helper. Verifies that
 *              only the literal string 'true' enables mock mode, that all
 *              other values (including common falsey / truthy gotchas like
 *              'TRUE', '1', '', undefined) disable it, and that getMockMode
 *              returns the correctly-typed string.
 *
 * Exports:
 *   - none (test suite)
 *
 * Depends on:
 *   - ./mock-config   — system under test
 *
 * Side-effects:
 *   - Mutates process.env.NEXT_PUBLIC_MOCK_GQL. Each test restores it in
 *     afterEach to avoid leakage into other suites.
 *
 * Key invariants:
 *   - One test per value variant. Adding a new env-var convention (e.g. a
 *     future 'yes' alias) MUST add a new case here and a corresponding note
 *     in mock-config.ts.
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-01
 */

import { getMockMode, isMockGraphQLEnabled, MOCK_GQL_ENV_VAR, type MockMode } from './mock-config';

describe('mock-config', () => {
  const originalValue = process.env[MOCK_GQL_ENV_VAR];

  afterEach(() => {
    if (originalValue === undefined) {
      delete process.env[MOCK_GQL_ENV_VAR];
    } else {
      process.env[MOCK_GQL_ENV_VAR] = originalValue;
    }
  });

  describe('isMockGraphQLEnabled', () => {
    it('returns true when NEXT_PUBLIC_MOCK_GQL === "true"', () => {
      process.env[MOCK_GQL_ENV_VAR] = 'true';
      expect(isMockGraphQLEnabled()).toBe(true);
    });

    it('returns false when NEXT_PUBLIC_MOCK_GQL === "false"', () => {
      process.env[MOCK_GQL_ENV_VAR] = 'false';
      expect(isMockGraphQLEnabled()).toBe(false);
    });

    it('returns false when NEXT_PUBLIC_MOCK_GQL === "TRUE" (case-sensitive)', () => {
      process.env[MOCK_GQL_ENV_VAR] = 'TRUE';
      expect(isMockGraphQLEnabled()).toBe(false);
    });

    it('returns false when NEXT_PUBLIC_MOCK_GQL === "1"', () => {
      process.env[MOCK_GQL_ENV_VAR] = '1';
      expect(isMockGraphQLEnabled()).toBe(false);
    });

    it('returns false when NEXT_PUBLIC_MOCK_GQL === ""', () => {
      process.env[MOCK_GQL_ENV_VAR] = '';
      expect(isMockGraphQLEnabled()).toBe(false);
    });

    it('returns false when NEXT_PUBLIC_MOCK_GQL is undefined', () => {
      delete process.env[MOCK_GQL_ENV_VAR];
      expect(isMockGraphQLEnabled()).toBe(false);
    });
  });

  describe('getMockMode', () => {
    it('returns "enabled" when the env var is "true"', () => {
      process.env[MOCK_GQL_ENV_VAR] = 'true';
      const mode: MockMode = getMockMode();
      expect(mode).toBe('enabled');
    });

    it('returns "disabled" when the env var is "false"', () => {
      process.env[MOCK_GQL_ENV_VAR] = 'false';
      const mode: MockMode = getMockMode();
      expect(mode).toBe('disabled');
    });

    it('returns "disabled" when the env var is undefined', () => {
      delete process.env[MOCK_GQL_ENV_VAR];
      const mode: MockMode = getMockMode();
      expect(mode).toBe('disabled');
    });
  });
});
