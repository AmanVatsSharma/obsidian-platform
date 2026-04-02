# `apps/web` layout (no `src/` — Next project root)

- `app/` — Next.js App Router: routes, layouts, colocated route CSS only where needed.
- `features/<name>/` — Vertical slices (UI + feature `lib/`). Import other features only via their **public `index.ts`** or through `shared`.
- `shared/` — Cross-cutting app code (e.g. providers) used by multiple features. Do not import feature code from here.

**Dependency direction:** `app` → `features` → `shared` → `libs` (`@nesttrade/*`). Avoid `features` → `features` unless mediated by `shared` or an explicit integration module.

Path aliases: `@/features/*`, `@/shared/*` (see `tsconfig.json`).

If you change where `app/` lives, delete `apps/web/.next` before the next build so generated types do not point at stale paths.

See also [LEGACY.md](./LEGACY.md) for the archived Obsidian reference under `legacy/`.
