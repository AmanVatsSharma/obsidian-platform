/**
 * File:        apps/mobile/src/components/button.tsx
 * Module:      mobile · Components · Button
 * Purpose:     Touchable button primitive with the Obsidian visual
 *              rhythm. BUY / SELL call-to-action variants are UPPERCASE
 *              bold per CLAUDE.md §12 and tinted `--bull` / `--bear`.
 *
 * Exports:
 *   - Button              — primary / ghost / danger / buy / sell
 *   - ButtonProps
 *
 * Depends on:
 *   - react-native                  — Pressable, Text, StyleSheet
 *   - expo-haptics                  — Haptics.selectionAsync (gentle tap)
 *   - ../design/tokens              — color, textStyles, space, radii
 *
 * Side-effects:
 *   - Fires a light haptic on press when `haptic` is true (default).
 *
 * Key invariants:
 *   - The `buy` and `sell` variants tint their backgrounds with
 *     `tokens.sem.bull` / `tokens.sem.bear`. NEVER use a different
 *     green/red pair — the bull/bear pair is the brand contract.
 *   - The label is rendered in `textStyles.action` (UPPERCASE bold).
 *     Passing a sentence-case label is a brand violation.
 *   - Buttons have a 44pt minimum touch target — the `minHeight` of 44
 *     is intentional, do not reduce.
 *
 * Read order:
 *   1. ButtonProps
 *   2. Button
 *
 * Author:       BharatERP
 * Last-updated: 2026-06-03
 */

import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { textStyles, tokens } from '../design/tokens';

export type ButtonVariant = 'primary' | 'ghost' | 'danger' | 'buy' | 'sell';

export type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  fullWidth?: boolean;
  haptic?: boolean;
  trailing?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  fullWidth,
  haptic = true,
  trailing,
  style,
}: ButtonProps) {
  const handlePress = () => {
    if (disabled) return;
    if (haptic) {
      Haptics.selectionAsync().catch(() => {
        // Haptics is best-effort; ignore failures (e.g. older simulators).
      });
    }
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.base,
        fullWidth ? styles.fullWidth : null,
        VARIANT_BG[variant],
        pressed && !disabled ? VARIANT_PRESSED_BG[variant] : null,
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      <Text style={[textStyles.action, VARIANT_TEXT[variant]]} numberOfLines={1}>
        {label}
      </Text>
      {trailing ? <>{trailing}</> : null}
    </Pressable>
  );
}

const VARIANT_BG: Record<ButtonVariant, ViewStyle> = {
  primary: { backgroundColor: tokens.bg.elevated, borderColor: tokens.border.mid, borderWidth: 1 },
  ghost: { backgroundColor: 'transparent', borderColor: tokens.border.default, borderWidth: 1 },
  danger: { backgroundColor: tokens.bg.elevated, borderColor: tokens.sem.bear, borderWidth: 1 },
  buy: { backgroundColor: tokens.sem.bull, borderColor: tokens.sem.bull, borderWidth: 1 },
  sell: { backgroundColor: tokens.sem.bear, borderColor: tokens.sem.bear, borderWidth: 1 },
};

const VARIANT_PRESSED_BG: Record<ButtonVariant, ViewStyle> = {
  primary: { backgroundColor: tokens.bg.active },
  ghost: { backgroundColor: tokens.bg.hover },
  danger: { backgroundColor: tokens.bg.active },
  buy: { opacity: 0.85 },
  sell: { opacity: 0.85 },
};

const VARIANT_TEXT: Record<ButtonVariant, { color: string }> = {
  primary: { color: tokens.fg.primary },
  ghost: { color: tokens.fg.primary },
  danger: { color: tokens.sem.bear },
  buy: { color: '#06080A' },
  sell: { color: '#06080A' },
};

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    paddingHorizontal: tokens.space['4'],
    borderRadius: tokens.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: tokens.space['2'],
  },
  fullWidth: { alignSelf: 'stretch' },
  disabled: { opacity: 0.4 },
});
