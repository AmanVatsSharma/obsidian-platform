/**
 * @file index.ts
 * @module mobile-auth
 * @description Mobile auth contracts and helpers
 * @author BharatERP
 * @created 2026-02-19
 */

export type MobileSessionPrincipal = {
  userId: string;
  tenantId: string;
  roles: string[];
};
