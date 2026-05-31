# Module: risk-engine

**Short:** Real-time pre-trade risk validation, exposure tracking, Greeks calculation, circuit breakers, and auto-liquidation.

**Purpose:** Enforce risk thresholds (margin level, exposure, position limits, open orders, delta, gamma) by validating orders before execution and executing configured actions (ALERT, FREEZE_ACCOUNT, LIQUIDATE_ALL, LIQUIDATE_BIGGEST, CIRCUIT_BREAKER) when thresholds are breached. Consumed by OmsModule for pre-trade checks and AccountsModule for buying-power calculations.

## Files

- `risk-engine.module.ts` — NestJS module wiring (imports / providers / exports)
- `services/risk-engine.service.ts` — Central orchestrator for risk validation + admin CRUD
- `services/real-time-exposure.service.ts` — In-memory exposure tracking per account
- `services/greeks-calculator.service.ts` — Delta/gamma computation per portfolio
- `services/circuit-breaker.service.ts` — Price-limit circuit breakers
- `services/auto-liquidation.worker.ts` — Margin-triggered position liquidation (30s interval)
- `entities/risk-threshold.entity.ts` — TypeORM entity for configurable thresholds
- `tests/risk-engine.service.spec.ts` — Unit tests

## Flow diagram

```
OrderService.place()
    → RiskEngineService.validateOrder()
        → getCurrentValue(metric)
            ├── MARGIN_LEVEL  → AutoLiquidationWorker.getMarginLevel()
            ├── EXPOSURE      → RealTimeExposureService.getExposure()
            ├── POSITION_LIMIT → StrategyPositionService.getPositionsByAccount()
            ├── OPEN_ORDERS   → (placeholder)
            ├── DELTA         → GreeksCalculatorService.getPortfolioGreeks()
            └── GAMMA         → GreeksCalculatorService.getPortfolioGreeks()
        → evaluateCheck() — operator evaluation (GT/LT/GTE/LTE/EQ)
        → executeAction() — ALERT|FREEZE_ACCOUNT|LIQUIDATE_ALL|LIQUIDATE_BIGGEST|CIRCUIT_BREAKER
    → throws AppError('RISK_LIMIT_BREACH') if threshold breached
```

## Dependencies

- Internal:
  - `@obsidian/backend-accounts` — AccountsService (FREEZE_ACCOUNT), StrategyPositionService (position limits)
  - `@obsidian/backend-market` — PriceFeedService (last prices), InstrumentsService
  - `@obsidian/backend-notifications` — NotificationService (ALERT action)
  - `@obsidian/backend-risk-policy` — RiskPolicyService (pre-trade composition)
  - `@obsidian/backend-oms` — OrderEventsService (in-process pub/sub for LIQUIDATE_ALL/LIQUIDATE_BIGGEST — avoids circular dep)
  - `@obsidian/backend-shared` — AppLoggerService, OutboxModule
- External: none (no direct exchange/network calls)

## APIs

### REST

| Method | Path | Auth | Idempotent | Brief |
|---|---|---|---|---|
| POST | `/api/v1/risk/thresholds` | JWT | yes (idempotency by threshold key) | Create risk threshold |
| GET | `/api/v1/risk/thresholds` | JWT | N/A | List thresholds (tenant-scoped, paginated) |
| PATCH | `/api/v1/risk/thresholds/:id` | JWT | yes | Update threshold |
| DELETE | `/api/v1/risk/thresholds/:id` | JWT | yes | Soft-delete threshold (enabled=false) |

### GraphQL

Admin schema (adminResolver) exposes threshold CRUD under `adminRiskThresholds` query and mutations.

### WebSocket (PranaStream)

None — risk events are pushed as notifications, not streamed via WS.

## Public route list (auth bypass)

None — all endpoints require JWT authentication.

## Idempotency contract

- Threshold create/update: idempotent via unique constraint on `(tenantId, accountId, metric, operator)` — duplicate payloads return existing record.
- Order validation: idempotent via `externalRefId` on the order write (handled upstream in OmsModule).

## Domain events (outbox)

- `risk.threshold.created` — when admin creates a new threshold
- `risk.threshold.breached` — when a threshold is breached (action=ALERT|FREEZE_ACCOUNT|LIQUIDATE_*)

## Env vars

- `RISK_ENGINE_ENABLED` — default true; set false to bypass all checks (dev only)
- `AUTO_LIQUIDATION_INTERVAL_MS` — default 30000 (30s); interval between margin checks

## Tests

- Coverage target: 80% lines / 70% branches
- Integration tests use Testcontainers + PostgreSQL
- No `it.skip` / `test.skip` without a ticket reference comment

## Failure modes & runbook hooks

1. **Order rejected with RISK_LIMIT_BREACH but trader expects fill** — Check `risk.threshold.breached` outbox event log for which metric breached and the current value vs threshold. Likely margin dropped or new position opened.
2. **Auto-liquidation not firing despite margin breach** — Check `auto-liquidation.worker` interval is running (`AutoLiquidationWorker` constructor starts interval). Verify DB connectivity. Check `getMarginLevel()` returns non-zero values.
3. **Real-time exposure stale after execution** — `RealTimeExposureService` subscribes to `execution.added` events; verify `OrderEventsService` subscription was established at module init. Restart clears in-memory state.

## Change-log

| Date | Author | Summary |
|---|---|---|
| 2026-05-31 | BharatERP | Fix circular dep with OmsModule by replacing OmsModule import with direct OrderEventsService injection; break-event uses in-memory pub/sub instead of bidirectional module refs |