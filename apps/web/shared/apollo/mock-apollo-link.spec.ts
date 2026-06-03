/**
 * File:        apps/web/shared/apollo/mock-apollo-link.spec.ts
 * Module:      web · Shared · Apollo · Tests
 * Purpose:     Co-located smoke tests for `createMockApolloLink()`. Verifies
 *              the four contract branches the link exposes: pass-through when
 *              mock mode is off, fixture dispatch when on, GraphQLError when
 *              an operation is unknown, and per-operation override via the
 *              `window.__MOCK_OVERRIDES__` escape hatch. Runs under standalone
 *              `npx jest` — deliberately not wired into the Nx target graph
 *              because `apps/web` does not have an `nx test web` project (see
 *              CLAUDE.md drift note for the module).
 *
 * Exports:
 *   - none (test suite)
 *
 * Depends on:
 *   - ./mock-apollo-link — system under test
 *   - ./mock-config      — MOCK_GQL_ENV_VAR (canonical env-var name)
 *   - ./__fixtures__     — MOCK_FIXTURES + mockPositions (golden payload)
 *   - @apollo/client     — ApolloLink, Observable, FetchResult, GraphQLRequest
 *   - graphql            — GraphQLError (for instanceof assertion)
 *
 * Side-effects:
 *   - Mutates `process.env.NEXT_PUBLIC_MOCK_GQL` per test; restored in
 *     afterEach via the same pattern used in `mock-config.spec.ts`.
 *   - Mutates `global.window` in the override test; cleaned in afterEach so
 *     the global object is never left in a polluted state for sibling specs.
 *   - No filesystem, no network, no `console.log`, no `throw new Error()`.
 *     Test failures surface through Jest's standard `expect()` machinery.
 *
 * Key invariants:
 *   - Apollo's `Observable.subscribe` is synchronous for a cold observable
 *     whose factory invokes `observer.next` + `observer.complete` before
 *     returning. We still wrap the result in a `Promise` to make the test
 *     resilient if Apollo ever flips to a microtask boundary, and to keep
 *     the assertion shape identical across the four cases.
 *   - We never instantiate a real Apollo Client. The test exercises the link
 *     in isolation by passing a `forward` spy — this keeps the test bundle
 *     free of the rest of the Apollo stack and makes SSR-safe imports a
 *     non-issue.
 *
 * Author:       BharatERP
 * Last-updated: 2026-06-01
 */

import { ApolloLink, Observable } from '@apollo/client';
import type { FetchResult, GraphQLRequest } from '@apollo/client';
import { GraphQLError } from 'graphql';

import { MOCK_GQL_ENV_VAR } from './mock-config';
import { createMockApolloLink } from './mock-apollo-link';
import { MOCK_FIXTURES, mockPositions } from './__fixtures__';

const SENTINEL = Symbol('forward-sentinel');

/**
 * Build a minimal-but-valid `GraphQLRequest` carrying only the fields the
 * mock link inspects (`operationName`). Other Apollo bookkeeping fields
 * (`query`, `variables`, `context`, `extensions`) are deliberately left
 * undefined — the link does not read them and ApolloLink's runtime type
 * permits partial shapes in the way that only a standalone test would use.
 */
function fakeOperation(operationName: string): GraphQLRequest {
  return { operationName } as unknown as GraphQLRequest;
}

/**
 * Subscribe to the link's emitted Observable and resolve with the first
 * emitted `FetchResult` (or reject on terminal error). Using a Promise keeps
 * the assertion shape identical regardless of whether Apollo later makes the
 * observable hot.
 */
function firstEmitted(link: ApolloLink, operation: GraphQLRequest): Promise<FetchResult> {
  return new Promise<FetchResult>((resolve, reject) => {
    const observable = link.request(operation, () => Observable.of()) as Observable<FetchResult>;
    const subscription = observable.subscribe({
      next: (value) => {
        resolve(value);
        subscription.unsubscribe();
      },
      error: (err) => reject(err),
      complete: () => {
        // No-op: resolve already happened via `next`. Some branches never
        // emit before completing — those tests assert on the value already
        // captured above, so reaching here is a legitimate no-op.
      },
    });
  });
}

