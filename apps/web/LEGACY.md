# Web app `legacy/` folder

The directory `apps/web/legacy` is a **reference implementation** of the Obsidian trading terminal (Next 14, Pages Router, client-side mock data). It is kept **intentionally** so designers and developers can run and compare the original UX.

The production-facing **App Router** app at `apps/web/app` ports that experience to `/workstation` and `/m/workstation` (implementation in `features/trading-terminal/`) without deleting `legacy/`. See [STRUCTURE.md](./STRUCTURE.md) for app layout rules.

- Canonical legacy sources: `legacy/pages/index.jsx`, `legacy/mobile/mobile-index.jsx`, `legacy/lib/mockData.js`.
- Nested `legacy/mobile/obsidian-trading-dashboard-v2/` is an older snapshot; prefer the paths above.

To run legacy standalone (optional): `cd apps/web/legacy && npm install && npm run dev`.

Nx excludes `apps/web/legacy` from the project graph via [`.nxignore`](../../.nxignore) so the main monorepo `nx run web:*` targets stay valid.
