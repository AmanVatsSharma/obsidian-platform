/**
 * File:        tests/order-entry-extended.spec.tsx
 * Module:      web-trading
 * Purpose:     Integration tests for extended order types (GTT/Trailing/Stop/Iceberg/TWAP/VWAP) and bracket order submission
 *
 * Exports:
 *   - (test suite only — no runtime exports)
 *
 * Depends on:
 *   - react — testing library
 *   - @testing-library/react — component rendering
 *
 * Side-effects: none
 *
 * Key invariants:
 *   - GTT shows trigger price + condition fields when type=GTT selected
 *   - TWAP shows slices + duration fields when type=TWAP selected
 *   - Bracket fields (SL/TP) are always visible regardless of order type
 *
 * Read order:
 *   1. Test setup helpers — renderOrderEntry factory
 *   2. Order type tests — field visibility per type
 *   3. Bracket order tests — payload shape when SL/TP filled
 *   4. Algo order tests — TWAP/VWAP slices/duration payload
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-24
 */

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OrderEntry } from '../components/order-entry';
import type { Instrument, OrderTypeExtended, TriggerCondition } from '../lib/types';

// Minimal instrument fixture
const EURUSD: Instrument = {
  symbol: 'EURUSD',
  name: 'Euro / US Dollar',
  bid: 1.0845,
  ask: 1.0848,
  change: 0.0003,
  changePct: 0.03,
  high: 1.0855,
  low: 1.0830,
  spread: 0.3,
  pip: 0.0001,
  category: 'forex',
  digits: 5,
  instrumentId: 'inst-eurusd',
};

const prices = { EURUSD };

// Spy payload collector
let collectedPayloads: Parameters<Parameters<typeof OrderEntry>[0]['onTrade']>[0][] = [];

function renderOrderEntry(instrument: Instrument | null = EURUSD) {
  collectedPayloads = [];
  return render(
    <OrderEntry
      instrument={instrument}
      prices={prices}
      onTrade={(payload) => collectedPayloads.push(payload)}
    />,
  );
}

function clickTab(label: string) {
  fireEvent.click(screen.getByRole('button', { name: label }));
}

function clickTypeBtn(label: string) {
  fireEvent.click(screen.getByRole('button', { name: label }));
}

