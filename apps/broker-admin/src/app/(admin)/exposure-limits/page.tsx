/**
 * File:        apps/broker-admin/src/app/(admin)/exposure-limits/page.tsx
 * Module:      broker-admin · Risk · Exposure Limits
 * Purpose:     Per-symbol exposure limit management with margin level gauge,
 *              utilization bars, breach alerts, and risk threshold CRUD
 *
 * Exports:
 *   - default (ExposureLimitsPage) — exposure table + margin level section
 *
 * Depends on:
 *   - @/lib/api/hooks/use-exposure-limits — live exposure limits via API
 *   - @/lib/api/hooks/use-risk           — useRiskExposure + useRiskThresholds
 *
 * Side-effects:
 *   - PATCH /admin/exposure-limits/:id on save
 *   - GET  /admin/risk/exposure on mount (margin level data)
 *   - POST /admin/risk/thresholds on create threshold
 *
 * Key invariants:
 *   - Utilization % = currentNetExposure / maxNetExposure * 100
 *   - Color coding: Normal=bull, Warning=warn, Breach=bear
 *   - Margin level gauge: green>150%, amber 100-150%, red<100%
 *   - Alert threshold and hard limit expressed as % of maxNetExposure
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-24
 */

'use client';

import { useState, useMemo } from 'react';
import { AlertTriangle, AlertCircle, Edit2, X, Plus, Zap } from 'lucide-react';
import { useExposureLimits } from '@/lib/api/hooks/use-exposure-limits';
import { useRiskExposure, useRiskThresholds, useCreateRiskThreshold } from '@/lib/api/hooks/use-risk';
import { MarginLevelGauge } from '@/components/margin-level-gauge';
import type { ExposureLimit, RiskThreshold, RiskThresholdMetric, RiskOperator, RiskAction } from '@/lib/types';

const STATUS_COLOR: Record<ExposureLimit['status'], string> = {
  Normal:  'bg-bull',
  Warning: 'bg-warn',
  Breach:  'bg-bear',
};

const STATUS_TEXT: Record<ExposureLimit['status'], string> = {
  Normal:  'text-bull',
  Warning: 'text-warn',
  Breach:  'text-bear',
};

const STATUS_BAR: Record<ExposureLimit['status'], string> = {
  Normal:  'bg-bull/70',
  Warning: 'bg-warn/70',
  Breach:  'bg-bear/70',
};

function UtilBar({ pct, status }: { pct: number; status: ExposureLimit['status'] }) {
  const capped = Math.min(pct, 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 rounded-full bg-[var(--bg-elevated)]">
        <div
          className={`h-full rounded-full transition-all ${STATUS_BAR[status]}`}
          style={{ width: `${capped}%` }}
        />
      </div>
      <span className={`mono-cell text-[11px] font-semibold ${STATUS_TEXT[status]}`}>{pct.toFixed(1)}%</span>
    </div>
  );
}

