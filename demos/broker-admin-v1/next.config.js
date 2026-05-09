/**
 * File:        demos/broker-admin-v1/next.config.js
 * Module:      broker-admin-demo-v1 · Build Config
 * Purpose:     Standalone Next.js config (no Nx). obsidian-ui is inlined at ./libs/obsidian-ui.
 *              STATIC_EXPORT=true switches to static output mode for serving via npx serve.
 *
 * Usage:
 *   npm run dev     — dev server on http://localhost:4500
 *   npm run export  — static HTML/CSS/JS to ./out/
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-09
 */

// @ts-check
const isStaticExport = process.env.STATIC_EXPORT === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(isStaticExport
    ? {
        output: 'export',
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
};

module.exports = nextConfig;
