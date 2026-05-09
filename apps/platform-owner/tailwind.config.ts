/**
 * File:        apps/platform-owner/tailwind.config.ts
 * Module:      platform-owner · Build Config
 * Purpose:     Tailwind + Obsidian UI preset for apps/platform-owner
 *
 * Exports:
 *   - default (Config) — Tailwind configuration
 *
 * Depends on:
 *   - ../../libs/obsidian-ui/src/tailwind/preset — relative import (PostCSS can't resolve TS paths)
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - Relative import for preset (PostCSS doesn't resolve TS path aliases)
 *   - Content paths cover src/app, features, shared, and obsidian-ui lib
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

import type { Config } from 'tailwindcss';

import { obsidianTailwindPreset } from '../../libs/obsidian-ui/src/tailwind/preset';

const config: Config = {
  presets: [obsidianTailwindPreset as Config],
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/shared/**/*.{js,ts,jsx,tsx,mdx}',
    '../../libs/obsidian-ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        ui: ['var(--font-ui)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
};

export default config;
