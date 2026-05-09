'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { ToastProvider } from '../shared/Toast';
import { ConfirmProvider } from '../shared/ConfirmDialog';
import { broker, notifications as notifData } from '../../lib/mockData';

// ─── NAV CONFIG ───────────────────────────────────────────────────────────────
const NAV = [
  {
    section: 'OVERVIEW',
    items: [
      { id: 'dashboard',    label: 'Dashboard',           icon: '◈' },
      { id: 'live-monitor', label: 'Live Monitor',         icon: '◉' },
    ],
  },
  {
    section: 'CLIENTS',
    items: [
      { id: 'clients',      label: 'All Clients',          icon: '◻' },
      { id: 'kyc-queue',    label: 'KYC Queue',            icon: '◫', badge: 14 },
      { id: 'ibs',          label: 'Introducing Brokers',  icon: '◈' },
      { id: 'client-groups',label: 'Client Groups',        icon: '◻' },
    ],
  },
  {
    section: 'TRADING',
    items: [
      { id: 'instruments',  label: 'Instruments',          icon: '◈' },
      { id: 'pricing-rules',label: 'Pricing Rules',        icon: '◫' },
      { id: 'sessions',     label: 'Trading Sessions',     icon: '◉' },
      { id: 'orders',       label: 'Order Management',     icon: '◻' },
    ],
  },
  {
    section: 'RISK & COMPLIANCE',
    items: [
      { id: 'risk',         label: 'Risk Dashboard',       icon: '◈' },
      { id: 'exposure',     label: 'Exposure Limits',      icon: '◫' },
      { id: 'surveillance', label: 'Surveillance Alerts',  icon: '◉', badge: 3, badgeColor: 'warn' },
      { id: 'aml',          label: 'AML Monitor',          icon: '◻' },
    ],
  },
  {
    section: 'FINANCE',
    items: [
      { id: 'transactions', label: 'Transactions',         icon: '◈', badge: 23 },
      { id: 'commissions',  label: 'IB Commissions',       icon: '◫' },
      { id: 'bonuses',      label: 'Bonuses',              icon: '◉' },
      { id: 'pnl',          label: 'P&L Statement',        icon: '◻' },
    ],
  },
  {
    section: 'REPORTS',
    items: [
      { id: 'report-builder',   label: 'Report Builder',   icon: '◈' },
      { id: 'scheduled-reports',label: 'Scheduled Reports',icon: '◫' },
      { id: 'regulatory',       label: 'Regulatory Reports',icon: '◻' },
    ],
  },
  {
    section: 'PLATFORM',
    items: [
      { id: 'brand',        label: 'Brand Settings',       icon: '◈' },
      { id: 'templates',    label: 'Email Templates',      icon: '◫' },
      { id: 'compliance-config', label: 'Compliance Config',icon: '◻' },
      { id: 'api',          label: 'API & Webhooks',       icon: '◉' },
    ],
  },
  {
    section: 'TEAM',
    items: [
      { id: 'team',         label: 'Members',              icon: '◈' },
      { id: 'roles',        label: 'Roles & Permissions',  icon: '◫' },
      { id: 'audit-log',    label: 'Audit Log',            icon: '◻' },
    ],
  },
];

