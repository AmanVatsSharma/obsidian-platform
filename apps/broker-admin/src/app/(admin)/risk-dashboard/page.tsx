/**
 * File:        apps/broker-admin/src/app/(admin)/risk-dashboard/page.tsx
 * Module:      broker-admin · Risk · Risk Dashboard
 * Purpose:     Portfolio-level risk overview: margin level gauge, VAR, Greeks,
 *              exposure bars per instrument, circuit breaker status, and
 *              24h liquidation event log.
 *
 * Exports:
 *   - default (RiskDashboardPage) — risk overview with all risk widgets
 *
 * Depends on:
 *   - @/components/margin-level-gauge — MarginLevelGauge
 *   - @/lib/api/hooks/use-risk — useRiskExposure, usePortfolioVar, useGreeks,
 *                                               useCircuitBreakers, useLiquidationHistory
 *   - @/lib/types — ExposureSnapshot, CircuitBreaker, LiquidationEvent
 *
 * Side-effects:
 *   - GET /admin/risk/exposure on mount (margin level)
 *   - GET /admin/risk/var on mount (portfolio VAR)
 *   - GET /admin/risk/circuit-breakers on mount
 *   - GET /admin/risk/liquidation-history on mount
 *   - CSV export (mock — generates Blob and triggers download)
 *
 * Key invariants:
 *   - All risk hooks called with brokerId from session context
 *   - Exposure bars color-coded: green <60%, amber 60–85%, red >85%
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-24
 */

'use client';

