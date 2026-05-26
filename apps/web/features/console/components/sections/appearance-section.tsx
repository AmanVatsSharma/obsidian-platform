/**
 * File:        apps/web/features/console/components/sections/appearance-section.tsx
 * Module:      web · Console · Appearance
 * Purpose:     /console/appearance — wires the design's theme/density/accent
 *              controls to the extended ObsidianProvider so changes apply to the
 *              entire app and persist in localStorage.
 *
 * Exports:
 *   - default AppearanceSection
 *
 * Depends on:
 *   - @obsidian/obsidian-ui — useObsidian, ObsidianIcon, ObsidianSegmented,
 *                              ObsidianToggle, types ObsidianAccent / ObsidianDensity
 *
 * Side-effects:
 *   - useObsidian().setTheme / setDensity / setAccent persist to localStorage and
 *     mirror to <html> data-attributes / CSS variables.
 *
 * Key invariants:
 *   - The Theme card uses two side-by-side preview tiles. Activating Paper sets
 *     theme to 'light'; the Dark tile sets it back to 'dark'. We do NOT use
 *     'system' from this UI — selection is explicit.
 *   - Accent buttons display a 2px white outline + outer glow when active.
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

'use client';

import * as React from 'react';

import {
  ObsidianIcon,
  ObsidianSegmented,
  ObsidianToggle,
  type ObsidianAccent,
  type ObsidianDensity,
  useObsidian,
} from '@obsidian/obsidian-ui';

const ACCENTS: ReadonlyArray<{ id: ObsidianAccent; color: string; lightColor: string }> = [
  { id: 'blue',   color: '#3B82F6', lightColor: '#2563EB' },
  { id: 'mint',   color: '#10D996', lightColor: '#058E65' },
  { id: 'violet', color: '#A855F7', lightColor: '#7C3AED' },
  { id: 'amber',  color: '#F59E0B', lightColor: '#B45309' },
];

function FieldRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="frow">
      <div className="lbl">
        {label}
        {hint && <span className="hint">{hint}</span>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function ThemeCard({
  active,
  title,
  subtitle,
  colors,
  onClick,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  colors: readonly [string, string, string, string];
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: 12,
        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 8,
        background: active ? 'var(--bg-active)' : 'var(--bg-elevated)',
        cursor: 'pointer',
        boxShadow: active ? '0 0 0 3px var(--accent-dim)' : 'none',
        textAlign: 'left',
        font: 'inherit',
        color: 'inherit',
        width: '100%',
      }}
      aria-pressed={active}
    >
      <div
        aria-hidden="true"
        style={{
          aspectRatio: '16/8',
          background: colors[0],
          border: '1px solid var(--border)',
          borderRadius: 4,
          padding: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          marginBottom: 10,
        }}
      >
        <div style={{ height: 8, background: colors[1], borderRadius: 2 }} />
        <div style={{ display: 'flex', gap: 4, flex: 1 }}>
          <div style={{ flex: 1, background: colors[1], borderRadius: 2 }} />
          <div style={{ width: 40, background: colors[2], borderRadius: 2 }} />
          <div style={{ width: 28, background: colors[3], borderRadius: 2 }} />
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ fontSize: 12, fontWeight: 600 }}>{title}</div>
          <div className="muted small">{subtitle}</div>
        </div>
        {active && <ObsidianIcon name="CheckCircle2" size={16} style={{ color: 'var(--accent)' }} />}
      </div>
    </button>
  );
}

export default function AppearanceSection() {
  const { resolvedTheme, density, accent, setTheme, setDensity, setAccent } = useObsidian();
  const isLight = resolvedTheme === 'light';

  // Local UI flags — these are not persisted (cosmetic toggles for now).
  const [showGrid, setShowGrid] = React.useState(true);
  const [animations, setAnimations] = React.useState(true);

  return (
    <>
      <section className="sec">
        <div className="sec-hd">
          <h2>Theme</h2>
          <div className="line" />
        </div>
        <div className="card">
          <FieldRow
            label="Surface"
            hint="Dark is the default for trading screens; light is paper-terminal."
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
                maxWidth: 520,
              }}
            >
              <ThemeCard
                active={!isLight}
                title="Dark"
                subtitle="Trading-floor default"
                colors={['#06080A', '#0F1216', '#3B82F6', '#10D996']}
                onClick={() => setTheme('dark')}
              />
              <ThemeCard
                active={isLight}
                title="Paper"
                subtitle="Print-crisp light theme"
                colors={['#FBFAF7', '#FFFFFF', '#2563EB', '#058E65']}
                onClick={() => setTheme('light')}
              />
            </div>
          </FieldRow>
          <FieldRow label="Accent color" hint="Used for buttons, links, and selected rows.">
            <div style={{ display: 'flex', gap: 8 }}>
              {ACCENTS.map((a) => {
                const swatch = isLight ? a.lightColor : a.color;
                const active = accent === a.id;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setAccent(a.id)}
                    aria-label={`Accent ${a.id}`}
                    aria-pressed={active}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: swatch,
                      border: `2px solid ${active ? '#fff' : 'transparent'}`,
                      boxShadow: active ? `0 0 0 1px ${swatch}, 0 0 14px ${swatch}66` : 'none',
                      cursor: 'pointer',
                    }}
                  />
                );
              })}
            </div>
          </FieldRow>
          <FieldRow
            label="Density"
            hint="Compact = more rows on screen; comfortable = more whitespace."
          >
            <ObsidianSegmented<ObsidianDensity>
              value={density}
              onChange={setDensity}
              options={['compact', 'regular', 'comfortable'] as const}
            />
          </FieldRow>
        </div>
      </section>

      <section className="sec">
        <div className="sec-hd">
          <h2>Charts</h2>
          <div className="line" />
        </div>
        <div className="card">
          <FieldRow label="Bull / bear colors">
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{ width: 14, height: 14, borderRadius: 3, background: 'var(--bull)' }}
                />
                <span className="mono small">Bull · #10D996</span>
              </div>
              <span className="muted">/</span>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{ width: 14, height: 14, borderRadius: 3, background: 'var(--bear)' }}
                />
                <span className="mono small">Bear · #FF3B5C</span>
              </div>
              <button type="button" className="btn sm ghost">
                <ObsidianIcon name="Palette" size={11} />
                Customize
              </button>
            </div>
          </FieldRow>
          <FieldRow label="Chart background">
            <ObsidianSegmented
              value={'Transparent' as const}
              onChange={() => undefined}
              options={['Transparent', 'Solid', 'Grid'] as const}
            />
          </FieldRow>
          <FieldRow label="Show price grid">
            <ObsidianToggle on={showGrid} onChange={setShowGrid} aria-label="Show price grid" />
          </FieldRow>
          <FieldRow label="Crosshair">
            <ObsidianSegmented
              value={'Cross' as const}
              onChange={() => undefined}
              options={['Cross', 'Plus', 'Off'] as const}
            />
          </FieldRow>
        </div>
      </section>

      <section className="sec">
        <div className="sec-hd">
          <h2>Layout</h2>
          <div className="line" />
        </div>
        <div className="card">
          <FieldRow
            label="Animations"
            hint="Disable for low-power machines or motion sensitivity."
          >
            <ObsidianToggle on={animations} onChange={setAnimations} aria-label="Animations" />
          </FieldRow>
          <FieldRow label="Reduce motion">
            <ObsidianToggle on={false} onChange={() => undefined} aria-label="Reduce motion" />
          </FieldRow>
          <FieldRow label="Sidebar">
            <ObsidianSegmented
              value={'Expanded' as const}
              onChange={() => undefined}
              options={['Expanded', 'Icon only', 'Auto'] as const}
            />
          </FieldRow>
          <FieldRow label="Default landing screen">
            <ObsidianSegmented
              value={'Overview' as const}
              onChange={() => undefined}
              options={['Overview', 'Trading terminal', 'Watchlist', 'Last visited'] as const}
            />
          </FieldRow>
        </div>
      </section>
    </>
  );
}
