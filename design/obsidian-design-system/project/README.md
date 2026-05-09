# Obsidian Design System

**Obsidian** is a multi-product suite for FX/CFD/multi-asset trading. It powers a full vertically-integrated broker stack: a consumer trading terminal, a dealer/risk desk, a broker admin workstation (ArcaFX), an IB (Introducing Broker) partner portal, and a top-level platform owner hub.

The aesthetic is **professional-terminal dark** — Bloomberg / TradingView / ICE grade density, neutral greys, semantic bull/bear green/red, blue accent, monospaced data, uppercase display type.

## Sources

All sources are mounted via File System Access API under `Obsidian/`:

| Source | Path | Notes |
|---|---|---|
| **User Terminal** (Obsidian Trading Dashboard) | `Obsidian/User/` | Next.js 14, full CSS token system in `styles/dashboard.css`. Canonical source for tokens. |
| **Broker Workstation** (ArcaFX) | `Obsidian/Broker WorkStation/arcafx-final/arcafx/` | Full admin console — KYC, clients, IB, risk, finance, reports. `styles/admin.css`. |
| **Dealer Desk** | `Obsidian/Dealer Workstation/obsidian-desk.html` | Single-file HTML dealing workstation (RFQ, exposure, B-book). |
| **IB Portal** | `Obsidian/IB Portal/ObsidianPartners.jsx` | Partner earnings, referrals, sub-IB tree, marketing materials. |
| **Platform Owner Hub** | `Obsidian/Platform Owner/ObsidianHub.jsx` | Top-level multi-broker / multi-tenant control center. |
| **Mobile Terminal** | `Obsidian/User/mobile/` | Responsive mobile variant of the user terminal. |

## Index

- `README.md` — this file
- `SKILL.md` — Claude Skill manifest
- `colors_and_type.css` — all tokens + semantic type classes
- `preview/` — Design System tab cards (tokens, type, components)
- `assets/` — logos, placeholder images
- `ui_kits/user_terminal/` — User Terminal recreation
- `ui_kits/broker_workstation/` — ArcaFX broker admin
- `ui_kits/platform_hub/` — Platform Owner hub
- `ui_kits/ib_portal/` — IB partner portal
- `ui_kits/dealer_desk/` — Dealer/risk desk

## Products at a glance

1. **User Terminal** — retail/pro trader's screen. Watchlist, chart, DOM, order entry, positions, calendar, news.
2. **Dealer Desk** — internal risk/dealer view. RFQ queue, aggregated exposure, B-book management, hedging.
3. **Broker Workstation (ArcaFX)** — broker back-office: clients, KYC queue, IB tree, transactions, AML, compliance, pricing.
4. **IB Portal** — introducing broker earnings, referral links, sub-IB network, marketing materials.
5. **Platform Owner Hub** — parent company view of all broker tenants, infra health, billing, system-wide surveillance.

All five share one token system, one type stack, and one core component vocabulary.

---

## CONTENT FUNDAMENTALS

**Tone:** terse, professional, operator-grade. Written for people who know the domain — no hand-holding, no marketing fluff. "Margin Level", not "How much room you have left". Short fragments over full sentences in data-dense surfaces.

**Casing:**
- **ALL CAPS** for panel titles, column headers, session badges, micro-labels (tracking ~0.06em–0.1em).
- **Sentence case** for in-app copy, menu items, tooltips, toast text.
- **Title Case** rarely — only for page H1s on marketing-adjacent surfaces (IB Portal landing).

**Voice:** third-person/neutral system voice, no "I", rarely "you". "Position closed" not "We closed your position." Announcements read like wire copy: `"New instrument added: NVDA stock CFD — effective April 1"`.

**Terminology:** industry-correct. Pip, lot, SL/TP, DOM, OHLCV, bid/ask, spread (in pips), margin level, equity, free margin, drawdown, MTD/YTD, B-book/A-book, RFQ, KYC, AML. Never simplified.

**Numbers:** always monospaced. Always with `+` / `-` prefix for deltas. Always two-decimal for P&L (`+$1,240.00`). Percentages at two decimals (`+2.14%`). Symbols UPPERCASE (`EUR/USD`, `XAU/USD`, `BTC/USD`).

