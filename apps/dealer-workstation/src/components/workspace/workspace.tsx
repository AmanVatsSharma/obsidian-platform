/**
 * File:        apps/dealer-workstation/src/components/workspace/workspace.tsx
 * Module:      dealer-workstation · Workspace
 * Purpose:     6-tab workspace container — renders the active tab panel and
 *              the clickable tab bar; tab state lives in DeskContext so other
 *              panels can navigate to a tab (e.g. "View in Clients" link).
 *
 * Exports:
 *   - Workspace() — tab bar + active panel switcher
 *
 * Side-effects: none
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

'use client';

import { useDeskData } from '../../lib/mock-data-context';
import { BookTab }         from './tabs/book-tab';
import { ExecutionsTab }   from './tabs/executions-tab';
import { RiskTab }         from './tabs/risk-tab';
import { ClientsTab }      from './tabs/clients-tab';
import { SurveillanceTab } from './tabs/surveillance-tab';
import { ChatTab }         from './tabs/chat-tab';

const TABS = [
  { id: 'book',          label: 'BOOK' },
  { id: 'executions',    label: 'EXECUTIONS' },
  { id: 'risk',          label: 'RISK' },
  { id: 'clients',       label: 'CLIENTS' },
  { id: 'surveillance',  label: 'SURVEILLANCE' },
  { id: 'chat',          label: 'CHAT' },
] as const;

type TabId = typeof TABS[number]['id'];

function tabBadgeColor(id: TabId, count: number): string | null {
  if (count === 0) return null;
  if (id === 'surveillance') return 'var(--bear)';
  if (id === 'chat')         return 'var(--accent)';
  return null;
}

export function Workspace() {
  const { activeTab, setActiveTab, surveillanceAlerts, chatMessages, clients } = useDeskData();

  function badgeCount(id: TabId): number {
    if (id === 'surveillance') return surveillanceAlerts.filter(a => a.status === 'ACTIVE').length;
    if (id === 'chat')         return chatMessages.length;
    if (id === 'clients')      return clients.filter(c => c.status === 'MARGIN_CALL').length;
    return 0;
  }

  function badgeStyle(id: TabId): string | null {
    const count = badgeCount(id);
    if (count === 0) return null;
    if (id === 'clients')      return 'var(--bear)';
    return tabBadgeColor(id, count);
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', background: 'var(--bg-panel)', borderBottom: '2px solid var(--border-md)', flexShrink: 0, overflowX: 'auto' }}>
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          const count  = badgeCount(tab.id);
          const color  = badgeStyle(tab.id);

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding:       '9px 18px',
                fontFamily:    'var(--font-display)',
                fontSize:      11,
                fontWeight:    active ? 700 : 500,
                letterSpacing: '0.06em',
                color:         active ? 'var(--fg1)' : 'var(--fg3)',
                background:    active ? 'var(--bg-surface)' : 'transparent',
                border:        'none',
                borderBottom:  active ? '2px solid var(--accent)' : '2px solid transparent',
                marginBottom:  -2,
                cursor:        'pointer',
                whiteSpace:    'nowrap',
                display:       'flex',
                alignItems:    'center',
                gap:           6,
                transition:    'color var(--dur-fast)',
              }}
            >
              {tab.label}
              {count > 0 && (
                <span style={{
                  background:   color ?? 'var(--fg3)',
                  color:        '#fff',
                  fontSize:     9,
                  fontWeight:   700,
                  borderRadius: 8,
                  padding:      '1px 5px',
                  lineHeight:   1,
                  fontFamily:   'var(--font-data)',
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active panel */}
      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {activeTab === 'book'         && <BookTab />}
        {activeTab === 'executions'   && <ExecutionsTab />}
        {activeTab === 'risk'         && <RiskTab />}
        {activeTab === 'clients'      && <ClientsTab />}
        {activeTab === 'surveillance' && <SurveillanceTab />}
        {activeTab === 'chat'         && <ChatTab />}
      </div>
    </div>
  );
}
