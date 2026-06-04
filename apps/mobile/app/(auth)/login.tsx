/**
 * File:        apps/mobile/app/(auth)/login.tsx
 * Module:      mobile · Screens · Login
 * Purpose:     Real login screen for the Obsidian Mobile app. Renders
 *              a dark-themed form with email + password inputs, a
 *              UPPERCASE "SIGN IN" button, and inline error messaging
 *              styled with the bear token. On submit, calls the dev
 *              login endpoint (the only path the current backend
 *              exposes — `auth/otp/*` requires an SMS round-trip that
 *              is out of scope for the mobile foundation layer). When
 *              `EXPO_PUBLIC_MOCK_GQL=1`, the form short-circuits to a
 *              mock JWT so the rest of the app is testable end-to-end
 *              without a live backend.
 *
 * Exports:
 *   - LoginScreen (default) — the Expo Router route component
 *
 * Depends on:
 *   - react                            — useState
 *   - react-native                     — TextInput, View, Text, Pressable, KeyboardAvoidingView
 *   - expo-router                      — useRouter
 *   - @obsidian/mobile-ui-kit          — Panel (the bordered, titled container)
 *   - ../src/auth/auth-context         — useAuth, signIn
 *   - ../src/auth/login                — devLogin, loginErrorToMessage
 *   - ../src/auth/secure-store         — StoredTokens shape
 *   - ../src/apollo/config             — isMockGraphQLEnabled, resolveApiConfig
 *   - ../src/design/tokens             — tokens, textStyles
 *   - ../src/lib/errors                — AppError
 *   - ../src/lib/logger                — logWarn
 *
 * Side-effects:
 *   - On submit: POSTs to `auth/dev/login` (dev-only) or short-circuits
 *     in mock mode.
 *   - On success: writes tokens to secure store via `signIn` and
 *     `router.replace('/(tabs)')` to land on the main stack.
 *   - On failure: surfaces the error message in the bear color.
 *
 * Key invariants:
 *   - The login button is UPPERCASE bold per CLAUDE.md §12. Sentence-
 *     case is a brand violation.
 *   - Inputs use `fontFamilyUi` so they match the rest of the app;
 *     platform defaults would otherwise render the email field in a
 *     serif font on Android.
 *   - The mock-mode short-circuit only fires when the env var is
 *     exactly `'1'`. Production builds statically inline the env
 *     value at build time and tree-shake the mock branch.
 *   - The `devLogin` helper is gated on `__DEV__` inside the helper,
 *     so a production bundle cannot reach the dev endpoint even if
 *     the form is somehow submitted.
 *
 * Read order:
 *   1. LoginScreen — single default export
 *
 * Author:       BharatERP
 * Last-updated: 2026-06-03
 */

import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { Panel } from '@obsidian/mobile-ui-kit';
import type { MobileSessionPrincipal } from '@obsidian/mobile-auth';

import { useAuth } from '../../src/auth/auth-context';
import { devLogin, loginErrorToMessage } from '../../src/auth/login';
import type { StoredTokens } from '../../src/auth/secure-store';
import { isMockGraphQLEnabled, resolveApiConfig } from '../../src/apollo/config';
import { textStyles, tokens } from '../../src/design/tokens';
import { AppError } from '../../src/lib/errors';
import { logWarn } from '../../src/lib/logger';

type SubmitState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'error'; message: string };

