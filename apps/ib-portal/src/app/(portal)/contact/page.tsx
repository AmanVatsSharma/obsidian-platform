/**
 * File:        apps/ib-portal/src/app/(portal)/contact/page.tsx
 * Module:      ib-portal · Contact Manager
 * Purpose:     Account manager contact card + support ticket submission form
 *
 * Exports:
 *   - ContactPage() — client component (form state, submit feedback)
 *
 * Side-effects:
 *   - none (demo — no real submission)
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

'use client';

import { useState } from 'react';
import { Mail, Phone, MessageSquare, Clock, CheckCircle } from 'lucide-react';
import { useIBData } from '../../../lib/mock-data-context';

type TicketCategory = 'Commission Query' | 'Technical Issue' | 'Account Upgrade' | 'Compliance' | 'Other';

const CATEGORIES: TicketCategory[] = [
  'Commission Query',
  'Technical Issue',
  'Account Upgrade',
  'Compliance',
  'Other',
];

const RECENT_TICKETS = [
  { id: 'TKT-00312', date: 'Apr 18', subject: 'Commission payout delay — March statement', status: 'Resolved', statusClass: 'badge badge-bull' },
  { id: 'TKT-00298', date: 'Apr 02', subject: 'Request to add new referral link channel', status: 'Closed',   statusClass: 'badge badge-muted' },
  { id: 'TKT-00271', date: 'Mar 14', subject: 'GOLD tier upgrade eligibility review',      status: 'Closed',   statusClass: 'badge badge-muted' },
];

export default function ContactPage() {
  const { ib } = useIBData();

  const [category, setCategory]   = useState<TicketCategory>('Commission Query');
  const [subject, setSubject]     = useState('');
  const [message, setMessage]     = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubject('');
    setMessage('');
    setCategory('Commission Query');
    setSubmitted(false);
  };

  return (
    <div className="mx-auto max-w-[900px] p-6 space-y-5">
      <div>
        <h1 className="font-display text-[22px] font-bold text-fg1">Contact Manager</h1>
        <p className="mt-0.5 font-sans text-[13px] text-fg2">Reach your dedicated account manager or raise a support ticket</p>
      </div>

      {/* Account manager card */}
      <div className="card p-5">
        <div className="mb-4 font-display text-[10px] tracking-[0.15em] text-fg3 uppercase">YOUR ACCOUNT MANAGER</div>
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-[18px] font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #1A56DB, #3B82F6)' }}>
            SR
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="font-sans text-[16px] font-semibold text-fg1">Sophia Reynolds</div>
            <div className="font-sans text-[13px] text-fg2 mt-0.5">Senior IB Relationship Manager · ArcaFX Markets</div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                { icon: Mail,          label: 'Email',    value: 's.reynolds@arcafx.com' },
                { icon: Phone,         label: 'Direct',   value: '+1 (212) 555-0184' },
                { icon: MessageSquare, label: 'WhatsApp', value: '+1 (212) 555-0184' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-2.5">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--bg-elevated)] border border-[var(--border)]">
                    <Icon size={13} strokeWidth={2} className="text-fg3" />
                  </div>
                  <div>
                    <div className="font-mono text-[10px] tracking-[0.08em] text-fg3 uppercase">{label}</div>
                    <div className="font-sans text-[12px] text-fg1 mt-0.5">{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Availability badge */}
          <div className="shrink-0 text-right hidden sm:block">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-bull/20 bg-bull/8 px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-bull animate-pulse" />
              <span className="font-sans text-[12px] font-medium text-bull">Available</span>
            </div>
            <div className="mt-2 flex items-center justify-end gap-1 font-sans text-[11px] text-fg3">
              <Clock size={11} strokeWidth={2} />
              Mon–Fri, 9AM–6PM EST
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2.5 border-t border-[var(--border)] pt-4">
          <a
            href="mailto:s.reynolds@arcafx.com"
            className="btn btn-primary btn-sm"
          >
            <Mail size={12} strokeWidth={2} />
            Send Email
          </a>
          <a
            href="https://wa.me/12125550184"
            className="btn btn-ghost btn-sm"
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageSquare size={12} strokeWidth={2} />
            WhatsApp
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_1fr]">
        {/* Support ticket form */}
        <div className="card p-5">
          <div className="mb-4 font-display text-[10px] tracking-[0.15em] text-fg3 uppercase">RAISE A SUPPORT TICKET</div>

          {submitted ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CheckCircle size={40} strokeWidth={1.5} className="text-bull mb-3" />
              <div className="font-sans text-[15px] font-semibold text-fg1 mb-1">Ticket Submitted</div>
              <div className="font-sans text-[13px] text-fg2 max-w-[280px]">
                Your ticket has been raised. You'll receive a confirmation at your registered email within 5 minutes.
              </div>
              <div className="mt-1 font-mono text-[11px] text-fg3">Expected response: within 4 business hours</div>
              <button className="btn btn-ghost btn-sm mt-5" onClick={handleReset}>
                Raise Another Ticket
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category */}
              <div>
                <label className="mb-1.5 block font-mono text-[10px] tracking-[0.1em] text-fg3 uppercase">
                  CATEGORY
                </label>
                <select
                  className="input cursor-pointer"
                  value={category}
                  onChange={e => setCategory(e.target.value as TicketCategory)}
                >
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="mb-1.5 block font-mono text-[10px] tracking-[0.1em] text-fg3 uppercase">
                  SUBJECT
                </label>
                <input
                  className="input"
                  placeholder="Brief description of your issue"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  maxLength={120}
                />
              </div>

              {/* Message */}
              <div>
                <label className="mb-1.5 block font-mono text-[10px] tracking-[0.1em] text-fg3 uppercase">
                  MESSAGE
                </label>
                <textarea
                  className="input h-32 resize-none py-2"
                  placeholder="Describe your issue in detail. Include relevant dates, amounts, and account IDs where applicable."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                />
              </div>

              {/* Attachment hint */}
              <div className="rounded-md border border-dashed border-[var(--border-md)] bg-[var(--bg-elevated)] px-4 py-3 text-center">
                <div className="font-sans text-[12px] text-fg3">Attach screenshots or documents</div>
                <div className="font-mono text-[10px] text-fg3 mt-0.5">PNG, JPG, PDF up to 10 MB</div>
                <button type="button" className="btn btn-ghost btn-xs mt-2">Browse Files</button>
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={!subject.trim() || !message.trim()}
                >
                  Submit Ticket
                </button>
                <button type="button" className="btn btn-ghost" onClick={handleReset}>
                  Clear
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Recent tickets + info */}
        <div className="space-y-4">
          {/* Recent tickets */}
          <div className="card overflow-hidden">
            <div className="card-header">
              <div className="card-title">RECENT TICKETS</div>
            </div>
            {RECENT_TICKETS.map((t, i) => (
              <div
                key={t.id}
                className={`flex items-start gap-3 px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors cursor-pointer${
                  i < RECENT_TICKETS.length - 1 ? ' border-b border-[var(--border)]' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-mono text-[11px] text-fg3">{t.id}</span>
                    <span className={t.statusClass}>{t.status}</span>
                  </div>
                  <div className="font-sans text-[12px] text-fg2 truncate">{t.subject}</div>
                  <div className="font-mono text-[10px] text-fg3 mt-0.5">{t.date}</div>
                </div>
              </div>
            ))}
          </div>

          {/* SLA card */}
          <div className="card p-4 space-y-3">
            <div className="font-display text-[10px] tracking-[0.15em] text-fg3 uppercase">SUPPORT SLA</div>
            {[
              { tier: 'Urgent (trading block)',  sla: '1 hour',         color: 'text-bear' },
              { tier: 'High (commission issue)', sla: '4 business hrs', color: 'text-warn' },
              { tier: 'Normal',                  sla: '1 business day', color: 'text-fg2'  },
              { tier: 'Low',                     sla: '2 business days',color: 'text-fg3'  },
            ].map(row => (
              <div key={row.tier} className="flex items-center justify-between">
                <span className="font-sans text-[12px] text-fg2">{row.tier}</span>
                <span className={`font-mono text-[12px] font-semibold ${row.color}`}>{row.sla}</span>
              </div>
            ))}
          </div>

          {/* IB code reminder */}
          <div className="rounded-lg border border-accent/20 bg-accent/8 px-4 py-3">
            <div className="font-sans text-[12px] font-medium text-fg1 mb-0.5">Your IB Code</div>
            <div className="font-mono text-[16px] font-bold text-accent">{ib.code}</div>
            <div className="font-sans text-[11px] text-fg3 mt-0.5">Include this in all support correspondence</div>
          </div>
        </div>
      </div>
    </div>
  );
}
