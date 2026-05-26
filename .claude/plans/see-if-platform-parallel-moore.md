# Platform-Owner Backend Integration — Remediation Plan

## Context

The platform-owner Next.js app (port 4200) was audited alongside the backend's `saas-control-plane`, `accounts`, `broker-hierarchy`, `tenancy`, and `users` modules. Three parallel audits (frontend architecture, backend integration, comparative analysis) revealed the app is **partially integrated but enterprise-unsafe** — several critical security gaps, stub data endpoints, and architectural debt must be resolved before production use.

---

## Priority Tiers

### 🔴 TIER 1 — CRITICAL (Security + Data Integrity)

#### 1. SaasControlPlaneController — No Auth Guards
**File**: `apps/backend/src/modules/saas-control-plane/controllers/saas-control-plane.controller.ts`

The controller has zero `@UseGuards`. Every endpoint (provisioning, entitlements, billing, audit) is publicly accessible.

```typescript
// CURRENT (VULNERABLE)
@Controller('saas-control-plane')
export class SaasControlPlaneController {
  constructor(private readonly saasControlPlaneService: SaasControlPlaneService) {}
  @Post('provisioning') ...   // NO GUARD
  @Post('entitlements') ...   // NO GUARD
  @Post('billing/invoices') ...  // NO GUARD
```

**Fix**: Add `@UseGuards(JwtAuthGuard, PlatformOwnerGuard)` to the controller class.

#### 2. Duplicate Unguarded Routes
`BrokerOnboardingController` guards `/saas/entitlements` with `PlatformOwnerGuard`. `SaasControlPlaneController` exposes the same data via `/saas-control-plane/entitlements` with NO guard. A request to the second path bypasses auth entirely.

**Fix**: Either merge into one controller or apply the same guards to both.

#### 3. advanceProvisioning — 204 Contract Violation
**File**: `apps/backend/src/modules/saas-control-plane/controllers/broker-onboarding.controller.ts:117`

```typescript
@HttpCode(204)
async advanceProvisioning(@Param('tenantId') tenantId: string): Promise<void> {
  // Returns TenantProvisioningEntity, NOT void
  return this.service.advanceProvisioning(tenantId);
}
```

NestJS will send a body with a 204 status — a protocol violation.

**Fix**: Remove return value or change to `Promise<void>`.

#### 4. No Transaction Wrapping in onboardBroker
**File**: `apps/backend/src/modules/saas-control-plane/services/broker-onboarding.service.ts:100-188`

8 sequential DB writes (tenant create, RBAC seed, broker hierarchy, user, role, metrics) without `@Transactional()`. If `seedRbac` partially fails, tenant exists but RBAC is inconsistent.

**Fix**: Wrap in TypeORM transaction or use an outbox-based saga.

---

### 🟠 TIER 2 — HIGH (Scalability + Reliability)

#### 5. N+1 Queries in Dashboard Endpoints
**File**: `broker-onboarding.service.ts:248-256`

```typescript
async getPlatformStats() {
  const brokers = await this.brokerHierarchy.listAllBrokers();  // 1 query
  const metrics = await Promise.all(
    brokers.map((b) => this.brokerMetrics.getMetrics(b.id))  // N queries
  );
}
```

`listAllBrokers()` has no pagination. With 50+ brokers → 51 queries.

**Fix**: Add pagination (`limit`/`offset`) or cursor-based paging. Fetch metrics in batch.

#### 6. Unbounded List Endpoints
`listBrokersWithMetrics`, `getPlatformStats` return entire tables. OOM risk at scale.

**Fix**: Implement pagination on all list endpoints used by platform dashboard.

#### 7. Missing Idempotency on Billing Writes
**File**: `broker-onboarding.service.ts:340`

`createBillingPlaceholder` has no `idempotencyKey` check. Retry creates duplicate invoice.

**Fix**: Add `idempotencyKey` field with unique constraint, lookup before create.

#### 8. Hardcoded / Synthesized Backend Data
- `getLiveActivity` — generates fake events with `Math.random()`
- `getRevenueSeries` — historical months return `mrr: 0`
- `getPlatformHealth` — all hardcoded values, always OPERATIONAL

These are placeholder stubs. The dashboard will display incorrect data in production.

**Fix**: Wire to real data sources (outbox event log, metrics table, health checks).

#### 9. Missing Bulk Operations API
No endpoint to suspend multiple brokers in one call. No bulk tenant status update.

**Fix**: Add `POST /saas/brokers/batch-suspend` endpoint.

#### 10. Missing Tenant Deletion API
No endpoint for GDPR compliance or broker offboarding.

