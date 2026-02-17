---
name: nx-enterprise-mt5-upgrade
overview: Transform the current mixed Nx/Nest setup into a canonical enterprise Nx monorepo, then apply critical backend hardening fixes and publish an evidence-based MT5-competition readiness update (assuming live market data remains a separate API).
todos:
  - id: phase1-nx-foundation
    content: Normalize workspace into canonical Nx app/lib layout and harden root Nx config.
    status: in_progress
  - id: phase2-executors
    content: Replace command-wrapper project targets with proper Nx executors for backend/web/e2e.
    status: pending
  - id: phase3-domain-split
    content: Split backend into enterprise domain libs and shared infra libs with boundary tags.
    status: pending
  - id: phase4-critical-fixes
    content: Apply critical backend hardening fixes (request context, auth async flow, realtime snapshot/adapters baseline).
    status: pending
  - id: phase5-quality-gates
    content: Add cycle/duplicate checks and enforce affected lint-test-build pipeline.
    status: pending
  - id: phase6-doc-sync
    content: Sync MODULE_DOC docs/changelogs and update backend audit/readiness documents.
    status: pending
  - id: phase7-mt5-update
    content: Publish final MT5-competition readiness update with completion score and prioritized gap roadmap.
    status: pending
isProject: false
---

# Enterprise Nx + MT5 Backend Upgrade Plan

## Current Verified Baseline

- Workspace is Nx-initialized but not enterprise-ready yet:
  - Targets are shell-command wrappers in [Backend/project.json](Backend/project.json) and [apps/project.json](apps/project.json), so caching/affected execution is weak.
  - Dependency management is split across root [package.json](package.json) and [Backend/package.json](Backend/package.json).
  - Canonical Nx app/lib boundaries are not established (`Backend/` sits outside standard `apps/` layout).
- Backend implementation is substantial (approx. ~78% production readiness for MT5-like scope with separate market-data API):
  - Strong: auth, users/rbac, accounts ledgers, OMS core, market/watchlists, realtime infra, migrations.
  - Partially stubbed: exchange adapter realism, realtime snapshots, notification channels, some risk/settlement depth.
- Critical code-quality gaps to fix in this phase:
  - Request context middleware flow bug risk in [Backend/src/shared/request-id.middleware.ts](Backend/src/shared/request-id.middleware.ts).
  - Promise-chaining/controller style inconsistencies in [Backend/src/modules/auth/auth.controller.ts](Backend/src/modules/auth/auth.controller.ts).
  - Realtime snapshot and live-adapter baseline in [Backend/src/modules/realtime/prana-stream/services/realtime-aggregator.service.ts](Backend/src/modules/realtime/prana-stream/services/realtime-aggregator.service.ts), [Backend/src/modules/realtime/prana-stream/adapters/main-market-data.adapter.ts](Backend/src/modules/realtime/prana-stream/adapters/main-market-data.adapter.ts), [Backend/src/modules/realtime/prana-stream/adapters/vortex-market-data.adapter.ts](Backend/src/modules/realtime/prana-stream/adapters/vortex-market-data.adapter.ts).

## Target Enterprise Architecture

```mermaid
flowchart LR
  currentRepo[CurrentRepo] --> canonicalNx[CanonicalNxLayout]
  canonicalNx --> executorUpgrade[NxExecutorsAndPipelines]
  executorUpgrade --> domainSplit[BackendDomainLibSplit]
  domainSplit --> criticalHardening[CriticalBackendHardening]
  criticalHardening --> qualityGates[QualityGatesAndDocsSync]
```



## Execution Phases

### Phase 1: Canonical Nx Foundation

- Normalize workspace structure toward canonical Nx:
  - Backend app moved under `apps/backend` (from current `Backend/`).
  - Frontend app normalized under `apps/web` (from current `apps/`).
  - Start `libs/` for shared and domain libraries.
- Upgrade workspace config:
  - Harden [nx.json](nx.json) with `targetDefaults`, named inputs, caching defaults, affected defaults, workspace layout.
  - Update [package.json](package.json) scripts for `nx run-many` and `nx affected` workflows.
  - Align [tsconfig.base.json](tsconfig.base.json) path aliases for app/lib imports.

### Phase 2: Proper Nx Project Targets (No Shell Wrappers)

- Replace command-only targets with Nx executors for backend/web/e2e projects.
- Update project definitions currently in [Backend/project.json](Backend/project.json), [apps/project.json](apps/project.json), [apps-e2e/project.json](apps-e2e/project.json) to canonical executor-based targets (`build`, `serve`, `test`, `lint`, `e2e`).
- Ensure test/lint/build output paths are cache-friendly and deterministic.

### Phase 3: Full-Enterprise Backend Domain Split (As Requested)

- Split backend into domain libraries while keeping a thin backend app shell:
  - Domain libs for auth, users, rbac, market, accounts, oms, realtime, notifications, admin.
  - Infra/shared libs for logger, request context, database config, observability, common errors/filters.
- Remove fragile cross-domain coupling and forwardRef-heavy cycles where feasible.
- Add Nx tags and boundary rules to enforce architecture and avoid regression.

### Phase 4: Critical Backend Hardening (Included by Your Choice)

- Fix request correlation middleware flow correctness in [Backend/src/shared/request-id.middleware.ts](Backend/src/shared/request-id.middleware.ts).
- Refactor auth controller async flows to `async/await` and harden token handling in [Backend/src/modules/auth/auth.controller.ts](Backend/src/modules/auth/auth.controller.ts).
- Implement baseline realtime snapshot/domain aggregation and adapter fallback behavior for separate market-data API in:
  - [Backend/src/modules/realtime/prana-stream/services/realtime-aggregator.service.ts](Backend/src/modules/realtime/prana-stream/services/realtime-aggregator.service.ts)
  - [Backend/src/modules/realtime/prana-stream/adapters/main-market-data.adapter.ts](Backend/src/modules/realtime/prana-stream/adapters/main-market-data.adapter.ts)
  - [Backend/src/modules/realtime/prana-stream/adapters/vortex-market-data.adapter.ts](Backend/src/modules/realtime/prana-stream/adapters/vortex-market-data.adapter.ts)

### Phase 5: Enterprise Quality Gates + Docs Sync + MT5 Update

- Add enforceable quality gates:
  - dependency-cycle check (madge), duplicate-file check, strict lint/test/build on affected projects.
- Complete docs alignment:
  - Sync module docs where missing/outdated (notably admin/notifications module docs and changelogs).
  - Update backend audit docs to reflect actual current implementation and remaining MT5 gaps (market data externalized assumption explicit).
- Deliver final MT5 competition readiness update with:
  - completed capabilities,
  - remaining blockers,
  - wave-wise roadmap (MVP, Scale, Institutional).

## Deliverables At End Of Execution

- Canonical enterprise Nx monorepo with executor-driven targets and enforceable boundaries.
- Backend split into maintainable domain libraries with reduced coupling.
- Critical runtime hardening fixes merged.
- Updated backend readiness report for MT5 competition context, explicitly separating live market-data API dependency.

