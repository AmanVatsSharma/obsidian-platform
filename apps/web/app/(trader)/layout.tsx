import Link from 'next/link';
import { buildSectionTitle, type UiNavItem } from '@nesttrade/ui-kit';

const traderNavItems: UiNavItem[] = [
  { label: 'Workstation', href: '/workstation', description: 'Chart, DOM, order ticket, and watchlists' },
  { label: 'Onboarding', href: '/onboarding', description: 'KYC, profile, and broker profile completion' },
  { label: 'Portfolio', href: '/portfolio', description: 'Positions, holdings, and PnL surfaces' },
  { label: 'Orders', href: '/orders', description: 'Live orders, history, and advanced order types' },
  { label: 'Funds', href: '/funds', description: 'Deposits, withdrawals, and transfer controls' },
  { label: 'Settings', href: '/settings', description: 'Security, sessions, API keys, and preferences' },
];

export default function TraderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: 24, display: 'grid', gap: 20 }}>
      <header style={{ display: 'grid', gap: 8 }}>
        <h1>{buildSectionTitle('Trader Workspace')}</h1>
        <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {traderNavItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
