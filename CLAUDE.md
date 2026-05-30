# CLAUDE.md — Obsidian Platform

> Authoritative briefing for Claude Code (and any LLM agent) working in this repo.
> **Read this top-to-bottom on first session of the day.** Most sections are
> single-source-of-truth — facts are not duplicated elsewhere.

---

## 0 · Five-line orientation

- **What this is:** Nx 21 monorepo for **Obsidian** — multi-tenant trading platform. NestJS backend + 9 frontends + design system + IaC.
- **Where the code is:** `apps/backend/src/modules/<32 modules>` · `apps/web` · `apps/broker-admin` · `libs/obsidian-ui` (design system) · `infra/aws/terraform` · `deploy/helm`.
- **Hot patterns to never violate:** `AppError` for all errors · `AppLoggerService` for all logs · **outbox** for all cross-module events · resilience wrappers around every external call · DTOs with `class-validator` on every input · idempotency on every order/payment/ledger write.
- **Most-broken tests:** contract tests run `--runInBand` because they share fixture state. If they're flaky, parallelism leaked in.
- **The visual brand:** Obsidian Design System — dark Bloomberg/TradingView terminal. Read `/design/obsidian-design-system/project/README.md` before any UI change.

---

## 1 · Specialist agents (auto-discovered from `.claude/agents/`)

Claude Code auto-invokes the matching agent based on the task. Use these instead of writing the work yourself when the trigger fits.

| Agent | Triggers when you are… | Does |
|---|---|---|
| **`backend-module-builder`** | Scaffolding/extending a module under `apps/backend/src/modules/<name>/` | Generates module + barrel + MODULE_DOC + tests aligned with all hard rules below |
| **`nestjs-controller-reviewer`** | After writing/modifying any `*.controller.ts` | Audits for layering / auth / DTO / `AppError` / idempotency / observability |
| **`obsidian-ui-engineer`** | Building or modifying UI in any frontend app | Enforces design tokens, `font-mono` numbers, ALL CAPS panel titles, no shadows for structure |
| **`db-migration-guard`** | About to run a migration that ALTERs / adds NOT NULL / renames / drops / changes types | Blocks the 7 known dangerous patterns; demands multi-step plans |
| **`contract-test-engineer`** | Touching `execution-gateway/connectors/**` or `developer-platform/**` | Maintains `--runInBand` contract suites + `CONNECTOR_CONTRACTS` / `API_EDGE_CONTRACTS` |
| **`file-header-enforcer`** | Backfilling missing/incomplete file headers across files or a module | Reads code, derives Exports/Side-effects/Invariants, writes accurate header |

Each agent's full system prompt lives in `.claude/agents/<name>.md`. Edit there to refine behavior.

---

## 2 · Build, dev, test commands

This is an Nx 21 monorepo. Use `nx` (via `./nx`) or `npm run <script>`.

### Run an app

| App | Script | Port |
|---|---|---|
| Backend API | `npm run dev:backend` | **3000** (Swagger at `/docs`) |
| Web (trader terminal, Next 15) | `npm run dev:web` | **4200** |
| Desktop (Electron) | `npm run dev:desktop` | — |
| Broker admin | `npm run dev:broker-admin` | — |
| Dealer workstation | `npm run dev:dealer` | **4500** |
| Support ops | `npm run dev:support-ops` | — |
| IB portal | `npm run dev:ib-portal` | — |
| Developer portal | `npm run dev:developer-portal` | — |
| Platform owner | `npm run dev:platform-owner` | — |
| Public site | `npm run dev:public-site` | — |

Swagger declares an `x-tenant-id` API key header — required on tenant-scoped endpoints.

### Build / lint / test

```bash
npm run build           # Build all
npm run lint            # Lint all
npm run lint:mobile     # Mobile lints
npm run lint:desktop    # Desktop lints
npm run lint:wave2-surfaces  # Dealer, support-ops, ib-portal, dev-portal, public-site, mobile, desktop
npm run test            # Test all
npm run e2e             # Playwright e2e (web)

nx test backend                                  # Single project
nx test backend --testPathPattern=users.service  # Single test file
npm run affected:test                            # Affected-only (CI / partial changes)
```

### GraphQL

```bash
npm run dev:backend        # Start backend — auto-generates schema.gql at startup
npm run codegen:web        # Generate web Apollo types + hooks from schema + operations
```

