# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Build & Dev Commands

This is an **Nx 21 monorepo**. Use `nx` (via the local wrapper `./nx`) or `npm run` scripts.

### Running apps

| App | Command | Port |
|---|---|---|
| Backend API | `npm run dev:backend` | 3000 |
| Web (Next.js) | `npm run dev:web` | 4200 |
| Broker admin | `npm run dev:broker-admin` | — |
| Dealer workstation | `npm run dev:dealer` | — |
| Support ops | `npm run dev:support-ops` | — |
| IB portal | `npm run dev:ib-portal` | — |
| Developer portal | `npm run dev:developer-portal` | — |
| Platform owner | `npm run dev:platform-owner` | — |
| Public site | `npm run dev:public-site` | — |

Swagger API docs at `/docs` when backend is running (`SWAGGER_ENABLED=true` by default).  
Swagger also declares a `x-tenant-id` API key header — required on all tenant-scoped endpoints.

### Build, lint, test

```bash
npm run build                # Build all projects
npm run lint                 # Lint all
npm run test                 # Test all
npm run e2e                  # Playwright e2e for web app

# Single project
nx test backend
nx lint web
nx build backend

# Single test file
nx test backend --testPathPattern=users.service

# Affected-only (faster in CI / after partial changes)
npm run affected:build
npm run affected:lint
npm run affected:test
```

### Contract tests (run in band — order matters)

```bash
npm run test:contracts                      # execution-gateway contracts
npm run test:developer-platform-contracts   # developer-platform contracts
```

Contract tests are run `--runInBand` because they rely on shared state. Keep `CONNECTOR_CONTRACTS` / `API_EDGE_CONTRACTS` in sync with test expectations.

### Quality gates

```bash
npm run check:cycles         # madge circular dependency check (backend only)
npm run check:duplicates     # duplicate file checker (tools/scripts/)
npm run quality:verify       # full gate: cycles + duplicates + contracts + affected lint/test/build
npm run docs:api             # Typedoc → apps/backend/docs/api/
```

All gates must pass before any PR merge.

---

## Architecture

### Monorepo layout

```
apps/
  backend/          NestJS API (primary focus of this guide)
  web/              Next.js 15 App Router (trader terminal)
  broker-admin/     Broker back-office
  dealer-workstation/
  desktop-pro/
  developer-portal/
  ib-portal/
  mobile/
  platform-owner/   SaaS platform management
  public-site/
  support-ops/
  web-e2e/          Playwright tests
libs/
  obsidian-ui/      Design system (tokens, Tailwind preset)
  ui-kit/
  web-auth/
  web-api-client/
  web-feature-flags/
  web-shell/
  desktop-shell/
  mobile-ui-kit/
  mobile-auth/
  mobile-api-client/
deploy/helm/        Helm charts (backend, web)
infra/aws/terraform/ VPC, EKS, RDS, Redis, Kafka
design/obsidian-design-system/ Canonical UI specs & HTML prototypes
tools/scripts/      check-duplicate-files.mjs, etc.
```

### Nx module boundary enforcement

`@nx/enforce-module-boundaries` in `eslint.config.mjs` enforces:

- **Scope tags**: `scope:web`, `scope:backend`, `scope:mobile`, `scope:desktop`, `scope:design-system` — cross-scope imports are **forbidden**
- **Layer tags**: `layer:entrypoint` → `layer:domain` → `layer:infra` — unidirectional only

Violating these will fail `nx lint`.

---

## Backend Deep-Dive (NestJS)

### Module domain map

Every feature lives in `apps/backend/src/modules/<name>/`. The 25 modules and their domains:

| Module | Domain |
|---|---|
| `auth` | JWT/session authentication, OTP, token lifecycle |
| `users` | User profiles, KYC fields, deactivation |
| `rbac` | Roles, permissions, policy enforcement |
| `tenancy` | Multi-tenant isolation, tenant resolution |
| `saas-control-plane` | Platform-level SaaS management (plans, limits, billing hooks) |
| `accounts` | Trading accounts, ledgers, buying power |
| `demo-accounts` | Paper-trading / demo account lifecycle |
| `market` | Instruments, market data, symbols |
| `oms` | Order management system (order lifecycle, positions) |
| `execution-gateway` | Exchange/broker adapters; routes orders to connectors |
| `dealing` | Dealer desk operations |
| `realtime` | WebSocket gateway (`PranaStreamModule`) for market & position feeds |
| `notifications` | In-app and push notification delivery |
| `onboarding` | User/broker registration flows |
| `broker-hierarchy` | IB trees, sub-broker relationships |
| `partners` | Partner API / referral integrations |
| `risk-policy` | Pre-trade risk checks, exposure rules |
| `limits-and-controls` | Position limits, order size caps |
| `compliance` | Regulatory compliance checks |
| `settlement` | Trade settlement workflows |
| `reconciliation` | Position and ledger reconciliation |
| `corporate-actions` | Dividends, splits, rights |
| `admin` | Internal admin endpoints |
| `support` | Support ticket / lookup endpoints |
| `developer-platform` | External developer API keys, webhooks, sandbox |

