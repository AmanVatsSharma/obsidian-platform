'use client';

import Link from 'next/link';
import { ArrowLeft, Home } from 'lucide-react';

interface DemoHeaderProps {
  title: string;
  subtitle?: string;
  color?: string;
}

export default function DemoHeader({ title, subtitle, color = 'var(--accent)' }: DemoHeaderProps) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--space-4) var(--space-6)',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-panel)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Left - Back */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            fontSize: '12px',
          }}
        >
          <ArrowLeft size={14} />
          <span>All Demos</span>
        </Link>

        <div
          style={{
            width: '1px',
            height: '24px',
            background: 'var(--border)',
          }}
        />

        <div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: color,
              }}
            />
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right - Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <span className="badge badge-bull">LIVE</span>
        <span className="badge badge-muted">Demo Mode</span>
      </div>
    </header>
  );
}