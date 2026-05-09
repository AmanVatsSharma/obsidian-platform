/**
 * File:        apps/public-site/src/components/sections/Footer.tsx
 * Module:      public-site · Sections
 * Purpose:     Site footer — product links, legal links, social icons,
 *              and the Obsidian brand watermark.
 *
 * Exports:
 *   - Footer()  — server component (no 'use client')
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - Server component — zero client JS
 *   - External links open in new tab with rel="noopener noreferrer"
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

const FOOTER_LINKS = {
  Platform: ['Web Terminal', 'Mobile App', 'Desktop Pro', 'Dealer Workstation', 'Broker Admin', 'IB Portal', 'Copy Trading'],
  Company:  ['About', 'Blog', 'Careers', 'Press', 'Contact'],
  Legal:    ['Terms of Service', 'Privacy Policy', 'Cookie Policy', 'SLA'],
  Support:  ['Documentation', 'API Reference', 'Status Page', 'Community'],
};

const SOCIAL = [
  { l: 'X',       h: '#' },
  { l: 'LinkedIn',h: '#' },
  { l: 'GitHub',  h: '#' },
  { l: 'YouTube', h: '#' },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)', padding: '72px 0 40px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>

        {/* Top — brand + links */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(4, auto)', gap: 48, marginBottom: 64 }} className="foot-grid">
          {/* Brand */}
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--fg1)', letterSpacing: '-.02em', marginBottom: 12 }}>
              Obsidian
            </div>
            <p style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--fg3)', lineHeight: 1.65, maxWidth: 220, marginBottom: 20 }}>
              The full-stack trading platform for brokers who want to compete on product, not infrastructure.
            </p>
            <div style={{ display: 'flex', gap: 16 }}>
              {SOCIAL.map((s) => (
                <a
                  key={s.l}
                  href={s.h}
                  rel="noopener noreferrer"
                  style={{
                    fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--fg3)',
                    textDecoration: 'none', letterSpacing: '.04em',
                    transition: 'color .15s',
                  }}
                >{s.l}</a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([col, links]) => (
            <div key={col}>
              <div style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--fg3)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 16 }}>{col}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {links.map((l) => (
                  <a key={l} href="#" style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--fg2)', textDecoration: 'none', transition: 'color .15s' }}>{l}</a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--fg3)', letterSpacing: '.04em' }}>
            © {year} Obsidian Trading Technologies Ltd. All rights reserved.
          </span>
          <span style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--fg3)', opacity: 0.5 }}>
            Trading involves risk. Past performance is not indicative of future results.
          </span>
        </div>
      </div>
    </footer>
  );
}
