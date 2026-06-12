/**
 * File:        apps/broker-admin/src/app/(admin)/segment-access/page.tsx
 * Module:      broker-admin · Segment Access Control
 * Purpose:     Admin interface for managing user access to market segments.
 *              Grant/revoke segments and configure per-segment limits.
 *
 * Exports:
 *   - default (SegmentAccessPage) — user segment access management UI
 *
 * Features:
 *   - Search/filter users by name/email
 *   - Grant/revoke segments (EQ, FNO, COM, CDS)
 *   - Configure: allowed instrument types, max order value, max positions
 *   - View all user access in one view
 *   - CSV export for reporting
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-09
 */

'use client';

import { useState, useMemo } from 'react';
import { Download, Shield, BarChart2, AlertCircle, Users, Filter, Plus } from 'lucide-react';
import type { InstrumentSegment, InstrumentType } from '@/lib/types';

// Mock data - replace with API calls
const MOCK_USERS = [
  { id: 'user1', name: 'John Trader', email: 'john@example.com', role: 'user', avatar: 'JT' },
  { id: 'user2', name: 'Jane Investor', email: 'jane@example.com', role: 'user', avatar: 'JI' },
  { id: 'user3', name: 'Bob User', email: 'bob@example.com', role: 'user', avatar: 'BU' },
  { id: 'user4', name: 'Alice User', email: 'alice@example.com', role: 'user', avatar: 'AU' },
];

const MOCK_SEGMENT_ACCESS: Array<{
  id: string;
  userId: string;
  segment: InstrumentSegment;
  allowedTypes: InstrumentType[];
  maxOrderValue?: number;
  maxDailyTrades?: number;
  maxOpenPositions?: number;
}> = [
  { id: 'access1', userId: 'user1', segment: 'EQ', allowedTypes: ['EQUITY'], maxOrderValue: 500000, maxDailyTrades: 10, maxOpenPositions: 50 },
  { id: 'access2', userId: 'user1', segment: 'FNO', allowedTypes: ['FUTURE', 'OPTION'], maxOrderValue: 1000000, maxDailyTrades: 5, maxOpenPositions: 20 },
  { id: 'access3', userId: 'user2', segment: 'EQ', allowedTypes: ['EQUITY'], maxOrderValue: 1000000, maxDailyTrades: 5, maxOpenPositions: 30 },
  { id: 'access4', userId: 'user3', segment: 'COM', allowedTypes: ['FUTURE'], maxOrderValue: 2000000, maxDailyTrades: 10, maxOpenPositions: 100 },
];

const SEGMENT_INFO: Record<InstrumentSegment, { name: string; color: string; icon: any }> = {
  EQ: { name: 'Equities', color: 'bg-bull/20 text-bull', icon: '📈' },
  FNO: { name: 'F&O', color: 'bg-accent/20 text-accent', icon: '📊' },
  COM: { name: 'Commodities', color: 'bg-warn/20 text-warn', icon: '🏭' },
  CDS: { name: 'Currency', color: 'bg-fg3/20 text-fg3', icon: '💱' },
  FX: { name: 'Forex', color: 'bg-fg2/20 text-fg2', icon: '🌍' },
  CRYPTO: { name: 'Crypto', color: 'bg-bear/20 text-bear', icon: '₿' },
  INDEX: { name: 'Index', color: 'bg-elevated text-fg2', icon: '📉' },
};

const INSTRUMENT_TYPES: InstrumentType[] = ['EQUITY', 'FUTURE', 'OPTION', 'ETF', 'FOREX', 'CRYPTO', 'INDEX'];

interface SegmentAccessModalProps {
  user: { id: string; name: string; email: string } | null;
  onSave: (userId: string, data: any) => void;
  onCancel: () => void;
}

