/**
 * File:        apps/backend/src/modules/auth/decorators/current-user.decorator.ts
 * Module:      auth
 * Purpose:     Custom @CurrentUser() parameter decorator that extracts the
 *              authenticated user payload from the request. Wrapped around
 *              JWT-protected routes (after JwtAuthGuard runs).
 *
 * Exports:
 *   - CurrentUser() — parameter decorator factory, returns the full payload
 *   - CurrentUserId() — convenience decorator that returns userId (string)
 *   - CurrentTenantId() — convenience decorator that returns tenantId (string)
 *
 * Depends on:
 *   - @nestjs/common (createParamDecorator, ExecutionContext)
 *
 * Side-effects:
 *   - none (pure request inspection)
 *
 * Key invariants:
 *   - Requires JwtAuthGuard to have populated req.user first; otherwise returns undefined.
 *   - Request shape: req.user = { userId, tenantId, role, sessionId, ... }
 *
 * Author:       BharatERP
 * Last-updated: 2026-06-10
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthenticatedUser {
  userId: string;
  tenantId: string;
  role?: string;
  sessionId?: string;
  [key: string]: unknown;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as AuthenticatedUser | undefined;
  },
);

/**
 * Convenience decorator — returns just the userId string from the JWT payload.
 * Use when a route only needs the id (the most common case).
 */
export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return (request.user as AuthenticatedUser | undefined)?.userId;
  },
);

/**
 * Convenience decorator — returns just the tenantId from the JWT payload.
 * Use for tenant-scoped reads where you don't need the full user object.
 */
export const CurrentTenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return (request.user as AuthenticatedUser | undefined)?.tenantId;
  },
);