### Path aliases (`@nesttrade/backend-*`)

Every module exposes a barrel via its `index.ts`. Import between modules using these aliases (defined in `tsconfig.base.json`):

```
@nesttrade/backend-auth             → modules/auth/index.ts
@nesttrade/backend-users            → modules/users/index.ts
@nesttrade/backend-rbac             → modules/rbac/index.ts
@nesttrade/backend-market           → modules/market/index.ts
@nesttrade/backend-accounts         → modules/accounts/index.ts
@nesttrade/backend-demo-accounts    → modules/demo-accounts/index.ts
@nesttrade/backend-oms              → modules/oms/index.ts
@nesttrade/backend-realtime         → modules/realtime/prana-stream/index.ts
@nesttrade/backend-notifications    → modules/notifications/index.ts
@nesttrade/backend-admin            → modules/admin/index.ts
@nesttrade/backend-tenancy          → modules/tenancy/index.ts
@nesttrade/backend-broker-hierarchy → modules/broker-hierarchy/index.ts
@nesttrade/backend-execution-gateway → modules/execution-gateway/index.ts
@nesttrade/backend-compliance       → modules/compliance/index.ts
@nesttrade/backend-onboarding       → modules/onboarding/index.ts
@nesttrade/backend-risk-policy      → modules/risk-policy/index.ts
@nesttrade/backend-settlement       → modules/settlement/index.ts
@nesttrade/backend-reconciliation   → modules/reconciliation/index.ts
@nesttrade/backend-corporate-actions → modules/corporate-actions/index.ts
@nesttrade/backend-limits-controls  → modules/limits-and-controls/index.ts
@nesttrade/backend-saas-control-plane → modules/saas-control-plane/index.ts
@nesttrade/backend-dealing          → modules/dealing/index.ts
@nesttrade/backend-support          → modules/support/index.ts
@nesttrade/backend-partners         → modules/partners/index.ts
@nesttrade/backend-developer-platform → modules/developer-platform/index.ts
```

Direct relative imports between modules are **forbidden** — always go through the alias and the module's exported barrel.

### Shared infrastructure (`src/shared/`)

Global providers — never re-declare these in feature modules:

| Path | Purpose |
|---|---|
| `shared/logger.ts` → `AppLoggerService` | Pino structured logging. Never use `console.log`. |
| `shared/config/` | `ConfigModule` setup; app-wide env config |
| `shared/database/typeorm.config.ts` | TypeORM + PostgreSQL connection factory |
| `shared/redis/` | Redis client |
| `shared/cache/` | Cache abstraction over Redis |
| `shared/messaging/` | Kafka/messaging contracts (`publisher.interface.ts`, `consumer.interface.ts`) |
| `shared/outbox/` | Transactional outbox pattern (`OutboxService`, `OutboxWorkerSkeleton`) |
| `shared/observability/` | Health checks (Terminus), metrics endpoints |
| `shared/resilience/` | `circuit-breaker.wrapper.ts`, `retry.wrapper.ts` — wrap all external calls |
| `shared/aws/sns.service.ts` | SNS push notifications |
| `shared/request-id.middleware.ts` | Attaches `requestId` to every request |
| `shared/fx/` | FX rate utilities |

### Common layer (`src/common/`)

- `common/errors/domain.errors.ts` — all domain errors extend `AppError(code, message)` and are mapped to HTTP status in `GlobalHttpExceptionFilter`
- `common/filters/` — `GlobalHttpExceptionFilter`; error responses include `{ code, message, requestId, timestamp }`
- `common/interceptors/` — `LoggingInterceptor`

### Bootstrap pipeline (`main.ts` → `app.module.ts`)

Applied **globally**, in order:

1. `ValidationPipe` — `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`
2. `GlobalHttpExceptionFilter`
3. `LoggingInterceptor`
4. `helmet()`, CORS (`credentials: true`), `cookie-parser`
5. `RequestContextMiddleware` — attaches `requestId` for log correlation
6. `ThrottlerGuard` — 100 requests / 60 s global rate limit
7. `SwaggerModule` (when `SWAGGER_ENABLED=true`)
8. Optional Socket.IO Redis adapter (when `REDIS_URL` set) — enables horizontal WebSocket scaling

### Execution gateway — connector registry

`modules/execution-gateway/connectors/` contains asset-class-specific adapters:

```
base/           Base connector interface (all connectors implement this)
equities-fno/   Indian equities & F&O
fx-cfd/         FX and CFD
crypto-cex/     Crypto centralized exchange
commodities/    Commodities
us-equities-options/  US equities & options
```

