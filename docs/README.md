# NestTrade documentation

High-level documentation for the NestTrade platform. Module-level docs live in each app or module; this folder points to them and describes the overall structure.

## Architecture overview

NestTrade is an Nx monorepo containing:

- **Backend** — NestJS API (auth, users, RBAC, market, accounts, OMS, realtime, notifications, admin, tenancy, broker hierarchy, execution gateway, compliance, onboarding, risk, settlement, reconciliation, corporate actions, limits, SaaS control plane, dealing, support, partners, developer platform).
- **Web apps** — Next.js applications: main trader web, broker-admin, platform-owner, dealer-workstation, support-ops, ib-portal, developer-portal, public-site.
- **Libs** — Shared code: ui-kit, web-auth, web-api-client, web-feature-flags, web-shell, desktop-shell, mobile-*.

## Where to find docs

| Area | Location |
|------|----------|
| **Backend API, contracts, deployment** | [apps/backend/docs/](../apps/backend/docs/) |
| **Module docs (purpose, flows, APIs)** | Each module has `MODULE_DOC.md` (e.g. `apps/backend/src/modules/users/MODULE_DOC.md`). These are the source of truth; they are not copied here. |
| **Platform Owner app (UI, mock data)** | [apps/platform-owner/MODULE_DOC.md](../apps/platform-owner/MODULE_DOC.md) — tenancy/entitlements/billing/audit screens; backend integration deferred. |
| **API docs (Typedoc)** | Generated under `apps/backend/docs/api/` when you run `npm run docs:api` (see root README). |

## Backend docs (apps/backend/docs/)

- **ENTERPRISE_CHECKLIST.md** — Platform foundation, identity, trading core, funds, market data, governance.
- **API_EDGE_CONTRACTS.md** — API edge and versioning contracts.
- **CONNECTOR_CONTRACTS.md** — Execution connector contracts.
- **GLOBAL_BROKER_SAAS_ARCHITECTURE.md** — Global broker SaaS architecture.
- **AWS_DEPLOYMENT_BASELINE.md**, **WAVE2_DAY1_BASELINE.md** — Deployment and baseline docs.
- **asyncapi.yaml**, **ws/** — AsyncAPI and WebSocket documentation.

## Contributing to docs

- When adding or changing a module, update that module’s `MODULE_DOC.md` and add a Change-log entry.
- Cross-cutting or runbook docs can be added under `docs/` or under the relevant app’s `docs/` folder.
- Do not put secrets in any documentation; use env.example or runbooks for secret env vars.