**Enterprise codegen pipeline** — codegen reads `apps/backend/src/generated/schema.gql` + `apps/web/gql/operations/**/*.gql` and outputs:
- `apps/web/gql/generated/graphql.ts` — all schema types + utility types (Exact, InputMaybe, Scalars, Maybe)
- `apps/web/gql/generated/hooks.ts` — all `useXxxQuery` / `useXxxMutation` hooks + document definitions

The generated `hooks.ts` uses types from `graphql.ts` (Exact, InputMaybe, Scalars, input types).
A manual `import type { ... } from './graphql'` is appended to `hooks.ts` post-generation
because the `importTypes` / `typesImportPath` codegen options are not always emitted correctly.

**Development workflow:**
1. Write `.gql` operation in `apps/web/gql/operations/<module>/`
2. Run `npm run codegen:web`
3. Use generated `useXxxQuery` / `useXxxMutation` from `gql/generated/hooks.ts` in UI
4. Import types from `gql/generated/graphql.ts` — DO NOT edit generated files
5. Optional: wrap in thin custom hook under `apps/web/gql/hooks/` for better DX

**Import convention:** Components import from `@/gql/hooks` (points to `gql/generated/hooks.ts`).
Legacy `gql-service.ts` is deprecated — only `CANCEL_BRACKET_GROUP_MUTATION` remains there
(because that mutation is not yet in the codegen pipeline).

**Note:** `graphql:schema` script is broken — schema is generated by NestJS at backend startup, not by a standalone script.

### Contract tests (in band — order matters)

```bash
npm run test:contracts                      # execution-gateway connectors
npm run test:developer-platform-contracts   # developer-platform API edge
```

Both run `--runInBand`. Keep `CONNECTOR_CONTRACTS` and `API_EDGE_CONTRACTS` expectation files in sync. See agent **`contract-test-engineer`** for the full workflow.

### Quality gates (must pass before any PR merge)

```bash
npm run check:cycles           # madge — circular deps in apps/backend/src
npm run check:duplicates       # tools/scripts/check-duplicate-files.mjs
npm run check:headers          # tools/scripts/check-file-headers.mjs (NEW)
npm run quality:verify         # full gate: cycles + duplicates + headers + contracts + affected lint/test/build
npm run docs:api               # Typedoc → apps/backend/docs/api/
```

---

## 3 · Monorepo layout

```
apps/
  backend/          NestJS API (primary focus of this guide)
  web/              Next.js 15 App Router — trader terminal
  broker-admin/     Broker back-office
  dealer-workstation/ · desktop-pro/ · developer-portal/ · ib-portal/
  mobile/           · platform-owner/   · public-site/    · support-ops/
  web-e2e/          Playwright tests
libs/
  obsidian-ui/      Design system (tokens, Tailwind preset)
  ui-kit/ · web-auth/ · web-api-client/ · web-feature-flags/ · web-shell/
  desktop-shell/ · mobile-ui-kit/ · mobile-auth/ · mobile-api-client/
deploy/helm/        Helm charts (backend, web)
infra/aws/terraform/ VPC, EKS, RDS, Redis, Kafka
design/obsidian-design-system/ Canonical UI specs & HTML prototypes
tools/scripts/      check-duplicate-files.mjs · check-file-headers.mjs · scaffold-module-doc.mjs
.claude/agents/     Specialist agents (Section 1)
.cursor/rules/      Detailed rule shards (.mdc) — referenced by section
```

### Nx module-boundary tags (enforced by `@nx/enforce-module-boundaries`)

- **Scope tags** — `scope:web` / `scope:backend` / `scope:mobile` / `scope:desktop` / `scope:design-system`. **Cross-scope imports are forbidden.**
- **Layer tags** — `layer:entrypoint` → `layer:domain` → `layer:infra`. Unidirectional only.

Violating either fails `nx lint`. Configure in `eslint.config.mjs`.

---

## 4 · Backend deep-dive (NestJS 11)

### 4.1 The 32-module domain map

