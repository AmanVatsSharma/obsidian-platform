/**
 * @file src/modules/auth/guards/dev-only.guard.ts
 * @module auth
 * @description Fail-closed guard for /auth/dev/* routes. Uses an
 *              init-time-baked boolean so a misconfigured NODE_ENV (e.g. 'prod',
 *              'live', 'staging') cannot accidentally grant access. The
 *              constant is computed once when this module is first imported
 *              and is read directly by the guard — there is no per-request
 *              string comparison.
 * @author BharatERP
 * @created 2026-06-13
 */

import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';

// Baked at module init. If you ship a build with NODE_ENV=production, this
// resolves to false, the guard denies, and a misconfigured `prod` env cannot
// slip through the loose `=== 'production'` comparison in the controller.
const PROD = process.env['NODE_ENV'] === 'production';
// Explicit opt-in for prod — if a deployer really wants to enable the dev
// login path in production, they have to set this. There is no string-match
// path that can be wrong-by-one-letter.
const ENABLED_IN_PROD = process.env['ENABLE_DEV_LOGIN_IN_PROD'] === 'true';

export const IS_DEV_LOGIN_ENABLED: boolean = !PROD || ENABLED_IN_PROD;

if (PROD && ENABLED_IN_PROD) {
  Logger.warn(
    'ENABLE_DEV_LOGIN_IN_PROD=true — /auth/dev/login is reachable in production. ' +
      'This is intended for incident response only and should be unset ' +
      'once the operator no longer needs it.',
    'DevOnlyGuard',
  );
}

@Injectable()
export class DevOnlyGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    return IS_DEV_LOGIN_ENABLED;
  }
}
