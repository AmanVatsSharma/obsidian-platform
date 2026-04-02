/**
 * @file page.tsx
 * @module support-ops
 * @description Support ops home page
 * @author BharatERP
 * @created 2026-02-19
 */

import Link from 'next/link';

export default function IndexPage() {
  return (
    <main style={{ display: 'grid', gap: 12 }}>
      <h1>Support Ops</h1>
      <p>Support operations and customer service surface.</p>
      <ul>
        <li>
          <Link href="/tickets">Tickets</Link>
        </li>
        <li>
          <Link href="/users">User Lookup</Link>
        </li>
        <li>
          <Link href="/audit">Audit Log</Link>
        </li>
      </ul>
    </main>
  );
}