| Module | Domain |
|---|---|
| `accounts` | Trading accounts, ledgers, buying power |
| `admin` | Internal admin endpoints |
| `auth` | JWT / session auth, OTP, token lifecycle |
| `broker-hierarchy` | IB trees, sub-broker relationships |
| `compliance` | Regulatory checks |
| `copy-trading` | Mirror/copy trading strategies |
| `corporate-actions` | Dividends, splits, rights |
| `crm` | CRM integration |
| `dealing` | Dealer desk operations |
| `demo-accounts` | Paper-trading / demo lifecycle |
| `developer-platform` | External developer API keys, webhooks, sandbox |
| `execution-gateway` | Exchange/broker adapters; order routing |
| `limits-and-controls` | Position limits, order size caps |
| `lp-routing` | Liquidity provider routing |
| `market` | Instruments, market data, symbols |
| `notifications` | In-app + push delivery |
| `oms` | Order management (lifecycle, positions) |
| `onboarding` | User/broker registration flows |
| `pamm` | PAMM (Percentage Allocation Management Module) |
| `partners` | Partner API / referral integrations |
| `rbac` | Roles, permissions, policy enforcement |
| `reconciliation` | Position + ledger reconciliation |
| `reports` | Reporting and analytics |
| `risk-policy` | Pre-trade risk checks, exposure |
| `rules-engine` | Configurable business rules engine |
| `saas-control-plane` | Platform-level SaaS mgmt (plans, limits, billing hooks) |
| `settlement` | Trade settlement workflows |
| `support` | Support ticket / lookup |
| `tenancy` | Multi-tenant isolation, tenant resolution |
| `users` | Profiles, KYC fields, deactivation |
| `promotions` | Promotions and bonuses |
| `realtime` | WebSocket gateway (`PranaStreamModule`) |

### 4.2 Path aliases — cross-module imports go through these

Defined in `tsconfig.base.json`. **Direct relative imports between modules are forbidden** — always go through the alias and the module's `index.ts` barrel.

```
@obsidian/backend-accounts · @obsidian/backend-admin · @obsidian/backend-auth
@obsidian/backend-broker-hierarchy · @obsidian/backend-compliance · @obsidian/backend-copy-trading
@obsidian/backend-corporate-actions · @obsidian/backend-crm · @obsidian/backend-dealing
@obsidian/backend-demo-accounts · @obsidian/backend-developer-platform · @obsidian/backend-execution-gateway
@obsidian/backend-limits-controls · @obsidian/backend-lp-routing · @obsidian/backend-market
@obsidian/backend-notifications · @obsidian/backend-oms · @obsidian/backend-onboarding
@obsidian/backend-pamm · @obsidian/backend-partners · @obsidian/backend-rbac
@obsidian/backend-reconciliation · @obsidian/backend-reports · @obsidian/backend-risk-policy
@obsidian/backend-rules-engine · @obsidian/backend-saas-control-plane · @obsidian/backend-settlement
@obsidian/backend-support · @obsidian/backend-tenancy · @obsidian/backend-users
@obsidian/backend-promotions · @obsidian/backend-realtime
```

### 4.3 Layered architecture contract (CONTROLLERS → SERVICES → REPOSITORIES)

| Layer | What lives here | What MUST NOT live here |
|---|---|---|
| Controller | DTO parse → service call → DTO return | Business logic · Repository / DataSource calls · `try/catch` around everything · Manual response envelopes |
| Service | All business logic · transactions · domain events · resilience wrappers · `AppLoggerService` calls | Raw HTTP / WS framework code · Direct framework guard wiring |
| Repository | Non-trivial / reusable DB access (TypeORM) | Business logic · External calls |

Functions stay ≤ ~40 lines and composable. No circular deps — `madge` enforces (`npm run check:cycles`).

### 4.4 Bootstrap pipeline (`main.ts` → `app.module.ts`) — applied **globally**, in order

1. `ValidationPipe` — `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`
2. `GlobalHttpExceptionFilter` — maps `AppError.code` → HTTP status; emits `{ code, message, requestId, timestamp }`
3. `LoggingInterceptor`
4. `helmet()`, CORS (`credentials: true`), `cookie-parser`
5. `RequestContextMiddleware` — attaches `requestId` for log correlation
6. `ThrottlerGuard` — 100 requests / 60 s global rate limit
7. `SwaggerModule` (when `SWAGGER_ENABLED=true`)
8. Optional Socket.IO Redis adapter (when `REDIS_URL` set) — horizontal WS scaling

