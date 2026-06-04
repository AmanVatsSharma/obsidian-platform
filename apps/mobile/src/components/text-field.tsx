/**
 * File:        apps/mobile/src/components/text-field.tsx
 * Module:      mobile · Components · TextField
 * Purpose:     TextField primitive — wraps RN's `TextInput` with the
 *              Obsidian border-and-bg rhythm. Used by the login screen
 *              and the order entry sheet.
 *
 * Exports:
 *   - TextField
 *   - TextFieldProps
 *
 * Depends on:
 *   - react-native       — TextInput, View, Text, StyleSheet
 *   - ../design/tokens   — color, textStyles, space
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - Border is `border.default` at rest, `border.high` on focus, and
 *     `border.mid` for the error state. There are NEVER shadows on
 *     input fields.
 *   - The optional label is rendered in `textStyles.sectionTitle` so
 *     field labels follow the panel-title rhythm (ALL CAPS).
 *
 * Read order:
 *   1. TextFieldProps
 *   2. TextField
 *
 * Author:       BharatERP
 * Last-updated: 2026-06-03
 */

import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { KeyboardTypeOptions, TextInputProps } from 'react-native';
import { textStyles, tokens } from '../design/tokens';

export type TextFieldProps = Omit<TextInputProps, 'style' | 'placeholderTextColor'> & {
  label?: string;
  errorText?: string;
  helperText?: string;
  trailing?: ReactNode;
  numeric?: boolean;
};

export function TextField({
  label,
  errorText,
  helperText,
  trailing,
  numeric,
  onFocus,
  onBlur,
  ...rest
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const borderColor = errorText
    ? tokens.sem.bear
    : focused
      ? tokens.border.high
      : tokens.border.default;

  const keyboardType: KeyboardTypeOptions | undefined = numeric
    ? 'numeric'
    : (rest.keyboardType ?? undefined);

  return (
    <View style={styles.wrap}>
      {label ? <Text style={textStyles.sectionTitle}>{label}</Text> : null}
      <View
        style={[
          styles.fieldRow,
          { borderColor, backgroundColor: tokens.bg.elevated },
        ]}
      >
        <TextInput
          {...rest}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          placeholderTextColor={tokens.fg.muted}
          keyboardType={keyboardType}
          style={[textStyles.body, styles.input]}
          selectionColor={tokens.sem.accent}
        />
        {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      </View>
      {errorText ? (
        <Text style={[textStyles.bodyMuted, { color: tokens.sem.bear }]}>{errorText}</Text>
      ) : helperText ? (
        <Text style={textStyles.bodyMuted}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: tokens.space['1'] },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: tokens.radii.md,
    minHeight: 44,
    paddingHorizontal: tokens.space['3'],
  },
  input: { flex: 1, paddingVertical: tokens.space['2'] },
  trailing: { marginLeft: tokens.space['2'] },
});
