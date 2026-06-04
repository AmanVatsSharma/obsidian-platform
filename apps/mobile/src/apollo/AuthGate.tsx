/**
 * File:        apps/mobile/src/apollo/AuthGate.tsx
 * Module:      mobile · Apollo · Auth Gate
 * Purpose:     The auth gate is the single point that decides whether the
 *              app renders the auth stack or the main tab stack. It is
 *              a client component mounted at the root layout, so the
 *              layout itself stays declarative (it does not own auth
 *              state). The gate reads the auth context's `status` and
 *              redirects via Expo Router's imperative `router.replace`
 *              when the state transitions.
 *
 * Exports:
 *   - AuthGate              — top-level auth-state router
 *   - SplashScreen          — minimal splash shown while the token is
 *                              being primed at boot
 *
 * Depends on:
 *   - react                — useEffect
 *   - expo-router          — useRouter (imperative navigation)
 *   - ../auth/auth-context — useAuth, AuthStatus
 *
 * Side-effects:
 *   - Reads the auth status from React context (no IO).
 *   - When the status transitions between authenticated ↔ unauthenticated,
 *     calls `router.replace('/(auth)/login')` or `router.replace('/(tabs)')`
 *     to swap the rendered route group. No state is owned by this component.
 *
 * Key invariants:
 *   - The gate MUST render *something* on every render. The SplashScreen
 *     is shown while the auth context is in `'loading'` state — without
 *     a single child, Expo Router would mount a blank screen and the
 *     user would see a flash of nothing.
 *   - The gate does NOT own auth state. Auth state lives in `AuthProvider`
 *     and is hydrated by `primeAccessTokenCache()` at boot.
 *   - The redirect targets are the route-group roots: `/(auth)/login`
 *     and `/(tabs)`. Expo Router resolves those to the first child of
 *     the matching group layout.
 *
 * Read order:
 *   1. SplashScreen — the splash
 *   2. AuthGate     — the gate
 *
 * Author:       BharatERP
 * Last-updated: 2026-06-03
 */

import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useAuth } from '../auth/auth-context';
import { textStyles, tokens } from '../design/tokens';

/**
 * Minimal splash — black background, the Obsidian wordmark in the
 * display font, and a small spinner underneath. Shown for the ~50ms
 * the auth context needs to read tokens from secure store on first
 * boot. On subsequent boots the gate re-renders with the actual
 * status almost immediately.
 */
export function SplashScreen(): React.JSX.Element {
  return (
    <View style={styles.splash} testID="splash">
      <Text style={styles.wordmark}>OBSIDIAN</Text>
      <ActivityIndicator color={tokens.fg.secondary} style={styles.spinner} />
    </View>
  );
}

export function AuthGate({ children }: { children: React.ReactNode }): React.JSX.Element {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'authenticated') {
      router.replace('/(tabs)');
    } else {
      router.replace('/(auth)/login');
    }
  }, [status, router]);

  // While the auth context is hydrating, render a splash. Once a
  // status has been resolved the gate kicks the router; the children
  // passed in are the route-group stacks themselves, which Expo
  // Router renders after the redirect lands.
  if (status === 'loading') {
    return <SplashScreen />;
  }
  return <>{children}</>;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.bg.base,
  },
  wordmark: {
    ...textStyles.sectionTitle,
    fontSize: 18,
    letterSpacing: 4,
    color: tokens.fg.primary,
  },
  spinner: {
    marginTop: 16,
  },
});
