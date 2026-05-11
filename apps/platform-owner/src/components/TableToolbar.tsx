/**
 * File:        apps/platform-owner/src/components/TableToolbar.tsx
 * Module:      platform-owner · Shared Components
 * Purpose:     Reusable search + filter bar for list pages.
 *              Renders a text search input on the left and filter dropdowns on the right.
 *
 * Exports:
 *   - TableToolbar({ searchValue, onSearch, filters, className? }) — toolbar component
 *
 * Depends on:
 *   - lucide-react — Search, X icons
 *   - @obsidian/obsidian-ui — cn()
 *
 * Side-effects: none
 *
 * Key invariants:
 *   - Filters are client-side only; parent is responsible for applying them to data.
 *   - Empty filters array is valid — renders search-only toolbar.
 *
 * Author:      BharatERP
 * Last-updated: 2026-06-08
 */

'use client';

import { Search, X } from 'lucide-react';
import { cn } from '@obsidian/obsidian-ui';

export interface FilterOption {
  value: string;
  label: string;
}

export interface Filter {
  key: string;
  label: string;
  options: FilterOption[];
}

interface TableToolbarProps {
  searchValue: string;
  onSearch: (value: string) => void;
  filters?: Filter[];
  filterValues?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  placeholder?: string;
  className?: string;
}

export function TableToolbar({
  searchValue,
  onSearch,
  filters = [],
  filterValues = {},
  onFilterChange,
  placeholder = 'Search...',
  className,
}: TableToolbarProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg3" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-r-sm border border-[var(--border)] bg-[var(--bg-elevated)] pl-8 pr-8 py-2 font-mono text-[12px] text-fg1 placeholder:text-fg4 focus:border-accent focus:outline-none"
        />
        {searchValue && (
          <button
            onClick={() => onSearch('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-fg3 hover:text-fg2"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Filters */}
      {filters.map((filter) => (
        <div key={filter.key} className="flex items-center gap-1.5">
          <span className="font-display text-[10px] uppercase tracking-[0.06em] text-fg3">{filter.label}</span>
          <select
            value={filterValues[filter.key] ?? ''}
            onChange={(e) => onFilterChange?.(filter.key, e.target.value)}
            className="rounded-r-sm border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1.5 font-mono text-[11px] text-fg1 focus:border-accent focus:outline-none"
          >
            <option value="">All</option>
            {filter.options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
