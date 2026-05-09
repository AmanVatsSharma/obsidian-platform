/**
 * File:        apps/public-site/tailwind.config.ts
 * Module:      public-site · Styling
 * Purpose:     Tailwind configuration for the public marketing site, wiring in the
 *              Obsidian Design System preset so all token utilities (bg-bg-base, text-bull,
 *              font-display, shadow-glow-accent, etc.) are available without re-definition.
 *
 * Exports:
 *   - default (Config)   — Tailwind config consumed by PostCSS
 *
 * Depends on:
 *   - obsidianTailwindPreset   — relative import (PostCSS cannot resolve TS path aliases)
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - Import path must be relative; TS paths like @obsidian/* fail at PostCSS time
 *   - content globs cover src/ (App Router lives under src/app/) and obsidian-ui components
 *
 * Read order:
 *   1. presets — Obsidian token mapping
 *   2. content — file globs for purging
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

import type { Config } from 'tailwindcss';
import { obsidianTailwindPreset } from '../../libs/obsidian-ui/src/tailwind/preset';

const config: Config = {
  presets: [obsidianTailwindPreset as Config],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../libs/obsidian-ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
};

export default config;