### 4.5 Shared infrastructure (`apps/backend/src/shared/`)

Global providers — **never re-declare in feature modules**.

| Path | Purpose |
|---|---|
| `shared/logger.ts` → `AppLoggerService` | Pino structured logging. Never `console.log`. |
| `shared/config/` | App-wide env config (`ConfigModule`) |
| `shared/database/typeorm.config.ts` | TypeORM + PostgreSQL connection factory |
| `shared/redis/` | Redis client |
| `shared/cache/` | Cache abstraction over Redis |
| `shared/messaging/` | Kafka/messaging contracts (publisher/consumer interfaces) |
| `shared/outbox/` | **Transactional outbox** (`OutboxService`, `OutboxWorkerSkeleton`) — `@Global()` |
| `shared/observability/` | Health checks (Terminus), metrics endpoints |
| `shared/resilience/` | `circuit-breaker.wrapper.ts` · `retry.wrapper.ts` — wrap **every** external call |
| `shared/aws/sns.service.ts` | SNS push notifications |
| `shared/request-id.middleware.ts` | Attaches `requestId` to every request |
| `shared/fx/` | FX rate utilities |

### 4.6 Common layer (`apps/backend/src/common/`)

- `common/errors/domain.errors.ts` — all errors extend `AppError(code, message)`
- `common/filters/global-http-exception.filter.ts` — error response envelope
- `common/interceptors/logging.interceptor.ts` — request log emission

### 4.7 Execution gateway — connector registry

`apps/backend/src/modules/execution-gateway/connectors/` per asset class:

```
base/                    Base connector interface (all connectors implement)
equities-fno/            Indian equities & F&O
fx-cfd/                  FX and CFD
crypto-cex/              Crypto centralized exchange
commodities/             Commodities
us-equities-options/     US equities & options
```

Routing selects the connector by asset class. Contract tests verify each integration — see agent **`contract-test-engineer`**.

### 4.8 Realtime — PranaStream WebSocket gateway

`apps/backend/src/modules/realtime/prana-stream/`. Every WS handler MUST:

- Propagate `requestId` / `correlationId` from the auth handshake into log context AND outbound frames.
- Use small typed frame DTOs — never broadcast unbounded payloads.
- Respect the optional Socket.IO Redis adapter for horizontal scaling.

---

## 5 · The 7 load-bearing patterns (NEVER violate)

These are what makes this codebase enterprise-grade. Memorize.

| # | Pattern | What | Where |
|---|---|---|---|
| 1 | **Errors via `AppError`** | All thrown errors extend `AppError(code, message)`. Filter maps to HTTP status. | `common/errors/domain.errors.ts` |
| 2 | **Logging via `AppLoggerService`** | Pino. `logger.debug({ requestId, ... })` at entry/exit of every public service method. Never `console.log`. | `shared/logger.ts` |
| 3 | **Outbox for cross-module events** | Insert into `OutboxEntity` in the **same DB transaction** as the domain write. `OutboxWorkerSkeleton` publishes asynchronously. | `shared/outbox/` |
| 4 | **Resilience wrappers on external calls** | Every exchange / broker / payment / compliance call goes through `retry.wrapper.ts` or `circuit-breaker.wrapper.ts`. Log duration + outcome. | `shared/resilience/` |
| 5 | **DTOs with class-validator** | Every controller input is a class with decorators. `forbidNonWhitelisted: true` is global → extra fields cause 400. | `<module>/dto/*.dto.ts` |
| 6 | **Idempotency on writes** | Order / payment / ledger writes idempotent via unique constraint on `clientOrderId` / `idempotencyKey`. Documented in MODULE_DOC. | `oms` · `accounts` · `settlement` · `developer-platform` |
| 7 | **Module barrel `index.ts`** | Public surface only. Cross-module imports use `@obsidian/backend-<name>`, never relative paths. | every module |

---

## 6 · Database & migrations

- **TypeORM + PostgreSQL** · UUID v4 PKs (`@PrimaryGeneratedColumn('uuid')`)
- Relations declare cascade rules **explicitly**.
- Migrations: timestamp-prefixed slug — `1734123456789-add-user-kyc-fields.ts`. Never edit an applied migration; always add a new one.
- **Manual DB migrations and destructive codemods require explicit user approval** before execution.

