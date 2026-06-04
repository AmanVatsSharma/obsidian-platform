/**
 * File:        apps/mobile/app/(tabs)/orders.tsx
 * Module:      mobile · Screens · Orders (placeholder)
 * Purpose:     Placeholder for the Orders tab. Wave 2 replaces this
 *              with the Orders screen — a working/cancelled/filled
 *              blotter with a per-row cancel action. Today it is a
 *              typography-only scaffold.
 *
 * Exports:
 *   - OrdersScreen (default) — the placeholder tab
 *
 * Depends on:
 *   - ../src/design/tokens — tokens, textStyles
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - Title typography matches the other placeholders.
 *
 * Read order:
 *   1. OrdersScreen — single default export
 *
 * Author:       BharatERP
 * Last-updated: 2026-06-03
 */

import { StyleSheet, Text, View } from 'react-native';

import { textStyles, tokens } from '../../src/design/tokens';

export default function OrdersScreen(): React.JSX.Element {
  return (
    <View style={styles.container} testID="orders-placeholder">
      <Text style={styles.title}>ORDERS</Text>
      <Text style={styles.placeholder}>Wave 2 — working orders, fills, cancel.</Text>
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
