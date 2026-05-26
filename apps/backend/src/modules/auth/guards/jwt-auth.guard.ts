/**
 * File:        apps/backend/src/modules/auth/guards/jwt-auth.guard.ts
 * Module:      auth
 * Purpose:     Guard wrapping passport-jwt strategy with dual auth support —
 *             accepts both Bearer header tokens and access_token cookies.
 *
 * Exports:
 *   - JwtAuthGuard — GraphQL/REST auth guard
 *
 * Depends on:
 *   - @nestjs/passport       — AuthGuard base class
 *   - passport-jwt           — token validation (via JwtAccessStrategy)
 *
 * Side-effects: none
 *
 * Key invariants:
 *   - Bearer Authorization header is tried first (programmatic clients)
 *   - Falls back to access_token cookie (web browser sessions)
 *   - Cookie value is injected as Authorization header so passport reads it
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-22
 */

import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: any) {
    const request = context.switchToHttp?.().getRequest?.() as Request | undefined;
    if (request) {
      // Already has a Bearer header — use it directly
      if (request.headers.authorization?.toLowerCase().startsWith('bearer ')) {
        return super.canActivate(context);
      }
      // Fall back to access_token cookie — inject as Authorization header
      const cookieHeader = request.headers.cookie ?? '';
      const match = cookieHeader.match(/(?:^|;\s*)access_token=([^;]+)/);
      if (match?.[1]) {
        request.headers.authorization = `Bearer ${match[1]}`;
        return super.canActivate(context);
      }
    }
    return super.canActivate(context);
  }
}
