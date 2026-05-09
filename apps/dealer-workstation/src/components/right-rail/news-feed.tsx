/**
 * File:        apps/dealer-workstation/src/components/right-rail/news-feed.tsx
 * Module:      dealer-workstation · Right Rail
 * Purpose:     Market news feed — headlines with source, timestamp, and bull/bear/neutral
 *              sentiment dot for quick visual scanning.
 *
 * Exports:
 *   - NewsFeed() — market news panel
 *
 * Side-effects: none
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-26
 */

'use client';

import { useDeskData } from '../../lib/mock-data-context';
import type { NewsSentiment } from '../../lib/types';

function sentimentColor(s: NewsSentiment): string {
  if (s === 'bull')    return 'var(--bull)';
  if (s === 'bear')    return 'var(--bear)';
  return 'var(--fg3)';
}

export function NewsFeed() {
  const { newsItems } = useDeskData();

  return (
    <div>
      <div className="right-title">MARKET NEWS</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {newsItems.map(item => (
          <div key={item.id} style={{ padding: '6px 8px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', borderLeft: `2px solid ${sentimentColor(item.sentiment)}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <span style={{ fontFamily: 'var(--font-data)', fontSize: 9, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>{item.source}</span>
              <span style={{ fontFamily: 'var(--font-data)', fontSize: 9, color: 'var(--fg3)', marginLeft: 'auto' }}>{item.time}</span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: sentimentColor(item.sentiment), flexShrink: 0 }} />
            </div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--fg2)', lineHeight: 1.4 }}>{item.headline}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
