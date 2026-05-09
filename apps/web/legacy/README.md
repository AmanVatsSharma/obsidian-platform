# Obsidian Trading Terminal

World-class multi-asset professional trading dashboard — Next.js 14.

## Stack
- **Next.js 14** (Pages Router, JSX)
- **TradingView Lightweight Charts v4** — candlestick chart, live ticks, volume bars
- **Lucide React** — icon system
- **CSS Custom Properties** — full design token system, zero external CSS frameworks
- **No state library** — pure React hooks

## Feature Set

| Panel | Description |
|---|---|
| **Live Chart** | TradingView Lightweight Charts, OHLCV, crosshair, OHLC overlay, timeframe switcher, indicator toolbar |
| **Order Entry** | Buy/Sell, Market/Limit/Stop, lot size, SL/TP, live bid/ask, margin calc, pip value |
| **Watchlist** | All asset classes (FX/Crypto/Indices/Commodities), live ticking prices, category filter |
| **Depth of Market** | 10-level bid/ask ladder, volume bars, live refresh every 800ms |
| **Account Summary** | Balance, equity, unrealised P&L, margin level, risk meter, 30-day P&L sparkline |
| **Positions** | Live P&L updates, close individual / close all, edit SL/TP |
| **Pending Orders** | Full order book, cancel/edit |
| **Trade History** | Win rate, gross profit/loss, net P&L summary |
| **Economic Calendar** | Impact filter, actual vs forecast vs previous |
| **News Feed** | Sentiment indicator, source, symbol tag |
| **Status Bar** | Connection status, server, latency, UTC time |
| **Toast System** | Trade confirmations, position close notifications |

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── pages/
│   ├── _app.jsx          # Global CSS import
│   └── index.jsx         # Complete trading dashboard (all components)
├── lib/
│   └── mockData.js       # All mock data: instruments, OHLCV, positions, news…
├── styles/
│   └── dashboard.css     # Complete design system — CSS tokens, all component styles
├── package.json
└── next.config.js
```

## Design System

All colors, spacing, typography, and shadows are defined as CSS custom properties in `styles/dashboard.css`.

**Key tokens:**
```css
--bg-base:    #06080A   /* deepest background */
--bull:       #10D996   /* green / buy */
--bear:       #FF3B5C   /* red / sell */
--accent:     #3B82F6   /* primary CTA */
--font-data:  'IBM Plex Mono'  /* all numbers & prices */
--font-display: 'Syne'         /* headers & labels */
```

## Connecting Real Data

Replace mock data with live feeds:
- **Prices** — swap `setInterval` in `useEffect` for WebSocket connection to your price server
- **Chart** — replace `generateOHLCV()` with REST/WS OHLCV data from your broker API
- **Positions** — connect to your trading engine REST API
- **DOM** — WebSocket depth feed
- **Calendar** — any economic calendar API (e.g. investing.com, tradingeconomics)
- **News** — RSS/API feed

## Mobile

Full responsive layout with CSS media queries:
- `≤ 1024px` — compressed sidebar widths
- `≤ 768px` — stacked column layout, horizontal watchlist strip
- `≤ 480px` — minimal top bar, full-width panels

## Multi-Tenant Theming

Override CSS variables per broker by wrapping the dashboard root:
```jsx
<div style={{ '--accent': brandColor, '--bull': brandBull }}>
  <TradingDashboard />
</div>
```
