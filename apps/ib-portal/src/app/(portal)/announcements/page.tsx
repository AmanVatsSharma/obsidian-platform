/**
 * File:        apps/ib-portal/src/app/(portal)/announcements/page.tsx
 * Module:      ib-portal · Announcements
 * Purpose:     Full announcements feed — tagged items with filter pills (NEW / UPDATE / MARKETING)
 *
 * Exports:
 *   - AnnouncementsPage() — client component (filter state)
 *
 * Depends on:
 *   - ../../../lib/mock-data-context — useIBData
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

'use client';

import { useState } from 'react';
import { cn } from '@obsidian/obsidian-ui';
import { useIBData } from '../../../lib/mock-data-context';

type AnnFilter = 'All' | 'NEW' | 'UPDATE' | 'MARKETING';

function TagBadge({ tag }: { tag: string }) {
  const cls: Record<string, string> = {
    NEW:       'tag-new',
    UPDATE:    'tag-update',
    MARKETING: 'tag-marketing',
  };
  return <span className={cls[tag] ?? 'badge badge-muted'}>{tag}</span>;
}

export default function AnnouncementsPage() {
  const { announcements } = useIBData();
  const [filter, setFilter] = useState<AnnFilter>('All');

  const filters: AnnFilter[] = ['All', 'NEW', 'UPDATE', 'MARKETING'];

  const filtered = filter === 'All'
    ? announcements
    : announcements.filter(a => a.tag === filter);

  return (
    <div className="mx-auto max-w-[900px] p-6 space-y-5">
      <div>
        <h1 className="font-display text-[22px] font-bold text-fg1">Announcements</h1>
        <p className="mt-0.5 font-sans text-[13px] text-fg2">Broker updates, product news, and marketing opportunities</p>
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2">
        {filters.map(f => (
          <button
            key={f}
            className={cn('filter-pill', filter === f && 'active')}
            onClick={() => setFilter(f)}
          >
            {f}
            {f !== 'All' && (
              <span className="ml-1.5 font-mono text-[10px]">
                ({announcements.filter(a => a.tag === f).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-12 text-center font-sans text-[13px] text-fg3">No announcements for this filter.</div>
        ) : (
          filtered.map((a, i) => (
            <div
              key={a.id}
              className={cn(
                'flex items-start gap-4 px-5 py-4 hover:bg-[var(--bg-hover)] transition-colors cursor-pointer',
                i < filtered.length - 1 && 'border-b border-[var(--border)]',
              )}
            >
              <div className="font-mono text-[11px] text-fg3 w-14 shrink-0 pt-0.5">{a.date}</div>
              <div className="shrink-0 pt-0.5"><TagBadge tag={a.tag} /></div>
              <div className="flex-1 font-sans text-[13px] text-fg2 leading-relaxed">{a.text}</div>
              <button className="shrink-0 font-sans text-[12px] text-accent hover:underline pt-0.5">Read →</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
