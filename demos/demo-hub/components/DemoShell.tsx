'use client';

import { ReactNode } from 'react';

interface DemoShellProps {
  children: ReactNode;
  maxWidth?: string;
}

export default function DemoShell({ children, maxWidth = '1600px' }: DemoShellProps) {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {children}
    </main>
  );
}

interface PanelSectionProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function PanelSection({ children, className = '', style }: PanelSectionProps) {
  return (
    <div className={`panel-grid ${className}`} style={style}>
      {children}
    </div>
  );
}

export function Panel({ children, className = '', colSpan = 4 }: {
  children: ReactNode;
  className?: string;
  colSpan?: 4 | 6 | 8 | 12;
}) {
  const spanClass = `panel-col-${colSpan}`;
  return (
    <div className={`panel ${spanClass} ${className}`}>
      {children}
    </div>
  );
}

export function PanelHeader({ children, badge }: { children: ReactNode; badge?: string }) {
  return (
    <div className="panel-header">
      <span>{children}</span>
      {badge && <span className="badge badge-muted">{badge}</span>}
    </div>
  );
}

export function PanelBody({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return <div className="panel-body" style={style}>{children}</div>;
}