export default function LoginScreen(): React.JSX.Element {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('platform@obsidian.local');
  const [password, setPassword] = useState('platform123');
  const [submit, setSubmit] = useState<SubmitState>({ kind: 'idle' });

  const handleSubmit = useCallback(async () => {
    if (submit.kind === 'submitting') return;
    setSubmit({ kind: 'submitting' });

    try {
      let tokens: StoredTokens;

      if (isMockGraphQLEnabled()) {
        // Mock mode: mint a fake JWT and synthetic principal. The token
        // is not validated by any backend — every operation goes through
        // the mock link. Wave 2 will replace this with a real OTP flow.
        tokens = {
          accessToken: 'mock.jwt.token',
          refreshToken: 'mock.refresh.token',
          tokenId: 'mock-token-id',
          principal: {
            userId: 'mock-user',
            tenantId: 'mock-tenant',
            roles: ['trader'],
          } satisfies MobileSessionPrincipal,
        };
      } else {
        const api = resolveApiConfig();
        const response = await devLogin(api, {
          tenantId: 'platform',
          mobileE164: emailToMobile(email),
          password,
        });
        tokens = {
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          tokenId: response.tokenId,
          principal: {
            userId: response.userId,
            tenantId: 'platform',
            roles: ['platform_owner'],
          } satisfies MobileSessionPrincipal,
        };
      }

      await signIn(tokens);
      router.replace('/(tabs)');
    } catch (err) {
      logWarn('[login] submit failed', { error: err instanceof Error ? err.message : String(err) });
      const message = err instanceof AppError ? err.message : loginErrorToMessage(err);
      setSubmit({ kind: 'error', message });
    }
  }, [email, password, router, signIn, submit.kind]);

  const submitting = submit.kind === 'submitting';
  const errorMessage = submit.kind === 'error' ? submit.message : null;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <Text style={styles.wordmark}>OBSIDIAN</Text>
        <Text style={styles.tagline}>TRADER</Text>

        <Panel title="Sign in" testID="login-panel">
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="you@obsidian.local"
              placeholderTextColor={tokens.fg.muted}
              style={styles.input}
              editable={!submitting}
              testID="login-email"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoComplete="password"
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor={tokens.fg.muted}
              style={styles.input}
              editable={!submitting}
              testID="login-password"
            />
          </View>

          {errorMessage ? (
            <Text style={styles.error} testID="login-error">
              {errorMessage}
            </Text>
          ) : null}

          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            accessibilityRole="button"
            accessibilityLabel="Sign in"
            testID="login-submit"
            style={({ pressed }) => [
              styles.button,
              submitting && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
          >
            {submitting ? (
              <ActivityIndicator color={tokens.fg.primary} />
            ) : (
              <Text style={styles.buttonLabel}>SIGN IN</Text>
            )}
          </Pressable>

          {isMockGraphQLEnabled() ? (
            <Text style={styles.mockHint}>MOCK MODE · EXPO_PUBLIC_MOCK_GQL=1</Text>
          ) : null}
        </Panel>
      </View>
    </KeyboardAvoidingView>
  );
}

/**
 * Wave-1 stopgap: derive an E.164 mobile number from the email's
 * local part. The backend's `devLogin` requires `mobileE164`; the
 * mobile UI surfaces an email field. This is a one-line bridge so
 * the screen is testable today and Wave 2 can swap it for a proper
 * `auth/otp/request` + `auth/otp/verify` flow without changing the
 * form chrome.
 */
function emailToMobile(email: string): string {
  const local = email.split('@')[0]?.replace(/[^a-z0-9]/gi, '') ?? 'user';
  return `+1${local.padEnd(10, '0').slice(0, 10)}`;
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: tokens.bg.base },
  container: {
    flex: 1,
    backgroundColor: tokens.bg.base,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tokens.space['6'],
    gap: tokens.space['2'],
  },
  wordmark: {
    ...textStyles.sectionTitle,
    fontSize: 22,
    letterSpacing: 6,
    color: tokens.fg.primary,
  },
  tagline: {
    ...textStyles.sectionTitle,
    fontSize: 11,
    letterSpacing: 4,
    color: tokens.fg.secondary,
    marginBottom: tokens.space['6'],
  },
  field: { gap: tokens.space['1'], marginTop: tokens.space['3'] },
  label: {
    ...textStyles.bodyMuted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    ...textStyles.body,
    backgroundColor: tokens.bg.surface,
    borderColor: tokens.border.default,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: tokens.space['3'],
    paddingVertical: tokens.space['3'],
    color: tokens.fg.primary,
    minHeight: 44,
  },
  error: {
    ...textStyles.bodyMuted,
    color: tokens.sem.bear,
    marginTop: tokens.space['3'],
  },
  button: {
    backgroundColor: tokens.sem.accent,
    borderRadius: 6,
    paddingVertical: tokens.space['3'],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: tokens.space['5'],
    minHeight: 48,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonPressed: { opacity: 0.85 },
  buttonLabel: {
    ...textStyles.action,
    color: tokens.fg.primary,
  },
  mockHint: {
    ...textStyles.bodyMuted,
    fontSize: 10,
    color: tokens.fg.muted,
    textAlign: 'center',
    marginTop: tokens.space['3'],
    letterSpacing: 0.8,
  },
});
