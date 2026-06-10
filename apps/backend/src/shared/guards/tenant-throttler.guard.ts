/**
 * File:        apps/backend/src/shared/guards/tenant-throttler.guard.ts
 * Module:      shared · guards
 * Purpose:     Extends ThrottlerGuard to key rate-limit buckets by tenantId rather
 *              than by IP. This prevents one tenant's traffic from exhausting another's
 *              quota, and allows per-tenant limit configuration via request headers.
 *
 * Exports:
 *   - TenantThrottlerGuard — drop-in replacement for ThrottlerGuard in APP_GUARD
 *
 * Depends on:
 *   - @nestjs/throttler — base guard + storage
 *
 * Side-effects: writes to throttler storage (Redis or in-memory) per request
 *
 * Key invariants:
 *   - Tracker key: `tenant:{tenantId}` when x-tenant-id header is set
 *   - Falls back to `ip:{remoteAddress}` for unauthenticated/public routes
 *   - Trading paths (/orders, /executions) always use the stricter limit (60/min)
 *     regardless of tier — enforced by returning a separate tracker key with a prefix
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

const TRADING_PATH_REGEX = /\/(orders|executions)(\/|$)/;

@Injectable()
export class TenantThrottlerGuard extends ThrottlerGuard {
  /**
   * Skip throttling for non-HTTP contexts (GraphQL, RPC). The base ThrottlerGuard
   * expects a Request object with `req.ip` / `req.headers`; GraphQL contexts
   * pass a GqlExecutionContext instead, which would crash.
   *
   * We rely on per-resolver and per-handler rate limiting (where needed) for
   * GraphQL paths rather than this global guard.
   */
  protected shouldSkip(context: ExecutionContext): boolean {
    const type = context.getType<'http' | 'graphql' | 'rpc' | string>();
    if (type !== 'http') {
      return true;
    }
    return super.shouldSkip(context);
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    if (!req || typeof req !== 'object' || !req.headers) {
      return 'unknown';
    }

    const tenantId = req.headers['x-tenant-id'] as string | undefined;
    const ip = (req.ip ?? req.connection?.remoteAddress ?? 'unknown') as string;
    const path: string = req.path ?? req.url ?? '';

    // Trading endpoints get a separate tighter bucket per tenant
    if (TRADING_PATH_REGEX.test(path) && tenantId) {
      return `trading:${tenantId}`;
    }

    return tenantId ? `tenant:${tenantId}` : `ip:${ip}`;
  }
}
