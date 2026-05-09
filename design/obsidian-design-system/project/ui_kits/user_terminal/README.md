# User Terminal

Obsidian's consumer-grade trading dashboard. Multi-asset — FX, crypto, indices, commodities.

**Source:** `Obsidian/User/` (Next.js 14 + TradingView Lightweight Charts + Lucide + CSS custom props).

## Screens recreated

- `index.html` — full terminal layout: topbar, watchlist, chart + DOM, positions table, order entry, account summary.

## Key components (in the HTML)

- **TopBar** — pulsing-dot logo + pinned symbols + session pills + alert/settings + account chip
- **Watchlist** — category filter, search, active-item blue left-bar, bull/bear colored prices
- **ChartPanel** — mock SVG candlesticks + volume histogram, OHLC overlay, timeframe switcher
- **DepthOfMarket** — ask/bid ladder with proportional volume bars, spread row
- **OrderEntry** — Buy/Sell tabs, volume/type/SL/TP inputs, bid/ask/spread triplet, glowing CTA
- **AccountPanel** — 2×2 stats grid, risk meter, 30-day P&L sparkline with gradient fill
- **PositionsTable** — mono cells, BUY/SELL pill, uppercase header, close button
- **StatusBar** — pulsing green dot, server, latency, feed, UTC clock

All styles consume `colors_and_type.css` tokens.
