/**
 * File:        libs/mobile-ui-kit/src/lib/types.ts
 * Module:      mobile-ui-kit · Contracts
 * Purpose:     Shared prop types for mobile UI primitives. All component
 *              prop types live here so screens have a single import surface
 *              for shape contracts.
 *
 * Exports:
 *   - Density                    — 'compact' | 'regular' | 'comfortable'
 *   - Side                       — 'BUY' | 'SELL'
 *   - OrderTypeBadge             — MARKET | LIMIT | STOP | STOP_LIMIT | GTT
 *   - PnlSign                    — signed-numeric P&L (positive = gain)
 *   - NumberFormat               — formatting hint for the number-text primitive
 *   - PanelProps                 — Panel container props
 *   - PillProps                  — Status pill props
 *   - SideButtonProps            — BUY/SELL button props
 *   - NumberTextProps            — monospace numeric text props
 *
 * Depends on:
 *   - none
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - Numeric deltas always carry a sign — '+' for non-negative, '-' for
 *     negative — per CLAUDE.md §12. Bull/bear classification is derived
 *     from the value, never passed in.
 *
 * Read order:
 *   1. Side/OrderTypeBadge  — small enum-like types
 *   2. PanelProps / PillProps / SideButtonProps / NumberTextProps
 *
 * Author:       BharatERP
 * Last-updated: 2026-06-03
 */

export type Density = 'compact' | 'regular' | 'comfortable';

export type Side = 'BUY' | 'SELL';

export type OrderTypeBadge = 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT' | 'GTT';

export type PnlSign = number;

export type NumberFormat = 'price' | 'integer' | 'percent' | 'currency';

export interface PanelProps {
  title: string;
  density?: Density;
  loading?: boolean;
  error?: string | null;
  testID?: string;
  children?: React.ReactNode;
}

export interface PillProps {
  label: string;
  tone?: 'neutral' | 'bull' | 'bear' | 'warn' | 'accent';
  testID?: string;
}

export interface SideButtonProps {
  side: Side;
  label?: string;
  disabled?: boolean;
  onPress: () => void;
  testID?: string;
}

export interface NumberTextProps {
  value: number;
  digits?: number;
  format?: NumberFormat;
  signed?: boolean;
  bullBear?: boolean;
  muted?: boolean;
  testID?: string;
}
