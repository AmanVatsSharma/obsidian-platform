/**
 * File:        apps/public-site/src/components/sections/Nav.tsx
 * Module:      public-site · Sections
 * Purpose:     Sticky navigation bar with scroll-blur backdrop, desktop link row,
 *              and mobile slide-in drawer. Anchor links scroll to section ids.
 *
 * Exports:
 *   - Nav()  — fixed-position navigation component
 *
 * Depends on:
 *   - @/lib/data  — NAV_LINKS
 *
 * Side-effects:
 *   - window.addEventListener: scroll (passive), resize (passive)
 *   - document.body.classList.toggle('no-scroll', open) — prevents background scroll when drawer is open
 *
 * Key invariants:
 *   - All links scroll smoothly to anchor ids via Element.scrollIntoView
 *   - Mobile drawer transition delay (400ms) lets the drawer close before scrolling
 *   - cursor: none enforced via CSS classes (.btn-p, .btn-g, .ham, .nav-link)
 *
 * Read order:
 *   1. NAV_LINKS — the link data
 *   2. Nav — scroll state + mobile logic
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

'use client';

import { useEffect, useState } from 'react';
import { NAV_LINKS } from '@/lib/data';

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen]         = useState(false);
  const [isMob, setIsMob]       = useState(false);

  useEffect(() => {
    setIsMob(window.innerWidth < 1024);
    const onScroll = () => setScrolled(window.scrollY > 80);
    const onResize = () => setIsMob(window.innerWidth < 1024);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('no-scroll', open);
    return () => { document.body.classList.remove('no-scroll'); };
  }, [open]);

  const go = (href: string) => {
    setOpen(false);
    if (href.startsWith('#')) {
      const delay = open ? 400 : 0;
      setTimeout(() => {
        const el = document.querySelector(href);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, delay);
    }
  };

  return (
    <>
      <nav
        className={`main-nav${scrolled ? ' scrolled' : ''}`}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 500,
          height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 32px',
          transition: 'background .3s ease, border-color .3s ease, backdrop-filter .3s ease',
        }}
      >
        {/* Logo */}
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="logo-dot" />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--fg1)', letterSpacing: '-.01em' }}>
            OBSIDIAN
          </span>
        </a>

        {/* Desktop links */}
        {!isMob && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            {NAV_LINKS.map((link) => (
              <button key={link.l} onClick={() => go(link.h)} className="nav-link">
                {link.l}
              </button>
            ))}
          </div>
        )}

        {/* Desktop CTAs / Mobile hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!isMob && (
            <>
              <button className="btn-g" style={{ padding: '8px 18px' }}>Request Demo</button>
              <button className="btn-p" style={{ padding: '8px 20px' }}>
                Get Started <span className="arr">→</span>
              </button>
            </>
          )}
          {isMob && (
            <button onClick={() => setOpen((o) => !o)} className={`ham${open ? ' open' : ''}`}>
              <span /><span /><span />
            </button>
          )}
        </div>
      </nav>

      {/* Mobile drawer */}
      <div className={`mob-menu${open ? ' open' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', height: 64, borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="logo-dot" />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--fg1)' }}>OBSIDIAN</span>
          </div>
          <button onClick={() => setOpen(false)} className="ham open"><span /><span /><span /></button>
        </div>

        <div style={{ padding: '32px 24px', flex: 1 }}>
          {NAV_LINKS.map((link) => (
            <button
              key={link.l}
              onClick={() => go(link.h)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                fontSize: 26, fontWeight: 700, color: 'var(--fg1)',
                fontFamily: 'var(--font-display)',
                background: 'transparent', border: 'none',
                borderBottom: '1px solid var(--border)', padding: '14px 0',
                cursor: 'none', letterSpacing: '-.02em',
              }}
            >
              {link.l}
            </button>
          ))}
        </div>

        <div style={{ padding: '0 24px 40px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button className="btn-p" style={{ padding: 14, fontSize: 15, justifyContent: 'center' }}>
            Get Started <span className="arr">→</span>
          </button>
          <button className="btn-g" style={{ padding: 14, fontSize: 15, justifyContent: 'center' }}>
            Request Demo
          </button>
        </div>
      </div>
    </>
  );
}
