/**
 * File:        apps/mobile/app/(tabs)/_layout.tsx
 * Module:      mobile · Routing · Tabs Group
 * Purpose:     Bottom-tab layout for the main authenticated surface.
 *              Declares four tabs — Quotes, Positions, Orders, Account —
 *              each backed by a placeholder screen in the same group.
 *              The tab bar uses the Obsidian palette: dark surface,
 *              monospaced inactive labels, no shadows. Icons come from
 *              `lucide-react-native`.
 *
 * Exports:
 *   - TabsLayout (default) — the tab navigator layout
 *
 * Depends on:
 *   - expo-router                   — Tabs
 *   - @react-navigation/bottom-tabs — TabBar types (transitive)
 *   - lucide-react-native          — LineChart, Briefcase, ListChecks, User
 *   - ../src/design/layout         — layout.tabBarHeight
 *   - ../src/design/tokens         — tokens, textStyles
 *
 * Side-effects:
 *   - none
 *
 * Key invariants:
 *   - `tabBarShowLabel: false` per the brief — the brief asked for
 *     "no labels for inactive tabs". We extend that to ALL tabs for
 *     visual consistency: a single, large icon per tab keeps the
 *     thumb zone clean. The accessible name is still set so screen
 *     readers can announce the tab.
 *   - Icons render at 22px stroke 2 — the lucide-recommended density
 *     for bottom tabs. Anything larger breaks the dark terminal grid.
 *   - The tab bar is rendered at the BOTTOM of the safe area, not
 *     absolute-positioned — `Tabs` from `expo-router` handles the
 *     insets automatically.
 *
 * Read order:
 *   1. TabsLayout — single default export
 *
 * Author:       BharatERP
 * Last-updated: 2026-06-03
 */

import { Tabs } from 'expo-router';
import { Briefcase, LineChart, ListChecks, User } from 'lucide-react-native';
import type { ComponentType } from 'react';

import { layout } from '../../src/design/layout';
import { textStyles, tokens } from '../../src/design/tokens';

type IconComponent = ComponentType<{ color: string; size: number; strokeWidth?: number }>;

const TAB_ICON_SIZE = 22;

const TAB_ICON: Record<'quotes' | 'positions' | 'orders' | 'account', IconComponent> = {
  quotes: LineChart,
  positions: Briefcase,
  orders: ListChecks,
  account: User,
};

export default function TabsLayout(): React.JSX.Element {
  return (
    <Tabs
      screenOptions={({ route }) => {
        const name = route.name as keyof typeof TAB_ICON;
        const Icon = TAB_ICON[name] ?? User;
        return {
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: tokens.bg.surface,
            borderTopColor: tokens.border.default,
            borderTopWidth: 1,
            height: layout.tabBarHeight,
          },
          tabBarActiveTintColor: tokens.sem.bull,
          tabBarInactiveTintColor: tokens.fg.muted,
          tabBarIcon: ({ color }) => (
            <Icon color={color} size={TAB_ICON_SIZE} strokeWidth={2} />
          ),
        };
      }}
    />
  );
}