describe('createMockApolloLink', () => {
  const originalEnv = process.env[MOCK_GQL_ENV_VAR];
  const originalWindow = (global as { window?: unknown }).window;

  afterEach(() => {
    // Restore env-var state — same pattern as mock-config.spec.ts.
    if (originalEnv === undefined) {
      delete process.env[MOCK_GQL_ENV_VAR];
    } else {
      process.env[MOCK_GQL_ENV_VAR] = originalEnv;
    }

    // Restore global.window — the override test injects it on a Node test
    // env that normally has no `window`. Leave the host environment exactly
    // the way we found it so sibling suites are not affected.
    if (originalWindow === undefined) {
      delete (global as { window?: unknown }).window;
    } else {
      (global as { window?: unknown }).window = originalWindow;
    }
  });

  it('forwards to the next link when NEXT_PUBLIC_MOCK_GQL is not "true"', async () => {
    process.env[MOCK_GQL_ENV_VAR] = 'false';

    const forwardSpy = jest.fn((_op: GraphQLRequest) =>
      Observable.of<FetchResult>({ data: { sentinel: SENTINEL } } as unknown as FetchResult),
    );

    const link = new ApolloLink((operation, forward) => {
      // Delegate to the real factory so we can intercept `forward` cleanly.
      const inner = createMockApolloLink();
      return inner.request(operation, forwardSpy) as Observable<FetchResult>;
    });

    const result = await firstEmitted(link, fakeOperation('GetPositions'));

    expect(forwardSpy).toHaveBeenCalledTimes(1);
    expect(forwardSpy).toHaveBeenCalledWith(expect.objectContaining({ operationName: 'GetPositions' }));
    expect(result.data).toEqual({ sentinel: SENTINEL });
    // Sanity: when the link forwards, the registered fixture must NOT leak.
    expect(result.data).not.toBe(MOCK_FIXTURES.GetPositions);
  });

  it('emits the registered fixture for a known operation when mock mode is on', async () => {
    process.env[MOCK_GQL_ENV_VAR] = 'true';

    const link = createMockApolloLink();
    const result = await firstEmitted(link, fakeOperation('GetPositions'));

    expect(result.errors).toBeUndefined();
    expect(result.data).toEqual(mockPositions);
    // Pointer identity: must come from the fixtures barrel, not a copy.
    expect(result.data).toBe(MOCK_FIXTURES.GetPositions);
  });

  it('emits a GraphQLError for an unknown operation when mock mode is on', async () => {
    process.env[MOCK_GQL_ENV_VAR] = 'true';

    const link = createMockApolloLink();
    const result = await firstEmitted(link, fakeOperation('GetSomethingNotMocked'));

    expect(result.data).toBeUndefined();
    expect(result.errors).toBeDefined();
    expect(Array.isArray(result.errors)).toBe(true);
    expect(result.errors?.length).toBeGreaterThan(0);

    const firstError = result.errors?.[0];
    expect(firstError).toBeInstanceOf(GraphQLError);
    // Case-insensitive contains check — the error message also mentions
    // adding an entry to MOCK_FIXTURES, so the operation name is embedded
    // in a larger diagnostic string.
    expect(firstError?.message.toLowerCase()).toContain('getsomethingnotmocked');
  });

  it('prefers window.__MOCK_OVERRIDES__ over the registered fixture', async () => {
    process.env[MOCK_GQL_ENV_VAR] = 'true';

    const overridePayload = [{ instrumentId: 'overridden', quantity: 42, symbol: 'OVER' }];
    (global as { window?: unknown }).window = {
      __MOCK_OVERRIDES__: {
        GetPositions: overridePayload,
      },
    };

    const link = createMockApolloLink();
    const result = await firstEmitted(link, fakeOperation('GetPositions'));

    expect(result.errors).toBeUndefined();
    expect(result.data).toEqual(overridePayload);
    // The override must short-circuit the fixture lookup — pointer identity
    // confirms we did not fall through to MOCK_FIXTURES.
    expect(result.data).not.toBe(MOCK_FIXTURES.GetPositions);
  });
});
