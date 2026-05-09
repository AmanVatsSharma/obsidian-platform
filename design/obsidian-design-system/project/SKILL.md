---
name: obsidian-design
description: Use this skill to generate well-branded interfaces and assets for Obsidian, a multi-product suite for FX/CFD/multi-asset trading (User Terminal, Dealer Desk, Broker Workstation, IB Portal, Platform Hub). Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.
If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.
If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick facts
- **Tokens:** `colors_and_type.css` (CSS vars + semantic classes)
- **Fonts:** Syne (display/UPPERCASE), DM Sans (UI), IBM Plex Mono (data) — all Google Fonts
- **Palette:** dark-first. `--bg-base #06080A`. Bull `#10D996`, Bear `#FF3B5C`, Accent blue `#3B82F6`, Warn `#F59E0B`.
- **Icons:** Lucide (stroke 2, 14–16px). No emoji in product chrome.
- **Feel:** Bloomberg-grade terminal density. Borders over shadows. Flat panels. Mono numerals. UPPERCASE labels.
- **UI Kits:** `ui_kits/user_terminal`, `ui_kits/broker_workstation`, `ui_kits/platform_hub`, `ui_kits/ib_portal`, `ui_kits/dealer_desk`.
