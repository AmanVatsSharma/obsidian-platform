# Broker Workstation (ArcaFX)

Broker-facing admin console. Manages clients, KYC, finance, IB network, compliance and pricing.

**Source:** `Obsidian/Broker WorkStation/arcafx-final/arcafx/` (Next.js + `styles/admin.css`).

## Screens recreated

- `index.html` — Broker Dashboard: KPI grid, top clients table, compliance ring, KYC review queue, live audit log.

## Components demonstrated

- TopBar (logo + product sub-label, global search w/ ⌘K, notif dot, user chip)
- Sidebar sectioned nav w/ badges, operational footer indicator
- KPI cards w/ colored top-edge accents + inline sparklines
- Data table: client cells with avatar+ID, tier badges (Basic/Silver/Gold/Platinum), status tags
- Compliance "health" donut + stat rows
- KYC review list with per-item progress bar (auto-check %, incomplete, PEP escalation)
- Streaming audit log (icon + time + actor line)
- Status bar (live sessions, queue lag, build)
