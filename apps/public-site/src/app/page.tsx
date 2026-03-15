/**
 * @file page.tsx
 * @module public-site
 * @description Public site home page
 * @author BharatERP
 * @created 2026-02-19
 */

import Link from 'next/link';

export default function IndexPage() {
  return (
    <main style={{ display: 'grid', gap: 12 }}>
      <h1>NestTrade</h1>
      <p>Enterprise trading platform.</p>
      <ul>
        <li>
          <Link href="/about">About</Link>
        </li>
        <li>
          <Link href="/pricing">Pricing</Link>
        </li>
        <li>
          <Link href="/contact">Contact</Link>
        </li>
      </ul>
    </main>
  );
}