When routing an order, `ExecutionGatewayModule` selects the connector by asset class. **Contract tests** (`npm run test:contracts`) verify each connector's integration contract — run in band because they share fixtures.

### Realtime module — PranaStream

`modules/realtime/prana-stream/` is the WebSocket gateway. All WebSocket handlers must:
- Propagate `requestId`/`correlationId` from the auth handshake payload into logs and outbound frames
- Use typed, small frames for market data streaming

---

## Project Conventions

### File headers (required on all `.ts` files)

```ts
/**
 * @file <filename>
 * @module <module-name>
 * @description <short description>
 * @author BharatERP
 * @created YYYY-MM-DD
 */
```

Add `@last-updated YYYY-MM-DD` on significant edits.

### Module scaffold

```bash
nest g module <name> && nest g service <name> && nest g controller <name>
```

Every module directory **must** contain a `MODULE_DOC.md`. Update its `Change-log` section on every edit. Template: `.cursor/rules/MODULE_DOC.mdc`.

### Layered architecture contract (controllers → services → repositories)

- **Controllers are thin**: parse request, delegate to service, return DTO. No business logic.
- **Services handle business logic only**: no raw TypeORM calls unless CRUD is trivial and single-use.
- **Repositories** (`repository/<module>.repository.ts`): all non-trivial or reusable DB access lives here. Keeps services free of raw TypeORM.
- No circular dependencies — enforced by `madge` (`npm run check:cycles`).

### Naming

- All filenames: **kebab-case**
- File suffixes: `*.controller.ts`, `*.service.ts`, `*.entity.ts`, `*.dto.ts`, `*.repository.ts`, `*.spec.ts`

### Logging

`AppLoggerService` (Pino) via DI. Add `logger.debug(...)` at entry/exit of every public service method. Log IST timestamps. Never `console.log`.

### Error handling

All errors extend `AppError` from `src/common/errors/domain.errors.ts`. `GlobalHttpExceptionFilter` maps codes → HTTP status. Never throw raw `Error` in services.

### DTOs and validation

All inputs via DTOs with `class-validator` decorators. `forbidNonWhitelisted: true` is global — extra fields cause 400. Use Zod schemas in tests to verify DTO shape.

### Database

- TypeORM + PostgreSQL; UUID v4 PKs (`@PrimaryGeneratedColumn('uuid')`)
- Relations must declare cascade rules explicitly
- Migrations: timestamp-prefixed slug — `1734123456789-add-user-kyc-fields.ts`
- Never edit an applied migration; always add a new one
- Order / payment / ledger writes must be **idempotent** (idempotency key or unique constraint); document in MODULE_DOC and API contracts

### Outbox pattern (event-driven writes)

For cross-module domain events that must survive crashes: write to `OutboxEntity` in the same DB transaction, then `OutboxWorkerSkeleton` publishes to the message broker. Import `OutboxService` from `src/shared/outbox` — it is a `@Global()` module.

### External calls — resilience

Wrap every call to an external system (exchange, payment, compliance provider) in `retry.wrapper.ts` or `circuit-breaker.wrapper.ts` from `src/shared/resilience/`. Log call duration and outcome.

### API design decision matrix

| Scenario | Protocol |
|---|---|
| Transactional endpoints (orders, auth, funds) | REST |
| High-frequency (modify/cancel/fills) | REST — minimal overhead |
| Dashboards & cross-entity aggregation | GraphQL (admin schema) |
| Streaming market data | WebSocket (PranaStream), small typed frames |
| External partner APIs | REST, versioned `/api/v1/...` |

Every HTTP and WebSocket endpoint must use an auth guard OR be explicitly marked public (health, login, HMAC webhooks). Document public routes in MODULE_DOC.

### Security

- Public REST APIs: versioned at `/api/v1/...`
- No secrets in code or MODULE_DOC.md; document only non-secret env var names; secrets go in `env.example` / runbooks
- Manual DB migrations and destructive codemods require **explicit approval** before execution

### TODO markers

Use `[SonuRamTODO]` tag for searchability across the codebase.

### Code style

- `async/await` only — never `.then()` chaining
- Functions max ~40 lines; keep composable
- Explicit imports over wildcard imports
- Always export interfaces from module `index.ts`
- TypeScript strict mode

---

## Testing

| Type | Location | Runner |
|---|---|---|
| Unit | co-located `*.spec.ts` | `nx test backend` |
| Integration | module `tests/` or `__tests__/` | `nx test backend` |
| Contract | boundary modules (execution-gateway, developer-platform) | `npm run test:contracts` (in band) |
| E2E (web) | `apps/web-e2e/` | `npm run e2e` |

