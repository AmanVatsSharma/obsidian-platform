/**
 * File:        apps/web/jest.setup.ts
 * Module:      web · Jest Setup
 * Purpose:     Jest setup file — runs before each test file. Sets up testing-library
 *              global mocks for Next.js 15, Apollo, and auth.
 *
 * Depends on:
 *   - @testing-library/jest-dom — browser assertions
 *   - jest-fetch-mock — mock fetch (for REST endpoints)
 *
 * Side-effects:
 *   - Mocks Next.js navigation/redirect
 *   - Mocks Apollo Client internals
 *   - Mocks auth cookies
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-07
 */

import '@testing-library/jest-dom';

// ─── Next.js 15 mocks ─────────────────────────────────────────────────────

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/trading',
  useParams: () => ({}),
}));

// Mock Next.js dynamic (for dynamic imports)
jest.mock('next/dynamic', () => (component: unknown) => component);

// Mock next/font
jest.mock('next/font', () => ({
  IBM_Plex_Mono: () => 'IBM Plex Mono',
  Syne: () => 'Syne',
}), { virtual: true });

// ─── Auth mocks ─────────────────────────────────────────────────────

// Mock document.cookie for auth provider
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: '',
});

// Mock localStorage for auth tokens
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  writable: true,
  value: localStorageMock,
});

// ─── Apollo mocks ─────────────────────────────────────────────────────

// Mock Apollo's cache for GraphQL
jest.mock('@apollo/client', () => ({
  ...jest.requireActual('@apollo/client'),
  ApolloProvider: ({ children }: { children: React.ReactNode }) => children,
  gql: (strings: TemplateStringsArray) => strings[0],
}));

// ─── Window mocks ─────────────────────────────────────────────────────

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
} as any;

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback: FrameRequestCallback) => setTimeout(callback, 16);
global.cancelAnimationFrame = (id: number) => clearTimeout(id);