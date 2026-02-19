# Module: admin

**Short:** Tenant-scoped admin APIs for KPI dashboards and order audit views.

**Purpose:** Provide broker/operator-facing visibility into platform activity without exposing cross-tenant data.

**Files:**
- `admin.module.ts` - Nest module
- `controllers/admin-dashboard.controller.ts` - KPI endpoints
- `controllers/admin-audit.controller.ts` - audit listing endpoints
- `services/admin-dashboard.service.ts` - dashboard and audit data aggregation
- `index.ts` - module re-exports
- `MODULE_DOC.md` - this file

**Flow diagram:** `flowcharts/admin-flow.svg`

**Dependencies:**
- Internal: OMS entities, Accounts entities, Users entities, shared logger
- External: PostgreSQL via TypeORM

**APIs:**
- `GET /admin/dashboard/stats` - tenant KPI snapshot
- `GET /admin/audit/orders` - latest order-audit logs

**Env vars:**
- none specific (inherits global auth/tenant config)

**Tests:** controller/service coverage should validate tenant scoping and limit bounds.

**Change-log:**
- 2025-01-09 IST: Initial admin module with dashboard stats and order-audit APIs.
- 2026-02-17 IST: Added module re-exports and Nx domain project boundary (`backend-admin`).
