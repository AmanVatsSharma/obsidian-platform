/**
 * @file tailwind.config.ts
 * @module web
 * @description Tailwind + Obsidian UI preset for apps/web
 * @author BharatERP
 * @created 2026-04-03
 */

import type { Config } from 'tailwindcss';

import { obsidianTailwindPreset } from '../../libs/obsidian-ui/src/tailwind/preset';

const config: Config = {
  presets: [obsidianTailwindPreset as Config],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
    './shared/**/*.{js,ts,jsx,tsx,mdx}',
    '../../libs/obsidian-ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
};

export default config;