**Fix**: Add `DELETE /saas/tenants/:tenantId` with cascade.

---

### 🟡 TIER 3 — MEDIUM (Architectural Debt)

#### 11. PlatformOwnerGuard — Role Check Gap
`PlatformOwnerGuard` likely checks `tid='platform'` from JWT but does NOT verify `platform_owner` role. Any user with `tid=platform` can call all endpoints.

**Fix**: Assert `req.user.roles` includes `platform_owner`.

#### 12. Auth Context — No JWT Signature Verification
**File**: `apps/platform-owner/src/lib/auth/auth-context.tsx`

Manual JWT parsing doesn't validate signature, expiry, or audience. Trusts token blindly.

**Fix**: Use a library like `jose` to verify JWT signature.

#### 13. No Token Refresh Mechanism
Token expires in 15 min, no refresh flow. User must re-login.

**Fix**: Implement `POST /auth/refresh` endpoint and refresh logic.

#### 14. No Request Timeout on API Client
**File**: `apps/platform-owner/src/lib/api/client.ts`

`apiRequest` calls can hang indefinitely. No `AbortSignal` support.

**Fix**: Add 10s default timeout with `AbortController`.

#### 15. No Retry Logic on Transient Errors
5xx errors require manual caller handling. No automatic retry with backoff.

**Fix**: Add retry logic (3 attempts, exponential backoff) to `apiRequest`.

#### 16. Frontend — No Hook Abstraction Layer
broker-admin has `lib/api/hooks/` with consistent loading/error/refetch pattern. platform-owner has none — data fetching is inline in pages.

**Fix**: Create `lib/api/hooks/` directory with `usePlatformStats`, `useBrokers`, etc.

#### 17. No Zod Validation on API Responses
Response casting via `res.json() as Promise<T>` — backend could return wrong shape.

**Fix**: Add Zod schemas for critical API responses.

---

### 🟢 TIER 4 — LOW (Polish)

| Issue | Location | Fix |
|---|---|---|
| No polling on health page | `health/page.tsx` | Add 30s auto-refresh |
| No success toasts for mutations | All pages | Add toast system |
| No mobile sidebar toggle | `app-shell.tsx` | Add hamburger menu |
| No aria-labels on OTP inputs | `login/page.tsx` | Add accessibility |
| Inline skeleton usage in health/revenue | Pages | Use skeleton library consistently |

---

## Implementation Order

```
1. Fix SaasControlPlaneController guards (CRITICAL — security breach)
2. Fix advanceProvisioning 204 contract violation
3. Add transaction wrapping to onboardBroker
4. Fix N+1 queries with pagination + batch metrics
5. Wire real data to health/activity/revenue endpoints
6. Add PlatformOwnerGuard role assertion
7. Add idempotency to billing writes
8. Add token refresh to frontend auth
9. Add request timeout + retry to apiRequest
10. Create hooks directory
11. Add bulk operations + tenant deletion APIs
12. Polish: polling, toasts, mobile sidebar
```

---

## Critical Files to Modify

### Backend
- `apps/backend/src/modules/saas-control-plane/controllers/saas-control-plane.controller.ts` — add guards
- `apps/backend/src/modules/saas-control-plane/controllers/broker-onboarding.controller.ts` — fix 204
- `apps/backend/src/modules/saas-control-plane/services/broker-onboarding.service.ts` — transaction, pagination, idempotency
- `apps/backend/src/modules/saas-control-plane/services/saas-control-plane.service.ts` — real data

### Frontend
- `apps/platform-owner/src/lib/api/client.ts` — timeout, retry, interceptors
- `apps/platform-owner/src/lib/auth/auth-context.tsx` — JWT verification, refresh
- `apps/platform-owner/src/lib/api/hooks/` — new hook abstraction
- `apps/platform-owner/src/app/layout.tsx` — wire ErrorBoundary globally
- `apps/platform-owner/src/shared/topbar/topbar.tsx` — add toast outlet

---

## Verification Plan

1. **Security**: Run `curl -X POST http://localhost:3000/saas-control-plane/provisioning` — should return 401/403
2. **Health endpoint**: Navigate to health page → verify "OPERATIONAL" reflects real status, not hardcoded
3. **Revenue chart**: Check historical months show real data, not flat `mrr: 0` lines
4. **Onboard broker**: Complete flow, verify all 8 steps succeed or rollback transactionally
5. **API client**: Trigger 5xx error → verify retry happens, verify timeout fires after 10s
6. **Token expiry**: Wait 15 min → verify redirect to login, not silent failure
7. **Build**: `npm run build` on platform-owner — zero errors, zero warnings
8. **Quality gates**: `npm run quality:verify` passes on backend