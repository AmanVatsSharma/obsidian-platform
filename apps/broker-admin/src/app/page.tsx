import Link from 'next/link';
import { isFeatureEnabled } from '@nesttrade/web-feature-flags';
import type { SessionPrincipal } from '@nesttrade/web-auth';

const flags = {
  brokerApprovals: true,
  exceptionQueue: true,
};

const principal: SessionPrincipal = {
  userId: 'broker-admin-user',
  tenantId: 'tenant-demo',
  roles: ['broker-admin'],
};

export default function IndexPage() {
  return (
    <main style={{ display: 'grid', gap: 12 }}>
      <h1>Broker Admin Console</h1>
      <p>
        Tenant: <strong>{principal.tenantId}</strong>
      </p>
      <ul>
        <li>
          <Link href="/hierarchy">Broker Hierarchy</Link>
        </li>
        <li>
          <Link href="/approvals">Approvals</Link>
        </li>
        <li>
          <Link href="/breaks">Reconciliation Breaks</Link>
        </li>
        {isFeatureEnabled(flags, 'exceptionQueue') && (
          <li>
            <Link href="/exceptions">Exception Queue</Link>
          </li>
        )}
      </ul>
    </main>
  );
}
