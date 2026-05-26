'use client';

import DemoHeader from '@/components/DemoHeader';
import DemoShell, { PanelSection, Panel, PanelHeader, PanelBody } from '@/components/DemoShell';
import {
  brokerDashboard,
  brokerClients,
  brokerOrders,
  brokerRiskMetrics,
  formatCurrency,
  formatCompact,
} from '@/lib/mock-data';

export default function BrokerAdminDemo() {
  return (
    <DemoShell>
      <DemoHeader
        title="Broker Admin"
        subtitle="Multi-tenant broker operations and client management"
        color="#6366f1"
      />

      <div style={{ padding: 'var(--space-6)', maxWidth: '1600px', margin: '0 auto' }}>
        {/* KPI Bar */}
        <div className="demo-grid" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="kpi-card">
            <div className="kpi-label">Total Clients</div>
            <div className="kpi-value">{brokerDashboard.totalClients.toLocaleString()}</div>
            <div className="kpi-delta value-bull">+{brokerDashboard.activeClients} active</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Total AUM</div>
            <div className="kpi-value">{formatCompact(brokerDashboard.totalAUM)}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Daily Volume</div>
            <div className="kpi-value">{formatCompact(brokerDashboard.dailyVolume)}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Margin Utilized</div>
            <div className="kpi-value">{brokerDashboard.marginUtilized}%</div>
            <div className="progress-bar" style={{ marginTop: 'var(--space-2)' }}>
              <div className="progress-fill" style={{ width: `${brokerDashboard.marginUtilized}%`, background: brokerDashboard.marginUtilized > 80 ? 'var(--bear)' : 'var(--bull)' }} />
            </div>
          </div>
        </div>

        {/* Main Panels */}
        <PanelSection>
          {/* Client List */}
          <Panel colSpan={8}>
            <PanelHeader>Client List</PanelHeader>
            <PanelBody style={{ padding: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Client ID</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>AUM</th>
                    <th>Margin</th>
                    <th>Status</th>
                    <th>KYC</th>
                  </tr>
                </thead>
                <tbody>
                  {brokerClients.map((client) => (
                    <tr key={client.id}>
                      <td className="value-mono">{client.id}</td>
                      <td style={{ fontWeight: 500 }}>{client.name}</td>
                      <td><span className="badge badge-muted">{client.type}</span></td>
                      <td className="value-mono">{formatCompact(client.aum)}</td>
                      <td className="value-mono">{formatCompact(client.margin)}</td>
                      <td>
                        <span className={`badge ${client.status === 'Active' ? 'badge-bull' : 'badge-muted'}`}>
                          {client.status}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${client.kyc === 'Verified' ? 'badge-bull' : 'badge-accent'}`}>
                          {client.kyc}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </PanelBody>
          </Panel>

          {/* Risk Summary */}
          <Panel colSpan={4}>
            <PanelHeader>Risk Alerts</PanelHeader>
            <PanelBody>
              <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: brokerDashboard.activeAlerts > 0 ? 'var(--bear-bg)' : 'var(--bull-bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto var(--space-4)',
                  }}
                >
                  <span
                    style={{
                      fontSize: '28px',
                      fontWeight: 700,
                      color: brokerDashboard.activeAlerts > 0 ? 'var(--bear)' : 'var(--bull)',
                    }}
                  >
                    {brokerDashboard.activeAlerts}
                  </span>
                </div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
                  {brokerDashboard.activeAlerts > 0 ? 'Active risk alerts require attention' : 'All risk metrics within limits'}
                </p>
              </div>
            </PanelBody>
          </Panel>

          {/* Orders */}
          <Panel colSpan={6}>
            <PanelHeader>Recent Orders</PanelHeader>
            <PanelBody style={{ padding: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Client</th>
                    <th>Symbol</th>
                    <th>Type</th>
                    <th>Value</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {brokerOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="value-mono">{order.id}</td>
                      <td className="value-mono">{order.client}</td>
                      <td style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>{order.symbol}</td>
                      <td className={order.type === 'BUY' ? 'value-bull' : 'value-bear'} style={{ fontWeight: 500 }}>{order.type}</td>
                      <td className="value-mono">{formatCompact(order.value)}</td>
                      <td>
                        <span className={`badge ${order.status === 'Executed' ? 'badge-bull' : 'badge-accent'}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </PanelBody>
          </Panel>

          {/* Risk Metrics */}
          <Panel colSpan={6}>
            <PanelHeader>Client Risk Exposure</PanelHeader>
            <PanelBody style={{ padding: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Exposure</th>
                    <th>Limit</th>
                    <th>Utilized %</th>
                  </tr>
                </thead>
                <tbody>
                  {brokerRiskMetrics.map((risk) => (
                    <tr key={risk.client}>
                      <td className="value-mono">{risk.client}</td>
                      <td className="value-mono">{formatCompact(risk.exposure)}</td>
                      <td className="value-mono">{formatCompact(risk.limit)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <div className="progress-bar" style={{ flex: 1 }}>
                            <div
                              className="progress-fill"
                              style={{
                                width: `${risk.utilized}%`,
                                background: risk.utilized > 80 ? 'var(--bear)' : 'var(--bull)',
                              }}
                            />
                          </div>
                          <span className={`value-mono ${risk.utilized > 80 ? 'value-bear' : 'value-bull'}`} style={{ width: '40px', textAlign: 'right' }}>
                            {risk.utilized}%
                          </span>
                        </div>
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