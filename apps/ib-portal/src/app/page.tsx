/**
 * @file page.tsx
 * @module ib-portal
 * @description IB portal home page
 * @author BharatERP
 * @created 2026-02-19
 */

import Link from 'next/link';

export default function IndexPage() {
  return (
    <main style={{ display: 'grid', gap: 12 }}>
      <h1>IB Portal</h1>
      <p>Introducing broker portal and sub-broker management.</p>
      <ul>
        <li>
          <Link href="/clients">Clients</Link>
        </li>
        <li>
          <Link href="/commissions">Commissions</Link>
        </li>
        <li>
          <Link href="/reports">Reports</Link>
        </li>
      </ul>
    </main>
  );
}
