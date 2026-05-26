'use client';

import { useState } from 'react';
import DemoHeader from '@/components/DemoHeader';
import DemoShell, { PanelSection, Panel, PanelHeader, PanelBody } from '@/components/DemoShell';
import {
  ibHierarchy,
  ibCommission,
  ibSubBrokers,
  formatCurrency,
  formatCompact,
} from '@/lib/mock-data';

export default function IBPortalDemo() {
  const [expandedNode, setExpandedNode] = useState<string | null>('IB001');

  return (
    <DemoShell>
      <DemoHeader
        title="IB Portal"
        subtitle="Introducing broker hierarchy and commission management"
        color="#ec4899"
      />

      <div style={{ padding: 'var(--space-6)', maxWidth: '1600px', margin: '0 auto' }}>
        {/* KPI Bar */}
        <div className="demo-grid" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="kpi-card">
            <div className="kpi-label">Total IBs</div>
            <div className="kpi-value">77</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Total Clients</div>
            <div className="kpi-value">1,247</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Monthly Revenue</div>
            <div className="kpi-value">4.30 L</div>
            <div className="kpi-delta value-bear">-36.8% MoM</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Pending Commission</div>
            <div className="kpi-value">1.92 L</div>
          </div>
        </div>

        {/* Main Panels */}
        <PanelSection>
          {/* Hierarchy Tree */}
          <Panel colSpan={8}>
            <PanelHeader>Broker Hierarchy</PanelHeader>
            <PanelBody style={{ padding: 0 }}>
              <div style={{ padding: 'var(--space-4)' }}>
                {ibHierarchy.map((node) => (
                  <div key={node.id} style={{ marginBottom: 'var(--space-4)' }}>
                    {/* Master IB */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 'var(--space-3) var(--space-4)',
                        background: 'var(--bg-elevated)',
                        borderRadius: 'var(--radius)',
                        border: '1px solid var(--border)',
                        cursor: 'pointer',
                      }}
                      onClick={() => setExpandedNode(expandedNode === node.id ? null : node.id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <span style={{ fontSize: '16px' }}>{expandedNode === node.id ? '▼' : '▶'}</span>
                        <div>
                          <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            {node.name}
                            <span className="badge badge-accent" style={{ fontSize: '9px' }}>{node.type}</span>
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {node.clients} clients · Revenue {formatCompact(node.revenue)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sub IBs */}
                    {expandedNode === node.id && node.children && (
                      <div style={{ marginLeft: 'var(--space-8)', marginTop: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {node.children.map((child) => (
                          <div
                            key={child.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: 'var(--space-2) var(--space-3)',
                              background: 'var(--bg-panel)',
                              borderRadius: 'var(--radius)',
                              border: '1px solid var(--border)',
                            }}
                          >
                            <div>
                              <span style={{ fontWeight: 500 }}>{child.name}</span>
                              <span className="badge badge-muted" style={{ marginLeft: 'var(--space-2)', fontSize: '9px' }}>{child.type}</span>
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                              {child.clients} clients · {formatCompact(child.revenue)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </PanelBody>
          </Panel>

          {/* Commission Summary */}
          <Panel colSpan={4}>
            <PanelHeader>Commission Trend</PanelHeader>
            <PanelBody>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {ibCommission.map((comm) => (
                  <div
                    key={comm.period}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'var(--space-2) var(--space-3)',
                      background: 'var(--bg-elevated)',
                      borderRadius: 'var(--radius)',
                    }}
                  >
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{comm.period}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                      <span className="value-mono" style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                        {formatCompact(comm.shared)} shared
                      </span>
                      <span className="value-mono" style={{ fontWeight: 600 }}>
                        {formatCompact(comm.net)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </PanelBody>
          </Panel>

          {/* Sub-Broker List */}
          <Panel colSpan={12}>
            <PanelHeader>Sub-Broker List</PanelHeader>
            <PanelBody style={{ padding: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Total Clients</th>
                    <th>Active Clients</th>
                    <th>Month Revenue</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ibSubBrokers.map((sb) => (
                    <tr key={sb.id}>
                      <td className="value-mono">{sb.id}</td>
                      <td style={{ fontWeight: 500 }}>{sb.name}</td>
                      <td className="value-mono">{sb.clients}</td>
                      <td className="value-mono">{sb.activeClients}</td>
                      <td className="value-mono">{formatCompact(sb.monthRevenue)}</td>
                      <td>
                        <span className={`badge ${sb.status === 'Active' ? 'badge-bull' : 'badge-accent'}`}>
                          {sb.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </PanelBody>
          </Panel>
        </PanelSection>
      </div>
    </DemoShell>
  );
}