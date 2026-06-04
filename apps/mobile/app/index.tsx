/**
 * File:        apps/mobile/app/index.tsx
 * Module:      mobile · Routing · Index
 * Purpose:     The very first route Expo Router resolves at app launch.
 *              Renders a transparent passthrough so Expo Router mounts
 *              the route tree; the actual routing decision is made by
 *              `AuthGate` (which sits in the parent layout). The gate
 *              immediately calls `router.replace('/(auth)/login')` or
 *              `router.replace('/(tabs)')` once the auth context's
 *              status is no longer `'loading'`.
 *
 * Exports:
 *   - IndexRoute (default) — the initial route
 *
 * Depends on:
 *   - ../src/apollo/AuthGate — SplashScreen (re-used so the user sees
 *                               the wordmark while the gate decides)
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - The `IndexRoute` is intentionally a thin shell. Putting routing
 *     logic here would race the gate; the gate owns the redirect.
 *   - The splash component is exported by `AuthGate.tsx` and is the
 *     only thing rendered on the very first frame. When the gate
 *     transitions, Expo Router unmounts the splash and mounts the
 *     target stack.
 *
 * Read order:
 *   1. IndexRoute — single default export
 *
 * Author:       BharatERP
 * Last-updated: 2026-06-03
 */

import { SplashScreen } from '../src/apollo/AuthGate';

export default function IndexRoute(): React.JSX.Element {
  return <SplashScreen />;
}
