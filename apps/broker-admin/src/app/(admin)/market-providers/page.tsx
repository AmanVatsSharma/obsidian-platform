/**
 * File:        apps/broker-admin/src/app/(admin)/market-providers/page.tsx
 * Module:      broker-admin · Market Data Providers
 * Purpose:     Enterprise provider management — configure Kite, Alpaca, Binance,
 *              sync instruments, monitor health.
 *
 * Exports:
 *   - default (MarketProvidersPage) — provider config and status
 *
 * Depends on:
 *   - @/lib/types — DataProvider, Exchange
 *   - mock data for demo
 *
 * Key invariants:
 *   - Kite credentials stored encrypted in production
 *   - Token refresh daily at midnight IST
 *   - Provider health monitoring every 30s
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-09
 */

'use client';

import { useState, useCallback } from 'react';
import { Settings, Save, RefreshCw, Check, X, AlertTriangle, Loader2, ExternalLink, Key, Database, Activity } from 'lucide-react';
import type { DataProvider, Exchange } from '@/lib/types';

// Mock data for demo
const MOCK_PROVIDERS: DataProvider[] = [
  {
    id: 'kite',
    code: 'KITE',
    name: 'Zerodha Kite Connect',
    providerType: 'both',
    exchanges: ['NSE', 'BSE', 'MCX', 'NFO', 'CDS'],
    status: 'Connected',
    lastHealthCheck: '2026-06-09T12:34:00Z',
    latency: 45,
    instrumentCount: 8434,
  },
  {
    id: 'alpaca',
    code: 'ALPACA',
    name: 'Alpaca Markets',
    providerType: 'both',
    exchanges: ['NASDAQ', 'NYSE', 'CRYPTO'],
    status: 'Disconnected',
    instrumentCount: 0,
  },
  {
    id: 'binance',
    code: 'BINANCE',
    name: 'Binance',
    providerType: 'data',
    exchanges: ['CRYPTO'],
    status: 'Connected',
    lastHealthCheck: '2026-06-09T12:33:45Z',
    latency: 23,
    instrumentCount: 456,
  },
];

const MOCK_EXCHANGES: Exchange[] = [
  { id: 'nse', code: 'NSE', name: 'National Stock Exchange', segment: 'ALL', status: 'Active', dataProviderCode: 'KITE', executionProviderCode: 'KITE' },
  { id: 'bse', code: 'BSE', name: 'Bombay Stock Exchange', segment: 'EQUITY', status: 'Active', dataProviderCode: 'KITE' },
  { id: 'mex', code: 'MCX', name: 'Multi Commodity Exchange', segment: 'COM', status: 'Active', dataProviderCode: 'KITE' },
  { id: 'nasdaq', code: 'NASDAQ', name: 'NASDAQ', segment: 'ALL', status: 'Suspended', dataProviderCode: 'ALPACA' },
];

function StatusBadge({ status }: { status: DataProvider['status'] }) {
  const colors = {
    Connected: 'bg-bull/20 text-bull',
    Disconnected: 'bg-fg3/20 text-fg3',
    Error: 'bg-bear/20 text-bear',
  };
  const icons = {
    Connected: <Check size={10} />,
    Disconnected: <X size={10} />,
    Error: <AlertTriangle size={10} />,
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${colors[status]}`}>
      {icons[status]} {status}
    </span>
  );
}

function ProviderConfigModal({
  provider,
  onClose,
  onSave,
}: {
  provider: DataProvider;
  onClose: () => void;
  onSave: (p: DataProvider) => void;
}) {
  const [form, setForm] = useState<Partial<DataProvider>>({
    ...provider,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="w-[520px] rounded-lg border border-[var(--border)] bg-[var(--bg-panel)]" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-accent/20 flex items-center justify-center">
              <Key size={16} className="text-accent" />
            </div>
            <div>
              <p className="font-mono font-bold text-fg1">{provider.code}</p>
              <p className="text-[11px] text-fg3">{provider.name}</p>
            </div>
          </div>
          <StatusBadge status={provider.status} />
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {provider.code === 'KITE' && (
            <>
              <div>
                <label className="kpi-label">API Key</label>
                <input
                  className="input"
                  type="text"
                  placeholder="xxxxxxxxxxxxx"
                  defaultValue=""
                />
              </div>
              <div>
                <label className="kpi-label">API Secret</label>
                <input
                  className="input"
                  type="password"
                  placeholder="••••••••••••"
                  defaultValue=""
                />
              </div>
              <div>
                <label className="kpi-label">Access Token</label>
                <input
                  className="input"
                  type="password"
                  placeholder="••••••••••••"
                  defaultValue=""
                />
                <p className="text-[10px] text-fg3 mt-1">
                  Access token expires daily at midnight IST. Re-login to generate new token.
                </p>
              </div>
              <div>
                <label className="kpi-label">Refresh Token</label>
                <input
                  className="input"
                  type="password"
                  placeholder="••••••••••••"
                  defaultValue=""
                />
              </div>
            </>
          )}

          {provider.code !== 'KITE' && (
            <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]">
              <p className="text-[12px] text-fg2">Configuration for {provider.code} coming soon</p>
            </div>
          )}

          {/* Mapped Exchanges */}
          <div>
            <label className="kpi-label mb-2">Mapped Exchanges</label>
            <div className="flex flex-wrap gap-2">
              {provider.exchanges.map(ex => (
                <span key={ex} className="px-2 py-1 rounded bg-[var(--bg-elevated)] text-[11px] text-fg2 font-mono">
                  {ex}
                </span>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[var(--border)]">
            <div>
              <p className="text-[10px] text-fg3">Latency</p>
              <p className="font-mono text-[18px] text-fg1">{provider.latency ?? '-'}ms</p>
            </div>
            <div>
              <p className="text-[10px] text-fg3">Instruments</p>
              <p className="font-mono text-[18px] text-fg1">{provider.instrumentCount?.toLocaleString() ?? '-'}</p>
            </div>
            <div>
              <p className="text-[10px] text-fg3">Last Check</p>
              <p className="font-mono text-[11px] text-fg2">
                {provider.lastHealthCheck
                  ? new Date(provider.lastHealthCheck).toLocaleTimeString()
                  : 'Never'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-[var(--border)] px-5 py-3">
          <button className="btn-ghost btn btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn-primary btn btn-sm" onClick={() => onSave(form as DataProvider)}>
            <Save size={12} /> Save Credentials
          </button>
        </div>
      </div>
    </div>
  );
}

function ExchangeCard({ exchange }: { exchange: Exchange }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${exchange.status === 'Active' ? 'bg-bull' : 'bg-warn'}`} />
        <div>
          <p className="font-mono text-[13px] font-bold text-fg1">{exchange.code}</p>
          <p className="text-[10px] text-fg3">{exchange.name}</p>
        </div>
      </div>
      <div className="flex items-center gap-4 text-[11px]">
        <span className="text-fg2">{exchange.segment}</span>
        <span className="text-fg3">{exchange.dataProviderCode || '-'}</span>
      </div>
    </div>
  );
}

