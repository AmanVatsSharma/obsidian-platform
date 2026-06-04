/**
 * File:        apps/mobile/app/(tabs)/account.tsx
 * Module:      mobile · Screens · Account (placeholder)
 * Purpose:     Placeholder for the Account tab. Wave 2 replaces this
 *              with the Account Summary screen — equity, buying power,
 *              and a "Sign out" button. Today it is a typography-only
 *              scaffold. The screen exposes a "Sign out" Pressable
 *              so the end-to-end flow (login → home → sign out →
 *              login) is testable in mock mode.
 *
 * Exports:
 *   - AccountScreen (default) — the placeholder tab
 *
 * Depends on:
 *   - ../src/auth/auth-context — useAuth (signOut)
 *   - ../src/design/tokens    — tokens, textStyles
 *
 * Side-effects:
 *   - The "Sign out" button calls `signOut()` which clears the
 *     secure-store tokens and flips the auth context to
 *     `'unauthenticated'`. The AuthGate then re-routes to
 *     `/(auth)/login`.
 *
 * Key invariants:
 *   - Sign-out is the only behavioural element in this file. Wave 2
 *     adds the actual account-summary content above the button.
 *
 * Read order:
 *   1. AccountScreen — single default export
 *
 * Author:       BharatERP
 * Last-updated: 2026-06-03
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../../src/auth/auth-context';
import { textStyles, tokens } from '../../src/design/tokens';

export default function AccountScreen(): React.JSX.Element {
  const { signOut } = useAuth();

  return (
    <View style={styles.container} testID="account-placeholder">
      <Text style={styles.title}>ACCOUNT</Text>
      <Text style={styles.placeholder}>Wave 2 — equity, buying power, settings.</Text>

      <Pressable
        onPress={() => {
          void signOut();
        }}
        accessibilityRole="button"
        accessibilityLabel="Sign out"
        testID="account-signout"
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <Text style={styles.buttonLabel}>SIGN OUT</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.bg.base,
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.space['6'],
    gap: tokens.space['3'],
  },
  title: {
    ...textStyles.sectionTitle,
    fontSize: 18,
    color: tokens.fg.primary,
    letterSpacing: 4,
  },
  placeholder: {
    ...textStyles.bodyMuted,
    textAlign: 'center',
    maxWidth: 280,
  },
  button: {
    marginTop: tokens.space['6'],
    borderWidth: 1,
    borderColor: tokens.border.default,
    borderRadius: 6,
    paddingHorizontal: tokens.space['6'],
    paddingVertical: tokens.space['3'],
    minWidth: 200,
    alignItems: 'center',
  },
  buttonPressed: { opacity: 0.7 },
  buttonLabel: {
    ...textStyles.action,
    color: tokens.fg.primary,
    fontSize: 13,
  },
});
