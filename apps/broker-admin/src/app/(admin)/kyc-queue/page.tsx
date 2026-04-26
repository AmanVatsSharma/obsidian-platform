/**
 * File:        apps/broker-admin/src/app/(admin)/kyc-queue/page.tsx
 * Module:      broker-admin · KYC Queue
 * Purpose:     Pending KYC document review queue — approve, reject, or request more info
 *              per document, with client summary and status strip
 *
 * Exports:
 *   - KYCQueuePage — default page export
 *
 * Depends on:
 *   - @/lib/mock-data-context — useBrokerData() for approveKyc, rejectKyc, pendingKycCount
 *
 * Side-effects:
 *   - none (actions are context mutations)
 *
 * Key invariants:
 *   - 'use client' — filter state, expanded row state
 *   - Document list is derived from clients with Pending / In Review KYC status
 *   - Each approve/reject updates the parent context and removes the item from the queue
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

'use client';

import { useState, useMemo } from 'react';
import {
  Clock, CheckCircle2, X, MessageSquare, Filter,
  FileText, User, Calendar, Globe, Shield, AlertCircle,
  ChevronDown, ChevronRight, RefreshCw,
} from 'lucide-react';
import { useBrokerData } from '@/lib/mock-data-context';
import type { Client, KYCLevel } from '@/lib/types';

// ─── SYNTHESIZED KYC DOC TYPE ──────────────────────────────────────────────────

interface KYCDocRow {
  docId: string;
  clientId: string;
  clientName: string;
  clientFlag: string;
  clientType: string;
  country: string;
  docType: 'Passport' | 'ID Card' | 'Utility Bill' | 'Bank Statement' | 'Selfie';
  level: KYCLevel;
  submittedAt: string;
  ageHours: number;
}

// Generate synthetic doc rows from clients with pending KYC
function buildDocQueue(clients: Client[]): KYCDocRow[] {
  const DOCS_BY_LEVEL: Record<KYCLevel, KYCDocRow['docType'][]> = {
    Basic:    ['Passport', 'Selfie'],
    Standard: ['Passport', 'Utility Bill', 'Selfie'],
    Enhanced: ['Passport', 'Bank Statement', 'Utility Bill', 'Selfie'],
  };

  const rows: KYCDocRow[] = [];
  let docCounter = 1;

  clients
    .filter(c => c.kyc === 'Pending' || c.kyc === 'In Review')
    .forEach(c => {
      const docs = DOCS_BY_LEVEL[c.kycLevel];
      docs.forEach((docType, i) => {
        rows.push({
          docId: `KYC${String(docCounter++).padStart(4, '0')}`,
          clientId: c.id,
          clientName: c.name,
          clientFlag: c.flag,
          clientType: c.type,
          country: c.country,
          docType,
          level: c.kycLevel,
          submittedAt: c.lastLogin,
          ageHours: 2 + i * 3,
        });
      });
    });

  return rows;
}

// ─── HELPERS ───────────────────────────────────────────────────────────────────

const LEVEL_COLOR: Record<KYCLevel, string> = {
  Basic:    'badge-muted',
  Standard: 'badge-accent',
  Enhanced: 'badge-gold',
};

const DOC_ICON: Record<KYCDocRow['docType'], React.ElementType> = {
  Passport:        FileText,
  'ID Card':       User,
  'Utility Bill':  Globe,
  'Bank Statement':FileText,
  Selfie:          User,
};

type FilterKYC = 'All' | KYCLevel;

// ─── DOC PREVIEW MOCK ─────────────────────────────────────────────────────────

function DocPreview({ docType }: { docType: KYCDocRow['docType'] }) {
  const Icon = DOC_ICON[docType];
  return (
    <div className="flex h-[120px] w-full items-center justify-center rounded border border-[var(--border)] bg-[var(--bg-elevated)]">
      <div className="flex flex-col items-center gap-2 text-center">
        <Icon size={28} className="text-fg3" />
        <span className="font-ui text-[11px] text-fg3">{docType}</span>
        <span className="font-ui text-[10px] text-fg3 opacity-60">Mock preview</span>
      </div>
    </div>
  );
}

// ─── PAGE ──────────────────────────────────────────────────────────────────────

export default function KYCQueuePage() {
  const { clients, approveKyc, rejectKyc, pendingKycCount } = useBrokerData();

  const [filterLevel, setLevel]     = useState<FilterKYC>('All');
  const [expandedId, setExpanded]   = useState<string | null>(null);
  const [actionState, setAction]    = useState<Record<string, 'pending' | 'approved' | 'rejected' | 'more'>>({});
  const [confirmId, setConfirm]     = useState<string | null>(null);
  const [confirmType, setConfirmType] = useState<'approve' | 'reject' | null>(null);

  // Derive docs from client list
  const allDocs = useMemo(() => buildDocQueue(clients), [clients]);

  const filtered = useMemo(() => {
    let list = allDocs.filter(d => !actionState[d.docId]);
    if (filterLevel !== 'All') list = list.filter(d => d.level === filterLevel);
    return list;
  }, [allDocs, filterLevel, actionState]);

  // Stats derived from original (not filtered) queue
  const approvedToday = Object.values(actionState).filter(v => v === 'approved').length;
  const rejectedToday = Object.values(actionState).filter(v => v === 'rejected').length;
  const pendingCount  = allDocs.filter(d => !actionState[d.docId]).length;
  const avgHours      = allDocs.length > 0 ? (allDocs.reduce((s, d) => s + d.ageHours, 0) / allDocs.length).toFixed(1) : '0';

  function handleConfirm() {
    if (!confirmId || !confirmType) return;
    const doc = allDocs.find(d => d.docId === confirmId);
    if (!doc) return;

    setAction(prev => ({ ...prev, [confirmId]: confirmType === 'approve' ? 'approved' : 'rejected' }));
    if (confirmType === 'approve') approveKyc(doc.clientId);
    else rejectKyc(doc.clientId);
    setConfirm(null);
    setConfirmType(null);
    setExpanded(null);
  }

  function handleRequestMore(docId: string) {
    setAction(prev => ({ ...prev, [docId]: 'more' }));
    setExpanded(null);
  }

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="module-header">
        <div>
          <h1 className="module-title flex items-center gap-2">
            <Shield size={14} className="text-warn" />
            KYC Queue
          </h1>
          <p className="module-subtitle">
            Document review queue — approve, reject, or request more information
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-ghost btn-sm gap-1.5">
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-4 border-b border-[var(--border)]">
        {[
          { label: 'PENDING REVIEW', value: pendingCount.toString(), color: 'text-warn', icon: Clock },
          { label: 'APPROVED TODAY', value: approvedToday.toString(), color: 'text-bull', icon: CheckCircle2 },
          { label: 'REJECTED TODAY', value: rejectedToday.toString(), color: 'text-bear', icon: X },
          { label: 'AVG REVIEW TIME', value: `${avgHours}h`, color: 'text-fg1', icon: Calendar },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="border-r border-[var(--border)] px-6 py-4 last:border-r-0">
              <div className="flex items-center justify-between">
                <p className="kpi-label">{s.label}</p>
                <Icon size={12} className={s.color} />
              </div>
              <p className={`kpi-value ${s.color}`}>{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 border-b border-[var(--border)] px-6 py-3">
        <Filter size={12} className="text-fg3" />
        <span className="font-ui text-[11px] text-fg3">KYC Level:</span>
        {(['All', 'Basic', 'Standard', 'Enhanced'] as FilterKYC[]).map(l => (
          <button
            key={l}
            onClick={() => setLevel(l)}
            className={`btn btn-sm ${filterLevel === l ? 'btn-primary' : 'btn-ghost'}`}
          >
            {l}
          </button>
        ))}
        <span className="ml-auto font-ui text-[11px] text-fg3">{filtered.length} documents pending</span>
      </div>

      {/* Document Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <CheckCircle2 size={40} className="text-bull" />
          <p className="font-display text-[14px] font-semibold tracking-widest text-fg1 uppercase">Queue Clear</p>
          <p className="font-ui text-[12px] text-fg3">No documents pending review at this time</p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--border)]">
          {filtered.map(doc => {
            const isExpanded = expandedId === doc.docId;
            const Icon = DOC_ICON[doc.docType];

            return (
              <div key={doc.docId}>
                {/* Row */}
                <div
                  className="flex cursor-pointer items-center gap-4 px-6 py-3 transition-colors hover:bg-[var(--bg-hover)]"
                  onClick={() => setExpanded(isExpanded ? null : doc.docId)}
                >
                  {/* Expand */}
                  <span className="shrink-0 text-fg3">
                    {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  </span>

                  {/* Doc Icon + Type */}
                  <div className="flex w-40 items-center gap-2 shrink-0">
                    <Icon size={14} className="shrink-0 text-fg3" />
                    <span className="font-ui text-[12px] text-fg1">{doc.docType}</span>
                  </div>

                  {/* Client */}
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span>{doc.clientFlag}</span>
                    <div className="min-w-0">
                      <p className="truncate font-ui text-[12px] font-medium text-fg1">{doc.clientName}</p>
                      <p className="font-mono text-[10px] text-fg3">{doc.clientId}</p>
                    </div>
                  </div>

                  {/* Level Badge */}
                  <span className={`badge ${LEVEL_COLOR[doc.level]} shrink-0`}>{doc.level}</span>

                  {/* Type Badge */}
                  <span className={`shrink-0 badge ${
                    doc.clientType === 'VIP' ? 'badge-gold' :
                    doc.clientType === 'Pro' ? 'badge-purple' :
                    'badge-muted'
                  }`}>{doc.clientType}</span>

                  {/* Submitted */}
                  <div className="w-32 shrink-0 text-right">
                    <p className="font-ui text-[11px] text-fg2">{doc.submittedAt.split(' ')[0]}</p>
                    <p className="font-mono text-[10px] text-fg3">{doc.ageHours}h ago</p>
                  </div>

                  {/* Quick Actions (visible on row hover) */}
                  <div
                    className="flex shrink-0 items-center gap-1.5"
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      className="btn btn-bull btn-xs gap-1"
                      onClick={() => { setConfirm(doc.docId); setConfirmType('approve'); }}
                    >
                      <CheckCircle2 size={10} /> Approve
                    </button>
                    <button
                      className="btn btn-danger btn-xs gap-1"
                      onClick={() => { setConfirm(doc.docId); setConfirmType('reject'); }}
                    >
                      <X size={10} /> Reject
                    </button>
                    <button
                      className="btn btn-ghost btn-xs gap-1"
                      onClick={() => handleRequestMore(doc.docId)}
                    >
                      <MessageSquare size={10} /> More
                    </button>
                  </div>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-[var(--border)] bg-[var(--bg-elevated)] px-6 py-4">
                    <div className="grid grid-cols-3 gap-4">
                      {/* Preview */}
                      <div className="space-y-2">
                        <p className="font-display text-[10px] font-semibold tracking-widest text-fg3 uppercase">Document Preview</p>
                        <DocPreview docType={doc.docType} />
                      </div>

                      {/* Client Details */}
                      <div className="space-y-2">
                        <p className="font-display text-[10px] font-semibold tracking-widest text-fg3 uppercase">Client Summary</p>
                        <div className="card divide-y divide-[var(--border)] text-[11px]">
                          {[
                            { label: 'Account ID', value: doc.clientId },
                            { label: 'Country', value: `${doc.clientFlag} ${doc.country}` },
                            { label: 'KYC Level', value: doc.level },
                            { label: 'Client Type', value: doc.clientType },
                            { label: 'Submitted', value: doc.submittedAt },
                          ].map(r => (
                            <div key={r.label} className="flex items-center justify-between px-3 py-1.5">
                              <span className="text-fg3">{r.label}</span>
                              <span className="font-mono text-fg1">{r.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Review Actions */}
                      <div className="space-y-2">
                        <p className="font-display text-[10px] font-semibold tracking-widest text-fg3 uppercase">Review Decision</p>
                        <div className="space-y-2">
                          <button
                            className="btn btn-bull btn-sm w-full gap-2"
                            onClick={() => { setConfirm(doc.docId); setConfirmType('approve'); }}
                          >
                            <CheckCircle2 size={13} /> Approve Document
                          </button>
                          <button
                            className="btn btn-danger btn-sm w-full gap-2"
                            onClick={() => { setConfirm(doc.docId); setConfirmType('reject'); }}
                          >
                            <X size={13} /> Reject — Insufficient
                          </button>
                          <button
                            className="btn btn-ghost btn-sm w-full gap-2"
                            onClick={() => handleRequestMore(doc.docId)}
                          >
                            <MessageSquare size={13} /> Request Clarification
                          </button>
                          <button
                            className="btn btn-ghost btn-sm w-full gap-2"
                            onClick={() => setExpanded(null)}
                          >
                            <AlertCircle size={13} /> Escalate to Compliance
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmId && confirmType && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setConfirm(null)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-80 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[var(--border-md)] bg-[var(--bg-panel)] p-6 shadow-2xl">
            <h3 className="font-display text-[13px] font-semibold tracking-widest text-fg1 uppercase">
              {confirmType === 'approve' ? 'Approve Document?' : 'Reject Document?'}
            </h3>
            <p className="mt-2 font-ui text-[12px] text-fg2">
              {confirmType === 'approve'
                ? 'This will mark the document as verified and update the client\'s KYC status.'
                : 'This will reject the document and notify the client to re-submit with valid documentation.'}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                className={`btn btn-sm flex-1 ${confirmType === 'approve' ? 'btn-bull' : 'btn-danger'} gap-1.5`}
                onClick={handleConfirm}
              >
                {confirmType === 'approve' ? <CheckCircle2 size={12} /> : <X size={12} />}
                Confirm {confirmType === 'approve' ? 'Approval' : 'Rejection'}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setConfirm(null)}>
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
