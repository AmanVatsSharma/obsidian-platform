/**
 * @file sidebar.tsx
 * @module platform-owner
 * @description Sidebar navigation with role-gated menu for platform-owner console
 * @author BharatERP
 * @created 2026-03-15
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { hasRole, type SessionPrincipal } from '@nesttrade/web-auth';

const MOCK_PRINCIPAL: SessionPrincipal = {
  userId: 'platform-owner-user',
  tenantId: 'platform-global',
  roles: ['platform-owner'],
};

const navItems = [
  { href: '/tenants', label: 'Tenants' },
  { href: '/entitlements', label: 'Entitlements' },
  { href: '/billing', label: 'Billing' },
  { href: '/audit-controls', label: 'Audit controls' },
];

export function Sidebar() {
  const pathname = usePathname();
  const showNav = hasRole(MOCK_PRINCIPAL, 'platform-owner');

  return (
    <aside
      style={{
        width: 220,
        minHeight: '100vh',
        padding: '24px 16px',
        borderRight: '1px solid #334155',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <Link
        href="/"
        style={{
          fontSize: '1.1rem',
          fontWeight: 600,
          color: '#e2e8f0',
          marginBottom: 16,
          textDecoration: 'none',
        }}
      >
        Platform Owner
      </Link>
      {showNav &&
        navItems.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            style={{
              padding: '10px 12px',
              borderRadius: 6,
              color: pathname === href ? '#38bdf8' : '#94a3b8',
              background: pathname === href ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
              textDecoration: 'none',
              fontSize: '0.95rem',
            }}
          >
            {label}
          </Link>
        ))}
    </aside>
  );
}