export default function MarketProvidersPage() {
  const [providers] = useState<DataProvider[]>(MOCK_PROVIDERS);
  const [exchanges] = useState<Exchange[]>(MOCK_EXCHANGES);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [modal, setModal] = useState<DataProvider | null>(null);

  const handleSync = useCallback(async (providerCode: string) => {
    setSyncing(providerCode);
    // Simulate sync
    setTimeout(() => {
      setSyncing(null);
    }, 2000);
  }, []);

  const handleSave = useCallback((provider: DataProvider) => {
    setModal(null);
    // Persistence is a v2 concern — see apps/broker-admin/docs/admin-v1-scope.md
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console -- dev-only debug
      console.debug('[market-providers] save (no-op in v1):', provider.code);
    }
  }, []);

  return (
    <div className="flex flex-col">
      <div className="module-header">
        <div>
          <p className="module-title">Market Data Providers</p>
          <p className="module-subtitle">
            Configure data streams, sync instruments, monitor connection health
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-primary btn btn-sm">
            <Settings size={12} /> Add Provider
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Providers Grid */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {providers.map(provider => (
            <div
              key={provider.code}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-panel)] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${provider.status === 'Connected' ? 'bg-bull' : 'bg-fg3'}`} />
                  <p className="font-mono font-bold text-fg1">{provider.code}</p>
                </div>
                <StatusBadge status={provider.status} />
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <p className="text-[11px] text-fg3">{provider.name}</p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-fg3">Latency</p>
                    <p className="font-mono text-[16px] text-bull">
                      {provider.latency ?? '-'}ms
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-fg3">Instruments</p>
                    <p className="font-mono text-[16px] text-fg1">
                      {provider.instrumentCount?.toLocaleString() ?? '0'}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] text-fg3 mb-1">Exchanges</p>
                  <div className="flex flex-wrap gap-1">
                    {provider.exchanges.map(ex => (
                      <span key={ex} className="px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] text-[10px] font-mono">
                        {ex}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-[var(--border)]">
                  <button
                    className="btn-ghost btn btn-xs flex-1"
                    onClick={() => setModal(provider)}
                  >
                    <Key size={10} /> Config
                  </button>
                  <button
                    className="btn-ghost btn btn-xs flex-1"
                    onClick={() => handleSync(provider.code)}
                    disabled={syncing === provider.code}
                  >
                    {syncing === provider.code ? (
                      <Loader2 size={10} className="animate-spin" />
                    ) : (
                      <RefreshCw size={10} />
                    )}
                    {syncing === provider.code ? 'Syncing...' : 'Sync'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Exchanges Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-bold text-fg1 flex items-center gap-2">
              <Database size={14} /> Exchange Mappings
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {exchanges.map(exchange => (
              <ExchangeCard key={exchange.id} exchange={exchange} />
            ))}
          </div>
        </div>

        {/* Kite Setup Guide */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
          <h3 className="text-[13px] font-bold text-fg1 mb-3 flex items-center gap-2">
            <ExternalLink size={14} /> Kite Connect Setup Guide
          </h3>
          <ol className="text-[11px] text-fg2 space-y-2 list-decimal list-inside">
            <li>
              <a href="#" className="text-accent hover:underline">Login to Kite</a> and go to Apps → Developers → Create new app
            </li>
            <li>
              Generate API Key and API Secret
            </li>
            <li>
              Use the <span className="font-mono">request_token</span> flow to get access_token:
              <br />
              <code className="text-[10px] text-fg3">POST /api/login?api_key=xxx&secret=xxx&request_token=X</code>
            </li>
            <li>
              Enter PIN to generate access_token (expires at midnight IST)
            </li>
            <li>
              Save credentials in the config form above
            </li>
          </ol>
          <p className="text-[10px] text-warn mt-3 flex items-center gap-1">
            <AlertTriangle size={10} />
            Access token expires daily at midnight IST — re-login and update token daily
          </p>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <ProviderConfigModal
          provider={modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}