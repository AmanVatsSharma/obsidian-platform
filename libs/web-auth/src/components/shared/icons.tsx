/**
 * File:        libs/web-auth/src/components/shared/icons.tsx
 * Module:      web-auth · Auth Icons
 * Purpose:     Inline SVG icon set for Obsidian auth screens. Self-contained — no icon font dependency.
 *
 * Exports:
 *   - AuthIcons  — object with all icon JSX elements (google, apple, microsoft, passkey,
 *                  wallet, phone, mail, lock, check, shield, arrowRight, arrowLeft, user,
 *                  camera, upload, info)
 *
 * Side-effects: none
 * Key invariants: All SVGs use currentColor — color is controlled by the parent element's CSS color.
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

import React from 'react';

const s = (d: string, vb = '0 0 16 16') => (
  <svg width="16" height="16" viewBox={vb} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

export const AuthIcons = {
  google: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M15.545 6.558a9.42 9.42 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885-1.344 1.24-3.14 1.931-5.3 1.931A8 8 0 0 1 0 8a8 8 0 0 1 8-8c2.159 0 3.978.802 5.367 2.11L11.28 4.197C10.325 3.313 9.289 2.82 8 2.82c-2.923 0-5.18 2.28-5.18 5.18 0 2.9 2.257 5.18 5.18 5.18 2.398 0 4.04-1.24 4.688-3.22H8V6.558h7.545Z" fill="currentColor"/>
    </svg>
  ),
  apple: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M11.182.008C11.148-.03 9.923.022 8.857 1.18c-1.066 1.156-.902 2.482-.878 2.516.024.034 1.52.087 2.475-1.258.955-1.345.762-2.391.728-2.43ZM7.49 3.932C6.256 3.932 5.453 4.71 4.78 4.71c-.698 0-1.678-.78-2.69-.78-1.5 0-3.09 1.23-3.09 3.53C-1 10.265.955 14 2.476 14c.84 0 1.524-.575 2.535-.575 1.01 0 1.497.575 2.5.575 1.476 0 3.195-3.73 3.195-6.39 0-2.487-2.216-3.678-3.217-3.678Z" fill="currentColor"/>
    </svg>
  ),
  microsoft: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="6.5" height="6.5" fill="#f25022"/>
      <rect x="8.5" y="1" width="6.5" height="6.5" fill="#7fba00"/>
      <rect x="1" y="8.5" width="6.5" height="6.5" fill="#00a4ef"/>
      <rect x="8.5" y="8.5" width="6.5" height="6.5" fill="#ffb900"/>
    </svg>
  ),
  passkey: s('M12 10v2m-8-2v2M8 6v2m-5 4h10a1 1 0 0 0 1-1V9a5 5 0 0 0-10 0v2a1 1 0 0 0 1 1ZM8 3a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z'),
  wallet: s('M2 4h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1ZM1 7h14M11 10.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1Z'),
  phone: s('M3 2h2.586a1 1 0 0 1 .707.293l1.414 1.414a1 1 0 0 1 0 1.414L6.5 6.5a9 9 0 0 0 3 3l1.379-1.207a1 1 0 0 1 1.414 0l1.414 1.414a1 1 0 0 1 .293.707V13a1 1 0 0 1-1 1C5.716 14 2 10.284 2 5.5A2.5 2.5 0 0 1 3 2Z'),
  mail: s('M1 4h14v9a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4Zm0 0 7 5 7-5'),
  lock: s('M4 7V5a4 4 0 0 1 8 0v2M2 7h12a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Zm6 3v2'),
  check: s('M2 8l4 4 8-8'),
  shield: s('M8 1l6 3v4c0 3.5-2.5 6-6 7-3.5-1-6-3.5-6-7V4l6-3Z'),
  arrowRight: s('M3 8h10m-4-4 4 4-4 4'),
  arrowLeft: s('M13 8H3m4-4L3 8l4 4'),
  user: s('M8 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5 8a5 5 0 0 1 10 0'),
  camera: s('M2 5h2l1.5-2h5L12 5h2a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm6 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z'),
  upload: s('M8 1v9m-4-4 4-4 4 4M1 14h14'),
  info: s('M8 7v5m0-8v.5'),
};