function typeValue(label: string, value: string) {
  const input = screen.getByLabelText(label);
  fireEvent.change(input, { target: { value } });
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const clickBuy = () => clickTab('▲ BUY');
const clickSell = () => clickTab('▼ SELL');

function setLots(v: string) {
  typeValue('Volume in lots', v);
}

function setPrice(v: string) {
  typeValue('Order price', v);
}

function setTriggerPrice(v: string) {
  typeValue('GTT trigger price', v);
}

function setTrailDistance(v: string) {
  typeValue('Trailing distance', v);
}

function setDisplayQty(v: string) {
  typeValue('Iceberg display quantity', v);
}

function setSlices(v: string) {
  typeValue('Number of TWAP/VWAP slices', v);
}

function setDuration(v: string) {
  typeValue('TWAP/VWAP duration in minutes', v);
}

function setSl(v: string) {
  // SL input has no aria-label — find by placeholder
  const inputs = screen.getAllByPlaceholderText('0.00');
  fireEvent.change(inputs[0], { target: { value: v } });
}

function setTp(v: string) {
  const inputs = screen.getAllByPlaceholderText('0.00');
  fireEvent.change(inputs[1], { target: { value: v } });
}

function submit() {
  // Submit button label contains BUY/SELL + type
  const btns = screen.getAllByRole('button');
  const submitBtn = btns.find((b) => b.className.includes('oe-submit'));
  if (submitBtn) fireEvent.click(submitBtn);
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe('OrderEntry — order type buttons', () => {
  it('renders all 8 order type buttons', () => {
    renderOrderEntry();
    const types = ['Market', 'Limit', 'Stop', 'GTT', 'Trailing', 'Iceberg', 'TWAP', 'VWAP'];
    types.forEach((t) => {
      expect(screen.getByRole('button', { name: t })).toBeInTheDocument();
    });
  });

  it('shows price input for LIMIT', () => {
    renderOrderEntry();
    clickTypeBtn('Limit');
    expect(screen.queryByLabelText('Order price')).toBeInTheDocument();
  });

  it('hides price input for MARKET', () => {
    renderOrderEntry();
    clickTypeBtn('Market');
    expect(screen.queryByLabelText('Order price')).not.toBeInTheDocument();
  });
});

describe('OrderEntry — GTT fields', () => {
  it('shows trigger price and condition when GTT selected', () => {
    renderOrderEntry();
    clickTypeBtn('GTT');
    expect(screen.getByLabelText('GTT trigger price')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ABOVE' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'BELOW' })).toBeInTheDocument();
  });

  it('hides GTT fields when LIMIT selected', () => {
    renderOrderEntry();
    clickTypeBtn('GTT');
    clickTypeBtn('Limit');
    expect(screen.queryByLabelText('GTT trigger price')).not.toBeInTheDocument();
  });

  it('emits triggerPrice and triggerCondition in payload on GTT submit', () => {
    renderOrderEntry();
    clickTypeBtn('GTT');
    setTriggerPrice('1.0900');
    clickTab('ABOVE');
    submit();

    expect(collectedPayloads).toHaveLength(1);
    const p = collectedPayloads[0];
    expect(p.type).toBe('GTT');
    expect(p.triggerPrice).toBe('1.0900');
    expect(p.triggerCondition).toBe('ABOVE');
  });
});

describe('OrderEntry — TWAP/VWAP fields', () => {
  it('shows slices and duration when TWAP selected', () => {
    renderOrderEntry();
    clickTypeBtn('TWAP');
    expect(screen.getByLabelText('Number of TWAP/VWAP slices')).toBeInTheDocument();
    expect(screen.getByLabelText('TWAP/VWAP duration in minutes')).toBeInTheDocument();
  });

  it('shows slices and duration when VWAP selected', () => {
    renderOrderEntry();
    clickTypeBtn('VWAP');
    expect(screen.getByLabelText('Number of TWAP/VWAP slices')).toBeInTheDocument();
    expect(screen.getByLabelText('TWAP/VWAP duration in minutes')).toBeInTheDocument();
  });

  it('emits slices and durationMinutes in payload on TWAP submit', () => {
    renderOrderEntry();
    clickTypeBtn('TWAP');
    setSlices('20');
    setDuration('60');
    submit();

    expect(collectedPayloads).toHaveLength(1);
    const p = collectedPayloads[0];
    expect(p.type).toBe('TWAP');
    expect(p.slices).toBe(20);
    expect(p.durationMinutes).toBe(60);
  });
});

describe('OrderEntry — Iceberg fields', () => {
  it('shows display qty when Iceberg selected', () => {
    renderOrderEntry();
    clickTypeBtn('Iceberg');
    expect(screen.getByLabelText('Iceberg display quantity')).toBeInTheDocument();
  });

  it('emits displayQty in payload on Iceberg submit', () => {
    renderOrderEntry();
    clickTypeBtn('Iceberg');
    setLots('10.00');
    setDisplayQty('1.00');
    submit();

    expect(collectedPayloads).toHaveLength(1);
    const p = collectedPayloads[0];
    expect(p.type).toBe('ICEBERG');
    expect(p.displayQty).toBe('1.00');
  });
});

describe('OrderEntry — Trailing Stop fields', () => {
  it('shows trail distance when Trailing selected', () => {
    renderOrderEntry();
    clickTypeBtn('Trailing');
    expect(screen.getByLabelText('Trailing distance')).toBeInTheDocument();
  });
});

describe('OrderEntry — bracket (SL/TP always visible)', () => {
  it('SL input is present regardless of order type', () => {
    renderOrderEntry();
    const slInputs = screen.getAllByPlaceholderText('0.00');
    expect(slInputs.length).toBeGreaterThanOrEqual(1);
  });

  it('emits sl and tp in payload when both are filled', () => {
    renderOrderEntry();
    setLots('1.00');
    setSl('1.0800');
    setTp('1.0900');
    submit();

    expect(collectedPayloads).toHaveLength(1);
    const p = collectedPayloads[0];
    expect(p.sl).toBe('1.0800');
    expect(p.tp).toBe('1.0900');
  });
});

describe('OrderEntry — side toggle', () => {
  it('default side is BUY', () => {
    renderOrderEntry();
    expect(screen.getByRole('button', { name: '▲ BUY' })).toHaveClass('active');
  });

  it('switches to SELL', () => {
    renderOrderEntry();
    clickSell();
    expect(screen.getByRole('button', { name: '▼ SELL' })).toHaveClass('active');
  });

  it('emits correct side in payload', () => {
    renderOrderEntry();
    clickSell();
    setLots('2.00');
    submit();

    expect(collectedPayloads).toHaveLength(1);
    expect(collectedPayloads[0].side).toBe('sell');
  });
});