**Emoji:** **avoided in core product chrome**. Found sparingly in the IB Portal onboarding copy and some mobile demo cards — not load-bearing. Flag emoji used in Economic Calendar (`🇺🇸 🇪🇺 🇬🇧`). **Rule: no emoji in data tables, panels, or navigation.**

**Examples from the product:**
- Toast: `"Position closed"` / `"+$120.40 realized"`
- Panel title: `WATCHLIST`, `DEPTH OF MARKET`, `ORDER ENTRY`
- Status: `OPERATIONAL`, `DEGRADED`, `OUTAGE`
- Column header: `SYMBOL`, `BID`, `ASK`, `SPREAD`, `CHG%`
- Button: `BUY`, `SELL` (uppercase, bold), `Close`, `Edit`, `Cancel` (sentence)
- Empty state: `"No open positions"` — no cheer, no emoji.
- Announcement tag: `NEW`, `UPDATE`, `MARKETING`
- IB tier: `SILVER`, `GOLD`, `PLATINUM` (ALL CAPS)

---

## VISUAL FOUNDATIONS

**Backgrounds:** six-step greyscale stack from `#06080A` (base) up through `#1E2530` (active). Every surface is flat — no gradients on panels or cards. Gradients exist only in:
  - logo dot / avatar (blue→purple 135deg)
  - KPI card top-edge accents (1–2px gradient to transparent)
  - P&L sparkline fills (stopped rgba)
No full-bleed imagery. No hand-drawn illustration. No repeating patterns. The base is just the dark surface with a 1px border structure.

**Borders:** the primary structural language. `1px solid var(--border)` separates every panel, row, column, status bar segment. Hover promotes to `--border-hi`. This is a high-density grid-style UI — borders define the architecture more than shadows.

**Shadows:** minimal. Two patterns:
  - Panel: `0 0 0 1px border, 0 4px 24px rgba(0,0,0,0.4)` (rarely used — most panels are border-only)
  - Float (modals, toasts, drawers, tooltips): `0 0 0 1px var(--border-md), 0 8px 40px rgba(0,0,0,0.6)`
  - Semantic "glow" effects for buy/sell buttons, alerts: `0 0 20px rgba(<color>, 0.15-0.2)`.
Inner shadows are not used. Elevation is signalled by bg color bump, not shadow.

**Radii:** small and deliberate. `4px` for tags/pills/inline controls, `6px` default button/input, `8px` for cards, `12px` only for modals. Nothing rounder. Chart overlays, session badges, KPI cards — all 4-10px.

**Animation:**
- Easing: **`cubic-bezier(0.4, 0, 0.2, 1)`** everywhere (Material ease). 120–300ms.
- Fades: `skeleton-sweep` shimmer (1.5s), `pulse-dot` (2s), `blink` (1.5s) for live/active indicators.
- No bounce. No spring. No overshoot. Trading UI is calm.
- `slide-up` (6px translate + opacity, 250ms) for toasts, modals, row appearance.
- Flash animations on live price ticks: `flash-bull` / `flash-bear` 500ms ease-out background pulse.

**Hover states:** background `--bg-hover` bump + `border` → `border-hi`. Icon buttons swap `--text-secondary` → `--text-primary`. Link text never underlines on hover inside the product; `href` links outside data rows underline.

**Press states:** `--bg-active` background + tint. No scale transform — trading ops never move under the cursor.

**Transparency & blur:** reserved for three cases:
  1. **Chart OHLC overlay:** `rgba(6,8,10,0.85) + backdrop-filter: blur(8px)` over the TradingView canvas.
  2. **Modal overlay:** `rgba(0,0,0,0.75) + backdrop-filter: blur(4px)`.
  3. **Tinted row backgrounds** (bull/bear/accent/warn) at ~8–12% alpha (`--bull-dim` etc.) for state indication without competing with data.

**Semantic color vibe:**
- `--bull #10D996` — electric mint-green, slightly saturated for confidence
- `--bear #FF3B5C` — hot pink-red (not crimson) — pops on dark
- `--accent #3B82F6` — classic Tailwind blue
- `--warn #F59E0B` — amber
- `--purple #A855F7` — used sparingly for tier badges and logo gradients
All semantic colors have three variants: solid (text, borders), `-dim` (backgrounds, ~10%), `-glow` (shadows, ~20%).

