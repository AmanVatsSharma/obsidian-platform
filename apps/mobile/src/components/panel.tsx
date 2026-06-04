/**
 * File:        apps/mobile/src/components/panel.tsx
 * Module:      mobile · Components · Panel
 * Purpose:     Panel container — a panel body with a 1px hairline border
 *              (no shadow, per CLAUDE.md §12 — structure is borders, not
 *              shadows) and an ALL-CAPS section title row above it.
 *              Mirrors the visual rhythm of the web app's
 *              `<Card>` + `<CardHeader>` primitives.
 *
 * Exports:
 *   - Panel             — bordered body container
 *   - PanelHeader       — section title row
 *   - PanelEmpty        — placeholder when a panel has no content
 *
 * Depends on:
 *   - react-native       — View, Text, StyleSheet
 *   - ../design/tokens   — color, textStyles, space
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - `PanelHeader` text is rendered with `textStyles.sectionTitle`
 *     which is ALL CAPS, font-display, 0.08em letter-spacing. Per
 *     CLAUDE.md §12, panel titles MUST follow that rhythm — passing
 *     a sentence-case string is a brand violation.
 *   - Panels never use shadows. Structure is conveyed by 1px hairlines
 *     on `border.default` for resting, `border.mid` for emphasis.
 *
 * Read order:
 *   1. PanelHeader
 *   2. Panel
 *   3. PanelEmpty
 *
 * Author:       BharatERP
 * Last-updated: 2026-06-03
 */

import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { textStyles, tokens } from '../design/tokens';

export function PanelHeader({
  title,
  trailing,
  emphasized,
}: {
  title: string;
  trailing?: ReactNode;
  /** When true, the panel uses a stronger border (for selected/active state). */
  emphasized?: boolean;
}) {
  return (
    <View style={styles.headerRow}>
      <Text
        style={[
          textStyles.sectionTitle,
          emphasized ? { color: tokens.fg.primary } : null,
        ]}
        numberOfLines={1}
      >
        {title}
      </Text>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </View>
  );
}

export function Panel({
  children,
  emphasized,
  noBodyPadding,
}: {
  children: ReactNode;
  emphasized?: boolean;
  noBodyPadding?: boolean;
}) {
  return (
    <View
      style={[
        styles.panel,
        emphasized ? { borderColor: tokens.border.mid } : null,
        noBodyPadding ? null : { padding: tokens.space['3'] },
      ]}
    >
      {children}
    </View>
  );
}

export function PanelEmpty({ message }: { message: string }) {
  return (
    <View style={styles.empty}>
      <Text style={textStyles.bodyMuted}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.space['2'],
  },
  trailing: { flexDirection: 'row', alignItems: 'center', gap: tokens.space['2'] },
  panel: {
    backgroundColor: tokens.bg.panel,
    borderColor: tokens.border.default,
    borderWidth: 1,
    borderRadius: tokens.radii.lg,
  },
  empty: {
    paddingVertical: tokens.space['6'],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