Integration tests skeletons use **Testcontainers + PostgreSQL** (see module_template scaffold). `it.skip` / `test.skip` require a ticket reference comment; no naked skips in `main`.

---

## Quality Gate Checklist (before every PR)

- [ ] `npm run check:cycles` passes (no circular deps)
- [ ] `npm run check:duplicates` passes
- [ ] All new `.ts` files have the file header
- [ ] `MODULE_DOC.md` updated with Change-log entry for every touched module
- [ ] Contract tests still pass if execution-gateway or developer-platform was touched
- [ ] No manual DB migrations run without explicit approval

---

## Design System

**Before any UI work, read `/design/obsidian-design-system/project/README.md`** — it is the authoritative visual spec.

All apps use the **Obsidian Design System** (Bloomberg/TradingView dark terminal aesthetic). Implementation: `libs/obsidian-ui/src/styles/tokens.css`.

### Core token vocabulary

| CSS Var | Value | Use |
|---|---|---|
| `--bg-base` | `#06080A` | Window background |
| `--bg-surface` | `#0C0E12` | Sidebar, status bar |
| `--bg-panel` | `#0F1216` | Cards, panels |
| `--bg-elevated` | `#141820` | Inputs, headers |
| `--bg-hover` | `#1A1F28` | Row hover |
| `--bg-active` | `#1E2530` | Pressed / selected |
| `--border` | `#1C2028` | Default hairline |
| `--border-md` | `#252C38` | Mid-strength |
| `--border-hi` | `#2E3847` | Hover / accent |
| `--fg1` | `#E2E8F0` | Primary text |
| `--fg2` | `#8B95A3` | Secondary text |
| `--fg3` | `#4A5568` | Muted / labels |
| `--bull` | `#10D996` | Long / up / success |
| `--bear` | `#FF3B5C` | Short / down / danger |
| `--accent` | `#3B82F6` | Blue CTA / brand |
| `--warn` | `#F59E0B` | Amber / caution |
| `--purple` | `#A855F7` | Tier badges |
| `--gold` | `#EAB308` | VIP, premium |

### Visual rules (non-negotiable)

- Panel titles / column headers: **ALL CAPS**, `font-display` (Syne), `letter-spacing: 0.08em`
- BUY / SELL buttons: **UPPERCASE bold** — all other action text: sentence case
- Numbers and prices: always `font-mono` (IBM Plex Mono) with `font-feature-settings: "tnum" 1`
- Deltas: always `+`/`-` prefix; P&L to 2 decimals (`+$1,240.00`); percentages 2 decimals (`+2.14%`)
- Structure = borders, not shadows: `1px solid var(--border)` between panels/rows; shadows only on modals/toasts/floats
- Radii: `--r-sm` 4px (tags/pills), `--r-md` 6px (buttons/inputs), `--r-lg` 8px (cards), `--r-xl` 12px (modals)
- Elevation: background-color bump only (`--bg-panel` → `--bg-elevated`); never shadow depth
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)` — no bounce, no spring
- Duration: `--dur-fast` 120ms, `--dur` 180ms, `--dur-slow` 300ms
- No emoji in data tables, navigation, or panel chrome — flag emoji only in economic calendar data

### Font stack

| Role | Font | CSS Var | Use |
|---|---|---|---|
| Display | Syne 400–800 | `--font-display` | Panel titles, logo, ALL CAPS labels, H1–H3 |
| UI | DM Sans 300–700 | `--font-ui` | Body copy, buttons, nav, menus |
| Data | IBM Plex Mono 300–700 | `--font-data` | Prices, numbers, timestamps, symbols |

Fonts are self-hosted via `next/font/google` — zero Google Fonts requests at runtime.

### Icons

Lucide React (`lucide-react`) at 14–16px, `strokeWidth={2}`. No emoji as icons except flag emoji in economic calendar. See `design/obsidian-design-system/project/README.md → ICONOGRAPHY` for canonical icon list.

### Tailwind utilities

`bg-bg-base`, `text-fg1`, `text-bull`, `text-bear`, `bg-bull-dim`, `shadow-glow-accent`, `font-display`, `font-mono`, `rounded-r-md`, etc. Full map in `libs/obsidian-ui/src/tailwind/preset.ts`.

The Tailwind preset is imported via a **relative path** in each app's `tailwind.config.ts` — PostCSS does not resolve TypeScript path aliases.

---

## Web (Next.js 15)

App Router files live directly under `apps/web/app/` (no `src/` prefix).

Dependency direction: `app/` → `features/` → `shared/` → `libs/` (`@nesttrade/*`).

Path aliases: `@/features/*`, `@/shared/*` (see `apps/web/tsconfig.json`).

If you move where `app/` lives, delete `apps/web/.next` before rebuilding.


<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:ca08a54f -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd dolt push
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
<!-- END BEADS INTEGRATION -->