// Command palette search index
const CMD_ITEMS = [
  { label: 'Dashboard',            sub: 'Overview',         module: 'dashboard',     icon: '◈' },
  { label: 'Live Monitor',         sub: 'Overview',         module: 'live-monitor',  icon: '◉' },
  { label: 'All Clients',          sub: 'Clients',          module: 'clients',       icon: '◻' },
  { label: 'KYC Queue',            sub: 'Clients · 14 pending', module: 'kyc-queue', icon: '◫' },
  { label: 'Introducing Brokers',  sub: 'Clients',          module: 'ibs',           icon: '◈' },
  { label: 'Instruments',          sub: 'Trading',          module: 'instruments',   icon: '◈' },
  { label: 'Pricing Rules',        sub: 'Trading',          module: 'pricing-rules', icon: '◫' },
  { label: 'Risk Dashboard',       sub: 'Risk & Compliance',module: 'risk',          icon: '◈' },
  { label: 'Surveillance Alerts',  sub: 'Risk · 3 open',   module: 'surveillance',  icon: '◉' },
  { label: 'AML Monitor',          sub: 'Risk & Compliance',module: 'aml',           icon: '◻' },
  { label: 'Transactions',         sub: 'Finance · 23 pending', module: 'transactions',icon: '◈' },
  { label: 'IB Commissions',       sub: 'Finance',          module: 'commissions',   icon: '◫' },
  { label: 'Bonuses',              sub: 'Finance',          module: 'bonuses',       icon: '◉' },
  { label: 'P&L Statement',        sub: 'Finance',          module: 'pnl',           icon: '◻' },
  { label: 'Report Builder',       sub: 'Reports',          module: 'report-builder',icon: '◈' },
  { label: 'Brand Settings',       sub: 'Platform',         module: 'brand',         icon: '◈' },
  { label: 'Email Templates',      sub: 'Platform',         module: 'templates',     icon: '◫' },
  { label: 'API & Webhooks',       sub: 'Platform',         module: 'api',           icon: '◉' },
  { label: 'Team Members',         sub: 'Team',             module: 'team',          icon: '◈' },
  { label: 'Roles & Permissions',  sub: 'Team',             module: 'roles',         icon: '◫' },
  { label: 'Audit Log',            sub: 'Team',             module: 'audit-log',     icon: '◻' },
];

// Avatar color by initials hash
function avatarColor(str = '') {
  const colors = ['#3B82F6','#10D996','#F59E0B','#8B5CF6','#EC4899','#06B6D4','#EF4444','#84CC16'];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h) + str.charCodeAt(i);
  return colors[Math.abs(h) % colors.length];
}

