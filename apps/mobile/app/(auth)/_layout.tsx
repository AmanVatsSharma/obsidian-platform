/**
 * File:        apps/mobile/app/(auth)/_layout.tsx
 * Module:      mobile · Routing · Auth Group
 * Purpose:     Stack layout for the `(auth)` route group. The group is
 *              rendered while the user is unauthenticated. No tab bar
 *              is shown here — the group's `Stack` declares a single
 *              `headerShown: false` screen and the screens themselves
 *              own their own top bar (login has a centered wordmark).
 *
 * Exports:
 *   - AuthLayout (default) — the auth stack layout
 *
 * Depends on:
 *   - expo-router — Stack
 *
 * Side-effects:
 *   - none (layout components are pure renderers)
 *
 * Key invariants:
 *   - The `(auth)` group is a logical grouping — Expo Router does NOT
 *     add a segment for the parenthesised directory. `/(auth)/login`
 *     resolves to the same path as `/login` from a deep-link
 *     perspective; the parens are purely for file organisation.
 *   - The auth stack will gain additional routes in Wave 2 (forgot-
 *     password, otp-verify, etc.). Each will be registered here as
 *     a `<Stack.Screen>` only if it needs a non-default header.
 *
 * Read order:
 *   1. AuthLayout — single default export
 *
 * Author:       BharatERP
 * Last-updated: 2026-06-03
 */

import { Stack } from 'expo-router';

import { tokens } from '../../src/design/tokens';

export default function AuthLayout(): React.JSX.Element {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: tokens.bg.base },
      }}
    />
  );
}
