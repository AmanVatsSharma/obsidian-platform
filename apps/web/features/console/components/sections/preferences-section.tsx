/**
 * File:        apps/web/features/console/components/sections/preferences-section.tsx
 * Module:      web · Console · Trade Preferences
 * Purpose:     /console/preferences — order entry defaults, chart & data settings,
 *              hotkeys table, and risk controls. Pure-form section; one save action.
 *
 * Exports:
 *   - default PreferencesSection
 *
 * Depends on:
 *   - @obsidian/obsidian-ui — ObsidianIcon, ObsidianSegmented, ObsidianSelect, ObsidianToggle, useToast
 *   - ../../lib/use-console-user
 *
 * Side-effects:
 *   - Local React state. Toast on save.
 *   - [SonuRamTODO] Persist preferences via PUT /v1/users/me/preferences.
 *
 * Key invariants:
 *   - One-click trading toggle is dangerous — its hint text is bear-coloured to draw
 *     attention. Consumers should respect this control on the workstation.
 *   - Auto-SL/TP fields hide when the toggle is off.
 *
 * Author:       BharatERP
 * Last-updated: 2026-05-09
 */

'use client';

import * as React from 'react';

import {
  ObsidianIcon,
  ObsidianSegmented,
  ObsidianSelect,
  ObsidianToggle,
  useToast,
} from '@obsidian/obsidian-ui';

type PipDisplay = 'standard' | 'fractional';

type Prefs = {
  defaultLot: number;
  defaultType: 'Market' | 'Limit' | 'Stop';
  oneClick: boolean;
  confirmOrders: boolean;
  confirmClose: boolean;
  autoSlPips: number;
  autoTpPips: number;
  enableSlTp: boolean;
  chartTf: 'M1' | 'M5' | 'M15' | 'H1' | 'H4' | 'D1';
  chartType: 'Candlestick' | 'Bars' | 'Area' | 'Heikin-Ashi';
  flashTicks: boolean;
  soundAlerts: boolean;
  pipDisplay: PipDisplay;
  riskWarning: boolean;
};

const DEFAULTS: Prefs = {
  defaultLot: 0.10,
  defaultType: 'Market',
  oneClick: false,
  confirmOrders: true,
  confirmClose: true,
  autoSlPips: 20,
  autoTpPips: 40,
  enableSlTp: true,
  chartTf: 'M15',
  chartType: 'Candlestick',
  flashTicks: true,
  soundAlerts: false,
  pipDisplay: 'fractional',
  riskWarning: true,
};

const HOTKEYS: ReadonlyArray<readonly [string, string]> = [
  ['Buy at market',          'F9'],
  ['Sell at market',         'F10'],
  ['Close all positions',    'Ctrl + W'],
  ['Toggle one-click',       'Ctrl + 1'],
  ['Cycle timeframe',        'Tab'],
  ['Focus symbol search',    '/'],
  ['Open DOM',               'D'],
  ['Pin to watchlist',       'P'],
];

function FieldRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="frow">
      <div className="lbl">
        {label}
        {hint && <span className="hint">{hint}</span>}
      </div>
      <div>{children}</div>
    </div>
  );
}