**Imagery vibe:** there are no full-bleed photos. Avatars are gradient-filled initials squares (`linear-gradient(135deg, var(--accent), #6366F1)` → purple). Flag emoji for economic calendar only. Charts are the only "imagery" — candlesticks with matching `bull`/`bear` fills and translucent volume histogram.

**Cards:** `background: var(--bg-panel) or var(--bg-1); border: 1px solid var(--border); border-radius: var(--r-lg)` (8px). No shadow on standard cards. KPI cards get a 2px colored top-edge gradient accent for category tinting.

**Layout rules:**
- Fixed top bar 52px, fixed status bar 24px, scroll in the middle.
- Sidebars: 220px primary nav, 220–260px context/watchlist, collapsible to 40–56px icon rail.
- Grid-first. Content is data tables, KPI grids, chart rows.
- Breakpoints: 1024 → 768 → 480. Mobile stacks panels vertically; collapses nav.
- Density: 32px button height, 36px table header, 28–32px table row, 52px top bar. This is a pro-tool density — denser than web norm.

**Scrollbars:** custom, 4px wide, thumb `--border-md`, track transparent. Present everywhere.

**Tables:** sticky headers, uppercase `10px` header, `12px` cell text, `tnum` numerals, 1px border between rows, full-row hover tint. Right-aligned for numbers, left-aligned for text.

**Forms / Inputs:** `bg-elevated` fill, 1px border, `r-md` radius, focus ring is `border-color → accent + 3px outer glow via box-shadow rgba(accent, 0.15)`.

---

## ICONOGRAPHY

**Primary icon set:** [Lucide](https://lucide.dev) React — used pervasively across every JSX surface. Imported directly: `import { Search, Bell, TrendingUp, ... } from 'lucide-react'`. Stroke-based line icons at `14–16px`, default `strokeWidth: 2`. Weight: clean / linear / uniform.

**Canonical icons in use (from the codebase):**
- Navigation: `Search`, `Bell`, `Settings`, `ChevronDown`, `ChevronUp`, `X`, `Plus`, `Minus`, `RefreshCw`, `MoreHorizontal`
- Trading: `TrendingUp`, `TrendingDown`, `ArrowUpRight`, `ArrowDownRight`, `BarChart2`, `CandlestickChart`, `LineChart`, `AreaChart`, `Activity`, `Layers`
- Finance: `DollarSign`, `Shield`, `Zap`, `Database`, `Wifi`
- Editorial: `BookOpen`, `Newspaper`, `Calendar`, `Clock`
- Actions: `Copy`, `Edit`, `Trash2`, `Eye`, `Maximize2`, `Minimize2`, `LogOut`, `User`, `AlertCircle`, `SlidersHorizontal`

**CDN for HTML surfaces:** load Lucide via `<script src="https://unpkg.com/lucide@latest"></script>` + `lucide.createIcons()`, or use the individual SVG strings from `https://lucide.dev`.

**Emoji:** not used as UI icons. Two exceptions:
  1. Economic calendar country flags (`🇺🇸 🇪🇺 🇬🇧 🇯🇵 🇨🇳`).
  2. A few decorative emoji in the IB Portal marketing/onboarding mock data (`🚀 💱 🥇 📈 ₿`). These are dataset, not system — avoid replicating.

**Custom glyphs:** the Obsidian logo itself is an **8px solid blue dot** with a blue glow (pulsing 2s), placed next to the wordmark in Syne Extra-Bold, all-caps, tracked 0.04–0.15em. That pulsing dot is the signature mark. A secondary logo lockup uses a 28px gradient square (blue→purple, 135deg) with a monogram or icon inside — used for sidebar logos and avatars.

**Brand logos stored in `assets/`:** SVG wordmark + dot-mark + gradient-square lockup.

---

## Font substitutions

All three primary fonts are Google Fonts and load from `fonts.googleapis.com` throughout the codebase — **no custom `.ttf` files needed to redistribute**. We link Google Fonts directly in `colors_and_type.css`. If you need to bundle them locally, download:
- [Syne](https://fonts.google.com/specimen/Syne) — 400, 500, 600, 700, 800
- [IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono) — 300, 400, 500, 600, 700
- [DM Sans](https://fonts.google.com/specimen/DM+Sans) — 300, 400, 500, 600, 700

No substitutions flagged.
