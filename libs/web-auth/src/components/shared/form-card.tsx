/**
 * File:        libs/web-auth/src/components/shared/form-card.tsx
 * Module:      web-auth · FormCard + StepIndicator
 * Purpose:     Scrollable form pane container with eyebrow, title, subtitle, back link,
 *              and footer slot. Also exports StepIndicator for multi-step onboarding flows.
 *
 * Exports:
 *   - FormCard({ back?, eyebrow?, title, subtitle?, children, footer? })
 *   - StepIndicator({ current, total, labels? })
 *
 * Side-effects: none
 * Key invariants:
 *   - Form content area: padding 40px 56px 32px; maxWidth 460 for centering
 *   - Title: 32px Syne 700 — matches the design spec
 *   - StepIndicator uses bull-dim (done), accent-dim (active), border (future)
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

import React, { ReactNode } from 'react';
import { ObsidianLogo } from './obsidian-logo';
import { LegalFooter } from './primitives';

// ─── FormCard ───────────────────────────────────────────────────
interface FormCardProps {
  back?: ReactNode;
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export function FormCard({ back, eyebrow, title, subtitle, children, footer }: FormCardProps) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      padding: '40px 56px 32px',
    }}>
      {/* logo */}
      <div style={{ marginBottom: 36 }}>
        <ObsidianLogo />
      </div>

      {/* back link */}
      {back && <div style={{ marginBottom: 16 }}>{back}</div>}

      {/* eyebrow */}
      {eyebrow && (
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 600,
          letterSpacing: '0.12em', color: 'var(--fg3)', textTransform: 'uppercase',
          marginBottom: 8,
        }}>{eyebrow}</div>
      )}

      {/* title */}
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700,
        color: 'var(--fg1)', lineHeight: 1.1, marginBottom: 10,
        letterSpacing: '0.01em',
      }}>{title}</div>

      {/* subtitle */}
      {subtitle && (
        <div style={{
          fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--fg2)',
          lineHeight: 1.5, marginBottom: 28, maxWidth: 460,
        }}>{subtitle}</div>
      )}

      {/* body */}
      <div style={{ maxWidth: 460, flex: 1 }}>
        {children}
      </div>

      {/* footer */}
      <div style={{ maxWidth: 460, marginTop: 28 }}>
        {footer ?? <LegalFooter />}
      </div>
    </div>
  );
}

// ─── StepIndicator ──────────────────────────────────────────────
interface StepIndicatorProps {
  current: number;
  total: number;
  labels?: string[];
}

export function StepIndicator({ current, total, labels }: StepIndicatorProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {Array.from({ length: total }, (_, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={i}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: done ? 'var(--bull-dim)' : active ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                border: `1.5px solid ${done ? 'var(--bull)' : active ? 'var(--accent)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-data)', fontSize: 10, fontWeight: 700,
                color: done ? 'var(--bull)' : active ? 'var(--accent)' : 'var(--fg3)',
              }}>
                {done ? '✓' : i + 1}
              </div>
              {labels?.[i] && (
                <div style={{
                  fontFamily: 'var(--font-data)', fontSize: 8, fontWeight: 600,
                  letterSpacing: '0.08em', color: active ? 'var(--accent)' : 'var(--fg3)',
                  textTransform: 'uppercase', whiteSpace: 'nowrap',
                }}>{labels[i]}</div>
              )}
            </div>
            {i < total - 1 && (
              <div style={{
                flex: 1, height: 1, minWidth: 20,
                background: done ? 'var(--bull)' : 'var(--border)',
                margin: labels ? '0 4px 14px' : '0 4px',
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
