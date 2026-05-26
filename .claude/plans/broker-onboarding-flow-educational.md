# Broker Onboarding Flow — Educational Plan

## Context

The user asked what happens when a **Platform Owner** onboards a new broker — since the platform-owner frontend is wired to the backend but the **broker-admin** dashboard is not yet fully connected. This plan documents the complete flow so the gap is clear.

---

## The Full Onboarding Flow

### Step 1: Platform Owner fills the onboarding form

**Frontend**: `apps/platform-owner/src/features/brokers/onboard-broker-form.tsx`

The Platform Owner enters:
- `brokerCode` — kebab-case slug (e.g., `acme-securities`)
- `brokerDisplayName` — human name
- `adminMobileE164` — broker admin's mobile number in E.164 format
- `adminEmail` — optional email
- `timezone`, `jurisdictionProfile`

**API Call**: `POST /saas/onboard-broker` → `BrokerOnboardingController.onboardBroker()`

---

### Step 2: Backend — `BrokerOnboardingService.onboardBroker()` (8 sequenced steps)

The service orchestrates everything **idempotently** — each step is safe to re-run:

**Step 1 — Tenant Creation**
- `TenancyService.createTenant()` creates a tenant with `status = PENDING`
- `brokerCode` becomes both the **subdomain slug** and the **JWT `tid` claim**
- If tenant already exists → resumes (unless SUSPENDED)

**Step 2 — RBAC Seed & Provisioning**
- `SaasControlPlaneService.provisionTenant()` idempotently seeds:
  - Roles & permissions for the new tenant
  - Initial entitlements / plan assignment
- If provisioning already COMPLETED → noop

**Step 3 — Broker Entity**
- `BrokerHierarchyService.createBroker()` creates the `broker` record
- Linked to tenant via UUID (`tenantId`), not slug
- Stores `brokerCode`, `displayName`

**Step 4 — Broker Admin User**
- `UsersService.create()` creates the admin user
- `tenantId` is stored as **slug** (not UUID!) — this must match what OTP verify uses
- Stores `mobileE164`, `email`, `tenantId = tenant.code`

**Step 5 — Role Assignment**
- `RbacService.assignRoleToUser(tenant.code, adminUserId, ROLE.BROKER_ADMIN)`
- Idempotent — checks for existing mapping before insert

**Step 6 — Welcome SMS**
- If admin user was **newly created** (not a resume):
  - `AwsSnsService.sendSms()` sends a welcome SMS
  - Contains the login URL: `https://{brokerCode}.obsidian.io/login`
  - Prevents duplicate SMS on retry/resume

**Step 7 — Domain Event**
- `OutboxService.append('broker.onboarded', { tenantId, brokerId, adminUserId, requestedBy }, tenant.id)`
- Appended in the **same logical transaction** for eventual consistency
- Downstream consumers (e.g., email service, analytics) can react to this

**Step 8 — Broker Metrics Seed**
- `BrokerMetricsService.upsertFromOnboarding()` seeds initial metrics row
- Called even on resume so the platform dashboard sees live counts

---

### Step 3: What the Platform Owner sees

After successful onboarding, the form:
1. Shows a success card with credentials
2. Copies the **local dev URL** to clipboard: `http://localhost:4500?tenant={brokerCode}`
3. Shows the **production login URL**: `https://{brokerCode}.obsidian.io/login`
4. Displays: "Login credentials sent via SMS to {adminMobile}"
5. Auto-redirects to `/brokers/{brokerCode}` after 1.2 seconds

---

## The Gap: Broker-Admin is Not Yet Wired

### What exists

The **broker-admin login page** (`apps/broker-admin/src/app/login/page.tsx`) already has:
- Two-step OTP flow (mobile → OTP → JWT)
- Tenant resolution from URL (`useTenant()`)
- Brand config fetch (`GET /tenancy/brand-config?slug={tenantCode}`)
- Auth context integration

### What is missing

1. **Backend auth endpoints** for the broker context:
   - `POST /auth/otp/request` (OTP request)
   - `POST /auth/otp/verify` (OTP verify → JWT)
   - These need to work in **broker tenant context** (not platform context)

2. **OTP generation/resend logic** in the backend — the `auth` module needs to support:
   - OTP generation for broker-admin users
   - SMS sending via the same `AwsSnsService`
   - OTP verification that returns a JWT with `tid = tenant.code`

3. **JWT `tid` (tenant) claim** — the broker-admin app needs to:
   - Read the JWT
   - Extract `tid`
   - Pass it as `x-tenant-id` header on all API calls

4. **Tenant context in broker-admin** — `apps/broker-admin/src/lib/tenant/tenant-context.ts` needs to:
   - Resolve `tenantCode` from the URL query param (`?tenant=acme-securities`)
   - Or from the subdomain pattern

5. **The `PlatformOwnerGuard`** — referenced in `broker-onboarding.controller.ts`:
   - `apps/backend/src/modules/rbac/guards/platform-owner.guard.ts` does **not exist yet**
   - It should check: `tid === 'platform'` AND user has `platform_owner` role

---

## Key Insight: Dual Tenant ID Semantics

This is the most important design decision in the codebase:

| Storage | Format | Used by |
|---|---|---|
| `UserEntity.tenantId` | **slug** (e.g., `acme-securities`) | `verifyOtp()`, `RbacService`, JWT `tid` claim |
| `BrokerEntity.tenantId` | **UUID** (e.g., `uuid-v4`) | `BrokerHierarchyService`, FK relationships |

The slug is human-readable and used for routing. The UUID is for internal FK integrity. Mixing these up causes silent auth failures.

---

## Verification

To verify the flow end-to-end:
1. Start backend: `npm run dev:backend`
2. Start platform-owner: `npm run dev:platform-owner`
3. Start broker-admin: `npm run dev:broker-admin`
4. Platform Owner: visit `/onboarding`, fill the form
5. Check: SMS sent (or check `AwsSnsService` logs), broker appears in `/brokers`
6. Broker Admin: visit `localhost:4500?tenant={brokerCode}`, try OTP login
