/**
 * File:        apps/broker-admin/src/app/(admin)/instruments/page.tsx
 * Module:      broker-admin · Trading · Instruments
 * Purpose:     Enterprise instrument management with multi-exchange, multi-segment,
 *              provider filtering, bulk operations, and inline editing.
 *
 * Exports:
 *   - default (InstrumentsPage) — instruments table with filters and controls
 *
 * Depends on:
 *   - @/lib/mock-data-context — useBrokerData() for instruments list
 *   - @/lib/types — Instrument, InstrumentSegment, Exchange, DataProvider
 *
 * Side-effects:
 *   - Local useState copy of instruments (mutations don't persist to context)
 *
 * Key invariants:
 *   - Exchange + Segment filters enable multi-exchange platform control
 *   - Provider column shows data provider for each instrument
 *   - Inline edits staged and batch-saved; Escape discards
 *   - Modal uses local copy; saved back on confirm
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-09
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { Settings, Save, RotateCcw, Plus, RefreshCw, Download, Upload } from 'lucide-react';
import { useBrokerData } from '@/lib/mock-data-context';
import type { Instrument, AssetClass, InstrumentSegment, Exchange, DataProvider } from '@/lib/types';

const ASSET_CLASSES: (AssetClass | 'All')[] = ['All', 'Forex', 'Crypto', 'Indices', 'Commodities', 'Stocks', 'ETF'];
const SEGMENTS: (InstrumentSegment | 'All')[] = ['All', 'EQ', 'FNO', 'COM', 'CDS', 'FX', 'CRYPTO', 'INDEX'];
const EXCHANGES: (string | 'All')[] = ['All', 'NSE', 'BSE', 'MCX', 'NASDAQ', 'NYSE'];
const PROVIDERS: (string | 'All')[] = ['All', 'KITE', 'ALPACA', 'BINANCE'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MODAL_TABS = ['General', 'Pricing', 'Leverage', 'Sessions', 'Swaps'] as const;

type UnsavedKey = `${string}.${keyof Instrument}`;

function StatusDot({ status }: { status: Instrument['status'] }) {
  const color = status === 'Active' ? 'bg-bull' : status === 'Halted' ? 'bg-warn' : 'bg-[var(--fg3)]';
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${color}`} />;
}

function EditModal({ instrument, onClose, onSave }: {
  instrument: Instrument;
  onClose: () => void;
  onSave: (updated: Instrument) => void;
}) {
  const [tab, setTab] = useState<typeof MODAL_TABS[number]>('General');
  const [data, setData] = useState<Instrument>({ ...instrument });
  const set = <K extends keyof Instrument>(k: K, v: Instrument[K]) => setData(d => ({ ...d, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="flex w-[580px] flex-col rounded-r-lg border border-[var(--border)] bg-[var(--bg-panel)] shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border)] px-5 py-4">
          <div>
            <p className="font-mono text-[15px] font-bold text-fg1">{data.symbol}</p>
            <p className="text-[11px] text-fg3">{data.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => set('status', data.status === 'Active' ? 'Disabled' : 'Active')}
                className={`relative h-5 w-9 rounded-full transition-colors ${data.status === 'Active' ? 'bg-bull/30' : 'bg-[var(--border-md)]'}`}
              >
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${data.status === 'Active' ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
              <span className="text-[11px] text-fg3">{data.status}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="chart-tabs m-4 mb-0">
          {MODAL_TABS.map(t => (
            <button key={t} className={`chart-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>

        {/* Content */}
        <div className="max-h-[420px] overflow-y-auto px-5 py-4">
          {tab === 'General' && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {[['Symbol', 'symbol', 'text'] as const, ['Name', 'name', 'text'] as const].map(([l, f, t]) => (
                <div key={f}>
                  <label className="kpi-label mb-1 block">{l}</label>
                  <input className="input" type={t} value={data[f] as string}
                    onChange={e => set(f, e.target.value as never)} />
                </div>
              ))}
              <div>
                <label className="kpi-label mb-1 block">Asset Class</label>
                <select className="input" value={data.assetClass}
                  onChange={e => set('assetClass', e.target.value as AssetClass)}>
                  {ASSET_CLASSES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="kpi-label mb-1 block">Digits</label>
                <input className="input" type="number" value={data.digits} onChange={e => set('digits', +e.target.value)} />
              </div>
              {[['Min Lot', 'minLot'], ['Max Lot', 'maxLot'], ['Lot Step', 'lotStep'], ['Contract Size', 'contractSize']].map(([l, f]) => (
                <div key={f}>
                  <label className="kpi-label mb-1 block">{l}</label>
                  <input className="input" type="number" value={data[f as keyof Instrument] as number}
                    onChange={e => set(f as keyof Instrument, +e.target.value as never)} />
                </div>
              ))}
            </div>
          )}

          {tab === 'Pricing' && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <label className="kpi-label mb-1 block">Spread Type</label>
                <select className="input" value={data.spreadType}
                  onChange={e => set('spreadType', e.target.value as 'Fixed' | 'Variable')}>
                  <option>Fixed</option><option>Variable</option>
                </select>
              </div>
              <div>
                <label className="kpi-label mb-1 block">Spread (pips)</label>
                <input className="input" type="number" value={data.spread} onChange={e => set('spread', +e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="kpi-label mb-1 block">Commission Markup (pips)</label>
                <input className="input" type="number" defaultValue={0.2} />
              </div>
              {[['Slippage Model', ['None', 'Market', 'Up to 2 pips', 'Up to 5 pips']],
                ['Commission Type', ['None', 'Per lot', 'Per trade', '% Notional']]].map(([l, opts]) => (
                <div key={l as string}>
                  <label className="kpi-label mb-1 block">{l as string}</label>
                  <select className="input">
                    {(opts as string[]).map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}

          {tab === 'Leverage' && (
            <div>
              <p className="kpi-label mb-3">Per-Group Leverage Overrides</p>
              {[['Retail', '1:100'], ['Professional', '1:200'], ['VIP', '1:500']].map(([group, def]) => (
                <div key={group} className="flex items-center gap-4 border-b border-[var(--border)] py-2.5">
                  <span className="w-28 text-[12px] font-medium text-fg2">{group}</span>
                  <select className="input w-28" defaultValue={def}>
                    {[2, 5, 10, 20, 30, 50, 100, 200, 500].map(l => <option key={l}>1:{l}</option>)}
                  </select>
                  <span className="text-[11px] text-fg3">Max leverage</span>
                </div>
              ))}
              <div className="mt-4 grid grid-cols-3 gap-x-4 gap-y-3">
                {[['Initial Margin %', '1'], ['Maintenance %', '0.5'], ['Stop-Out %', '20']].map(([l, def]) => (
                  <div key={l}>
                    <label className="kpi-label mb-1 block">{l}</label>
                    <input className="input" type="number" defaultValue={def} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'Sessions' && (
            <div>
              <p className="kpi-label mb-3">Weekly Trading Schedule (UTC)</p>
              {DAYS.map(day => (
                <div key={day} className="flex items-center gap-3 border-b border-[var(--border)] py-2">
                  <span className="w-8 text-[12px] text-fg2">{day}</span>
                  {['Sat', 'Sun'].includes(day) ? (
                    <span className="flex items-center gap-2 text-[11px] text-fg3">
                      <input type="checkbox" defaultChecked={false} className="accent-accent" /> Closed
                    </span>
                  ) : (
                    <>
                      <input className="input w-24" type="time" defaultValue="00:00" />
                      <span className="text-[11px] text-fg3">to</span>
                      <input className="input w-24" type="time" defaultValue="23:59" />
                      <button className="btn-ghost btn btn-xs">+ Break</button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === 'Swaps' && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <label className="kpi-label mb-1 block">Swap Long (per lot/night)</label>
                <input className="input" type="number" value={data.swapLong} onChange={e => set('swapLong', +e.target.value)} />
              </div>
              <div>
                <label className="kpi-label mb-1 block">Swap Short (per lot/night)</label>
                <input className="input" type="number" value={data.swapShort} onChange={e => set('swapShort', +e.target.value)} />
              </div>
              <div>
                <label className="kpi-label mb-1 block">Triple Swap Day</label>
                <select className="input"><option>Wednesday</option><option>Friday</option></select>
              </div>
              <div>
                <label className="kpi-label mb-1 block">Swap Type</label>
                <select className="input"><option>Pips</option><option>Percentage</option><option>Flat fee</option></select>
              </div>
              <div className="col-span-2">
                <div className="flex items-center gap-3 rounded-r-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
                  <button className="relative h-5 w-9 rounded-full bg-[var(--border-md)]">
                    <span className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow" />
                  </button>
                  <div>
                    <p className="text-[12px] font-medium text-fg1">Swap-free (Islamic accounts)</p>
                    <p className="text-[10px] text-fg3">Enable for clients with Islamic account type</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-[var(--border)] px-5 py-3">
          <button className="btn-ghost btn btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn-primary btn btn-sm" onClick={() => { onSave(data); onClose(); }}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

export default function InstrumentsPage() {
  const { instruments: initialInstruments } = useBrokerData();
  const [instruments, setInstruments] = useState<Instrument[]>([...initialInstruments]);

  // Multi-filter state for enterprise support
  const [assetClassFilter, setAssetClassFilter] = useState<AssetClass | 'All'>('All');
  const [exchangeFilter, setExchangeFilter] = useState<string | 'All'>('All');
  const [segmentFilter, setSegmentFilter] = useState<InstrumentSegment | 'All'>('All');
  const [providerFilter, setProviderFilter] = useState<string | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<Instrument['status'] | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [unsaved, setUnsaved] = useState<Partial<Record<UnsavedKey, number>>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [modal, setModal] = useState<Instrument | null>(null);

  // Multi-filter logic
  const displayed = useMemo(() => {
    let result = instruments;

    if (assetClassFilter !== 'All') {
      result = result.filter(i => i.assetClass === assetClassFilter);
    }
    if (exchangeFilter !== 'All') {
      result = result.filter(i => i.exchange === exchangeFilter);
    }
    if (segmentFilter !== 'All') {
      result = result.filter(i => i.segment === segmentFilter);
    }
    if (providerFilter !== 'All') {
      result = result.filter(i => i.providerCode === providerFilter);
    }
    if (statusFilter !== 'All') {
      result = result.filter(i => i.status === statusFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i =>
        i.symbol.toLowerCase().includes(q) ||
        i.name.toLowerCase().includes(q)
      );
    }

    return result;
  }, [instruments, assetClassFilter, exchangeFilter, segmentFilter, providerFilter, statusFilter, searchQuery]);

  // Stats for filter tabs
  const stats = useMemo(() => {
    return {
      total: instruments.length,
      active: instruments.filter(i => i.status === 'Active').length,
      disabled: instruments.filter(i => i.status === 'Disabled').length,
      halted: instruments.filter(i => i.status === 'Halted').length,
      byExchange: {
        NSE: instruments.filter(i => i.exchange === 'NSE').length,
        BSE: instruments.filter(i => i.exchange === 'BSE').length,
        MCX: instruments.filter(i => i.exchange === 'MCX').length,
      },
      bySegment: {
        EQ: instruments.filter(i => i.segment === 'EQ').length,
        FNO: instruments.filter(i => i.segment === 'FNO').length,
        COM: instruments.filter(i => i.segment === 'COM').length,
      },
    };
  }, [instruments]);

  const getVal = (inst: Instrument, field: keyof Instrument): number => {
    const key = `${inst.symbol}.${field}` as UnsavedKey;
    return (key in unsaved ? unsaved[key] : inst[field]) as number;
  };

  const stageEdit = (symbol: string, field: keyof Instrument, value: number) => {
    setUnsaved(u => ({ ...u, [`${symbol}.${field}`]: value }));
  };

  const saveAll = () => {
    setInstruments(prev => prev.map(inst => {
      const updates: Partial<Instrument> = {};
      (Object.keys(unsaved) as UnsavedKey[]).forEach(k => {
        const [sym, field] = k.split('.') as [string, keyof Instrument];
        if (sym === inst.symbol) (updates as Record<string, unknown>)[field] = unsaved[k];
      });
      return Object.keys(updates).length ? { ...inst, ...updates } : inst;
    }));
    setUnsaved({});
  };

  const toggleStatus = useCallback((symbol: string) => {
    setInstruments(prev => prev.map(i =>
      i.symbol === symbol ? { ...i, status: i.status === 'Active' ? 'Disabled' : 'Active' } : i
    ));
  }, []);

  const unsavedCount = Object.keys(unsaved).length;

  const InlineCell = ({ inst, field }: { inst: Instrument; field: keyof Instrument }) => {
    const key = `${inst.symbol}.${field}`;
    const isEditing = editing === key;
    const val = getVal(inst, field);
    const isDirty = key in unsaved;

    if (isEditing) {
      return (
        <input
          className="input input-sm w-16"
          type="number"
          defaultValue={val}
          autoFocus
          onBlur={e => { stageEdit(inst.symbol, field, +e.target.value); setEditing(null); }}
          onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setEditing(null); }}
        />
      );
    }
    return (
      <span
        onClick={() => setEditing(key)}
        className={`mono-cell cursor-text rounded px-1 py-0.5 text-[11px] transition-colors ${isDirty ? 'border border-warn/40 bg-warn/10 text-warn' : 'border border-transparent hover:border-[var(--border-md)]'}`}
        title="Click to edit"
      >
        {val}
      </span>
    );
  };

  return (
    <div className="flex flex-col">
      <div className="module-header">
        <div>
          <p className="module-title">Instruments</p>
          <p className="module-subtitle">
            {stats.active} active · {stats.total} total · {stats.bySegment.EQ} EQ · {stats.bySegment.FNO} F&O
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unsavedCount > 0 && (
            <>
              <span className="flex items-center gap-1.5 text-[11px] text-warn">
                <span className="h-1.5 w-1.5 rounded-full bg-warn" />
                {unsavedCount} unsaved
              </span>
              <button className="btn-ghost btn btn-sm" onClick={() => setUnsaved({})}>
                <RotateCcw size={12} /> Discard
              </button>
              <button className="btn-ghost btn btn-sm text-warn" onClick={saveAll}>
                <Save size={12} /> Save All
              </button>
            </>
          )}
          <button className="btn-ghost btn btn-sm">
            <RefreshCw size={12} /> Sync
          </button>
          <button className="btn-ghost btn btn-sm">
            <Download size={12} /> Export
          </button>
          <button className="btn-ghost btn btn-sm">
            <Upload size={12} /> Import
          </button>
          <button className="btn-primary btn btn-sm"><Plus size={13} /> Add</button>
        </div>
      </div>

      <div className="p-6">
        {/* Filter bar - enterprise multi-filter */}
        <div className="flex flex-wrap items-center gap-3 mb-4 p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]">
          {/* Exchange filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-fg3">Exchange</span>
            <select
              className="input input-sm w-20"
              value={exchangeFilter}
              onChange={e => setExchangeFilter(e.target.value as typeof exchangeFilter)}
            >
              {EXCHANGES.map(ex => <option key={ex} value={ex}>{ex}</option>)}
            </select>
          </div>

          {/* Segment filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-fg3">Segment</span>
            <select
              className="input input-sm w-20"
              value={segmentFilter}
              onChange={e => setSegmentFilter(e.target.value as typeof segmentFilter)}
            >
              {SEGMENTS.map(seg => <option key={seg} value={seg}>{seg}</option>)}
            </select>
          </div>

          {/* Provider filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-fg3">Provider</span>
            <select
              className="input input-sm w-24"
              value={providerFilter}
              onChange={e => setProviderFilter(e.target.value as typeof providerFilter)}
            >
              {PROVIDERS.map(prov => <option key={prov} value={prov}>{prov}</option>)}
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-fg3">Status</span>
            <select
              className="input input-sm w-24"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
            >
              <option value="All">All</option>
              <option value="Active">Active</option>
              <option value="Disabled">Disabled</option>
              <option value="Halted">Halted</option>
            </select>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 flex-1">
            <input
              className="input input-sm flex-1"
              type="text"
              placeholder="Search symbol or name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Clear filters */}
          {(exchangeFilter !== 'All' || segmentFilter !== 'All' || providerFilter !== 'All' || statusFilter !== 'All' || searchQuery) && (
            <button
              className="btn-ghost btn btn-xs"
              onClick={() => {
                setExchangeFilter('All');
                setSegmentFilter('All');
                setProviderFilter('All');
                setStatusFilter('All');
                setSearchQuery('');
              }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Stats row */}
        <div className="flex gap-4 mb-4 text-[11px]">
          <span className="text-fg2">
            NSE: <span className="font-mono text-bull">{stats.byExchange.NSE}</span>
          </span>
          <span className="text-fg2">
            BSE: <span className="font-mono">{stats.byExchange.BSE}</span>
          </span>
          <span className="text-fg2">
            MCX: <span className="font-mono">{stats.byExchange.MCX}</span>
          </span>
          <span className="text-fg3">|</span>
          <span className="text-fg2">
            EQ: <span className="font-mono">{stats.bySegment.EQ}</span>
          </span>
          <span className="text-fg2">
            F&O: <span className="font-mono">{stats.bySegment.FNO}</span>
          </span>
          <span className="text-fg2">
            COM: <span className="font-mono">{stats.bySegment.COM}</span>
          </span>
        </div>

        {/* Results count */}
        <div className="text-[11px] text-fg3 mb-2">
          Showing {displayed.length} of {stats.total} instruments
        </div>

        <div className="card overflow-x-auto">
          <table className="data-table" style={{ minWidth: 1080 }}>
            <thead>
              <tr>
                <th className="w-10">On</th>
                <th className="w-20">Symbol</th>
                <th>Name</th>
                <th className="w-16">Exch</th>
                <th className="w-14">Seg</th>
                <th className="w-16">Type</th>
                <th className="w-14">Status</th>
                <th className="w-14">Spread</th>
                <th className="w-12">Lot</th>
                <th className="w-14">Lever</th>
                <th className="w-16">Provider</th>
                <th className="w-16">Vol Today</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {displayed.map(inst => (
                <tr key={inst.symbol}>
                  <td>
                    <button
                      onClick={() => toggleStatus(inst.symbol)}
                      className={`relative h-5 w-9 rounded-full transition-colors ${inst.isTradingEnabled && inst.status === 'Active' ? 'bg-bull/30' : 'bg-[var(--border-md)]'}`}
                    >
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${inst.isTradingEnabled && inst.status === 'Active' ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </td>
                  <td className={`mono-cell font-bold text-[12px] ${inst.isTradingEnabled && inst.status === 'Active' ? 'text-fg1' : 'text-fg3'}`}>
                    {inst.symbol}
                  </td>
                  <td className="max-w-[160px] overflow-hidden text-ellipsis whitespace-nowrap text-[11px] text-fg2">
                    {inst.name}
                  </td>
                  {/* Exchange */}
                  <td className="mono-cell text-[11px] text-fg2 font-bold">
                    {inst.exchange || 'N/A'}
                  </td>
                  {/* Segment */}
                  <td>
                    <span className="mono-cell text-[11px] px-2 py-0.5 rounded bg-[var(--bg-elevated)] text-fg2">
                      {inst.segment || 'N/A'}
                    </span>
                  </td>
                  {/* Type */}
                  <td>
                    <span className="badge badge-muted">{inst.type || inst.assetClass}</span>
                  </td>
                  {/* Status with color */}
                  <td>
                    <StatusDot status={inst.status} />
                    <span className="text-[11px] ml-1">{inst.status}</span>
                  </td>
                  {/* Spread */}
                  <td>
                    {inst.spreadOverride ? (
                      <span className="mono-cell text-[11px] text-warn">
                        {inst.spreadOverride}
                      </span>
                    ) : (
                      <InlineCell inst={inst} field="spread" />
                    )}
                  </td>
                  {/* Lot Size */}
                  <td>
                    {inst.lotOverride ? (
                      <span className="mono-cell text-[11px] text-warn">
                        {inst.lotOverride}
                      </span>
                    ) : (
                      <InlineCell inst={inst} field="minLot" />
                    )}
                  </td>
                  {/* Leverage */}
                  <td className="mono-cell text-[11px]">
                    {inst.leverageOverride ? (
                      <span className="text-warn">{inst.leverageOverride}</span>
                    ) : (
                      inst.leverage
                    )}
                  </td>
                  {/* Provider */}
                  <td className="mono-cell text-[11px] text-fg2">
                    {inst.providerCode || 'GENERIC'}
                  </td>
                  {/* Volume */}
                  <td className="mono-cell text-[11px] text-fg2">
                    {inst.volumeToday.toLocaleString()}
                  </td>
                  {/* Actions */}
                  <td>
                    <button className="btn-ghost btn btn-xs p-1" onClick={() => setModal(inst)}>
                      <Settings size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <EditModal
          instrument={modal}
          onClose={() => setModal(null)}
          onSave={updated => setInstruments(prev => prev.map(i => i.symbol === updated.symbol ? updated : i))}
        />
      )}
    </div>
  );
}
