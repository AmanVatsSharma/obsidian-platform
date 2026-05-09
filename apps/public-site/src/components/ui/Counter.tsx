/**
 * File:        apps/public-site/src/components/ui/Counter.tsx
 * Module:      public-site · UI Primitives
 * Purpose:     Animated number counter that fires once when the element enters
 *              the viewport. Uses easeOutExpo for a snappy deceleration feel
 *              consistent with the Obsidian easing token.
 *
 * Exports:
 *   - Counter({ val, pre, suf, dec, comma, dur, sz, cls })
 *     Renders a <span> that counts from 0 → val on scroll-into-view.
 *
 * Depends on:
 *   - none
 *
 * Side-effects:
 *   - requestAnimationFrame loop during the count animation (self-cancels)
 *   - IntersectionObserver per instance (disconnects on unmount)
 *
 * Key invariants:
 *   - Animation fires only once per mount (observer disconnects after first intersect)
 *   - `comma` and `dec` are mutually exclusive by convention — use comma for integers,
 *     dec for decimals (both together would produce "124,847.00" which is intentional if needed)
 *
 * Read order:
 *   1. easeOutExpo — the easing function
 *   2. Counter — main component
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

'use client';

import { useEffect, useRef, useState } from 'react';

function easeOutExpo(t: number): number {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

interface CounterProps {
  val: number;
  pre?: string;
  suf?: string;
  dec?: number;
  comma?: boolean;
  dur?: number;
  sz?: string;
  cls?: string;
}

export function Counter({ val, pre = '', suf = '', dec = 0, comma = false, dur = 2200, sz = '48px', cls = '' }: CounterProps) {
  const [disp, setDisp] = useState(pre + (comma ? '0' : dec > 0 ? '0.00' : '0') + suf);
  const ref = useRef<HTMLSpanElement>(null);

  const fmt = (n: number) => {
    const s = comma
      ? Math.round(n).toLocaleString('en-US')
      : dec > 0
        ? n.toFixed(dec)
        : String(Math.round(n));
    return pre + s + suf;
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        observer.unobserve(el);

        const t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - t0) / dur, 1);
          setDisp(fmt(easeOutExpo(p) * val));
          if (p < 1) requestAnimationFrame(tick);
          else setDisp(fmt(val));
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [val]);

  return (
    <span
      ref={ref}
      className={`stat-num ${cls}`}
      style={{ fontSize: sz, fontVariantNumeric: 'tabular-nums', fontFamily: 'var(--font-data)' }}
      data-price
    >
      {disp}
    </span>
  );
}
