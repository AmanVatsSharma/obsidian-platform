/**
 * @file libs/web-auth/src/index.ts
 * @module web-auth
 * @description Shared web auth contracts for trader/admin surfaces
 * @author BharatERP
 * @created 2026-02-17
 */

export type SessionPrincipal = {
  userId: string;
  tenantId: string;
  roles: string[];
};

export function hasRole(principal: SessionPrincipal, role: string): boolean {
  return principal.roles.includes(role);
}
