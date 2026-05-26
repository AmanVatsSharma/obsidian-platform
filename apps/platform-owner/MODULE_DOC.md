# Module: platform-owner

**Short:** Platform Owner Console — global tenancy governance and SaaS control plane UI.

**Purpose:** Provide a UI for platform operators to manage tenants, entitlement plans, billing invoice placeholders, and support impersonation audit visibility. Currently uses mock data only; backend integration (tenancy + saas-control-plane APIs) is deferred until UI is complete.

**Screens:**
- **Home** (`/`) — Welcome and description; navigation in sidebar.
- **Tenants** (`/tenants`) — List tenants (table), create tenant (form with code, displayName, timezone, jurisdiction, status). Mock add updates in-memory list.
- **Entitlements** (`/entitlements`) — List entitlement plans (table), add/update plan (form: tenant, planCode, entitlements JSON, feature flags JSON). Mock upsert.
- **Billing** (`/billing`) — List billing invoice placeholders (table), create invoice (form: tenant, invoice number, amount, currency). Mock create.
- **Audit controls** (`/audit-controls`) — Read-only table of support impersonation audit records; optional filter by tenant.

**Data:** All data is mock. Types and shapes align with backend entities (Tenant, EntitlementPlan, BillingInvoicePlaceholder, SupportImpersonationAudit) so that swapping to real API is a drop-in.

**Files:**
- `src/app/layout.tsx` — Root layout; wraps with MockDataProvider and Sidebar.
- `src/app/sidebar.tsx` — Sidebar nav (client); role-gated with mock principal.
- `src/app/page.tsx` — Home.
- `src/app/tenants/page.tsx` — Tenants list + create.
- `src/app/entitlements/page.tsx` — Entitlements list + upsert.
- `src/app/billing/page.tsx` — Billing list + create.
- `src/app/audit-controls/page.tsx` — Audit list (read-only).
- `src/lib/types.ts` — Shared types (aligned with backend).
- `src/lib/mock-data.ts` — Initial mock arrays.
- `src/lib/mock-data-context.tsx` — React context for mock state and actions (addTenant, upsertEntitlement, addBillingInvoice).

**Dependencies:** Next.js, `@obsidian/web-auth` (hasRole, SessionPrincipal). No backend fetch in this phase.

**Change-log**
- 2026-03-15: Platform Owner UI completed with mock data: layout + sidebar, tenants (list + create), entitlements (list + upsert), billing (list + create), audit controls (read-only list + tenant filter). Types and mock data aligned with backend; backend integration deferred.
- 2026-05-09: Full auth + API integration. Added AuthProvider (po_access_token in sessionStorage), AuthGuard (SSR-safe), AppShell (conditionally renders shell for authenticated routes), API client (attaches Bearer + x-tenant-id: 'platform'). New /login page (two-step OTP). New /brokers/new page with OnboardBrokerForm → POST /saas/onboard-broker. Brokers list wired to GET /saas/brokers. All (admin) routes guarded against unauthenticated access.
