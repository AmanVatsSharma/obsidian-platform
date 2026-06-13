# Production Readiness Tracker

Generated: 2026-06-13. 5-audit sweep identified 17 BLOCKERs.

## BLOCKERs — fix in this order

### Track A — Security (5 BLOCKERs)
- [ ] A1. CORS `origin:true,credentials:true` → allowlist via env
- [ ] A2. `/auth/dev/login` in prod path → compile-time guard
- [ ] A3. `platform123` hard-coded in client → remove
- [ ] A4. `AuditService` `'dev-audit-secret'` literal fallback → Zod-validated required
- [ ] A5. `OTP_DEV_MODE` OR `!==production` → require `===development && ===true`

### Track B — Backend bootstrap (4 BLOCKERs)
- [ ] B1. Swagger default-on → off by default
- [ ] B2. `ValidationPipe transform:true` → `transformOptions.enableImplicitConversion:true`
- [ ] B3. GraphQL `AppError` not mapped → Apollo `formatError` plugin
- [ ] B4. `OutboxEntity` missing `app_name` → add column + index

### Track C — Realtime completion (3 BLOCKERs)
- [ ] C1. Domain services bypass outbox → refactor 5 services
- [ ] C2. 0 UI consumers for 10 PranaStream hooks → build consumers
- [ ] C3. No producer for `orderbook.depth` / `margin.breach` → add

### Track D — Frontend mock removal (5 BLOCKERs)
- [ ] D1. Chart panel `setInterval`+`Math.random` → `useWatchlistTicks` + REST candles
- [ ] D2. DOM panel `setInterval`+`Math.random` → `useOrderbookDepth`
- [ ] D3. /portfolio, /orders, /funds mock data → real GraphQL
- [ ] D4. 16 broker-admin pages have no backend wiring → remove or implement
- [ ] D5. Kite OAuth `DEMO_MODE=true` constant → real OAuth