function SegmentAccessModal({ user, onSave, onCancel }: SegmentAccessModalProps) {
  const [data, setData] = useState({
    segment: 'EQ' as InstrumentSegment,
    allowedTypes: ['EQUITY'] as InstrumentType[],
    maxOrderValue: null as number | null,
    maxOpenPositions: null as number | null,
    maxDailyTrades: null as number | null,
  });

  const toggleType = (type: InstrumentType) => {
    if (data.allowedTypes.includes(type)) {
      setData(d => ({ ...d, allowedTypes: d.allowedTypes.filter(t => t !== type) }));
    } else {
      setData(d => ({ ...d, allowedTypes: [...d.allowedTypes, type] }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onCancel}>
      <div className="w-[600px] rounded-lg border border-[var(--border)] bg-[var(--bg-panel)]" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <div>
            <p className="font-mono font-bold text-fg1">Grant Access</p>
            {user && <p className="text-[11px] text-fg3">User: {user.name}</p>}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Segment Selection */}
          <div>
            <label className="kpi-label">Market Segment</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {Object.entries(SEGMENT_INFO).map(([key, info]) => (
                <button
                  key={key}
                  className={`p-3 rounded-lg border ${data.segment === key ? 'border-accent' : 'border-[var(--border)]'}`}
                  onClick={() => setData(d => ({ ...d, segment: key as InstrumentSegment }))}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{info.icon}</span>
                    <span className="text-sm font-medium">{info.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Allowed Types */}
          <div>
            <label className="kpi-label">Allowed Instrument Types</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {INSTRUMENT_TYPES.map(type => (
                <button
                  key={type}
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${data.allowedTypes.includes(type) ? 'bg-bull text-white' : 'bg-[var(--bg-elevated)] text-fg2'}`}
                  onClick={() => toggleType(type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Limits */}
          <div className="space-y-3">
            <div>
              <label className="kpi-label">Max Order Value (INR)</label>
              <input
                type="number"
                className="input"
                placeholder="No limit"
                value={data.maxOrderValue || ''}
                onChange={e => setData(d => ({ ...d, maxOrderValue: e.target.value ? parseInt(e.target.value) : null }))}
              />
            </div>
            <div>
              <label className="kpi-label">Max Open Positions</label>
              <input
                type="number"
                className="input"
                placeholder="No limit"
                value={data.maxOpenPositions || ''}
                onChange={e => setData(d => ({ ...d, maxOpenPositions: e.target.value ? parseInt(e.target.value) : null }))}
              />
            </div>
            <div>
              <label className="kpi-label">Max Daily Trades</label>
              <input
                type="number"
                className="input"
                placeholder="No limit"
                value={data.maxDailyTrades || ''}
                onChange={e => setData(d => ({ ...d, maxDailyTrades: e.target.value ? parseInt(e.target.value) : null }))}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-[var(--border)] px-5 py-3">
          <button className="btn-ghost btn btn-sm" onClick={onCancel}>Cancel</button>
          <button className="btn-primary btn btn-sm" onClick={() => user && onSave(user.id, data)}>
            Save Access
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SegmentAccessPage() {
  const [users] = useState(MOCK_USERS);
  const [accessList] = useState(MOCK_SEGMENT_ACCESS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    return users.filter(u =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const userAccessMap = useMemo(() => {
    const map = new Map<string, typeof MOCK_SEGMENT_ACCESS>();
    filteredUsers.forEach(user => {
      map.set(user.id, accessList.filter(a => a.userId === user.id));
    });
    return map;
  }, [filteredUsers, accessList]);

  const handleSaveAccess = (userId: string, data: any) => {
    console.log('Saving access:', userId, data);
    // API call to grant access
    setModalOpen(false);
  };

  return (
    <div className="flex flex-col">
      <div className="module-header">
        <div>
          <p className="module-title">Segment Access Control</p>
          <p className="module-subtitle">
            Configure which market segments each user can trade
          </p>
        </div>
        <button className="btn-primary btn btn-sm">
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Search */}
      <div className="p-6">
        <div className="relative mb-6">
          <Filter className="absolute left-3 top-2.5 h-4 w-4 text-fg3" />
          <input
            type="text"
            placeholder="Search users by name or email"
            className="input pl-10 w-full"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Users Grid */}
        <div className="space-y-4">
          {filteredUsers.map(user => {
            const userAccess = userAccessMap.get(user.id) || [];
            return (
              <div key={user.id} className="rounded-lg border border-[var(--border)] bg-[var(--bg-panel)]">
                {/* User Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center font-bold text-fg1">
                      {user.avatar}
                    </div>
                    <div>
                      <p className="font-mono text-[14px] font-bold text-fg1">{user.name}</p>
                      <p className="text-[11px] text-fg3">{user.email}</p>
                    </div>
                  </div>
                  <button
                    className="btn-primary btn btn-sm"
                    onClick={() => setModalOpen(true)}
                  >
                    <Plus size={12} /> Grant Access
                  </button>
                </div>

                {/* User Segment Access */}
                <div className="p-4">
                  {userAccess.length === 0 ? (
                    <p className="text-[11px] text-fg3 italic">No segment access granted</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {userAccess.map(access => (
                        <div
                          key={access.id}
                          className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-[12px] font-bold text-fg1">
                              {SEGMENT_INFO[access.segment]?.icon} {SEGMENT_INFO[access.segment]?.name}
                            </span>
                            <button className="text-[10px] text-warn hover:underline">Revoke</button>
                          </div>

                          <div className="space-y-1 text-[10px] text-fg2">
                            <p><span className="font-medium">Allowed Types:</span> {access.allowedTypes.join(', ')}</p>
                            {access.maxOrderValue && (
                              <p><span className="font-medium">Max Order:</span> ₹{access.maxOrderValue.toLocaleString()}</p>
                            )}
                            {access.maxOpenPositions && (
                              <p><span className="font-medium">Max Positions:</span> {access.maxOpenPositions}</p>
                            )}
                            {access.maxDailyTrades && (
                              <p><span className="font-medium">Daily Trades:</span> {access.maxDailyTrades}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 p-4 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]">
          <h3 className="text-[12px] font-bold text-fg1 mb-3 flex items-center gap-2">
            <BarChart2 size={14} /> Access Summary
          </h3>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-[24px] font-bold text-fg1">{users.length}</p>
              <p className="text-[10px] text-fg3">Total Users</p>
            </div>
            <div>
              <p className="text-[24px] font-bold text-bull">
                {accessList.filter(a => a.userId !== 'admin').length}
              </p>
              <p className="text-[10px] text-fg3">Active Access</p>
            </div>
            <div>
              <p className="text-[24px] font-bold text-accent">
                {Object.keys(SEGMENT_INFO).length}
              </p>
              <p className="text-[10px] text-fg3">Segments</p>
            </div>
            <div>
              <p className="text-[24px] font-bold text-warn">
                {accessList.filter(a => a.maxDailyTrades && a.maxDailyTrades <= 5).length}
              </p>
              <p className="text-[10px] text-fg3">Low Limits</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && selectedUser && (
        <SegmentAccessModal
          user={users.find(u => u.id === selectedUser) || null}
          onSave={handleSaveAccess}
          onCancel={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}