/**
 * File:        apps/platform-owner/src/components/PaginationControls.tsx
 * Module:      platform-owner · Shared Components
 * Purpose:     Pagination controls for list pages — prev/next buttons with page indicator.
 *
 * Exports:
 *   - PaginationControls({ currentPage, totalPages, onPageChange }) — pagination UI
 *
 * Depends on:
 *   - lucide-react — ChevronLeft, ChevronRight
 *   - @obsidian/obsidian-ui — cn()
 *
 * Side-effects: none
 *
 * Key invariants:
 *   - 1-indexed pages (page 1 of N).
 *   - totalPages === 0 renders nothing.
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-08
 */

'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@obsidian/obsidian-ui';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationControlsProps) {
  if (totalPages === 0) return null;

  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  const btnBase = 'flex items-center gap-1 rounded-r-sm border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1.5 font-mono text-[11px] text-fg2 transition-colors';
  const btnDisabled = 'opacity-40 cursor-not-allowed pointer-events-none';
  const btnActive = 'hover:border-fg3 hover:text-fg1';

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!canPrev}
        className={cn(btnBase, btnActive, !canPrev && btnDisabled)}
      >
        <ChevronLeft size={13} strokeWidth={2} />
        Prev
      </button>

      <span className="font-mono text-[12px] text-fg3">
        <span className="text-fg2">{currentPage}</span>
        <span className="mx-1">/</span>
        <span>{totalPages}</span>
      </span>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!canNext}
        className={cn(btnBase, btnActive, !canNext && btnDisabled)}
      >
        Next
        <ChevronRight size={13} strokeWidth={2} />
      </button>
    </div>
  );
}
