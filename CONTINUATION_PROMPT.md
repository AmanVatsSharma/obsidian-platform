# Continuation Prompt — Kite + PranaStream Integration

## 📋 Context Summary

You are continuing work on the **Obsidian Platform** — an Nx 21 monorepo for a multi-tenant trading platform (NestJS backend + 9 frontends + design system).

**Current branch:** `main` — clean, pushed to origin.

---

## 🎯 Task: Wire Kite live data through PranaStream to traders

### What Was Built

**1. Kite Data Providers** (`apps/backend/src/modules/market/providers/kite/`)
- `kite-data-provider.adapter.ts` — REST quotes via Kite API
- `kite-websocket.service.ts` — Live WebSocket streaming (push-based ticks)
- `kite-credential-scheduler.service.ts` — Cron jobs (health check @5min, token expiry @8:55am IST, weekly sync)

**2. Kite Execution** (data-only, NOT execution) (`apps/backend/src/modules/execution-gateway/connectors/kite/`)
- `kite-execution.connector.ts` — Exists but not wired (Kite is data-only per latest refactor)

**3. Segment Access** (`apps/backend/src/modules/market/`)
- `services/segment-access.service.ts` — Per-user segment grants (EQ/FNO/COM/CDS)
- `entities/user-segment-access.entity.ts` — Entity with limits (maxOrderValue, maxDailyTrades)
- `controllers/segment-access.controller.ts` — Admin API endpoints

**4. PranaStream Adapter** (`apps/backend/src/modules/realtime/prana-stream/adapters/`)
- `kite-market-data.adapter.ts` — NEW: Implements `MarketDataProvider` interface, delegates to `KiteWebSocketService` for ticks, routes through PranaStream to traders

**5. Broker Admin UI** (`apps/broker-admin/src/app/(admin)/`)
- `kite-login/page.tsx` — 3-step OAuth flow (API key → request token → PIN)
- `segment-access/page.tsx` — Grant segments to users with limits
- `instruments/page.tsx` — Already has provider filtering (shows KITE)
- `market-providers/page.tsx` — Already shows Kite status

---

## 🔧 What Needs to Be Done

### Priority 1: Fix Integration Issues

**1.1 KiteMarketDataAdapter Type Errors**

The adapter references `KiteWebSocketService` but may have type mismatches:

```
File: apps/backend/src/modules/realtime/prana-stream/adapters/kite-market-data.adapter.ts
Issues to fix:
- subscribe() method expects number[] tokens, not string[] (exchange:symbol)
- onTicks$() returns KiteTick[], need to map to Tick[]
```

**1.2 Make Kite the Active Provider**

The `PranaStreamModule` now has `KiteMarketDataAdapter` but it's not the primary. Need to:
- Configure as primary in `CompositeMarketDataAdapter` or set env `MARKET_DATA_PROVIDER=kite`
- Or add to adapter priority list

### Priority 2: Connect WebSocket to Traders

**2.1 Client-Side Subscription**

The web app (`apps/web/`) needs to connect to PranaStream WebSocket:

```
Flow: Trader terminal → PranaStream WS → KiteMarketDataAdapter → KiteWebSocketService → Kite WS
```

Check: `apps/web/features/trading-terminal/lib/workstation-api.ts` or create a hook `useMarketData()`

**2.2 Set Default Provider**

In `apps/backend/src/modules/realtime/prana-stream/prana-stream.module.ts`:
```typescript
// Set Kite as primary adapter
MainMarketDataAdapter → change to KiteMarketDataAdapter
// OR set env: MARKET_DATA_PROVIDER=kite
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `apps/backend/src/modules/market/providers/kite/kite-websocket.service.ts` | Live Kite WS |
| `apps/backend/src/modules/realtime/prana-stream/adapters/kite-market-data.adapter.ts` | PranaStream adapter |
| `apps/backend/src/modules/realtime/prana-stream/prana-stream.module.ts` | Module registration |
| `apps/backend/src/modules/realtime/prana-stream/gateway/prana-stream.gateway.ts` | WebSocket gateway |
| `apps/backend/src/modules/market/services/segment-access.service.ts` | User segment config |
| `apps/broker-admin/src/app/(admin)/kite-login/page.tsx` | Admin Kite OAuth |

---

## 🧪 How to Test

**Manual Integration Test:**

1. Start backend: `npm run dev:backend`
2. Configure Kite credentials in admin UI (or via env)
3. Subscribe to symbols via PranaStream WebSocket
4. Verify live ticks flow: WebSocket → Adapter → Client

**Backend test:**
```bash
# Check Kite connection
curl -X POST http://localhost:3000/market/quotes/subscribe \
  -H "Content-Type: application/json" \
  -d '{"symbols": [{"exchange": "NSE", "symbol": "RELIANCE"}]}'

# Or SSE stream
curl -N http://localhost:3000/market/quotes/stream \
  -H "Authorization: Bearer <token>"
```

---

## 📖 Documentation

- `CLAUDE.md` — Project context (read top-to-bottom)
- `apps/backend/src/modules/market/MODULE_DOC.md` — Market module contract
- `apps/backend/src/modules/realtime/prana-stream/MODULE_DOC.md` — PranaStream docs

---

## ⚠️ Gotchas

1. **Kite token expiry** — Tokens expire at midnight IST. Admin must re-login daily.
2. **WebSocket limits** — Max 3000 instruments per Kite WebSocket.
3. **Provider priority** — Make sure Kite is the primary, not fallback.
4. **Segment access** — Users need explicit grants; admin has full access.

---

## ✅ Definition of Done

- [ ] Kite connected → live ticks appear in PranaStream
- [ ] Trader terminal receives live prices
- [ ] Segment access API works (grant/revoke limits)
- [ ] Admin can see Kite status in market-providers page
- [ ] Build passes (`npm run build:backend`)

---

## 🚀 Next Steps After This

1. **Wire web app** — Connect PranaStream WebSocket in `apps/web`
2. **Add price display** — Show live LTP in trading-terminal
3. **B-book execution** — Route orders through your internal execution (since Kite is data-only)
4. **Margin calc** — Use live prices for margin/buying power