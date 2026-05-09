/**
 * File:        apps/platform-owner/src/shared/components/section-stub.tsx
 * Module:      platform-owner · Shared Components
 * Purpose:     Consistent "Coming Soon" placeholder for unbuilt dashboard sections
 *
 * Exports:
 *   - SectionStub(props: SectionStubProps) — full-page stub UI
 *
 * Depends on:
 *   - lucide-react — Construction icon
 *
 * Side-effects:
 *   - none
 *
 * Author:      BharatERP
 * Last-updated: 2026-04-24
 */

import { Construction } from 'lucide-react';

export interface SectionStubProps {
  title: string;
  description?: string;
}

export function SectionStub({ title, description }: SectionStubProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-r-lg border border-[var(--border)] bg-[var(--bg-elevated)] text-fg3">
        <Construction size={20} strokeWidth={2} />
      </div>
      <div>
        <h2 className="font-display text-[14px] font-semibold uppercase tracking-[0.08em] text-fg2">
          {title}
        </h2>
        <p className="mt-1 font-ui text-[12px] text-fg3">
          {description ?? 'This section is under construction and will be available in a future update.'}
        </p>
      </div>
    </div>
  );
}