**Before running any production migration**, dispatch agent **`db-migration-guard`**. It blocks the 7 known dangerous patterns (NOT NULL without default, missing CONCURRENTLY, single-step rename, type-rewrite, drop-while-referenced, FK without index, long-running tx).

---

## 7 · API design — REST vs GraphQL vs WebSocket

| Scenario | Protocol | Why |
|---|---|---|
| Transactional endpoints (orders, auth, funds) | **REST** | Simple, low-overhead, idempotent semantics |
| High-frequency (modify / cancel / fills) | **REST** | Minimal overhead per call |
| Dashboards & cross-entity aggregation | **GraphQL** (admin schema) | Avoid n+1 round-trips |
| Streaming market data | **WebSocket** (PranaStream) | Small typed frames, low latency |
| External partner APIs | **REST** at `/api/v1/...` | Versioned, stable contract |

**Auth contract:** every HTTP/WS endpoint must use an auth guard OR be explicitly marked public. Public routes: health, login, HMAC webhooks. **All public routes must be listed in the module's MODULE_DOC.md.**

---

## 8 · Testing

| Type | Location | Runner |
|---|---|---|
| Unit | co-located `*.spec.ts` | `nx test backend` |
| Integration | module `tests/` or `__tests__/` (Testcontainers + Postgres) | `nx test backend` |
| Contract | execution-gateway · developer-platform | `npm run test:contracts` (in band) |
| E2E (web) | `apps/web-e2e/` | `npm run e2e` |

**`it.skip` / `test.skip`** require a ticket reference comment. No naked skips on `main`.

---

## 9 · File headers (required on every code file)

The going-forward standard is the **long form**. Existing **short-form** headers are grandfathered — they pass the lint.

### Long form (preferred for new files / significant rewrites)

```ts
/**
 * File:        <repo-relative path>
 * Module:      <logical module / domain>
 * Purpose:     <one sentence — what problem this file solves>
 *
 * Exports:
 *   - <Symbol>(args) → ReturnType   — <what it does>
 *   - <Type>                         — <what it models>
 *
 * Depends on:
 *   - <load-bearing import> — <why imported>
 *
 * Side-effects:
 *   - <DB / HTTP / FS / events / none>
 *
 * Key invariants:
 *   - <non-obvious rule the code relies on that types alone don't capture>
 *
 * Read order:
 *   1. <Symbol> — start here for the data shape
 *   2. <Symbol> — core logic
 *
 * Author:       BharatERP
 * Last-updated: YYYY-MM-DD
 */
```

### Short form (existing convention — accepted)

```ts
/**
 * @file         <filename or repo-relative path>
 * @module       <module-name>
 * @description  <one sentence>
 * @author       BharatERP
 * @created      YYYY-MM-DD
 * @last-updated YYYY-MM-DD   (optional — required only if @created is absent)
 */
```

### Enforcement

- `npm run check:headers` — wired into `npm run quality:verify`. Scans `apps/backend/src` and `libs/obsidian-ui/src`.
- Need to **add** or **fix** headers on a batch of files? Dispatch agent **`file-header-enforcer`** — it derives Exports/Side-effects/Invariants from the actual code.
- Manual fix? Use the `.cursor/rules/header.template.mdc` reference.

Sections are **mandatory**, not aspirational. Write `none` when a section has nothing — `none` is a useful fact, a blank is not.

---

## 10 · MODULE_DOC.md (required in every module)

Every `apps/backend/src/modules/<name>/` MUST contain `MODULE_DOC.md`. Update its **Change-log** on every edit.

Generate a starter:

```bash
node tools/scripts/scaffold-module-doc.mjs apps/backend/src/modules/<name>
```

The template (mirrors `.cursor/rules/MODULE_DOC.mdc`) covers: Short / Purpose / Files / Flow diagram / Dependencies / APIs (REST + GraphQL + WS) / Public route list / Idempotency contract / Domain events / Env vars / Tests / Failure modes / Change-log.

---

## 11 · Naming, code style, conventions

- **Filenames**: `kebab-case`. Suffixes: `*.controller.ts` · `*.service.ts` · `*.entity.ts` · `*.dto.ts` · `*.repository.ts` · `*.spec.ts`.
- **`async/await` only** — never `.then()` chaining.
- **Functions ≤ ~40 lines**, composable.
- **Explicit imports** over wildcard.
- **Always export interfaces from module `index.ts`.**
- **TypeScript strict mode.**
- **No secrets** in code or MODULE_DOC.md. Document non-secret env var names; secrets go in `env.example` / runbooks.
- **TODO markers** — use `[SonuRamTODO]` for searchability.

