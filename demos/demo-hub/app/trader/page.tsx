'use client';

import DemoHeader from '@/components/DemoHeader';
import DemoShell, { PanelSection, Panel, PanelHeader, PanelBody } from '@/components/DemoShell';
import {
  traderPortfolio,
  traderPositions,
  traderOrders,
  marketWatch,
  formatCurrency,
} from '@/lib/mock-data';

export default function TraderDemo() {
  return (
    <DemoShell>
      <DemoHeader
        title="Trader Terminal"
        subtitle="Full-featured trading interface with portfolio management"
        color="#10d996"
      />

      <div style={{ padding: 'var(--space-6)', maxWidth: '1600px', margin: '0 auto' }}>
        {/* KPI Bar */}
        <div className="demo-grid" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="kpi-card">
            <div className="kpi-label">Portfolio Value</div>
            <div className="kpi-value">{formatCurrency(traderPortfolio.totalValue)}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Day P&L</div>
            <div className="kpi-value value-bull">+{formatCurrency(traderPortfolio.dayPnL)}</div>
            <div className="kpi-delta value-bull">+1.82%</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Buying Power</div>
            <div className="kpi-value">{formatCurrency(traderPortfolio.buyingPower)}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Open Positions</div>
            <div className="kpi-value">{traderPositions.length}</div>
            <div className="kpi-delta value-bull">+3 active</div>
          </div>
        </div>

        {/* Main Panels */}
        <PanelSection>
          {/* Market Watch */}
          <Panel colSpan={8}>
            <PanelHeader>Market Watch</PanelHeader>
            <PanelBody style={{ padding: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>LTP</th>
                    <th>Change</th>
                    <th>Change %</th>
                    <th>Volume</th>
                    <th>High</th>
                    <th>Low</th>
                  </tr>
                </thead>
                <tbody>
                  {marketWatch.map((item) => (
                    <tr key={item.symbol}>
                      <td style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>{item.symbol}</td>
                      <td className="value-mono">{item.ltp.toFixed(2)}</td>
                      <td className={`value-mono ${item.change >= 0 ? 'value-bull' : 'value-bear'}`}>
                        {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}
                      </td>
                      <td className={`value-mono ${item.change >= 0 ? 'value-bull' : 'value-bear'}`}>
                        {item.change >= 0 ? '+' : ''}{item.changePct.toFixed(2)}%
                      </td>
                      <td className="value-mono">{item.volume}</td>
                      <td className="value-mono" style={{ color: 'var(--text-secondary)' }}>{item.high.toFixed(2)}</td>
                      <td className="value-mono" style={{ color: 'var(--text-secondary)' }}>{item.low.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </PanelBody>
          </Panel>

          {/* Order Entry */}
          <Panel colSpan={4}>
            <PanelHeader>Order Entry</PanelHeader>
            <PanelBody>
              <form style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>Symbol</label>
                  <select style={{ width: '100%', padding: 'var(--space-2)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}>
                    <option>RELIANCE</option>
                    <option>TCS</option>
                    <option>HDFCBANK</option>
                    <option>INFY</option>
                    <option>SBIN</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>Qty</label>
                    <input type="number" defaultValue="10" style={{ width: '100%', padding: 'var(--space-2)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>Price</label>
                    <input type="number" defaultValue="2912.00" style={{ width: '100%', padding: 'var(--space-2)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <button type="button" className="btn btn-primary" style={{ background: 'var(--bull)', justifyContent: 'center' }}>BUY</button>
                  <button type="button" className="btn btn-primary" style={{ background: 'var(--bear)', justifyContent: 'center' }}>SELL</button>
                </div>
              </form>
            </PanelBody>
          </Panel>

          {/* Positions */}
          <Panel colSpan={6}>
            <PanelHeader>Positions</PanelHeader>
            <PanelBody style={{ padding: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Qty</th>
                    <th>Avg Price</th>
                    <th>LTP</th>
                    <th>P&L</th>
                    <th>P&L %</th>
                  </tr>
                </thead>
                <tbody>
                  {traderPositions.map((pos) => (
                    <tr key={pos.symbol}>
                      <td style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>{pos.symbol}</td>
                      <td className="value-mono">{pos.qty}</td>
                      <td className="value-mono">{pos.avgPrice.toFixed(2)}</td>
                      <td className="value-mono">{pos.ltp.toFixed(2)}</td>
                      <td className={`value-mono ${pos.pnl >= 0 ? 'value-bull' : 'value-bear'}`}>
                        {pos.pnl >= 0 ? '+' : ''}{pos.pnl.toLocaleString()}
                      </td>
                      <td className={`value-mono ${pos.pnl >= 0 ? 'value-bull' : 'value-bear'}`}>
                        {pos.pnl >= 0 ? '+' : ''}{pos.pnlPct.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </PanelBody>
          </Panel>

          {/* Recent Orders */}
          <Panel colSpan={6}>
            <PanelHeader>Recent Orders</PanelHeader>
            <PanelBody style={{ padding: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Symbol</th>
                    <th>Type</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {traderOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="value-mono">{order.id}</td>
                      <td style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>{order.symbol}</td>
                      <td className={order.type === 'BUY' ? 'value-bull' : 'value-bear'} style={{ fontWeight: 500 }}>{order.type}</td>
                      <td className="value-mono">{order.qty}</td>
                      <td className="value-mono">{order.price.toFixed(2)}</td>
                      <td>
                        <span className={`badge ${order.status === 'EXECUTED' ? 'badge-bull' : order.status === 'PENDING' ? 'badge-accent' : 'badge-muted'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="value-mono" style={{ color: 'var(--text-secondary)' }}>{order.time}</td>
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