/**
 * File:        apps/mobile/app/(tabs)/quotes.tsx
 * Module:      mobile · Screens · Quotes (placeholder)
 * Purpose:     Placeholder for the Quotes tab. Wave 2 replaces this
 *              with the live-polling Quotes screen — a list of
 *              instruments with last price, bid/ask, and a tap-to-
 *              open order entry sheet. This file exists today so the
 *              tab bar has a target route, the typed-route generator
 *              has a surface to introspect, and a designer can preview
 *              the navigation skeleton in isolation.
 *
 * Exports:
 *   - QuotesScreen (default) — the placeholder tab
 *
 * Depends on:
 *   - ../src/design/tokens — tokens, textStyles
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - Title is UPPERCASE in the display font with 0.08em letter
 *     spacing per CLAUDE.md §12. No sentence-case.
 *   - The placeholder text is muted — it should not compete with
 *     future content for attention.
 *
 * Read order:
 *   1. QuotesScreen — single default export
 *
 * Author:       BharatERP
 * Last-updated: 2026-06-03
 */

import { StyleSheet, Text, View } from 'react-native';

import { textStyles, tokens } from '../../src/design/tokens';

export default function QuotesScreen(): React.JSX.Element {
  return (
    <View style={styles.container} testID="quotes-placeholder">
      <Text style={styles.title}>QUOTES</Text>
      <Text style={styles.placeholder}>Wave 2 — live polling, watchlists, order entry.</Text>
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