---

## 12 · Design system (Obsidian)

**Before any UI work, dispatch agent `obsidian-ui-engineer` OR read `/design/obsidian-design-system/project/README.md`.** That file is the authoritative visual spec.

Implementation: `libs/obsidian-ui/src/styles/tokens.css` · `libs/obsidian-ui/src/tailwind/preset.ts`.

**Brand essence** (Bloomberg / TradingView dark terminal):
- Panel titles & column headers — **ALL CAPS**, `font-display` (Syne), `letter-spacing: 0.08em`
- BUY/SELL buttons — UPPERCASE bold; everything else — sentence case
- Numbers, prices, timestamps, symbols — always `font-mono` (IBM Plex Mono) with `tnum`
- Direction — `--bull #10D996` · `--bear #FF3B5C`; deltas always `+`/`-` prefixed; 2 decimals
- Structure = **borders, not shadows** (`1px solid var(--border)`); shadows only on overlays
- Elevation = `bg-color` bump (`--bg-panel` → `--bg-elevated`), never shadow depth
- Easing — `cubic-bezier(0.4, 0, 0.2, 1)`; durations `--dur-fast 120` / `--dur 180` / `--dur-slow 300`. **No bouncy/spring.**
- Icons — `lucide-react` 14-16 px stroke 2. **No emoji** in tables, nav, or chrome (flag emoji only in economic-calendar data).
- Tailwind preset imported via **relative path** in each app's `tailwind.config.ts` (PostCSS doesn't resolve TS aliases).

---

## 13 · Web (Next.js 15)

- App Router files live under `apps/web/app/` (no `src/` prefix).
- Dependency direction: `app/ → features/ → shared/ → libs/` (`@obsidian/*`). Reverse imports fail `nx lint`.
- Path aliases: `@/features/*` · `@/shared/*` (in `apps/web/tsconfig.json`).
- **If you move where `app/` lives, delete `apps/web/.next` before rebuilding** — stale cache produces confusing errors.

---

## 14 · Quality gates (before every PR)

- [ ] `npm run check:cycles` — no circular deps
- [ ] `npm run check:duplicates` — no name collisions across modules
- [ ] `npm run check:headers` — every code file has a valid header
- [ ] All new `.ts` files use the **long form** header
- [ ] `MODULE_DOC.md` updated with a Change-log row for every touched module
- [ ] Contract tests still pass if `execution-gateway` or `developer-platform` was touched
- [ ] No manual DB migrations run without explicit approval
- [ ] `npm run quality:verify` is green

---

## 15 · Anti-patterns (red flags — refuse these)

| Anti-pattern | Why it's wrong | Do this instead |
|---|---|---|
| `console.log(...)` | Bypasses Pino, no `requestId` correlation | `AppLoggerService.debug({ requestId, ... }, ...)` |
| `throw new Error(...)` / raw `HttpException` | Global filter expects `AppError` | `throw new AppError('CODE', 'message')` |
| Cross-module `import { X } from '../../../<other>/...'` | Bypasses Nx boundary tags | `import { X } from '@obsidian/backend-<other>'` |
| Direct `eventEmitter.emit` / Kafka publish from a service | Loses transactional guarantees | `OutboxService.enqueue(...)` in same DB tx |
| External call without `retry`/`circuitBreaker` wrapper | Outage blast radius unbounded | Wrap with `shared/resilience/*` |
| Controller calling `Repository<T>.save()` | Layering violation | Push into service / repository |
| New module for one feature that fits an existing module | Over-modularization | Add a sub-module/sub-folder inside the existing module |
| `ADD COLUMN ... NOT NULL` on a large table in one step | Locks writes | Add nullable + default → backfill → SET NOT NULL (3 migrations) |
| `CREATE INDEX` without `CONCURRENTLY` on a large table | Locks writes | `CREATE INDEX CONCURRENTLY ...` (and disable migration tx) |
| Single-step column rename | Breaks running app | Add new column → backfill → switch reads → drop old |
| `it.skip` / `test.skip` without ticket comment | Hidden coverage debt | Reference a `bd` issue and explain |
| Generated docstring saying "exports: see code" | Pointless header | Enumerate exports — that's the contract |
| Inventing a new color in JSX inline | Breaks design system | Use a token; add a token if truly missing |
| Light-mode variant added speculatively | Obsidian is dark-first | Wait for explicit product ask + token updates |
| Sentence-case panel titles | Brand violation | ALL CAPS in `font-display` |
| Hardcoded secrets / DB URLs | Security | `env.example` + runbook + secrets manager |

