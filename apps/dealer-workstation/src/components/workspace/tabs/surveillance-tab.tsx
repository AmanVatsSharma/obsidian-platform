/**
 * File:        apps/dealer-workstation/src/components/workspace/tabs/surveillance-tab.tsx
 * Module:      dealer-workstation · Workspace
 * Purpose:     Surveillance tab — AML/compliance alert cards with 4 actions (INVESTIGATE,
 *              FLAG, DISMISS, RESTRICT), per-client risk scoring table, and an ACTIVE
 *              RESTRICTIONS panel with per-restriction LIFT button.
 *
 * Exports:
 *   - SurveillanceTab() — AML alert + risk scoring + restrictions panel
 *
 * Side-effects: none
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

'use client';

import { useState } from 'react';
import { useDeskData } from '../../../lib/mock-data-context';
import { ACTIVE_RESTRICTIONS } from '../../../lib/mock-data';
import type { AlertSeverity, AlertStatus } from '../../../lib/types';

type Restriction = { id: string; clientName: string; clientId: number; reason: string; since: string };

function severityColor(sev: AlertSeverity): string {
  if (sev === 'HIGH')   return 'var(--bear)';
  if (sev === 'MEDIUM') return 'var(--warn)';
  return 'var(--fg3)';
}

function severityBg(sev: AlertSeverity): string {
  if (sev === 'HIGH')   return 'rgba(255,59,92,0.08)';
  if (sev === 'MEDIUM') return 'rgba(245,158,11,0.06)';
  return 'var(--bg-surface)';
}

function severityBorder(sev: AlertSeverity): string {
  if (sev === 'HIGH')   return '1px solid rgba(255,59,92,0.25)';
  if (sev === 'MEDIUM') return '1px solid rgba(245,158,11,0.2)';
  return '1px solid var(--border)';
}

function riskScore(flagCount: number, severity: AlertSeverity): number {
  const base = severity === 'HIGH' ? 70 : severity === 'MEDIUM' ? 45 : 20;
  return Math.min(100, base + flagCount * 5);
}

function riskScoreColor(score: number): string {
  if (score >= 70) return 'var(--bear)';
  if (score >= 45) return 'var(--warn)';
  return 'var(--bull)';
}

export function SurveillanceTab() {
  const { surveillanceAlerts, dismissAlert, flagAlert, addToast } = useDeskData();
  const [restrictions, setRestrictions] = useState<Restriction[]>(ACTIVE_RESTRICTIONS);

  const active    = surveillanceAlerts.filter(a => a.status === 'ACTIVE');
  const flagged   = surveillanceAlerts.filter(a => a.status === 'FLAGGED');
  const dismissed = surveillanceAlerts.filter(a => a.status === 'DISMISSED');

  function restrictClient(alert: { id: string; clientId: number; clientName: string; type: string }) {
    const alreadyRestricted = restrictions.some(r => r.clientId === alert.clientId);
    if (!alreadyRestricted) {
      const now = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      setRestrictions(prev => [...prev, { id: `RST-${Date.now()}`, clientName: alert.clientName, clientId: alert.clientId, reason: alert.type, since: now }]);
    }
    addToast({ type: 'warn', icon: '🔒', title: 'CLIENT RESTRICTED', msg: `${alert.clientName} #${alert.clientId} — trading suspended pending review` });
  }

  function liftRestriction(id: string, clientName: string) {
    setRestrictions(prev => prev.filter(r => r.id !== id));
    addToast({ type: 'accept', icon: '✓', title: 'RESTRICTION LIFTED', msg: `${clientName} — trading access restored` });
  }

  /* Aggregate per-client risk for the scoring table */
  const clientRiskMap = new Map<number, { name: string; alerts: typeof active; score: number }>();
  for (const alert of surveillanceAlerts) {
    if (!clientRiskMap.has(alert.clientId)) {
      clientRiskMap.set(alert.clientId, { name: alert.clientName, alerts: [], score: 0 });
    }
    clientRiskMap.get(alert.clientId)!.alerts.push(alert);
  }
  const clientRiskRows = Array.from(clientRiskMap.entries()).map(([id, entry]) => {
    const highCount   = entry.alerts.filter(a => a.severity === 'HIGH').length;
    const topSeverity = highCount > 0 ? 'HIGH' : entry.alerts.some(a => a.severity === 'MEDIUM') ? 'MEDIUM' : 'LOW';
    const score       = riskScore(highCount, topSeverity as AlertSeverity);
    return { id, name: entry.name, count: entry.alerts.length, score, topSeverity };
  }).sort((a, b) => b.score - a.score);

  return (
    <div style={{ padding: 12, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 8, flex: 1, minHeight: 0 }}>

        {/* Left — Alert cards */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--fg2)', flexShrink: 0 }}>
            ACTIVE ALERTS <span style={{ color: active.length > 0 ? 'var(--bear)' : 'var(--fg3)' }}>({active.length})</span>
          </div>

          {active.length === 0 && (
            <div style={{ color: 'var(--fg3)', fontFamily: 'var(--font-data)', fontSize: 11, padding: '12px 0' }}>No active alerts</div>
          )}

          {active.map(alert => (
            <AlertCard key={alert.id} alert={alert} onDismiss={dismissAlert} onFlag={flagAlert}
              onToast={(title, msg) => addToast({ type: 'info', icon: '🔍', title, msg })}
              onRestrict={() => restrictClient(alert)}
            />
          ))}

          {flagged.length > 0 && (
            <>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', marginTop: 8, flexShrink: 0 }}>
                FLAGGED — ESCALATED ({flagged.length})
              </div>
              {flagged.map(alert => (
                <AlertCard key={alert.id} alert={alert} onDismiss={dismissAlert} onFlag={flagAlert}
                  onToast={(title, msg) => addToast({ type: 'info', icon: '🔍', title, msg })}
                  onRestrict={() => restrictClient(alert)}
                />
              ))}
            </>
          )}

          {dismissed.length > 0 && (
            <>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--fg3)', marginTop: 8, flexShrink: 0 }}>
                DISMISSED ({dismissed.length})
              </div>
              {dismissed.map(alert => (
                <AlertCard key={alert.id} alert={alert} onDismiss={dismissAlert} onFlag={flagAlert}
                  onToast={(title, msg) => addToast({ type: 'info', icon: '🔍', title, msg })}
                  onRestrict={() => restrictClient(alert)}
                />
              ))}
            </>
          )}
        </div>

        {/* Right — Risk scores + Active Restrictions */}
        <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* CLIENT RISK SCORE table */}
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--fg2)', flexShrink: 0 }}>
            CLIENT RISK SCORE
          </div>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', overflow: 'hidden' }}>
            <table className="desk-table">
              <thead>
                <tr>
                  <th>CLIENT</th><th>ALERTS</th><th>SEV</th><th>SCORE</th>
                </tr>
              </thead>
              <tbody>
                {clientRiskRows.map(row => (
                  <tr key={row.id}>
                    <td style={{ color: 'var(--fg1)', fontWeight: 600, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.name.split(' ')[0]}</td>
                    <td style={{ color: 'var(--fg2)' }}>{row.count}</td>
                    <td><span className={`sev-${row.topSeverity.toLowerCase()}`}>{row.topSeverity.slice(0, 3)}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 36, height: 3, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ width: `${row.score}%`, height: '100%', background: riskScoreColor(row.score), borderRadius: 2 }} />
                        </div>
                        <span style={{ color: riskScoreColor(row.score), fontWeight: 700, fontFamily: 'var(--font-data)', fontSize: 11 }}>{row.score}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ACTIVE RESTRICTIONS panel */}
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: restrictions.length > 0 ? 'var(--bear)' : 'var(--fg2)', flexShrink: 0, marginTop: 4 }}>
            ACTIVE RESTRICTIONS ({restrictions.length})
          </div>
          <div style={{ background: 'var(--bg-surface)', border: `1px solid ${restrictions.length > 0 ? 'rgba(255,59,92,0.25)' : 'var(--border)'}`, borderRadius: 'var(--r-sm)', flex: 1, overflowY: 'auto' }}>
            {restrictions.length === 0 ? (
              <div style={{ padding: 10, fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--fg3)' }}>No active restrictions</div>
            ) : (
              restrictions.map(rst => (
                <div key={rst.id} style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-data)', fontSize: 11, fontWeight: 700, color: 'var(--fg1)' }}>{rst.clientName}</div>
                    <div style={{ fontFamily: 'var(--font-data)', fontSize: 9, color: 'var(--fg3)', marginTop: 1 }}>{rst.reason} · since {rst.since}</div>
                  </div>
                  <button
                    onClick={() => liftRestriction(rst.id, rst.clientName)}
                    style={{ padding: '2px 8px', fontSize: 9, fontFamily: 'var(--font-data)', fontWeight: 700, borderRadius: 'var(--r-sm)', cursor: 'pointer', border: '1px solid rgba(16,217,150,0.4)', background: 'rgba(16,217,150,0.08)', color: 'var(--bull)', flexShrink: 0 }}
                  >
                    LIFT
                  </button>
                </div>
              ))
            )}
          </div>

          {/* PATTERN ANALYSIS — static summary */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: 10 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--fg2)', marginBottom: 6 }}>PATTERN ANALYSIS</div>
            {[
              { label: 'LATENCY ARBI.',  count: surveillanceAlerts.filter(a => a.type === 'LATENCY ARBITRAGE').length,    color: 'var(--bear)' },
              { label: 'NEWS TRADING',   count: surveillanceAlerts.filter(a => a.type === 'NEWS TRADING').length,          color: 'var(--warn)' },
              { label: 'VOL SPIKE',      count: surveillanceAlerts.filter(a => a.type === 'VOLUME SPIKE').length,           color: 'var(--warn)' },
              { label: 'SCALPING',       count: surveillanceAlerts.filter(a => a.type === 'SCALPING PATTERN').length,       color: 'var(--fg3)' },
              { label: 'ACCT COORD.',    count: surveillanceAlerts.filter(a => a.type === 'ACCOUNT COORDINATION').length,   color: 'var(--bear)' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-data)', fontSize: 10 }}>
                <span style={{ color: 'var(--fg3)' }}>{item.label}</span>
                <span style={{ color: item.count > 0 ? item.color : 'var(--fg3)', fontWeight: 700 }}>{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface AlertCardProps {
  alert: {
    id: string;
    severity: AlertSeverity;
    status: AlertStatus;
    type: string;
    clientName: string;
    clientId: number;
    detail: string;
    time: string;
  };
  onDismiss:  (id: string) => void;
  onFlag:     (id: string) => void;
  onToast:    (title: string, msg: string) => void;
  onRestrict: () => void;
}

function AlertCard({ alert, onDismiss, onFlag, onToast, onRestrict }: AlertCardProps) {
  const isDismissed = alert.status === 'DISMISSED';
  const isFlagged   = alert.status === 'FLAGGED';

  return (
    <div style={{
      background:   isDismissed ? 'var(--bg-panel)' : severityBg(alert.severity),
      border:       isDismissed ? '1px solid var(--border)' : severityBorder(alert.severity),
      borderRadius: 'var(--r-sm)',
      padding:      '8px 10px',
      opacity:      isDismissed ? 0.5 : 1,
      flexShrink:   0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className={`sev-${alert.severity.toLowerCase()}`}>{alert.severity}</span>
          <span style={{ fontFamily: 'var(--font-data)', fontSize: 11, fontWeight: 700, color: 'var(--fg1)' }}>{alert.type}</span>
          {isFlagged && <span style={{ fontFamily: 'var(--font-data)', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 2, background: 'rgba(59,130,246,0.15)', color: 'var(--accent)', border: '1px solid rgba(59,130,246,0.3)' }}>ESCALATED</span>}
        </div>
        <span style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--fg3)' }}>{alert.time}</span>
      </div>
      <div style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--fg2)', marginBottom: 4 }}>
        <span style={{ color: severityColor(alert.severity), fontWeight: 600 }}>{alert.clientName}</span>
        <span style={{ color: 'var(--fg3)' }}> #{alert.clientId}</span>
        <span style={{ color: 'var(--fg3)' }}> — {alert.detail}</span>
      </div>
      {!isDismissed && (
        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
          <button
            onClick={() => onToast('INVESTIGATING', `Case ${alert.id} — ${alert.type} on ${alert.clientName} sent to compliance review`)}
            style={{ padding: '2px 8px', fontSize: 10, fontFamily: 'var(--font-data)', fontWeight: 600, borderRadius: 'var(--r-sm)', cursor: 'pointer', border: '1px solid rgba(139,149,163,0.4)', background: 'rgba(139,149,163,0.08)', color: 'var(--fg2)' }}
          >INVESTIGATE</button>
          {!isFlagged && (
            <button
              onClick={() => onFlag(alert.id)}
              style={{ padding: '2px 8px', fontSize: 10, fontFamily: 'var(--font-data)', fontWeight: 600, borderRadius: 'var(--r-sm)', cursor: 'pointer', border: '1px solid rgba(59,130,246,0.4)', background: 'rgba(59,130,246,0.1)', color: 'var(--accent)' }}
            >FLAG</button>
          )}
          <button
            onClick={() => onDismiss(alert.id)}
            style={{ padding: '2px 8px', fontSize: 10, fontFamily: 'var(--font-data)', fontWeight: 600, borderRadius: 'var(--r-sm)', cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--bg-panel)', color: 'var(--fg3)' }}
          >DISMISS</button>
          <button
            onClick={onRestrict}
            style={{ padding: '2px 8px', fontSize: 10, fontFamily: 'var(--font-data)', fontWeight: 600, borderRadius: 'var(--r-sm)', cursor: 'pointer', border: '1px solid rgba(255,59,92,0.4)', background: 'rgba(255,59,92,0.08)', color: 'var(--bear)' }}
          >RESTRICT</button>
        </div>
      )}
    </div>
  );
}
