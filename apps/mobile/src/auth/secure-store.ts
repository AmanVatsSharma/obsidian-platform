/**
 * File:        apps/mobile/src/auth/secure-store.ts
 * Module:      mobile · Auth
 * Purpose:     Thin adapter around `expo-secure-store` that stores the
 *              Obsidian auth tokens (access + refresh) and exposes a
 *              synchronous read API to the rest of the app. Backed by
 *              iOS Keychain and Android EncryptedSharedPreferences.
 *
 * Exports:
 *   - storeTokens(tokens) → Promise<void>     — write both tokens
 *   - loadTokens() → Promise<StoredTokens|null>  — read both tokens
 *   - clearTokens() → Promise<void>           — wipe both
 *   - loadAccessTokenSync() → string|null     — in-memory cache, populated
 *                                                by `primeAccessTokenCache()`
 *   - primeAccessTokenCache() → Promise<string|null>  — read tokens from
 *                                                        secure store and
 *                                                        populate the in-memory
 *                                                        cache for sync access
 *   - StoredTokens
 *
 * Depends on:
 *   - expo-secure-store         — encrypted persistence
 *   - @obsidian/mobile-auth     — MobileSessionPrincipal (shared contract)
 *
 * Side-effects:
 *   - Reads/writes the platform secure keychain on store/load/clear.
 *   - The module-level `_accessTokenCache` is a process-memory cache that
 *     is read synchronously by the Apollo auth link.
 *
 * Key invariants:
 *   - Access token lives in memory and the keychain. It is NEVER logged.
 *   - `loadAccessTokenSync` returns `null` until `primeAccessTokenCache` is
 *     awaited at app boot. Callers that fire GraphQL operations before the
 *     cache is primed will see a missing Authorization header — the backend
 *     treats that as unauthenticated and the error-link will route the user
 *     back to the login screen.
 *   - On logout, both the keychain entries and the in-memory cache are wiped.
 *   - `MobileSessionPrincipal` is imported from `@obsidian/mobile-auth` for
 *     parity with the rest of the monorepo; the principal is NOT stored here
 *     — it is fetched on demand via `getMe` and kept in the auth context.
 *
 * Read order:
 *   1. StoredTokens       — the on-disk shape
 *   2. storeTokens        — write path
 *   3. loadTokens         — read path
 *   4. clearTokens        — wipe path
 *   5. loadAccessTokenSync / primeAccessTokenCache — sync access for Apollo
 *
 * Author:       BharatERP
 * Last-updated: 2026-06-03
 */

import * as SecureStore from 'expo-secure-store';
import type { MobileSessionPrincipal } from '@obsidian/mobile-auth';

const ACCESS_KEY = 'obsidian.auth.access';
const REFRESH_KEY = 'obsidian.auth.refresh';

export type StoredTokens = {
  accessToken: string;
  refreshToken: string;
  /** Server-issued token id (jti). Used for refresh rotation. */
  tokenId: string;
  /** Decoded principal — kept alongside the token for fast boot hydration. */
  principal: MobileSessionPrincipal;
};

/** Module-level cache so the Apollo auth link can read the token synchronously. */
let _accessTokenCache: string | null = null;

export async function storeTokens(tokens: StoredTokens): Promise<void> {
  _accessTokenCache = tokens.accessToken;
  await SecureStore.setItemAsync(ACCESS_KEY, tokens.accessToken);
  await SecureStore.setItemAsync(
    REFRESH_KEY,
    JSON.stringify({
      refreshToken: tokens.refreshToken,
      tokenId: tokens.tokenId,
      principal: tokens.principal,
    }),
  );
}

export async function loadTokens(): Promise<StoredTokens | null> {
  const access = await SecureStore.getItemAsync(ACCESS_KEY);
  if (!access) return null;

  const refreshRaw = await SecureStore.getItemAsync(REFRESH_KEY);
  if (!refreshRaw) return null;

  try {
    const parsed = JSON.parse(refreshRaw) as Omit<StoredTokens, 'accessToken'>;
    return { accessToken: access, ...parsed };
  } catch {
    // Corrupt refresh blob — clear everything and force re-login.
    await clearTokens();
    return null;
  }
}

export async function clearTokens(): Promise<void> {
  _accessTokenCache = null;
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

/**
 * Synchronous accessor used by the Apollo auth link. Returns `null` until
 * `primeAccessTokenCache` is awaited at app boot.
 */
export function loadAccessTokenSync(): string | null {
  return _accessTokenCache;
}

/**
 * Populate the in-memory cache from secure store. Must be awaited during
 * the App boot sequence BEFORE the first GraphQL operation is dispatched.
 */
export async function primeAccessTokenCache(): Promise<string | null> {
  const stored = await loadTokens();
  _accessTokenCache = stored?.accessToken ?? null;
  return _accessTokenCache;
}