// ─── TOP BAR ──────────────────────────────────────────────────────────────────
function TopBar({ collapsed, onToggleSidebar, unreadCount, onNotif, notifOpen, onCmd }) {
  return (
    // <ConfirmProvider>
    // <ToastProvider>
    <div className="topbar">
      <div className={`topbar__brand ${collapsed ? 'collapsed' : ''}`}>
        <div className="topbar__logo">A</div>
        {!collapsed && (
          <span className="topbar__broker-name">{broker.name}</span>
        )}
      </div>

      <button className="icon-btn" onClick={onToggleSidebar} style={{ marginLeft: 8 }} title="Toggle sidebar">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="0" y="2" width="14" height="1.5" rx="0.75" fill="currentColor"/>
          <rect x="0" y="6.25" width="10" height="1.5" rx="0.75" fill="currentColor"/>
          <rect x="0" y="10.5" width="14" height="1.5" rx="0.75" fill="currentColor"/>
        </svg>
      </button>

      <div className="topbar__center">
        <div className="topbar__divider" />
        <div className="topbar__admin">
          <div className="topbar__admin-name">{broker.adminUser.name}</div>
          <div className="topbar__admin-role">{broker.adminUser.role}</div>
        </div>
        <div className="topbar__divider" />
        <span className="topbar__last-login">Last login: {broker.adminUser.lastLogin}</span>
      </div>

      <div className="topbar__actions">
        {/* Command palette trigger */}
        <button
          className="btn btn-ghost btn-sm"
          onClick={onCmd}
          style={{ fontSize: 11, gap: 6, marginRight: 4 }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.2"/>
            <line x1="8" y1="8" x2="11" y2="11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          Search
          <kbd style={{ fontSize: 9, padding: '1px 4px', background: 'var(--bg-4)', borderRadius: 3, color: 'var(--text-tertiary)', border: '1px solid var(--border-strong)' }}>
            ⌘K
          </kbd>
        </button>

        <button className="icon-btn" title="Help">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M5.5 5.5C5.5 4.67 6.17 4 7 4C7.83 4 8.5 4.67 8.5 5.5C8.5 6.1 8.1 6.6 7.5 6.9C7.2 7.05 7 7.3 7 7.6V8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            <circle cx="7" cy="10" r="0.6" fill="currentColor"/>
          </svg>
        </button>

        <button
          className={`icon-btn ${notifOpen ? 'active' : ''}`}
          onClick={onNotif}
          title="Notifications"
          style={{ position: 'relative' }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1.5C7 1.5 4 3 4 7V10.5H10V7C10 3 7 1.5 7 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
            <path d="M5.5 10.5C5.5 11.33 6.17 12 7 12C7.83 12 8.5 11.33 8.5 10.5" stroke="currentColor" strokeWidth="1.2"/>
          </svg>
          {unreadCount > 0 && (
            <span className="badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </button>

        <button className="icon-btn" title="Settings">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M7 1v2M7 11v2M1 7h2M11 7h2M2.5 2.5l1.4 1.4M10.1 10.1l1.4 1.4M2.5 11.5l1.4-1.4M10.1 3.9l1.4-1.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="topbar__divider" />

        <div className="topbar__status">
          <div className="topbar__status-dot"></div>
          <span className="topbar__status-text">All Operational</span>
        </div>

        <div className="topbar__divider" />

        <button className="icon-btn" title="Sign out" style={{ color: 'var(--bear)' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 2H2.5C2 2 1.5 2.5 1.5 3V11C1.5 11.5 2 12 2.5 12H5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M9.5 4.5L12.5 7L9.5 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="5" y1="7" x2="12.5" y2="7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({ collapsed, active, onNavigate }) {
  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar__scroll">
        {NAV.map(({ section, items }) => (
          <div key={section}>
            <div className="sidebar__section-label">{section}</div>
            {items.map(item => (
              <NavItem
                key={item.id}
                item={item}
                active={active === item.id}
                collapsed={collapsed}
                onClick={() => onNavigate(item.id)}
              />
            ))}
          </div>
        ))}
        <div style={{ height: 8 }} />
      </div>

      <div className="sidebar__footer">
        {!collapsed && (
          <>
            <div
              className="sidebar__footer-link"
              onClick={() => alert('Opening Dealer Workstation...')}
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M2 9L9 2M9 2H5M9 2V6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Dealer Workstation
            </div>
            <div className="sidebar__version">
              v{broker.version} · Obsidian Platform
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function NavItem({ item, active, collapsed, onClick }) {
  return (
    <div
      className={`nav-item ${active ? 'active' : ''}`}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
    >
      <div className="nav-item__icon">{item.icon}</div>
      <span className="nav-item__label">{item.label}</span>
      {item.badge && (
        <span className={`nav-badge ${item.badgeColor === 'warn' ? 'warn' : ''}`}>
          {item.badge}
        </span>
      )}
    </div>
  );
}

// ─── NOTIFICATION PANEL ───────────────────────────────────────────────────────
function NotifPanel({ open, onClose, notifications, onModuleNav }) {
  const [tab, setTab] = useState('all');
  const unread = notifications.filter(n => !n.read);
  const critical = notifications.filter(n => n.type === 'critical');

  const filtered = tab === 'all' ? notifications
    : tab === 'unread' ? unread
    : tab === 'critical' ? critical
    : notifications.filter(n => n.type === 'system');

  return (
    <>
      {open && <div className="drawer-overlay" onClick={onClose} style={{ zIndex: 299 }} />}
      <div className={`notif-panel ${open ? 'open' : ''}`}>
        <div className="card-header" style={{ padding: '14px 16px' }}>
          <span className="card-title">Notifications</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn btn-ghost btn-xs">Mark all read</button>
            <button className="drawer-close" onClick={onClose}>✕</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 2, padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
          {['all','unread','critical','system'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`chart-tab ${tab === t ? 'active' : ''}`}
              style={{ fontSize: 11, padding: '3px 10px' }}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {t === 'unread' && unread.length > 0 && (
                <span style={{ marginLeft: 4, fontSize: 9, background: 'var(--bear)', color: 'white', padding: '0 4px', borderRadius: 8, fontWeight: 700 }}>
                  {unread.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">🔔</div>
              <div className="empty-state__title">No notifications</div>
              <div className="empty-state__sub">You're all caught up</div>
            </div>
          ) : (
            filtered.map(n => (
              <div key={n.id} className={`notif-item ${!n.read ? 'unread' : ''}`}>
                <div className={`notif-dot ${n.type}`} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="notif-title">{n.title}</div>
                  <div className="notif-body">{n.body}</div>
                  <div className="notif-time">{n.time}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
            Notification Settings
          </button>
        </div>
      </div>
    </>
  );
}

// ─── COMMAND PALETTE ──────────────────────────────────────────────────────────
function CommandPalette({ open, onClose, onNavigate }) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(0);
  const inputRef = useRef(null);

  const filtered = query.trim()
    ? CMD_ITEMS.filter(i =>
        i.label.toLowerCase().includes(query.toLowerCase()) ||
        i.sub.toLowerCase().includes(query.toLowerCase())
      )
    : CMD_ITEMS.slice(0, 8);

  useEffect(() => {
    if (open) {
      setQuery('');
      setFocused(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocused(f => Math.min(f + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setFocused(f => Math.max(f - 1, 0)); }
    if (e.key === 'Enter' && filtered[focused]) { onNavigate(filtered[focused].module); onClose(); }
    if (e.key === 'Escape') onClose();
  };

  if (!open) return null;

  return (
    <div className="cmd-palette-overlay" onClick={onClose}>
      <div className="cmd-palette" onClick={e => e.stopPropagation()}>
        <div className="cmd-input-wrap">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}>
            <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
            <line x1="10" y1="10" x2="14" y2="14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <input
            ref={inputRef}
            className="cmd-input"
            placeholder="Search modules, clients, transactions..."
            value={query}
            onChange={e => { setQuery(e.target.value); setFocused(0); }}
            onKeyDown={handleKey}
          />
          <kbd style={{ fontSize: 10, padding: '2px 6px', background: 'var(--bg-4)', borderRadius: 4, color: 'var(--text-tertiary)', border: '1px solid var(--border-strong)', flexShrink: 0 }}>
            ESC
          </kbd>
        </div>

        <div className="cmd-results">
          {!query.trim() && (
            <div className="cmd-section-label">Recent Modules</div>
          )}
          {filtered.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px' }}>
              <div className="empty-state__title">No results for "{query}"</div>
            </div>
          ) : (
            filtered.map((item, i) => (
              <div
                key={item.module}
                className={`cmd-result-item ${focused === i ? 'focused' : ''}`}
                onMouseEnter={() => setFocused(i)}
                onClick={() => { onNavigate(item.module); onClose(); }}
              >
                <span className="cmd-result-icon">{item.icon}</span>
                <span className="cmd-result-text">{item.label}</span>
                <span className="cmd-result-sub">{item.sub}</span>
              </div>
            ))
          )}
        </div>

        <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 16, alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>↑↓ navigate</span>
          <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>↵ open</span>
          <span style={{ fontSize: 10, color: 'var(--text-tertiary)', marginLeft: 'auto' }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── MODULE STUB ──────────────────────────────────────────────────────────────
function ModuleStub({ id }) {
  const labels = {
    'live-monitor':    ['Live Monitor',          'Real-time trading activity overview'],
    'client-groups':   ['Client Groups',          'Manage client segmentation groups'],
    'sessions':        ['Trading Sessions',       'Configure instrument trading hours'],
    'orders':          ['Order Management',       'Review and manage all platform orders'],
    'exposure':        ['Exposure Limits',        'Configure per-symbol exposure limits'],
    'commissions':     ['IB Commissions',         'Run and manage IB commission payouts'],
    'bonuses':         ['Bonus Management',       'Active campaigns and bonus awards'],
    'pnl':             ['P&L Statement',          'Revenue breakdown and cost analysis'],
    'report-builder':  ['Report Builder',         'Build and export custom reports'],
    'scheduled-reports':['Scheduled Reports',     'Manage automated report delivery'],
    'regulatory':      ['Regulatory Reports',     'EMIR/MiFID and capital adequacy'],
    'brand':           ['Brand Settings',         'White-label identity configuration'],
    'templates':       ['Email Templates',        'Customize transactional email content'],
    'compliance-config':['Compliance Config',     'KYC requirements and jurisdiction controls'],
    'api':             ['API & Webhooks',          'Manage API keys and webhook endpoints'],
    'roles':           ['Roles & Permissions',    'Admin access control matrix'],
    'audit-log':       ['Audit Log',              'Immutable log of all admin actions'],
  };

  const [title, sub] = labels[id] || ['Module', 'Coming in next phase'];

  return (
    <div style={{ padding: '24px' }}>
      <div className="module-header" style={{ padding: 0, marginBottom: 24 }}>
        <div>
          <div className="module-title">{title}</div>
          <div className="module-subtitle">{sub}</div>
        </div>
      </div>
      <div className="card" style={{ padding: 48, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 16, opacity: 0.3 }}>⊡</div>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>
          {title}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 24 }}>
          This module is being built in the next phase. The shell, design system, and mock data are all wired.
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <div className="skeleton" style={{ width: 200, height: 32, borderRadius: 8 }} />
          <div className="skeleton" style={{ width: 120, height: 32, borderRadius: 8 }} />
        </div>
      </div>
    </div>
  );
}

// ─── LAZY MODULE LOADER ───────────────────────────────────────────────────────
// Modules are imported lazily so the shell works even before all are built
function ModuleRenderer({ moduleId, onNavigate }) {
  // We'll expand this as modules are built in each phase.
  // For now: dashboard + clients are Phase 2 & 3.
  // All others get stub treatment.

  try {
    // Phase 2: Dashboard (will be built next)
    if (moduleId === 'dashboard') {
      const Dashboard = require('../dashboard/Dashboard').default;
      return <Dashboard onNavigate={onNavigate} />;
    }
    // Phase 3: Clients
    if (moduleId === 'clients') {
      const ClientList = require('../clients/ClientList').default;
      return <ClientList />;
    }
    // Phase 4: KYC Queue
    if (moduleId === 'kyc-queue') {
      const KYCQueue = require('../kyc/KYCQueue').default;
      return <KYCQueue />;
    }
    // Phase 4: IBs
    if (moduleId === 'ibs') {
      const IBList = require('../ib/IBList').default;
      return <IBList />;
    }
    // Phase 5: Instruments
    if (moduleId === 'instruments') {
      const InstrumentTable = require('../trading/InstrumentTable').default;
      return <InstrumentTable />;
    }
    // Phase 6: Risk
    if (moduleId === 'risk') {
      const RiskDashboard = require('../risk/RiskDashboard').default;
      return <RiskDashboard />;
    }
    if (moduleId === 'surveillance') {
      const SurveillanceAlerts = require('../risk/SurveillanceAlerts').default;
      return <SurveillanceAlerts />;
    }
    if (moduleId === 'aml') {
      const AMLMonitor = require('../risk/AMLMonitor').default;
      return <AMLMonitor />;
    }
    // Phase 6: Transactions
    if (moduleId === 'transactions') {
      const Transactions = require('../finance/Transactions').default;
      return <Transactions />;
    }
    // Phase 7: Team sub-modules
    if (moduleId === 'team') {
      const TeamMembers = require('../team/TeamMembers').default;
      return <TeamMembers />;
    }
    if (moduleId === 'roles') {
      const TeamMembers = require('../team/TeamMembers').default;
      return <TeamMembers initialSubModule="roles" />;
    }
    if (moduleId === 'audit-log') {
      const TeamMembers = require('../team/TeamMembers').default;
      return <TeamMembers initialSubModule="audit-log" />;
    }
    // Phase 4: Pricing rules — reuse instrument table
    if (moduleId === 'pricing-rules') {
      const InstrumentTable = require('../trading/InstrumentTable').default;
      return <InstrumentTable />;
    }
    // Live Monitor
    if (moduleId === 'live-monitor') {
      const LiveMonitor = require('../dashboard/LiveMonitor').default;
      return <LiveMonitor />;
    }
    // Platform modules
    if (moduleId === 'brand') {
      const BrandSettings = require('../platform/BrandSettings').default;
      return <BrandSettings />;
    }
    if (moduleId === 'templates') {
      const EmailTemplates = require('../platform/EmailTemplates').default;
      return <EmailTemplates />;
    }
    if (moduleId === 'compliance-config') {
      const ComplianceConfig = require('../platform/ComplianceConfig').default;
      return <ComplianceConfig />;
    }
    if (moduleId === 'api') {
      const APISettings = require('../platform/APISettings').default;
      return <APISettings />;
    }
    // Reports
    if (moduleId === 'report-builder' || moduleId === 'scheduled-reports' || moduleId === 'regulatory') {
      const ReportBuilder = require('../reports/ReportBuilder').default;
      return <ReportBuilder />;
    }
    // Finance — all remaining modules
    if (moduleId === 'commissions') {
      const IBCommissions = require('../finance/IBCommissions').default;
      return <IBCommissions />;
    }
    if (moduleId === 'bonuses') {
      const BonusManagement = require('../finance/BonusManagement').default;
      return <BonusManagement />;
    }
    if (moduleId === 'pnl') {
      const PnLStatement = require('../finance/PnLStatement').default;
      return <PnLStatement />;
    }
    // Trading modules
    if (moduleId === 'pricing-rules') {
      const PricingRules = require('../trading/PricingRules').default;
      return <PricingRules />;
    }
    if (moduleId === 'sessions') {
      const TradingSessions = require('../trading/TradingSessions').default;
      return <TradingSessions />;
    }
    if (moduleId === 'orders') {
      const OrderManagement = require('../trading/OrderManagement').default;
      return <OrderManagement />;
    }
    // Risk
    if (moduleId === 'exposure') {
      const ExposureLimits = require('../risk/ExposureLimits').default;
      return <ExposureLimits />;
    }
    // Clients
    if (moduleId === 'client-groups') {
      const ClientGroups = require('../clients/ClientGroups').default;
      return <ClientGroups />;
    }
  } catch {
    // Module not yet built → fallthrough to stub
  }

  return <ModuleStub id={moduleId} />;
}

// ─── SHELL ────────────────────────────────────────────────────────────────────
export default function Shell() {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [collapsed, setCollapsed]     = useState(false);
  const [notifOpen, setNotifOpen]     = useState(false);
  const [cmdOpen, setCmdOpen]         = useState(false);
  const [notifications, setNotifications] = useState(notifData);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Global Cmd+K handler
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(v => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleNavigate = useCallback((moduleId) => {
    setActiveModule(moduleId);
    setNotifOpen(false);
  }, []);

  return (
    <ToastProvider>
    <ConfirmProvider>
    <div className="admin-root">
      <TopBar
        collapsed={collapsed}
        onToggleSidebar={() => setCollapsed(v => !v)}
        unreadCount={unreadCount}
        onNotif={() => setNotifOpen(v => !v)}
        notifOpen={notifOpen}
        onCmd={() => setCmdOpen(true)}
      />

      <div className="admin-body">
        <Sidebar
          collapsed={collapsed}
          active={activeModule}
          onNavigate={handleNavigate}
        />

        <main className="main-content">
          <ModuleRenderer
            moduleId={activeModule}
            onNavigate={handleNavigate}
          />
        </main>
      </div>

      <NotifPanel
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        notifications={notifications}
        onModuleNav={handleNavigate}
      />

      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        onNavigate={handleNavigate}
      />
    </div>
    </ConfirmProvider>
    </ToastProvider>
  );
}
