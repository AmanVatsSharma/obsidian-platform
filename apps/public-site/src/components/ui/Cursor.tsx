/**
 * File:        apps/public-site/src/components/ui/Cursor.tsx
 * Module:      public-site · UI Primitives
 * Purpose:     Custom cursor controller. Moves #obs-cursor (lagging ring) and
 *              #obs-dot (instant dot) in response to mousemove. Adds shape
 *              variant classes based on what the pointer is hovering:
 *                xl    — links / buttons / inputs (large soft ring)
 *                cross — [data-price] elements (crosshair box)
 *
 * Exports:
 *   - Cursor()  — renders null; attaches global event listeners on mount
 *
 * Depends on:
 *   - none (targets DOM elements by id)
 *
 * Side-effects:
 *   - document.addEventListener: mousemove, mouseover, mouseout
 *   - requestAnimationFrame loop for ring lag
 *   - All listeners cleaned up on unmount
 *
 * Key invariants:
 *   - Hidden on touch/non-hover devices via (hover: hover) media query check
 *   - The #obs-cursor and #obs-dot elements are rendered in layout.tsx body
 *     so they are always present before this component mounts
 *   - aria-hidden is set on the cursor elements in layout.tsx — screen readers
 *     are not affected
 *
 * Read order:
 *   1. Cursor — the single exported component (returns null)
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

'use client';

import { useEffect } from 'react';

export function Cursor() {
  useEffect(() => {
    const cur = document.getElementById('obs-cursor');
    const dot = document.getElementById('obs-dot');
    if (!cur || !dot) return;

    if (!window.matchMedia('(hover: hover)').matches) {
      cur.style.display = 'none';
      dot.style.display = 'none';
      return;
    }

    let tx = -100, ty = -100, cx = -100, cy = -100;
    let raf: number;

    const onMove = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      dot.style.left = `${tx}px`;
      dot.style.top  = `${ty}px`;
    };

    const loop = () => {
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      cur.style.left = `${cx}px`;
      cur.style.top  = `${cy}px`;
      raf = requestAnimationFrame(loop);
    };

    const onOver = (e: MouseEvent) => {
      const t = e.target as Element;
      if (t.closest('[data-price]')) {
        cur.classList.add('cross');
        cur.classList.remove('xl');
      } else if (t.closest('a, button, input, select, [role="button"]')) {
        cur.classList.add('xl');
        cur.classList.remove('cross');
      }
    };

    const onOut = () => cur.classList.remove('xl', 'cross');

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout', onOut);
    raf = requestAnimationFrame(loop);

    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onOut);
      cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
