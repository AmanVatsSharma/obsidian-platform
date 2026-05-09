/**
 * @file account-summary-panel.tsx
 * @module web-trading
 * @description Account stats, margin meter, and mock 30d P&amp;L sparkline.
 * @author BharatERP
 * @created 2026-04-03
 */

'use client';

import { useState } from 'react';
import type { AccountSnapshot } from '../lib/types';
import { fmt, pnlClass, pnlSign } from '../lib/format-utils';
import { ACCOUNT, P_AND_L_HISTORY } from '../lib/mock-data';

function PnLSparkline({ data }: { data: number[] }) {
  if (!data?.length) return null;
  const w = 228;
  const h = 52;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  });
  const pathLine = `M ${pts.join(' L ')}`;
  const fill = `M 0,${h} L ${pts.join(' L ')} L ${w},${h} Z`;
  return (
    <svg width={w} height={h} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id="pnl-grad-nt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10D996" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#10D996" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={fill} fill="url(#pnl-grad-nt)" />
      <path d={pathLine} fill="none" stroke="#10D996" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function AccountSummaryPanel({ snapshot }: { snapshot?: AccountSnapshot }) {
  const [acct] = useState(snapshot ?? ACCOUNT);
  const marginPct = Math.min((acct.margin / acct.equity) * 100, 100);
  const riskColor = marginPct < 20 ? 'var(--bull)' : marginPct < 50 ? 'var(--warn)' : 'var(--bear)';

  return (
    <div className="account-panel">
      <div className="panel-header">
        <span className="panel-title">Account</span>
        <span style={{ fontFamily: 'var(--font-data)', fontSize: '10px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {acct.accountId} · {acct.leverage}
        </span>
      </div>

      <div className="account-grid">
        {[
          { label: 'Balance', value: `$${fmt(acct.balance)}`, sub: acct.currency },
          { label: 'Equity', value: `$${fmt(acct.equity)}`, sub: acct.accountType, cls: pnlClass(acct.equity - acct.balance) },
          {
            label: 'Unrealized P&L',
            value: `${pnlSign(acct.unrealizedPnl)}$${fmt(Math.abs(acct.unrealizedPnl))}`,
            cls: pnlClass(acct.unrealizedPnl),
          },
          { label: 'Today P&L', value: `+$${fmt(acct.realizedPnlToday)}`, cls: 'bull' },
          { label: 'Free Margin', value: `$${fmt(acct.freeMargin)}`, sub: `Used: $${fmt(acct.margin)}` },
          { label: 'Margin Level', value: `${fmt(acct.marginLevel)}%`, cls: 'bull', sub: 'Safe' },
        ].map((s) => (
          <div key={s.label} className="account-stat">
            <span className="account-stat-label">{s.label}</span>
            <span className={`account-stat-value ${s.cls || ''}`}>{s.value}</span>
            {s.sub ? <span className="account-stat-sub">{s.sub}</span> : null}
          </div>
        ))}
      </div>

      <div className="risk-meter">
        <div className="risk-title">Margin Usage</div>
        <div className="risk-bar-bg">
          <div className="risk-bar" style={{ width: `${marginPct}%`, background: riskColor }} />
        </div>
        <div className="risk-labels">
          <span>0%</span>
          <span style={{ color: riskColor }}>{marginPct.toFixed(1)}%</span>
          <span>100%</span>
        </div>
      </div>

      <div className="pnl-chart">
        <div className="pnl-chart-header">
          <span className="pnl-chart-title">30-Day P&L</span>
          <span className="pnl-chart-val">+$3,567</span>
        </div>
        <PnLSparkline data={P_AND_L_HISTORY} />
      </div>
    </div>
  );
}
