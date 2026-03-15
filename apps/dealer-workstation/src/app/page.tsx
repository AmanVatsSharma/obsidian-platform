/**
 * @file page.tsx
 * @module dealer-workstation
 * @description Dealer workstation home page
 * @author BharatERP
 * @created 2026-02-19
 */

import Link from 'next/link';

export default function IndexPage() {
  return (
    <main style={{ display: 'grid', gap: 12 }}>
      <h1>Dealer Workstation</h1>
      <p>Trading and order management surface for dealers.</p>
      <ul>
        <li>
          <Link href="/orders">Orders</Link>
        </li>
        <li>
          <Link href="/positions">Positions</Link>
        </li>
        <li>
          <Link href="/blotter">Blotter</Link>
        </li>
      </ul>
    </main>
  );
}
