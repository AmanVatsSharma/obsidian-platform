/**
 * File:        apps/mobile/app/_layout.tsx
 * Module:      mobile · Routing · Root
 * Purpose:     Root layout for the Expo Router tree. Mounts the global
 *              providers in the correct order and renders `AuthGate` as
 *              the only top-level child. The gate decides whether the
 *              auth stack (`/(auth)/*`) or the main tab stack
 *              (`/(tabs)/*`) is rendered.
 *
 * Exports:
 *   - RootLayout (default) — the Expo Router root layout component
 *
 * Depends on:
 *   - react-native               — View
 *   - react-native-gesture-handler — GestureHandlerRootView (required by reanimated)
 *   - react-native-safe-area-context — SafeAreaProvider
 *   - expo-status-bar            — StatusBar
 *   - ../src/apollo/ApolloRoot   — ApolloProvider wrapper
 *   - ../src/apollo/AuthGate     — auth-state router
 *   - ../src/auth/auth-context   — AuthProvider
 *
 * Side-effects:
 *   - Mounts the provider tree at app boot.
 *   - StatusBar is configured to `light` content (the brand is dark-first).
 *
 * Key invariants:
 *   - Provider order: GestureHandlerRootView → SafeAreaProvider →
 *     ApolloRoot → AuthProvider → AuthGate. AuthGate MUST sit inside
 *     AuthProvider so `useAuth()` can read the status, and inside
 *     SafeAreaProvider so descendants can use `useSafeAreaInsets()`.
 *   - The Expo Router file-based router renders this layout once at
 *     the top of the tree. It is NOT a stateful component.
 *
 * Read order:
 *   1. RootLayout — single default export
 *
 * Author:       BharatERP
 * Last-updated: 2026-06-03
 */

// NOTE: apps/mobile/babel.config.js was removed during the Nx-native
// refactor (this app now relies on the root package.json + tsconfig path
// aliases). If you intend to run `expo start` on a workstation, recreate
// the file with `react-native-reanimated/plugin` as the LAST plugin entry
// (the reanimated docs require it to be final; reordering breaks worklet
// compilation). Reanimated itself warns at startup if its plugin is
// missing, so the user signal is right.

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { Stack } from 'expo-router';

import { AuthGate } from '../src/apollo/AuthGate';
import { ApolloRoot } from '../src/apollo/ApolloRoot';
import { AuthProvider } from '../src/auth/auth-context';
import { tokens } from '../src/design/tokens';

export default function RootLayout(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ApolloRoot>
          <AuthProvider>
            <StatusBar style="light" backgroundColor={tokens.bg.base} />
            <AuthGate>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: tokens.bg.base },
                }}
              />
            </AuthGate>
          </AuthProvider>
        </ApolloRoot>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: tokens.bg.base,
  },
});
