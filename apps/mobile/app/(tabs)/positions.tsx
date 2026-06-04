/**
 * File:        apps/mobile/app/(tabs)/positions.tsx
 * Module:      mobile · Screens · Positions (placeholder)
 * Purpose:     Placeholder for the Positions tab. Wave 2 replaces
 *              this with the Positions screen — a list of open
 *              positions with live P&L, average price, and a swipe
 *              gesture to close. Today it is a typography-only
 *              scaffold so the tab bar has a target.
 *
 * Exports:
 *   - PositionsScreen (default) — the placeholder tab
 *
 * Depends on:
 *   - ../src/design/tokens — tokens, textStyles
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - Title typography matches the Quotes placeholder so all four
 *     tabs feel like the same app.
 *
 * Read order:
 *   1. PositionsScreen — single default export
 *
 * Author:       BharatERP
 * Last-updated: 2026-06-03
 */

import { StyleSheet, Text, View } from 'react-native';

import { textStyles, tokens } from '../../src/design/tokens';

export default function PositionsScreen(): React.JSX.Element {
  return (
    <View style={styles.container} testID="positions-placeholder">
      <Text style={styles.title}>POSITIONS</Text>
      <Text style={styles.placeholder}>Wave 2 — open positions, live P&L, close gesture.</Text>
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
});
