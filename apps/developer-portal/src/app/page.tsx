/**
 * @file page.tsx
 * @module developer-portal
 * @description Developer portal home page
 * @author BharatERP
 * @created 2026-02-19
 */

import Link from 'next/link';

export default function IndexPage() {
  return (
    <main style={{ display: 'grid', gap: 12 }}>
      <h1>Developer Portal</h1>
      <p>API docs and developer resources.</p>
      <ul>
        <li>
          <Link href="/api-docs">API Docs</Link>
        </li>
        <li>
          <Link href="/keys">API Keys</Link>
        </li>
        <li>
          <Link href="/webhooks">Webhooks</Link>
        </li>
      </ul>
    </main>
  );
}