export default function PreferencesSection() {
  const toast = useToast();
  const [prefs, setPrefs] = React.useState<Prefs>(DEFAULTS);
  const set = <K extends keyof Prefs>(k: K, v: Prefs[K]) =>
    setPrefs((p) => ({ ...p, [k]: v }));

  return (
    <>
      <section className="sec">
        <div className="sec-hd">
          <h2>Order entry defaults</h2>
          <div className="line" />
        </div>
        <div className="card">
          <FieldRow
            label="Default volume"
            hint="Pre-fills the volume field when you open a ticket."
          >
            <div className="ip-row">
              <div className="ip">
                <input
                  type="number"
                  step="0.01"
                  value={prefs.defaultLot}
                  onChange={(e) => set('defaultLot', parseFloat(e.target.value) || 0)}
                />
                <span className="post">lots</span>
              </div>
            </div>
          </FieldRow>
          <FieldRow label="Default order type">
            <ObsidianSegmented
              value={prefs.defaultType}
              onChange={(v) => set('defaultType', v)}
              options={['Market', 'Limit', 'Stop'] as const}
            />
          </FieldRow>
          <FieldRow
            label="Auto SL / TP"
            hint="Pre-fill stop-loss and take-profit when the ticket opens."
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <ObsidianToggle
                on={prefs.enableSlTp}
                onChange={(v) => set('enableSlTp', v)}
                aria-label="Enable auto stop-loss / take-profit"
              />
              {prefs.enableSlTp && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <div className="ip" style={{ width: 110 }}>
                    <span className="pre">SL</span>
                    <input
                      type="number"
                      value={prefs.autoSlPips}
                      onChange={(e) => set('autoSlPips', parseInt(e.target.value, 10) || 0)}
                    />
                    <span className="post">pips</span>
                  </div>
                  <div className="ip" style={{ width: 110 }}>
                    <span className="pre">TP</span>
                    <input
                      type="number"
                      value={prefs.autoTpPips}
                      onChange={(e) => set('autoTpPips', parseInt(e.target.value, 10) || 0)}
                    />
                    <span className="post">pips</span>
                  </div>
                </div>
              )}
            </div>
          </FieldRow>
          <FieldRow label="Confirm orders" hint="Show a confirmation modal before submission.">
            <ObsidianToggle
              on={prefs.confirmOrders}
              onChange={(v) => set('confirmOrders', v)}
              aria-label="Confirm orders before submission"
            />
          </FieldRow>
          <FieldRow label="Confirm position close">
            <ObsidianToggle
              on={prefs.confirmClose}
              onChange={(v) => set('confirmClose', v)}
              aria-label="Confirm position close"
            />
          </FieldRow>
          <FieldRow
            label="One-click trading"
            hint={
              <span style={{ color: 'var(--bear)' }}>
                Submits orders instantly without confirmation. Use with care.
              </span>
            }
          >
            <ObsidianToggle
              on={prefs.oneClick}
              onChange={(v) => set('oneClick', v)}
              aria-label="One-click trading"
            />
          </FieldRow>
        </div>
      </section>

      <section className="sec">
        <div className="sec-hd">
          <h2>Chart & data</h2>
          <div className="line" />
        </div>
        <div className="card">
          <FieldRow label="Default timeframe">
            <ObsidianSegmented
              value={prefs.chartTf}
              onChange={(v) => set('chartTf', v)}
              options={['M1', 'M5', 'M15', 'H1', 'H4', 'D1'] as const}
            />
          </FieldRow>
          <FieldRow label="Default chart type">
            <ObsidianSegmented
              value={prefs.chartType}
              onChange={(v) => set('chartType', v)}
              options={['Candlestick', 'Bars', 'Area', 'Heikin-Ashi'] as const}
            />
          </FieldRow>
          <FieldRow
            label="Pip display"
            hint="Fractional shows the 5th-decimal pipette as a small digit."
          >
            <ObsidianSegmented
              value={prefs.pipDisplay}
              onChange={(v) => set('pipDisplay', v)}
              options={[
                { value: 'standard', label: 'Standard' },
                { value: 'fractional', label: 'Fractional' },
              ]}
            />
          </FieldRow>
          <FieldRow
            label="Flash on ticks"
            hint="Briefly tints the price cell green/red on each new tick."
          >
            <ObsidianToggle
              on={prefs.flashTicks}
              onChange={(v) => set('flashTicks', v)}
              aria-label="Flash on price ticks"
            />
          </FieldRow>
          <FieldRow label="Sound alerts">
            <ObsidianToggle
              on={prefs.soundAlerts}
              onChange={(v) => set('soundAlerts', v)}
              aria-label="Sound alerts"
            />
          </FieldRow>
        </div>
      </section>

      <section className="sec">
        <div className="sec-hd">
          <h2>Hotkeys</h2>
          <div className="line" />
          <button type="button" className="btn sm ghost">
            <ObsidianIcon name="RotateCcw" size={11} />
            Reset to defaults
          </button>
        </div>
        <div className="card flush">
          <table className="tbl">
            <thead>
              <tr>
                <th>Action</th>
                <th>Shortcut</th>
                <th aria-label="edit" />
              </tr>
            </thead>
            <tbody>
              {HOTKEYS.map(([action, key]) => (
                <tr key={action}>
                  <td>{action}</td>
                  <td>
                    <span className="key">{key}</span>
                  </td>
                  <td style={{ width: 1 }}>
                    <button type="button" className="btn sm ghost" aria-label="Edit shortcut">
                      <ObsidianIcon name="Edit2" size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="sec">
        <div className="sec-hd">
          <h2>Risk controls</h2>
          <div className="line" />
        </div>
        <div className="card">
          <FieldRow label="Max daily loss" hint="Auto-block new orders when reached for the day.">
            <div className="ip-row">
              <div className="ip">
                <span className="pre">EUR</span>
                <input type="number" defaultValue={2000} />
              </div>
            </div>
          </FieldRow>
          <FieldRow label="Max position size">
            <div className="ip-row">
              <div className="ip">
                <input type="number" step="0.1" defaultValue={5.0} />
                <span className="post">lots</span>
              </div>
            </div>
          </FieldRow>
          <FieldRow
            label="Risk warning at order entry"
            hint="Show estimated risk in % of equity before submission."
          >
            <ObsidianToggle
              on={prefs.riskWarning}
              onChange={(v) => set('riskWarning', v)}
              aria-label="Risk warning at order entry"
            />
          </FieldRow>
          <FieldRow
            label="Cool-off period"
            hint="Block new positions for X minutes after closing a losing trade."
          >
            <ObsidianSelect
              value={'Off' as const}
              onChange={() => undefined}
              options={[
                'Off',
                '5 minutes',
                '15 minutes',
                '60 minutes',
                'Until next session',
              ] as const}
            />
          </FieldRow>
        </div>
      </section>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
        <button type="button" className="btn ghost" onClick={() => setPrefs(DEFAULTS)}>
          <ObsidianIcon name="RotateCcw" size={12} />
          Reset all
        </button>
        <button
          type="button"
          className="btn primary"
          onClick={() =>
            toast.push({
              kind: 'bull',
              title: 'Preferences saved',
              detail: 'Applied to all open terminals',
            })
          }
        >
          Save preferences
        </button>
      </div>
    </>
  );
}
