'use client';

import Link from 'next/link';
import { Monitor, Building2, Radio, Users, ArrowRight } from 'lucide-react';

const demos = [
  {
    id: 'trader',
    title: 'Trader Terminal',
    description: 'Portfolio management, order entry, market watch, and real-time positions',
    icon: Monitor,
    href: '/trader',
    color: '#10d996',
    stats: { panels: 5, data: 'Live' },
  },
  {
    id: 'broker-admin',
    title: 'Broker Admin',
    description: 'Client management, risk monitoring, compliance, and broker hierarchy',
    icon: Building2,
    href: '/broker-admin',
    color: '#6366f1',
    stats: { panels: 8, data: '35+ Modules' },
  },
  {
    id: 'dealer',
    title: 'Dealer Workstation',
    description: 'Quote management, risk book, P&L tracking, and dealer operations',
    icon: Radio,
    href: '/dealer',
    color: '#f59e0b',
    stats: { panels: 4, data: 'Real-time' },
  },
  {
    id: 'ib-portal',
    title: 'IB Portal',
    description: 'Introducing broker hierarchy, commission tracking, and sub-broker management',
    icon: Users,
    href: '/ib-portal',
    color: '#ec4899',
    stats: { panels: 5, data: 'Commission' },
  },
];

export default function DemoHubLanding() {
  return (
    <main style={{ minHeight: '100vh', padding: 'var(--space-8)' }}>
      {/* Header */}
      <header style={{ textAlign: 'center', marginBottom: 'var(--space-10)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="6" fill="var(--accent)" />
            <path d="M8 12L16 8L24 12V20L16 24L8 20V12Z" stroke="white" strokeWidth="2" fill="none" />
            <circle cx="16" cy="16" r="3" fill="white" />
          </svg>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 700 }}>
            Obsidian Demo Hub
          </h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
          Explore all platform capabilities in one place. Select a demo to see live panels with realistic trading data.
        </p>
      </header>

      {/* Demo Grid */}
      <div className="demo-grid" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {demos.map((demo) => {
          const Icon = demo.icon;
          return (
            <Link key={demo.id} href={demo.href} style={{ textDecoration: 'none' }}>
              <div
                className="panel"
                style={{
                  padding: 'var(--space-6)',
                  cursor: 'pointer',
                  transition: 'all var(--dur) var(--ease)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = demo.color;
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius)',
                    background: `${demo.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 'var(--space-4)',
                  }}
                >
                  <Icon size={24} color={demo.color} />
                </div>

                {/* Title */}
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '18px',
                    fontWeight: 600,
                    marginBottom: 'var(--space-2)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {demo.title}
                </h2>

                {/* Description */}
                <p
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                    lineHeight: 1.6,
                    marginBottom: 'var(--space-4)',
                    flex: 1,
                  }}
                >
                  {demo.description}
                </p>

                {/* Footer */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--border)',
                    paddingTop: 'var(--space-4)',
                    marginTop: 'auto',
                  }}
                >
                  <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                    <span className="badge badge-muted">
                      {demo.stats.panels} panels
                    </span>
                    <span
                      className="badge"
                      style={{ background: `${demo.color}20`, color: demo.color }}
                    >
                      {demo.stats.data}
                    </span>
                  </div>
                  <ArrowRight size={16} color="var(--text-muted)" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <footer
        style={{
          textAlign: 'center',
          marginTop: 'var(--space-10)',
          color: 'var(--text-muted)',
          fontSize: '12px',
        }}
      >
        Obsidian Platform Demo · Built with Obsidian Design System
      </footer>
    </main>
  );
}