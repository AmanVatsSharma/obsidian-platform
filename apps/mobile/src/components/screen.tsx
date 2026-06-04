/**
 * File:        apps/mobile/src/components/screen.tsx
 * Module:      mobile · Components · Screen
 * Purpose:     Top-level screen container — applies the Obsidian dark
 *              terminal background, a top safe-area inset, and a
 *              consistent horizontal gutter. Every screen mounts
 *              inside this so backgrounds and edges are uniform.
 *
 * Exports:
 *   - Screen                — the container component
 *   - ScreenProps           — props
 *
 * Depends on:
 *   - react-native                  — View, SafeAreaView, StyleSheet, ScrollView
 *   - react-native-safe-area-context — useSafeAreaInsets
 *   - ../design/tokens              — color, space
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - `Screen` is the only place that paints `bg.base`. Components do
 *     not set their own backgrounds — that prevents the iOS "white
 *     flash" on navigation transitions.
 *   - Scrollable variant: pass `scroll` to get a vertical `ScrollView`
 *     with consistent padding. Flat screens should use the default
 *     `<View>` to avoid unnecessary measurement.
 *
 * Read order:
 *   1. ScreenProps
 *   2. Screen
 *
 * Author:       BharatERP
 * Last-updated: 2026-06-03
 */

import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '../design/tokens';

export type ScreenProps = {
  children: ReactNode;
  /** When true, content is wrapped in a vertical ScrollView. */
  scroll?: boolean;
  /** Style overrides for the inner content. */
  contentStyle?: ViewStyle;
  /** Hide the top safe-area padding (e.g. for full-bleed headers). */
  noTopInset?: boolean;
};

export function Screen({ children, scroll, contentStyle, noTopInset }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const topPad = noTopInset ? 0 : insets.top;
  const bottomPad = insets.bottom;

  if (scroll) {
    return (
      <View style={[styles.root, { paddingTop: topPad }]}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            { padding: tokens.space['4'], paddingBottom: bottomPad + tokens.space['6'] },
            contentStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.root,
        { paddingTop: topPad, paddingBottom: bottomPad, paddingHorizontal: tokens.space['4'] },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1, backgroundColor: tokens.bg.base },
});
