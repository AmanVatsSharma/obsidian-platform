/**
 * File:        apps/desktop-pro/renderer/src/shared/providers/app-providers.tsx
 * Module:      desktop-pro · Renderer · Providers
 * Purpose:     Wraps the entire renderer tree with ObsidianProvider, QueryClientProvider,
 *              and the persistent UpdateBanner that survives route changes.
 *
 * Exports:
 *   - AppProviders({ children }) → ReactNode
 *
 * Depends on:
 *   - @obsidian/obsidian-ui — ObsidianProvider
 *   - @tanstack/react-query — QueryClient, QueryClientProvider
 *   - ../components/update-banner — UpdateBanner (auto-update notification)
 *
 * Side-effects:
 *   - ObsidianProvider reads/writes localStorage['obsidian-theme'] for persistence
 *   - UpdateBanner subscribes to ntBridge.on('updater:status') on mount
 *
 * Key invariants:
 *   - defaultTheme 'dark' — trading terminals default dark; users can switch in settings
 *   - UpdateBanner is outside the Router so it never unmounts on navigation
 *
 * Read order:
 *   1. AppProviders — trivial render
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ObsidianProvider } from '@obsidian/obsidian-ui';
import { UpdateBanner } from '../components/update-banner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ObsidianProvider defaultTheme="dark">
        <UpdateBanner />
        {children}
      </ObsidianProvider>
    </QueryClientProvider>
  );
}
