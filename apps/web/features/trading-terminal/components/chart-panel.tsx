/**
 * @file chart-panel.tsx
 * @module web-trading
 * @description Candlestick + volume chart using TradingView lightweight-charts (v4 API).
 * @author BharatERP
 * @created 2026-04-03
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import type { CandlestickData, HistogramData, ISeriesApi, UTCTimestamp } from 'lightweight-charts';
import { Activity, CandlestickChart, LineChart, Maximize2, RefreshCw, SlidersHorizontal } from 'lucide-react';
import type { Instrument } from '../lib/types';
import { fmtPrice, pnlSign } from '../lib/format-utils';
import { TIMEFRAMES, generateOHLCV } from '../lib/mock-data';

type PriceMap = Record<string, Instrument>;

export function ChartPanel({ instrument, prices }: { instrument: Instrument | null; prices: PriceMap }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const candleRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const [tf, setTf] = useState('5m');
  const [chartType, setChartType] = useState<'candle' | 'line'>('candle');
  const [ohlc, setOhlc] = useState({ o: 0, h: 0, l: 0, c: 0, v: 0 });
  const price = (instrument && prices[instrument.symbol]) ?? instrument;

  useEffect(() => {
    if (!containerRef.current) return;
    let cancel = false;

    const init = async (): Promise<(() => void) | undefined> => {
      const { createChart, CrosshairMode } = await import('lightweight-charts');
      if (!containerRef.current || cancel) return undefined;

      const chart = createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
        layout: {
          background: { color: 'transparent' },
          textColor: '#8B95A3',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 11,
        },
        grid: {
          vertLines: { color: '#1C2028', style: 1 },
          horzLines: { color: '#1C2028', style: 1 },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: { color: '#2E3847', style: 0, width: 1 },
          horzLine: { color: '#2E3847', style: 0, width: 1, labelBackgroundColor: '#141820' },
        },
        rightPriceScale: {
          borderColor: '#1C2028',
          scaleMargins: { top: 0.06, bottom: 0.25 },
        },
        timeScale: {
          borderColor: '#1C2028',
          timeVisible: true,
          secondsVisible: false,
        },
        handleScroll: true,
        handleScale: true,
      });

      const series = chart.addCandlestickSeries({
        upColor: '#10D996',
        downColor: '#FF3B5C',
        borderUpColor: '#10D996',
        borderDownColor: '#FF3B5C',
        wickUpColor: '#10D996',
        wickDownColor: '#FF3B5C',
      });
      candleRef.current = series;
      const volSeries = chart.addHistogramSeries({
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
      });
      chart.priceScale('volume').applyOptions({
        scaleMargins: { top: 0.82, bottom: 0 },
      });
      volRef.current = volSeries;

      const basePrice = instrument?.bid ?? 1.08452;
      const candles = generateOHLCV(basePrice, 300);
      const candleRows: CandlestickData<UTCTimestamp>[] = candles.map((c) => ({
        time: c.time as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));
      series.setData(candleRows);
      const histRows: HistogramData<UTCTimestamp>[] = candles.map((c) => ({
        time: c.time as UTCTimestamp,
        value: c.volume,
        color: c.close >= c.open ? 'rgba(16,217,150,0.35)' : 'rgba(255,59,92,0.35)',
      }));
      volSeries.setData(histRows);
      chart.timeScale().fitContent();

      if (candles.length) {
        const last = candles[candles.length - 1];
        setOhlc({ o: last.open, h: last.high, l: last.low, c: last.close, v: last.volume });
      }

      chart.subscribeCrosshairMove((param) => {
        const bar = param.seriesData.get(series) as { open?: number; high?: number; low?: number; close?: number } | undefined;
        if (bar?.open != null) {
          setOhlc({ o: bar.open, h: bar.high ?? 0, l: bar.low ?? 0, c: bar.close ?? 0, v: 0 });
        }
      });

      const ro = new ResizeObserver(() => {
        if (containerRef.current && chart) {
          chart.applyOptions({
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight,
          });
        }
      });
      ro.observe(containerRef.current);
      return () => {
        ro.disconnect();
        chart.remove();
        candleRef.current = null;
        volRef.current = null;
      };
    };

    const p = init();
    return () => {
      cancel = true;
      void p.then((fn) => fn?.());
    };
  }, [instrument?.symbol]);

  useEffect(() => {
    if (!candleRef.current || !volRef.current || !instrument) return;
    const tick = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const close = prices[instrument.symbol]?.bid ?? instrument.bid;
      const open = close * (1 + (Math.random() - 0.5) * 0.0002);
      const high = Math.max(open, close) * (1 + Math.random() * 0.0001);
      const low = Math.min(open, close) * (1 - Math.random() * 0.0001);
      try {
        candleRef.current?.update({ time: now as UTCTimestamp, open, high, low, close });
        volRef.current?.update({
          time: now as UTCTimestamp,
          value: Math.floor(Math.random() * 200000 + 20000),
          color: close >= open ? 'rgba(16,217,150,0.35)' : 'rgba(255,59,92,0.35)',
        });
      } catch {
        /* same-timestamp updates can throw; ignore */
      }
    }, 1500);
    return () => clearInterval(tick);
  }, [instrument?.symbol, prices, instrument]);

  const isUp = (price?.changePct ?? 0) >= 0;

  return (
    <div className="panel" style={{ flex: 1, borderBottom: 'none', borderRight: 'none', borderLeft: 'none' }}>
      <div className="chart-toolbar">
        <div className="chart-symbol-display">
          <span className="csd-symbol">{instrument?.symbol ?? '—'}</span>
          <span className={`csd-price ${isUp ? 'bull' : 'bear'}`}>{fmtPrice(price?.bid, instrument?.digits ?? 5)}</span>
          <span className={`csd-change ${isUp ? 'bull' : 'bear'}`}>
            {pnlSign(price?.changePct ?? 0)}
            {(price?.changePct ?? 0).toFixed(2)}%
          </span>
        </div>
        <div className="tf-divider" />
        {TIMEFRAMES.map((t) => (
          <button key={t} type="button" className={`tf-btn ${tf === t ? 'active' : ''}`} onClick={() => setTf(t)}>
            {t}
          </button>
        ))}
        <div className="tf-divider" />
        <button type="button" className={`indicator-btn ${chartType === 'candle' ? 'active' : ''}`} onClick={() => setChartType('candle')}>
          <CandlestickChart size={13} /> Candles
        </button>
        <button type="button" className={`indicator-btn ${chartType === 'line' ? 'active' : ''}`} onClick={() => setChartType('line')}>
          <LineChart size={13} /> Line
        </button>
        <button type="button" className="indicator-btn">
          <Activity size={13} /> Indicators
        </button>
        <button type="button" className="draw-btn">
          <SlidersHorizontal size={13} /> Drawing
        </button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
          <button type="button" className="panel-btn" aria-label="Maximize chart">
            <Maximize2 size={13} />
          </button>
          <button type="button" className="panel-btn" aria-label="Refresh chart">
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      <div className="chart-container" ref={containerRef} id="tv-chart">
        <div className="chart-ohlc-overlay">
          {(
            [
              ['O', ohlc.o],
              ['H', ohlc.h],
              ['L', ohlc.l],
              ['C', ohlc.c],
            ] as const
          ).map(([label, val]) => (
            <div key={label} className="ohlc-item">
              <span className="ohlc-label">{label}</span>
              <span className={`ohlc-val ${label === 'H' ? 'bull' : label === 'L' ? 'bear' : ''}`}>
                {fmtPrice(val, instrument?.digits ?? 5)}
              </span>
            </div>
          ))}
          <div className="ohlc-item">
            <span className="ohlc-label">VOL</span>
            <span className="ohlc-val" style={{ color: 'var(--text-secondary)' }}>
              {(ohlc.v / 1000).toFixed(0)}K
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
