/**
 * File:        apps/public-site/src/components/ui/RevealDiv.tsx
 * Module:      public-site · UI Primitives
 * Purpose:     IntersectionObserver wrapper that adds the CSS class "on" to its
 *              child div when the element enters the viewport, triggering the
 *              .rev reveal animation defined in global.css.
 *
 * Exports:
 *   - RevealDiv({ children, delay, threshold, className, style })
 *     Renders a <div class="rev ..."> that animates in on scroll.
 *
 * Depends on:
 *   - none (uses browser IntersectionObserver)
 *
 * Side-effects:
 *   - Attaches an IntersectionObserver per instance; disconnects on unmount
 *
 * Key invariants:
 *   - Once "on" is added it is never removed — one-shot reveal
 *   - rootMargin "-50px" prevents firing before the element is meaningfully visible
 *
 * Read order:
 *   1. RevealDiv — the single exported component
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

'use client';

import { useEffect, useRef } from 'react';

interface RevealDivProps {
  children: React.ReactNode;
  delay?: number;
  threshold?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function RevealDiv({ children, delay = 0, threshold = 0.13, className = '', style }: RevealDivProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setTimeout(() => el.classList.add('on'), delay);
          observer.unobserve(el);
        }
      },
      { threshold, rootMargin: '0px 0px -50px 0px' },
    );

    el.classList.add('rev');
    observer.observe(el);

    return () => observer.disconnect();
  }, [delay, threshold]);

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
