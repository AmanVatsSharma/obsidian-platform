/**
 * @file libs/web-api-client/src/index.ts
 * @module web-api-client
 * @description HTTP helper contracts for web application API access
 * @author BharatERP
 * @created 2026-02-17
 */

export type ApiClientOptions = {
  baseUrl: string;
  tenantId: string;
  accessToken?: string;
};

export function buildApiHeaders(options: ApiClientOptions): Record<string, string> {
  return {
    'content-type': 'application/json',
    'x-tenant-id': options.tenantId,
    ...(options.accessToken
      ? { authorization: `Bearer ${options.accessToken}` }
      : {}),
  };
}