function EditLimitModal({ limit, onClose, onSave, saving }: {
  limit: ExposureLimit;
  onClose: () => void;
  onSave: (updated: ExposureLimit) => void;
  saving?: boolean;
}) {
  const [data, setData] = useState({ ...limit });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="w-[400px] rounded-r-lg border border-[var(--border)] bg-[var(--bg-panel)]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <div>
            <p className="module-title">Edit Limit</p>
            <p className="mono-cell text-[11px] text-fg3">{limit.symbol}</p>
          </div>
          <button onClick={onClose} className="btn-ghost btn btn-xs p-1.5"><X size={14} /></button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {([
            ['Max Net Exposure ($)', 'maxNetExposure'],
            ['Alert Threshold (%)',  'alertThreshold'],
            ['Hard Limit (%)',       'hardLimit'],
          ] as [string, keyof ExposureLimit][]).map(([label, field]) => (
            <div key={field}>
              <label className="kpi-label mb-1 block">{label}</label>
              <input
                className="input"
                type="number"
                value={data[field] as number}
                onChange={e => setData(d => ({ ...d, [field]: +e.target.value }))}
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 border-t border-[var(--border)] px-5 py-3">
          <button className="btn-ghost btn btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn-primary btn btn-sm" onClick={() => { onSave(data); }} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── AUTO-LIQUIDATION STATUS ───────────────────────────────────────────────────

interface LiquidationEvent {
  symbol: string;
  accountId: string;
  action: string;
  marginLevelAtEvent: number;
  timestamp: string;
}

const MOCK_LIQUIDATION_HISTORY: LiquidationEvent[] = [
  { symbol: 'NIFTY',    accountId: 'ACC-001', action: 'LIQUIDATE_ALL',     marginLevelAtEvent: 87.3, timestamp: '2026-05-23T14:22:11Z' },
  { symbol: 'RELIANCE', accountId: 'ACC-002', action: 'LIQUIDATE_BIGGEST', marginLevelAtEvent: 93.1, timestamp: '2026-05-22T09:05:33Z' },
  { symbol: 'EURUSD',  accountId: 'ACC-001', action: 'LIQUIDATE_ALL',      marginLevelAtEvent: 74.8, timestamp: '2026-05-21T16:44:07Z' },
];

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const h = Math.floor(ms / 3_600_000);
  if (h < 1) return `${Math.floor(ms / 60_000)}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function AutoLiquidationStatus({ brokerId }: { brokerId: string }) {
  // TODO: replace mock with GET /admin/risk/liquidation-history?brokerId=X&limit=5
  const events = MOCK_LIQUIDATION_HISTORY;

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-obsidian-accent" />
          <p className="card-title">Auto-Liquidation History</p>
        </div>
        <span className="badge badge-muted text-[10px]">{events.length} recent events</span>
      </div>
      {events.length === 0 ? (
        <p className="py-4 text-center text-[12px] text-fg3">No liquidation events</p>
      ) : (
        <div className="space-y-2 px-4 pb-4">
          {events.map((ev, i) => {
            const isRecent = Date.now() - new Date(ev.timestamp).getTime() < 86_400_000; // 24h
            return (
              <div key={i} className={`flex items-center justify-between rounded border px-3 py-2 ${isRecent ? 'border-bear/30 bg-bear/5' : 'border-[var(--border)] bg-[var(--bg-elevated)]'}`}>
                <div className="flex items-center gap-3">
                  <span className={`h-2 w-2 rounded-full ${isRecent ? 'bg-bear animate-pulse' : 'bg-fg3/40'}`} />
                  <span className="mono-cell text-[11px] font-bold text-fg1">{ev.symbol}</span>
                  <span className="mono-cell text-[10px] text-fg3">{ev.accountId}</span>
                </div>
                <div className="flex items-center gap-3">
                  {isRecent && (
                    <span className="badge badge-bear text-[9px]">
                      LIQUIDATION: {ev.action} at ML {ev.marginLevelAtEvent.toFixed(1)}%
                    </span>
                  )}
                  {!isRecent && (
                    <span className="text-[10px] text-fg3">
                      {ev.action} · ML {ev.marginLevelAtEvent.toFixed(1)}% · {timeAgo(ev.timestamp)}
                    </span>
                  )}
                  {!isRecent && (
                    <span className="mono-cell text-[10px] text-fg3">{timeAgo(ev.timestamp)}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── CIRCUIT BREAKER STATUS ──────────────────────────────────────────────────

type CBStatus = 'ACTIVE' | 'HALTED';

interface CircuitBreakerEntry {
  symbol: string;
  status: CBStatus;
  triggeredAt?: string;
  reason?: string;
}

const MOCK_CIRCUIT_BREAKERS: CircuitBreakerEntry[] = [
  { symbol: 'NIFTY',    status: 'ACTIVE',  triggeredAt: undefined, reason: undefined },
  { symbol: 'RELIANCE', status: 'ACTIVE' },
  { symbol: 'BANKNIFTY', status: 'HALTED', triggeredAt: '2026-05-24T10:00:00Z', reason: '±10% circuit' },
  { symbol: 'EURUSD',  status: 'ACTIVE' },
  { symbol: 'XAUUSD',  status: 'HALTED',  triggeredAt: '2026-05-24T09:30:00Z', reason: 'Vol spike halt' },
  { symbol: 'BTCUSD',  status: 'ACTIVE' },
];

const CB_STATUS_LABEL: Record<CBStatus, { dot: string; text: string; badge: string }> = {
  ACTIVE:  { dot: 'bg-bull', text: 'text-bull', badge: 'badge badge-bull' },
  HALTED:  { dot: 'bg-warn', text: 'text-warn', badge: 'badge badge-warn' },
};

function CircuitBreakerStatus() {
  // TODO: replace mock with GET /admin/risk/circuit-breakers
  const haltedCount = MOCK_CIRCUIT_BREAKERS.filter(c => c.status === 'HALTED').length;

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-obsidian-accent" />
          <p className="card-title">Circuit Breaker Status</p>
        </div>
        {haltedCount > 0 && (
          <span className="badge badge-warn text-[10px]">{haltedCount} halted</span>
        )}
      </div>
      <div className="flex flex-wrap gap-2 px-4 pb-4">
        {MOCK_CIRCUIT_BREAKERS.map(cb => {
          const { dot, text, badge } = CB_STATUS_LABEL[cb.status];
          return (
            <div key={cb.symbol} className={`flex items-center gap-2 rounded border px-3 py-1.5 ${cb.status === 'HALTED' ? 'border-warn/30 bg-warn/5' : 'border-[var(--border)] bg-[var(--bg-elevated)]'}`}>
              <span className={`h-2 w-2 rounded-full ${dot}`} />
              <span className="mono-cell text-[11px] font-bold text-fg1">{cb.symbol}</span>
              <span className={`${badge} text-[9px]`}>{cb.status}</span>
              {cb.status === 'HALTED' && cb.triggeredAt && (
                <span className="text-[9px] text-warn/80">{timeAgo(cb.triggeredAt)}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MarginAlertBanner({ level }: { level: number }) {
  if (level < 80) {
    return (
      <div className="flex items-start gap-3 rounded-r-lg border border-bear/30 bg-bear/10 px-4 py-3">
        <AlertCircle size={16} className="mt-0.5 shrink-0 text-bear" />
        <div>
          <p className="text-[12px] font-semibold text-bear">CRITICAL: Auto-liquidation triggered at {level.toFixed(1)}% margin level</p>
          <p className="text-[11px] text-bear/80">Immediate dealer intervention required</p>
        </div>
      </div>
    );
  }
  if (level < 110) {
    return (
      <div className="flex items-start gap-3 rounded-r-lg border border-warn/30 bg-warn/10 px-4 py-3">
        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warn" />
        <div>
          <p className="text-[12px] font-semibold text-warn">Warning: Margin level at {level.toFixed(1)}%</p>
          <p className="text-[11px] text-warn/80">Approaching minimum maintenance level</p>
        </div>
      </div>
    );
  }
  return null;
}

// ─── RISK THRESHOLD CRUD ──────────────────────────────────────────────────────

const METRIC_LABELS: Record<RiskThresholdMetric, string> = {
  MARGIN_LEVEL:    'Margin Level',
  EXPOSURE:        'Net Exposure',
  OPEN_ORDERS:     'Open Orders',
  DELTA:           'Delta',
  GAMMA:           'Gamma',
  POSITION_LIMIT:  'Position Limit',
};

const OPERATOR_LABELS: Record<RiskOperator, string> = {
  GT:  '>',
  GTE: '>=',
  LT:  '<',
  LTE: '<=',
  EQ:  '=',
};

const ACTION_LABELS: Record<RiskAction, string> = {
  ALERT:              'Alert',
  FREEZE_ACCOUNT:     'Freeze Account',
  LIQUIDATE_ALL:      'Liquidate All',
  LIQUIDATE_BIGGEST:  'Liquidate Largest',
  CIRCUIT_BREAKER:    'Circuit Breaker',
};

function ThresholdRow({ threshold }: { threshold: RiskThreshold }) {
  return (
    <tr>
      <td className="mono-cell text-[11px]">{METRIC_LABELS[threshold.metric] ?? threshold.metric}</td>
      <td className="mono-cell text-[11px]">{OPERATOR_LABELS[threshold.operator]} {threshold.thresholdValue}</td>
      <td className="text-[11px]">{ACTION_LABELS[threshold.action]}</td>
      <td>
        <span className={`badge ${threshold.enabled ? 'badge-bull' : 'badge-muted'}`}>
          {threshold.enabled ? 'Active' : 'Disabled'}
        </span>
      </td>
    </tr>
  );
}

function ThresholdModal({ onClose, onSave, saving, tenantId }: {
  onClose: () => void;
  onSave: (data: { metric: RiskThresholdMetric; operator: RiskOperator; thresholdValue: string; action: RiskAction; enabled: boolean }) => void;
  saving?: boolean;
  tenantId: string;
}) {
  const [data, setData] = useState({
    metric: 'MARGIN_LEVEL' as RiskThresholdMetric,
    operator: 'LT' as RiskOperator,
    thresholdValue: '100',
    action: 'ALERT' as RiskAction,
    enabled: true,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="w-[420px] rounded-r-lg border border-[var(--border)] bg-[var(--bg-panel)]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <p className="module-title">Add Risk Threshold</p>
          <button onClick={onClose} className="btn-ghost btn btn-xs p-1.5"><X size={14} /></button>
        </div>
        <div className="space-y-4 px-5 py-4">
          {/* Metric */}
          <div>
            <label className="kpi-label mb-1 block">Metric</label>
            <select
              className="input"
              value={data.metric}
              onChange={e => setData(d => ({ ...d, metric: e.target.value as RiskThresholdMetric }))}
            >
              {(Object.keys(METRIC_LABELS) as RiskThresholdMetric[]).map(k => (
                <option key={k} value={k}>{METRIC_LABELS[k]}</option>
              ))}
            </select>
          </div>
          {/* Operator */}
          <div>
            <label className="kpi-label mb-1 block">Operator</label>
            <select
              className="input"
              value={data.operator}
              onChange={e => setData(d => ({ ...d, operator: e.target.value as RiskOperator }))}
            >
              {(Object.keys(OPERATOR_LABELS) as RiskOperator[]).map(k => (
                <option key={k} value={k}>{OPERATOR_LABELS[k]}</option>
              ))}
            </select>
          </div>
          {/* Threshold Value */}
          <div>
            <label className="kpi-label mb-1 block">Threshold Value</label>
            <input
              className="input"
              type="number"
              value={data.thresholdValue}
              onChange={e => setData(d => ({ ...d, thresholdValue: e.target.value }))}
            />
          </div>
          {/* Action */}
          <div>
            <label className="kpi-label mb-1 block">Action</label>
            <select
              className="input"
              value={data.action}
              onChange={e => setData(d => ({ ...d, action: e.target.value as RiskAction }))}
            >
              {(Object.keys(ACTION_LABELS) as RiskAction[]).map(k => (
                <option key={k} value={k}>{ACTION_LABELS[k]}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="accent-accent" checked={data.enabled} onChange={e => setData(d => ({ ...d, enabled: e.target.checked }))} />
            <span className="text-[12px] text-fg2">Enabled</span>
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t border-[var(--border)] px-5 py-3">
          <button className="btn-ghost btn btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn-primary btn btn-sm" onClick={() => onSave(data)} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}

export default function ExposureLimitsPage() {
  const { limits, isLoading, refetch, updateLimit } = useExposureLimits();
  const brokerId = 'default'; // TODO: replace with actual brokerId from auth context
  const tenantId = 'default'; // TODO(todo-fix): replace with actual tenantId from auth context
  const { marginLevel } = useRiskExposure(brokerId);
  const { thresholds } = useRiskThresholds(tenantId);

  const [editing, setEditing] = useState<ExposureLimit | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [thresholdModalOpen, setThresholdModalOpen] = useState(false);
  const { createThreshold, isPending: thresholdSaving } = useCreateRiskThreshold();

  const breached = useMemo(() => limits.filter(l => l.status === 'Breach'), [limits]);
  const warned   = useMemo(() => limits.filter(l => l.status === 'Warning'), [limits]);

  const handleSave = async (updated: ExposureLimit) => {
    setSaving(true);
    setSaveError(null);
    try {
      await updateLimit(updated.id, {
        maxNetExposure: updated.maxNetExposure,
        alertThreshold: updated.alertThreshold,
        hardLimit: updated.hardLimit,
      });
      setEditing(null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save limit');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateThreshold = async (data: { metric: RiskThresholdMetric; operator: RiskOperator; thresholdValue: string; action: RiskAction; enabled: boolean }) => {
    try {
      await createThreshold({ tenantId, ...data, thresholdValue: +data.thresholdValue });
      setThresholdModalOpen(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to create threshold');
    }
  };

  return (
    <div className="flex flex-col">
      <div className="module-header">
        <div>
          <p className="module-title">Exposure Limits</p>
          <p className="module-subtitle">
            {limits.length} symbols ·{' '}
            {breached.length > 0 && <span className="text-bear">{breached.length} breach{breached.length !== 1 ? 'es' : ''} · </span>}
            {warned.length > 0 && <span className="text-warn">{warned.length} warning{warned.length !== 1 ? 's' : ''}</span>}
            {breached.length === 0 && warned.length === 0 && <span className="text-bull">All Normal</span>}
          </p>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Margin level section */}
        {marginLevel > 0 && (
          <div className="kpi-card">
            <div className="flex items-center justify-between mb-3">
              <p className="kpi-label">Portfolio Margin Level</p>
              {marginLevel < 100 && (
                <span className="h-2 w-2 animate-pulse rounded-full bg-bear" />
              )}
            </div>
            <div className="flex items-center gap-6">
              <MarginLevelGauge level={marginLevel} />
              <MarginAlertBanner level={marginLevel} />
            </div>
          </div>
        )}

        {/* Auto-Liquidation Status */}
        <AutoLiquidationStatus brokerId={brokerId} />

        {/* Circuit Breaker Status */}
        <CircuitBreakerStatus />

        {/* Alert banners */}
        {breached.length > 0 && (
          <div className="flex items-start gap-3 rounded-r-lg border border-bear/30 bg-bear/10 px-4 py-3">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-bear" />
            <div>
              <p className="text-[12px] font-semibold text-bear">Hard Limit Breached</p>
              <p className="text-[11px] text-bear/80">{breached.map(b => b.symbol).join(', ')} — immediate dealer review required</p>
            </div>
          </div>
        )}
        {warned.length > 0 && (
          <div className="flex items-start gap-3 rounded-r-lg border border-warn/30 bg-warn/10 px-4 py-3">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warn" />
            <div>
              <p className="text-[12px] font-semibold text-warn">Alert Threshold Reached</p>
              <p className="text-[11px] text-warn/80">{warned.map(w => w.symbol).join(', ')} — approaching hard limit</p>
            </div>
          </div>
        )}

        {/* Utilization gauge grid */}
        <div className="grid grid-cols-3 gap-3">
          {limits.map(l => (
            <div key={l.id} className="kpi-card">
              <div className="flex items-center justify-between">
                <p className="kpi-label">{l.symbol}</p>
                <span className={`h-2 w-2 rounded-full ${STATUS_COLOR[l.status]}`} />
              </div>
              <UtilBar pct={l.utilizationPct} status={l.status} />
              <div className="kpi-bottom">
                <div className="kpi-sub">
                  ${l.currentNetExposure.toLocaleString()} / ${l.maxNetExposure.toLocaleString()}
                </div>
                <button className="btn-ghost btn btn-xs" onClick={() => setEditing(l)}>
                  <Edit2 size={10} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Detail table */}
        <div className="card overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Current Exposure</th>
                <th>Max Exposure</th>
                <th>Utilization</th>
                <th>Alert Threshold</th>
                <th>Hard Limit</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {limits.map(l => (
                <tr key={l.id}>
                  <td className="mono-cell font-bold text-[13px]">{l.symbol}</td>
                  <td className={`mono-cell font-bold text-[12px] ${STATUS_TEXT[l.status]}`}>
                    ${l.currentNetExposure.toLocaleString()}
                  </td>
                  <td className="mono-cell text-[12px] text-fg2">${l.maxNetExposure.toLocaleString()}</td>
                  <td><UtilBar pct={l.utilizationPct} status={l.status} /></td>
                  <td className="mono-cell text-[11px] text-warn">{l.alertThreshold}%</td>
                  <td className="mono-cell text-[11px] text-bear">{l.hardLimit}%</td>
                  <td>
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_COLOR[l.status]}`} />
                      <span className={STATUS_TEXT[l.status]}>{l.status}</span>
                    </span>
                  </td>
                  <td>
                    <button className="btn-ghost btn btn-xs" onClick={() => setEditing(l)}>
                      <Edit2 size={11} /> Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Risk Thresholds section */}
        <div className="card">
          <div className="card-header">
            <div>
              <p className="card-title">Risk Thresholds</p>
              <p className="mt-0.5 text-[11px] text-fg3">{thresholds.length} rule{thresholds.length !== 1 ? 's' : ''} configured</p>
            </div>
            <button className="btn-primary btn btn-sm" onClick={() => setThresholdModalOpen(true)}>
              <Plus size={12} /> Add Threshold
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Condition</th>
                  <th>Action</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {thresholds.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-[12px] text-fg3">No thresholds configured</td>
                  </tr>
                ) : thresholds.map(t => (
                  <ThresholdRow key={t.id} threshold={t} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {editing && (
        <EditLimitModal
          limit={editing}
          onClose={() => { setEditing(null); setSaveError(null); }}
          onSave={handleSave}
          saving={saving}
        />
      )}
      {thresholdModalOpen && (
        <ThresholdModal
          tenantId={tenantId}
          onClose={() => setThresholdModalOpen(false)}
          onSave={handleCreateThreshold}
          saving={thresholdSaving}
        />
      )}
      {saveError && (
        <div className="mx-6 rounded border border-bear/40 bg-bear/5 px-4 py-2">
          <p className="text-[11px] text-bear">{saveError}</p>
        </div>
      )}
    </div>
  );
}