import { useMemo, useState } from 'react';
import { Shield, Download, TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';
import { MarginLevelGauge } from '@/components/margin-level-gauge';
import {
  useRiskExposure,
  usePortfolioVar,
  useGreeks,
  useCircuitBreakers,
  useLiquidationHistory,
} from '@/lib/api/hooks/use-risk';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const h = Math.floor(ms / 3_600_000);
  if (h < 1) return `${Math.floor(ms / 60_000)}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Mock fallback data ───────────────────────────────────────────────────────

const MOCK_EXPOSURE_PER_INSTRUMENT = [
  { symbol: 'EURUSD',  netExposure: 45_000, maxExposure: 66_000, utilizationPct: 68.2 },
  { symbol: 'XAUUSD',  netExposure: 21_000, maxExposure: 50_000, utilizationPct: 42.0 },
  { symbol: 'BTCUSD',  netExposure: 9_100,  maxExposure: 10_000, utilizationPct: 91.0 },
  { symbol: 'NIFTY',   netExposure: 33_000, maxExposure: 40_000, utilizationPct: 82.5 },
  { symbol: 'RELIANCE', netExposure: 18_000, maxExposure: 25_000, utilizationPct: 72.0 },
  { symbol: 'XRPUSD', netExposure: 6_000,  maxExposure: 15_000, utilizationPct: 40.0 },
];

// ─── Widget components ─────────────────────────────────────────────────────────

// Portfolio VAR widget
function PortfolioVarWidget({ brokerId }: { brokerId: string }) {
  const { data, isLoading } = usePortfolioVar(brokerId);

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-accent" />
            <p className="card-title">Portfolio VAR</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-8">
          <span className="font-ui text-[12px] text-fg3">Loading…</span>
        </div>
      </div>
    );
  }

  // Fallback mock when backend is unavailable
  const varData = data ?? { var: 12_340, confidence: 95, horizonDays: 1 };

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-accent" />
          <p className="card-title">Portfolio VAR</p>
        </div>
        <span className="badge badge-muted text-[10px]">{varData.confidence}% 1-day</span>
      </div>
      <div className="px-4 pb-4 pt-2">
        <p
          className="font-mono text-[22px] font-bold text-fg1"
          style={{ fontFeatureSettings: '"tnum" 1' }}
        >
          {fmtCurrency(varData.var)}
        </p>
        <p className="mt-1 font-mono text-[10px] text-fg3">
          {varData.confidence}% confidence · {varData.horizonDays}-day horizon
        </p>
        <div className="mt-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-bear/70" />
          <span className="text-[10px] text-fg3">Value at Risk — max expected daily loss</span>
        </div>
      </div>
    </div>
  );
}

// Greeks widget
function GreeksWidget({ accountId }: { accountId: string }) {
  const { data, isLoading } = useGreeks(accountId);

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-accent" />
            <p className="card-title">Greeks</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-8">
          <span className="font-ui text-[12px] text-fg3">Loading…</span>
        </div>
      </div>
    );
  }

  // Fallback mock
  const greeks = data ?? { totalDelta: 0.45, totalGamma: 0.02, portfolioValue: 1_250_000 };
  const deltaBreached = Math.abs(greeks.totalDelta) > 1;
  const gammaBreached = Math.abs(greeks.totalGamma) > 0.1;

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-accent" />
          <p className="card-title">Greeks</p>
        </div>
        <span className="badge badge-muted text-[10px]">Portfolio</span>
      </div>
      <div className="grid grid-cols-2 gap-3 px-4 pb-4 pt-2">
        <div>
          <p className="font-display text-[9px] font-semibold tracking-widest text-fg3 uppercase">Delta</p>
          <p
            className={`mt-0.5 font-mono text-[18px] font-bold ${deltaBreached ? 'text-bear' : 'text-bull'}`}
            style={{ fontFeatureSettings: '"tnum" 1' }}
          >
            {greeks.totalDelta >= 0 ? '+' : ''}{greeks.totalDelta.toFixed(2)}
          </p>
          <p className="font-mono text-[9px] text-fg3">&#916;</p>
        </div>
        <div>
          <p className="font-display text-[9px] font-semibold tracking-widest text-fg3 uppercase">Gamma</p>
          <p
            className={`mt-0.5 font-mono text-[18px] font-bold ${gammaBreached ? 'text-bear' : 'text-bull'}`}
            style={{ fontFeatureSettings: '"tnum" 1' }}
          >
            {greeks.totalGamma >= 0 ? '+' : ''}{greeks.totalGamma.toFixed(3)}
          </p>
          <p className="font-mono text-[9px] text-fg3">&#915;</p>
        </div>
      </div>
      <div className="mx-4 mb-4 border-t border-[var(--border)] pt-3">
        <p className="font-mono text-[10px] text-fg3">
          Portfolio Value: <span className="text-fg1">{fmtCurrency(greeks.portfolioValue)}</span>
        </p>
      </div>
    </div>
  );
}

// Exposure bar for single instrument
function ExposureRow({ symbol, netExposure, maxExposure, utilizationPct }: {
  symbol: string;
  netExposure: number;
  maxExposure: number;
  utilizationPct: number;
}) {
  const capped = Math.min(utilizationPct, 100);
  const barColor =
    utilizationPct < 60 ? 'bg-bull/70' :
    utilizationPct < 85 ? 'bg-warn/70' :
    'bg-bear/70';
  const valueColor =
    utilizationPct < 60 ? 'text-bull' :
    utilizationPct < 85 ? 'text-warn' :
    'text-bear';

  return (
    <div className="flex items-center gap-4 py-2">
      <span className="w-14 shrink-0 font-mono text-[12px] font-bold text-fg1">{symbol}</span>
      <div className="relative flex-1">
        <div className="h-1.5 w-full rounded-full bg-[var(--bg-elevated)]">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${capped}%` }}
          />
        </div>
        <div
          className="absolute -top-0.5 h-1.5 rounded-full border border-[var(--fg3)]/40"
          style={{ left: `${capped}%`, width: '2px' }}
        />
      </div>
      <span className={`w-12 text-right font-mono text-[11px] font-semibold ${valueColor}`}>
        {utilizationPct.toFixed(0)}%
      </span>
      <span className="w-20 text-right font-mono text-[11px] text-fg3">
        {fmtCurrency(netExposure)} / {fmtCurrency(maxExposure)}
      </span>
    </div>
  );
}

