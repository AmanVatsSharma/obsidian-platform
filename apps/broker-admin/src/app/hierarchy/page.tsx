import { buildApiHeaders } from '@nesttrade/web-api-client';

export default function HierarchyPage() {
  const headers = buildApiHeaders({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    tenantId: 'tenant-demo',
  });

  return (
    <main style={{ display: 'grid', gap: 8 }}>
      <h2>Broker Hierarchy</h2>
      <p>Scaffold for brokers, branches, desks, and dealer assignment governance.</p>
      <pre>{JSON.stringify(headers, null, 2)}</pre>
    </main>
  );
}
