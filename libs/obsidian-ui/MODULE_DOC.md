# Obsidian UI (`@obsidian/obsidian-ui`)

Enterprise design system for Obsidian web surfaces: **semantic tokens**, **Tailwind preset**, **Radix** primitives, and **layout** shells.

## Consumption (Next.js app)

1. **Dependencies:** `tailwindcss`, `postcss`, `autoprefixer`, React 19 (root workspace already aligns).
2. **Config:**
   - `tailwind.config.ts` — import preset via **relative path** (Node loads config outside TS path aliases), e.g. `../../libs/obsidian-ui/src/tailwind/preset`; **`content`** must include the obsidian-ui `src` tree.
   - `postcss.config.js` — `tailwindcss`, `autoprefixer`.
   - `next.config.js` — `transpilePackages: ['@obsidian/obsidian-ui']`.
3. **Styles:** Import tokens + base once — in global CSS:

   ```css
   @import '../../../libs/obsidian-ui/src/styles/obsidian-ui.css';
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

   (Adjust relative path from `app/global.css`.)

4. **Provider:** Wrap the app with `<ObsidianProvider>` (see `apps/web/app/layout.tsx`).

## Public API

- **Server-safe:** `Card*`, `AppShell`, `PageHeader`, `ContentFrame`, `buildSectionTitle`, `UiNavItem`, `ShellConfig`, `obsidianTailwindPreset`, `cn`.
- **Client (`use client`):** `Button`, `Input`, `ObsidianDialog`, `ObsidianTooltip`, `ObsidianProvider`, `useObsidian`.

Subpath aliases (see root `tsconfig.base.json`): `styles.css`, `tailwind-preset`, `tokens/semantic.json`.

## Governance

- **SemVer:** treat prop/export removals as breaking; document in Change-log below.
- **No deep imports** — use package exports / path aliases only.
- **Rollout flags** live in **apps**, not inside this library.

## Change-log

| Date (IST) | Summary |
|------------|---------|
| 2026-04-03 | Initial library: tokens, Tailwind preset, ObsidianProvider, Button/Input/Card/Dialog/Tooltip, AppShell/PageHeader/ContentFrame, semantic JSON for future Style Dictionary, jest-axe smoke. |

## References

- [Style Dictionary phase 2](../../../docs/obsidian-ui/STYLE_DICTIONARY.md)