---

## 16 · Beads issue tracker

Project uses **bd (beads)** for issue tracking. Run `bd prime` for full workflow context.

```bash
bd ready                # Find available work
bd show <id>            # View issue details
bd update <id> --claim  # Claim work
bd close <id>           # Complete work
bd remember "insight"   # Persistent knowledge across sessions
```

**Rules:**
- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists.
- Use `bd remember` for persistent knowledge — do NOT fragment into MEMORY.md files.

---

## 17 · Session completion (mandatory)

Work is **NOT complete until `git push` succeeds.**

```bash
# 1. File issues for any leftover work
bd create --title="..." --description="..." --type=task --priority=2

# 2. Run quality gates if code changed
npm run quality:verify

# 3. Update issue status (close finished, update in-progress)
bd close <id1> <id2> ...

# 4. Push (mandatory — work is stranded if you stop here)
git pull --rebase
bd dolt push          # If beads remote configured
git push
git status            # MUST show "up to date with origin"
```

If push fails — resolve and retry. Never stop before push succeeds. Never say "ready to push when you are" — YOU push.

---

## 18 · Where the deeper rules live (`.cursor/rules/`)

These shards are loaded by Cursor and apply across editors. Reference them when CLAUDE.md is too high-level.

| Shard | Topic |
|---|---|
| `master.mdc` | Top-level project rules (always-applied) |
| `project_rules.mdc` | Project-specific conventions |
| `header.template.mdc` | Short-form header template |
| `MODULE_DOC.mdc` | MODULE_DOC.md template (used by `scaffold-module-doc.mjs`) |
| `module_template.mdc` | Module skeleton |
| `api_rules.mdc` | API design, versioning |
| `error_handling.mdc` | `AppError` + filter |
| `logger_setup.mdc` | Logger setup details |
| `data-persistence.mdc` | Repository layer, migrations, idempotency |
| `observability-resilience.mdc` | WS correlation, health, resilience wrappers |
| `security-api.mdc` | Auth, secrets, public routes |
| `testing-quality.mdc` | Coverage rules, contract tests |
| `manual_actions.mdc` | What requires explicit approval |
| `uirules.mdc` | UI rules (deeper than this file's design-system pointer) |
| `preferences.mdc` | Author / commit preferences |
| `PR_CHECKLIST.mdc` | PR review checklist |

---

## 19 · Quick decision tree

```
Need to do X?
│
├── Adding a new module                    → agent `backend-module-builder`
├── Just wrote a controller                → agent `nestjs-controller-reviewer`
├── Adding/changing UI                     → agent `obsidian-ui-engineer`
├── About to run a migration               → agent `db-migration-guard`
├── Touching connector or developer-platform → agent `contract-test-engineer`
├── Backfilling file headers               → agent `file-header-enforcer`
│
├── Cross-module event needed              → outbox (NOT direct broker emit)
├── External API call                      → resilience wrapper
├── Controller logic getting fat           → push into service
├── DB write that could be retried         → idempotency key + unique constraint
│
├── Dashboard / aggregation API            → GraphQL admin schema
├── Order / auth / funds                   → REST `/api/v1/...`
├── Live market data                       → WebSocket (PranaStream)
│
├── Naming a new file                      → kebab-case, suffix matches role
├── Throwing an error                      → AppError(CODE, message)
├── Logging                                → AppLoggerService with requestId
│
└── Unsure?                                → check the relevant `.cursor/rules/*.mdc` shard,
                                             then ask the user before guessing.
```

---

*Last updated: 2026-05-30 — fix GraphQL codegen pipeline: hooks.ts imports patched post-gen; operation .ts files import from graphql.ts; deprecated gql-service.ts; update codegen:web script with post-patch step*


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
