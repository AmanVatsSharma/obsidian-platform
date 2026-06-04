/**
 * File:        apps/mobile/expo-env.d.ts
 * Module:      mobile · Build · Types
 * Purpose:     Auto-generated ambient TypeScript declarations for the
 *              Expo runtime. Pulls in:
 *                - `expo-router/types` — typed routes (Route, LinkProps, etc.)
 *                - `expo/types`        — `expo-constants`, environment globals
 *              Expo regenerates this file on `expo start`; the entries below
 *              are the stable minimum we need for `tsc --noEmit` to type-check
 *              the project before the first dev server boot.
 *
 * Exports:
 *   - none (ambient reference comments)
 *
 * Depends on:
 *   - expo-router/types — typed file-based routes
 *   - expo/types        — env, manifest, Constants
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - This file MUST be committed to source control — `tsc` is the
 *     verification signal for the mobile app (no jest target yet), and a
 *     missing `expo-env.d.ts` makes the build fail with no useful error.
 *
 * Read order:
 *   1. (reference) — top of file
 *
 * Author:       BharatERP
 * Last-updated: 2026-06-03
 */

/// <reference types="expo-router/types" />
/// <reference types="expo/types" />
