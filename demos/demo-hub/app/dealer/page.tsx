'use client';

import DemoHeader from '@/components/DemoHeader';
import DemoShell, { PanelSection, Panel, PanelHeader, PanelBody } from '@/components/DemoShell';
import {
  dealerQuotes,
  dealerRiskBook,
  dealerPnL,
  formatCurrency,
  formatCompact,
} from '@/lib/mock-data';

export default function DealerDemo() {
  return (
    <DemoShell>
      <DemoHeader
        title="Dealer Workstation"
        subtitle="Real-time quote management and risk book monitoring"
        color="#f59e0b"
      />

      <div style={{ padding: 'var(--space-6)', maxWidth: '1600px', margin: '0 auto' }}>
        {/* P&L Summary Bar */}
        <div
          className="panel"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-4) var(--space-6)',
            marginBottom: 'var(--space-6)',
          }}
        >
          <div style={{ display: 'flex', gap: 'var(--space-8)' }}>
            <div>
              <div className="kpi-label">Realized P&L</div>
              <div className={`kpi-value ${dealerPnL.realized >= 0 ? 'value-bull' : 'value-bear'}`}>
                {dealerPnL.realized >= 0 ? '+' : ''}{formatCurrency(dealerPnL.realized)}
              </div>
            </div>
            <div>
              <div className="kpi-label">Unrealized P&L</div>
              <div className={`kpi-value ${dealerPnL.unrealized >= 0 ? 'value-bull' : 'value-bear'}`}>
                {dealerPnL.unrealized >= 0 ? '+' : ''}{formatCurrency(dealerPnL.unrealized)}
              </div>
            </div>
            <div>
              <div className="kpi-label">Total P&L</div>
              <div className={`kpi-value ${dealerPnL.total >= 0 ? 'value-bull' : 'value-bear'}`}>
                {dealerPnL.total >= 0 ? '+' : ''}{formatCurrency(dealerPnL.total)}
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div className="kpi-label">Daily Target Progress</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div className="progress-bar" style={{ width: '120px' }}>
                <div
                  className="progress-fill"
                  style={{
                    width: `${dealerPnL.progress}%`,
                    background: dealerPnL.progress >= 50 ? 'var(--bull)' : 'var(--accent)',
                  }}
                />
              </div>
              <span className="value-mono" style={{ fontSize: '16px', fontWeight: 600 }}>
                {dealerPnL.progress}%
              </span>
            </div>
          </div>
        </div>

        {/* Main Panels */}
        <PanelSection>
          {/* Quote Panel */}
          <Panel colSpan={8}>
            <PanelHeader>Live Quotes</PanelHeader>
            <PanelBody style={{ padding: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Bid</th>
                    <th>Ask</th>
                    <th>Spread</th>
                    <th>Volume</th>
                    <th>Last Trade</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dealerQuotes.map((quote) => (
                    <tr key={quote.symbol}>
                      <td style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px' }}>
                        {quote.symbol}
                      </td>
                      <td className="value-mono value-bull" style={{ fontSize: '14px' }}>
                        {quote.bid.toFixed(2)}
                      </td>
                      <td className="value-mono value-bear" style={{ fontSize: '14px' }}>
                        {quote.ask.toFixed(2)}
                      </td>
                      <td className="value-mono" style={{ color: 'var(--text-secondary)' }}>
                        {quote.spread.toFixed(2)}
                      </td>
                      <td className="value-mono">{quote.volume}</td>
                      <td className="value-mono" style={{ color: 'var(--text-muted)' }}>
                        {quote.lastTrade}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <button className="btn" style={{ padding: '2px 8px', fontSize: '11px', background: 'var(--bull-bg)', color: 'var(--bull)', border: 'none' }}>
                            BUY
                          </button>
                          <button className="btn" style={{ padding: '2px 8px', fontSize: '11px', background: 'var(--bear-bg)', color: 'var(--bear)', border: 'none' }}>
                            SELL
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </PanelBody>
          </Panel>

          {/* Quick Trade */}
          <Panel colSpan={4}>
            <PanelHeader>Quick Trade</PanelHeader>
            <PanelBody>
              <form style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>Symbol</label>
                  <select style={{ width: '100%', padding: 'var(--space-2)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}>
                    {dealerQuotes.map((q) => (
                      <option key={q.symbol}>{q.symbol}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>Qty</label>
                    <input type="number" defaultValue="100" style={{ width: '100%', padding: 'var(--space-2)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>Price</label>
                    <input type="number" step="0.01" style={{ width: '100%', padding: 'var(--space-2)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>Order Type</label>
                  <select style={{ width: '100%', padding: 'var(--space-2)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)' }}>
                    <option>Market</option>
                    <option>Limit</option>
                    <option>Stop Loss</option>
                  </select>
                </div>
                <button type="button" className="btn btn-primary" style={{ justifyContent: 'center' }}>
                  Execute Trade
                </button>
              </form>
            </PanelBody>
          </Panel>

          {/* Risk Book */}
          <Panel colSpan={12}>
            <PanelHeader>Risk Book</PanelHeader>
            <PanelBody style={{ padding: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Desk</th>
                    <th>P&L</th>
                    <th>Exposure</th>
                    <th>VaR (95%)</th>
                    <th>Limit</th>
                    <th>Utilization</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dealerRiskBook.map((desk) => (
                    <tr key={desk.desk}>
                      <td style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>{desk.desk}</td>
                      <td className={`value-mono ${desk.pnl >= 0 ? 'value-bull' : 'value-bear'}`} style={{ fontSize: '14px' }}>
                        {desk.pnl >= 0 ? '+' : ''}{formatCurrency(desk.pnl)}
                      </td>
                      <td className="value-mono">{formatCompact(desk.exposure)}</td>
                      <td className="value-mono">{formatCompact(desk.var)}</td>
                      <td className="value-mono">{formatCompact(desk.limit)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <div className="progress-bar" style={{ width: '80px' }}>
                            <div
                              className="progress-fill"
                              style={{
                                width: `${(desk.exposure / desk.limit) * 100}%`,
                                background: desk.status === 'Warning' ? 'var(--bear)' : 'var(--bull)',
                              }}
                            />
                          </div>
                          <span className="value-mono" style={{ width: '35px', textAlign: 'right' }}>
                            {((desk.exposure / desk.limit) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${desk.status === 'Normal' ? 'badge-bull' : 'badge-accent'}`}>
                          {desk.status}
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