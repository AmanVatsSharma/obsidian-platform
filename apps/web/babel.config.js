/**
 * File:        apps/web/babel.config.js
 * Module:      web · Babel Configuration
 * Purpose:     Babel configuration for Jest testing (minimal for TSX transformation)
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-07
 */

module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
    ['@babel/preset-typescript', { onlyRemoveTypeImports: true }],
  ],
};