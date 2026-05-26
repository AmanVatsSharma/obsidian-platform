# Obsidian Broker Admin — Demo Snapshot v1

**Snapshotted:** 2026-05-09  
**Status:** Production-ready baseline — 35 modules, 36 routes, Obsidian dark terminal UI

This is a self-contained copy of the broker-admin app at the time of the demo snapshot.
It runs independently of the Nx monorepo.

---

## Start (dev server)

```bash
cd demos/broker-admin-v1
npm install        # first time only
npm run dev        # http://localhost:4500
```

## Start (static, zero install)

The pre-built static export is in `../broker-admin-static/`.

```bash
npx serve ../broker-admin-static
# opens at http://localhost:3000
```

Or use the root launcher:

```bash
bash demos/run-demo.sh
```

---

## What's in this build

| Area | Coverage |
|---|---|
| Dashboard | KPIs, P&L chart, recent orders |
| Clients | List, detail, KYC status |
| Accounts | Trading accounts, fund history |
| Orders | Full order book, filters |
| Positions | Live position table |
| Risk | Exposure limits, VaR |
| Compliance | AML, regulatory reports |
| Broker Hierarchy | IB tree, branches, dealers |
| Reports | P&L, trade, commission exports |
| Settings | Brand, users, permissions, API keys |
| ... | 35 modules total |

---

## Dependency note

`@obsidian/obsidian-ui` is inlined at `./libs/obsidian-ui/` — no monorepo needed.
