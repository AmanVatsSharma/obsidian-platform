/**
 * File:        libs/mobile-ui-kit/src/lib/panel.tsx
 * Module:      mobile-ui-kit · Primitives
 * Purpose:     Bordered panel container with an ALL CAPS display title.
 *              Implements the "structure = borders, not shadows" rule
 *              from CLAUDE.md §12. The whole product uses this primitive
 *              for the workstation quadrants, order ticket, account card.
 *
 * Exports:
 *   - Panel — bordered, titled, optionally loading/errored container
 *
 * Depends on:
 *   - react-native  — View, Text, ActivityIndicator, StyleSheet
 *   - ./types       — PanelProps
 *   - ./theme       — colors, radius, spacing, typography
 *
 * Side-effects:
 *   - none (pure render)
 *
 * Key invariants:
 *   - Title is rendered in `typography.display` with letterSpacing 0.08em
 *     and uppercase — never the caller's responsibility.
 *   - 1px solid border using `colors.border` — no shadow for structure.
 *   - Loading state replaces children with a centered ActivityIndicator.
 *   - Error state shows the error string in bear color above children.
 *
 * Read order:
 *   1. Panel  — single export
 *
 * Author:       BharatERP
 * Last-updated: 2026-06-03
 */

import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { PanelProps } from './types';
import { colors, radius, spacing, typography } from './theme';

export function Panel({
  title,
  density = 'regular',
  loading = false,
  error = null,
  testID,
  children,
}: PanelProps): React.ReactElement {
  const pad = density === 'compact' ? spacing.s3 : spacing.s4;
  return (
    <View testID={testID} style={[styles.panel, { padding: pad }]}>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.fg2} />
        </View>
      ) : (
        children
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.bgPanel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    gap: spacing.s2,
  },
  title: {
    color: colors.fg2,
    fontFamily: typography.display,
    fontSize: typography.size11,
    fontWeight: '700',
    letterSpacing: 0.08 * 16,
    textTransform: 'uppercase',
  },
  error: {
    color: colors.bear,
    fontFamily: typography.mono,
    fontSize: typography.size11,
  },
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.s5,
  },
});
