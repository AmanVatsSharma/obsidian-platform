/**
 * File:        libs/web-auth/src/components/shared/primitives.tsx
 * Module:      web-auth · Form Primitives
 * Purpose:     Low-level form building blocks for Obsidian auth screens:
 *              TextInput, PrimaryButton, GhostButton, FieldLabel, Divider, LegalFooter.
 *
 * Exports:
 *   - TextInput({ value, onChange, placeholder?, type?, icon?, focus?, autoFocus? })
 *   - PrimaryButton({ children, onClick?, disabled?, wide?, variant? })
 *   - GhostButton({ children, onClick?, icon?, wide? })
 *   - FieldLabel({ children, optional?, hint? })
 *   - Divider({ label })
 *   - LegalFooter()
 *
 * Side-effects: none
 * Key invariants:
 *   - All sizing/color via CSS vars (--bg-elevated, --accent, --border, etc.)
 *   - PrimaryButton height 44px, GhostButton/TextInput height 42px
 *   - Focus ring: 3px rgba(59,130,246,0.15) glow on TextInput
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

'use client';

import React, { useState, ReactNode } from 'react';

// ─── TextInput ──────────────────────────────────────────────────
interface TextInputProps {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  type?: string;
  icon?: ReactNode;
  focus?: boolean;
  autoFocus?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  unit?: string;
}

export function TextInput({ value, onChange, placeholder, type = 'text', icon, focus, autoFocus, onFocus, onBlur }: TextInputProps) {
  const [f, setF] = useState(false);
  const isFocus = focus !== undefined ? focus : f;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', height: 42,
      background: 'var(--bg-elevated)',
      border: `1px solid ${isFocus ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius: 'var(--r-md)',
      boxShadow: isFocus ? '0 0 0 3px rgba(59,130,246,0.15)' : 'none',
      transition: 'all 150ms var(--ease)', overflow: 'hidden',
    }}>
      {icon && <div style={{ padding: '0 12px', color: 'var(--fg3)', display: 'flex' }}>{icon}</div>}
      <input
        type={type}
        value={value}
        autoFocus={autoFocus}
        onChange={e => onChange?.(e.target.value)}
        onFocus={() => { setF(true); onFocus?.(); }}
        onBlur={() => { setF(false); onBlur?.(); }}
        placeholder={placeholder}
        style={{
          flex: 1, background: 'none', border: 'none', outline: 'none',
          padding: icon ? '0 14px 0 0' : '0 14px',
          fontFamily: (type === 'email' || type === 'text') ? 'var(--font-ui)' : 'var(--font-data)',
          fontSize: 14, fontWeight: 500, color: 'var(--fg1)',
          letterSpacing: type === 'password' ? '0.2em' : 'normal',
        }}
      />
    </div>
  );
}

// ─── PrimaryButton ──────────────────────────────────────────────
interface PrimaryButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  wide?: boolean;
  variant?: 'default' | 'bull';
  type?: 'button' | 'submit';
}

export function PrimaryButton({ children, onClick, disabled, wide = true, variant = 'default', type = 'button' }: PrimaryButtonProps) {
  const bg = variant === 'bull' ? 'var(--bull)' : 'var(--accent)';
  const glow = variant === 'bull' ? 'var(--shadow-glow-bull)' : 'var(--shadow-glow-accent)';
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 44, width: wide ? '100%' : 'auto',
        padding: wide ? '0' : '0 20px',
        background: disabled ? 'var(--bg-elevated)' : bg,
        border: `1px solid ${disabled ? 'var(--border)' : bg}`,
        borderRadius: 'var(--r-md)',
        color: disabled ? 'var(--fg3)' : '#fff',
        fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700,
        letterSpacing: '0.08em', textTransform: 'uppercase', cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: disabled ? 'none' : glow,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        transition: 'all 150ms var(--ease)',
      }}
    >
      {children}
    </button>
  );
}

// ─── GhostButton ────────────────────────────────────────────────
interface GhostButtonProps {
  children: ReactNode;
  onClick?: () => void;
  icon?: ReactNode;
  wide?: boolean;
}

export function GhostButton({ children, onClick, icon, wide }: GhostButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        height: 42, width: wide ? '100%' : 'auto',
        padding: wide ? '0' : '0 16px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
        color: 'var(--fg1)',
        fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 500,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        transition: 'all 150ms var(--ease)',
      }}
    >
      {icon && <span style={{ display: 'flex' }}>{icon}</span>}
      {children}
    </button>
  );
}

// ─── FieldLabel ─────────────────────────────────────────────────
interface FieldLabelProps {
  children: ReactNode;
  optional?: boolean;
  hint?: ReactNode;
}

export function FieldLabel({ children, optional, hint }: FieldLabelProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
      <label style={{
        fontFamily: 'var(--font-data)', fontSize: 10, fontWeight: 600,
        letterSpacing: '0.08em', color: 'var(--fg3)', textTransform: 'uppercase',
      }}>
        {children}
        {optional && <span style={{ color: 'var(--fg4)', marginLeft: 6 }}>OPTIONAL</span>}
      </label>
      {hint && <span style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--fg3)' }}>{hint}</span>}
    </div>
  );
}

// ─── Divider ────────────────────────────────────────────────────
interface DividerProps {
  label: string;
}

export function Divider({ label }: DividerProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      <span style={{
        fontFamily: 'var(--font-data)', fontSize: 9, fontWeight: 600,
        letterSpacing: '0.1em', color: 'var(--fg3)', textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  );
}

// ─── LegalFooter ────────────────────────────────────────────────
export function LegalFooter() {
  return (
    <div style={{
      padding: '12px 0 0',
      fontFamily: 'var(--font-data)', fontSize: 9, fontWeight: 600,
      letterSpacing: '0.08em', color: 'var(--fg3)', textTransform: 'uppercase',
      textAlign: 'center',
    }}>
      © OBSIDIAN MARKETS · LICENSED · FCA 789021 · CYSEC 332/17
    </div>
  );
}
