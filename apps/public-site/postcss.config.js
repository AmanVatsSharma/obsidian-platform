/**
 * File:        apps/public-site/postcss.config.js
 * Module:      public-site · Styling
 * Purpose:     PostCSS pipeline — runs Tailwind and autoprefixer on every CSS file.
 *
 * Exports:
 *   - module.exports (PostCSS config object)
 *
 * Depends on:
 *   - none (plugins resolved by Next.js PostCSS loader)
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - Must be CJS (not ESM) — Next.js PostCSS loader requires CommonJS
 *
 * Read order:
 *   1. plugins — order matters: tailwindcss runs first, autoprefixer last
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