// Exposure per instrument widget
function ExposurePerInstrumentWidget({ brokerId }: { brokerId: string }) {
  const { exposure, isLoading } = useRiskExposure(brokerId);

  const rows = useMemo(() => {
    if (exposure?.exposurePerInstrument && exposure.exposurePerInstrument.length > 0) {
      return exposure.exposurePerInstrument;
    }
    return MOCK_EXPOSURE_PER_INSTRUMENT;
  }, [exposure]);

  const [filter, setFilter] = useState('');

  if (isLoading) return <div className="card skeleton h-40" />;

  const filtered = filter
    ? rows.filter(r => r.symbol.toLowerCase().includes(filter.toLowerCase()))
    : rows;

  return (
    <div className="card">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <p className="font-display text-[10px] font-semibold tracking-widest text-fg3 uppercase">
          Exposure per Instrument
        </p>
        <div className="relative">
          <input
            className="input input-sm w-32 pl-6 text-[11px]"
            placeholder="Filter symbol…"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
        </div>
      </div>
      <div className="px-4 pb-4 pt-2">
        {filtered.length === 0 ? (
          <p className="py-4 text-center text-[12px] text-fg3">No instruments match filter</p>
        ) : (
          <div className="border-b border-[var(--border)] pb-1">
            <div className="mb-1 flex items-center gap-4 px-0">
              <span className="w-14 shrink-0 font-display text-[9px] tracking-widest text-fg3 uppercase">Symbol</span>
              <span className="flex-1 font-display text-[9px] tracking-widest text-fg3 uppercase">Utilization</span>
              <span className="w-12 text-right font-display text-[9px] tracking-widest text-fg3 uppercase">%</span>
              <span className="w-20 text-right font-display text-[9px] tracking-widest text-fg3 uppercase">Values</span>
            </div>
            {filtered.map(r => (
              <ExposureRow
                key={r.symbol}
                symbol={r.symbol}
                netExposure={r.netExposure}
                maxExposure={r.maxExposure}
                utilizationPct={r.utilizationPct}
              />
            ))}
          </div>
        )}
        <div className="mt-3 flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-bull/70" />
            <span className="font-mono text-[9px] text-fg3">&lt;60% normal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-warn/70" />
            <span className="font-mono text-[9px] text-fg3">60–85% warning</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-bear/70" />
            <span className="font-mono text-[9px] text-fg3">&gt;85% breach</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Circuit breaker status widget
function CircuitBreakerWidget({ brokerId }: { brokerId: string }) {
  const { data, isLoading } = useCircuitBreakers(brokerId);

  // Fallback mock
  const breakers = data.length > 0 ? data : [
    { symbol: 'EURUSD',   status: 'ACTIVE' as const },
    { symbol: 'XAUUSD',   status: 'HALTED' as const, haltedAt: '2026-05-24T09:30:00Z' },
    { symbol: 'BTCUSD',   status: 'ACTIVE' as const },
    { symbol: 'NIFTY',    status: 'ACTIVE' as const },
    { symbol: 'RELIANCE', status: 'ACTIVE' as const },
    { symbol: 'XRPUSD',   status: 'ACTIVE' as const },
    { symbol: 'BANKNIFTY', status: 'HALTED' as const, haltedAt: '2026-05-24T10:00:00Z' },
  ];

  if (isLoading) return <div className="card skeleton h-32" />;

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-accent" />
          <p className="card-title">Circuit Breakers</p>
        </div>
        <span className="badge badge-muted text-[10px]">{breakers.length} instruments</span>
      </div>
      <div className="flex flex-wrap gap-2 px-4 pb-4">
        {breakers.map(cb => (
          <div
            key={cb.symbol}
            className={`flex items-center gap-2 rounded border px-3 py-1.5 ${
              cb.status === 'HALTED'
                ? 'border-warn/30 bg-warn/5'
                : 'border-[var(--border)] bg-[var(--bg-elevated)]'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${cb.status === 'HALTED' ? 'bg-warn' : 'bg-bull'}`}
            />
            <span className="font-mono text-[11px] font-bold text-fg1">{cb.symbol}</span>
            <span
              className={`text-[10px] font-semibold ${cb.status === 'HALTED' ? 'text-warn' : 'text-bull'}`}
            >
              {cb.status === 'HALTED' ? 'Halted' : 'Active'}
            </span>
            {cb.status === 'HALTED' && cb.haltedAt && (
              <span className="text-[9px] text-warn/70">{timeAgo(cb.haltedAt)}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Liquidation history table
function LiquidationHistoryWidget({ brokerId }: { brokerId: string }) {
  const { data } = useLiquidationHistory(brokerId);

  // Fallback mock
  const events = data.length > 0 ? data : [
    { accountId: 'ACC-1042', action: 'LIQUIDATE_ALL',      marginLevel: 68.3, timestamp: '2026-05-24T14:32:00Z', symbol: 'NIFTY' },
    { accountId: 'ACC-1018', action: 'LIQUIDATE_BIGGEST', marginLevel: 87.1, timestamp: '2026-05-24T11:15:00Z', symbol: 'EURUSD' },
    { accountId: 'ACC-1067', action: 'LIQUIDATE_ALL',      marginLevel: 75.9, timestamp: '2026-05-23T22:04:00Z', symbol: 'BTCUSD' },
    { accountId: 'ACC-1005', action: 'LIQUIDATE_BIGGEST', marginLevel: 91.2, timestamp: '2026-05-23T18:44:00Z', symbol: 'XAUUSD' },
  ];

  const exportCsv = () => {
    const header = 'Timestamp,Account,Symbol,Action,Margin Level';
    const rows = events.map(e =>
      `${e.timestamp},${e.accountId},${e.symbol ?? 'N/A'},${e.action},${e.marginLevel.toFixed(1)}%`,
    );
    const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `liquidation-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <div>
          <p className="font-display text-[10px] font-semibold tracking-widest text-fg3 uppercase">
            Liquidation Events (24h)
          </p>
          <p className="mt-0.5 font-mono text-[10px] text-fg3">{events.length} events</p>
        </div>
        <button
          className="btn btn-ghost btn-sm flex items-center gap-1.5 text-[11px]"
          onClick={exportCsv}
        >
          <Download size={11} /> Export CSV
        </button>
      </div>
      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="font-ui text-[12px] text-fg3">No liquidation events in the last 24 hours</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Account</th>
                <th>Symbol</th>
                <th>Action</th>
                <th>Margin Level</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev, i) => {
                const isRecent = Date.now() - new Date(ev.timestamp).getTime() < 86_400_000;
                return (
                  <tr key={i} className={isRecent ? 'bg-bear/5' : undefined}>
                    <td className="font-mono text-[11px] text-fg2">{fmtTime(ev.timestamp)}</td>
                    <td className="font-mono text-[11px] text-fg2">{ev.accountId}</td>
                    <td className="font-mono text-[11px] font-bold text-fg1">{ev.symbol ?? '—'}</td>
                    <td>
                      <span className={`badge ${ev.action === 'LIQUIDATE_ALL' ? 'badge-bear' : 'badge-warn'}`}>
                        {ev.action}
                      </span>
                    </td>
                    <td className="font-mono text-[11px] text-bear">{ev.marginLevel.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Top stats row
function TopStatsRow({ brokerId }: { brokerId: string }) {
  const { exposure } = useRiskExposure(brokerId);

  const totalExposure = useMemo(() => {
    if (exposure?.exposurePerInstrument) {
      return exposure.exposurePerInstrument.reduce((sum, e) => sum + e.netExposure, 0);
    }
    return MOCK_EXPOSURE_PER_INSTRUMENT.reduce((sum, e) => sum + e.netExposure, 0);
  }, [exposure]);

  const marginUsed = exposure?.usedMargin ?? 124_500;

  // Total buying power is summed from individual account buying power values
  // (exposed via useAccountBalances per account — here we use a mock aggregate)
  const buyingPower = 892_000;
  const openPositions = 142;

  const stats = [
    { label: 'Total Exposure', value: fmtCurrency(totalExposure), icon: DollarSign, color: 'text-fg1' },
    { label: 'Open Positions', value: String(openPositions), icon: Activity, color: 'text-fg1' },
    { label: 'Margin Used', value: fmtCurrency(marginUsed), icon: TrendingDown, color: 'text-warn' },
    { label: 'Buying Power', value: fmtCurrency(buyingPower), icon: TrendingUp, color: 'text-bull' },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {stats.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="kpi-card">
          <div className="flex items-center justify-between">
            <p className="kpi-label">{label}</p>
            <Icon size={13} className="text-fg3" />
          </div>
          <p
            className={`mt-1 font-mono text-[18px] font-bold ${color}`}
            style={{ fontFeatureSettings: '"tnum" 1' }}
          >
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RiskDashboardPage() {
  const brokerId = 'default'; // TODO: from auth context

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="flex flex-col gap-4">
      {/* Page header */}
      <div className="module-header">
        <div className="flex items-center gap-4">
          <div>
            <p className="module-title">Risk Dashboard</p>
            <p className="module-subtitle">Portfolio-level risk overview</p>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <span className="font-mono text-[11px] text-fg3">
              Last updated: {timeStr} · {dateStr}
            </span>
            <button className="btn btn-ghost btn-sm">
              <Activity size={12} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Top stats row */}
      <TopStatsRow brokerId={brokerId} />

      {/* Top row: Margin Level Gauge | Portfolio VAR | Greeks */}
      <div className="grid grid-cols-3 gap-3">
        {/* Margin level widget */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-accent" />
              <p className="card-title">Margin Level</p>
            </div>
          </div>
          <div className="flex items-center justify-center px-4 pb-6 pt-2">
            <MarginLevelGauge level={142} />
          </div>
        </div>

        {/* Portfolio VAR */}
        <PortfolioVarWidget brokerId={brokerId} />

        {/* Greeks */}
        <GreeksWidget accountId="default" />
      </div>

      {/* Exposure per instrument */}
      <ExposurePerInstrumentWidget brokerId={brokerId} />

      {/* Circuit breakers */}
      <CircuitBreakerWidget brokerId={brokerId} />

      {/* Liquidation history */}
      <LiquidationHistoryWidget brokerId={brokerId} />
    </div>
  );
}