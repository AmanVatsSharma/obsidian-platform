/**
 * @file status-bar-trading.tsx
 * @module web-trading
 * @description Footer connection / server / latency strip with mobile link.
 * @author BharatERP
 * @created 2026-04-03
 */

'use client';

import Link from 'next/link';
import { Database, Wifi, Zap } from 'lucide-react';
import type { AccountSnapshot } from '../lib/types';

export function StatusBarTrading({
  ping,
  account,
  mobileHref,
}: {
  ping: number;
  account: AccountSnapshot;
  mobileHref: string;
}) {
  const now = new Date();
  return (
    <footer className="statusbar">
      <div className="statusbar-item">
        <div className="status-dot green" />
        <span>Connected</span>
      </div>
      <div className="statusbar-item">
        <Wifi size={10} />
        <span>{account.server}</span>
      </div>
      <div className="statusbar-item">
        <Zap size={10} />
        <span>{ping}ms</span>
      </div>
      <div className="statusbar-item">
        <Database size={10} />
        <span>
          {account.accountType} · {account.leverage}
        </span>
      </div>
      <div className="statusbar-item">
        <span>v2.4.1</span>
      </div>
      <div className="statusbar-item">
        <Link href={mobileHref} style={{ color: 'inherit', textDecoration: 'none' }}>
          Mobile
        </Link>
      </div>
      <div className="statusbar-item">
        <span>
          {now.toLocaleTimeString('en-US', { hour12: false })} UTC
        </span>
      </div>
    </footer>
  );
}
