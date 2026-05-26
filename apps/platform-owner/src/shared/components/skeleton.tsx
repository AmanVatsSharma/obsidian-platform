/**
 * File:        apps/platform-owner/src/shared/components/skeleton.tsx
 * Module:      platform-owner · Shared Components
 * Purpose:     Obsidian-branded skeleton loaders for content loading states.
 *              Uses the design system's border tokens and accent animation.
 *
 * Exports:
 *   - SkeletonBlock({ className?, height?, width? })  — basic rectangle skeleton
 *   - SkeletonLine({ className?, width? })             — single-line text skeleton
 *   - SkeletonCard({ className? })                    — full card skeleton
 *   - SkeletonTable({ rows?, cols? })                  — table skeleton with rows/cols
 *   - SkeletonKpiCard()                             — 4-col KPI card skeleton
 *   - SkeletonBrokerRow()                           — broker table row skeleton
 *   - SkeletonPanel({ className? })                  — generic panel skeleton
 *   - PageSkeleton()                                 — full-page loading state
 *
 * Depends on:
 *   - @obsidian/obsidian-ui — cn()
 *
 * Side-effects: none
 *
 * Key invariants:
 *   - Animation uses bg-[var(--bg-elevated)] shimmer — no external colors
 *   - All skeletons use opacity-10 for subtle, non-distracting loading
 *
 * Author:      BharatERP
 * Last-updated: 2026-05-11
 */

import { cn } from '@obsidian/obsidian-ui';

const shimmerClass = 'bg-[var(--bg-elevated)] animate-shimmer-slow';

export function SkeletonBlock({
  className,
  height = 'h-4',
  width = 'w-full',
}: {
  className?: string;
  height?: string;
  width?: string;
}) {
  return <div className={cn(shimmerClass, 'rounded', height, width, className)} />;
}

export function SkeletonLine({
  className,
  width = 'w-3/4',
}: {
  className?: string;
  width?: string;
}) {
  return <div className={cn(shimmerClass, 'h-3 rounded', width, className)} />;
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-r-lg border border-[var(--border)] bg-[var(--bg-panel)] p-4', className)}>
      <div className="space-y-3">
        <SkeletonLine width="w-1/3" />
        <SkeletonBlock height="h-8" />
        <SkeletonLine width="w-2/3" />
      </div>
    </div>
  );
}

export function SkeletonTable({
  rows = 5,
  cols = 4,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="overflow-hidden rounded-r-lg border border-[var(--border)]">
      {/* Header */}
      <div className="flex gap-4 border-b border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonLine key={i} width={`w-${20 + i * 5}`} className="max-w-32" />
        ))}
      </div>
      {/* Body rows */}
      <div className="divide-y divide-[var(--border)] bg-[var(--bg-panel)]">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="flex items-center gap-4 px-4 py-4">
            {Array.from({ length: cols }).map((_, colIdx) => (
              <SkeletonLine
                key={colIdx}
                width={`w-${25 + colIdx * 10}`}
                className="max-w-40"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonKpiCard() {
  return (
    <div className="rounded-r-lg border border-[var(--border)] bg-[var(--bg-panel)] p-4">
      <div className="flex items-start justify-between mb-3">
        <SkeletonLine width="w-20" />
        <SkeletonBlock height="h-5" width="w-5" />
      </div>
      <SkeletonBlock height="h-8" width="w-28" className="mb-3" />
      <div className="flex items-center gap-2">
        <SkeletonBlock height="h-5" width="w-16" className="rounded-full" />
        <SkeletonLine width="w-16" />
      </div>
    </div>
  );
}

export function SkeletonKpiGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonKpiCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonBrokerRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <SkeletonBlock height="h-5" width="w-8" className="rounded" />
      <div className="flex-1 space-y-1.5">
        <SkeletonLine width="w-40" />
        <SkeletonBlock height="h-1.5" width="w-24" />
      </div>
      <SkeletonBlock height="h-2" width="w-16" className="rounded-full" />
      <SkeletonBlock height="h-5" width="w-20" />
    </div>
  );
}

export function SkeletonBrokerTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-r-lg border border-[var(--border)]">
      <div className="flex gap-4 border-b border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3">
        {[20, 35, 12, 12, 15].map((w, i) => (
          <SkeletonLine key={i} width={`w-[${w}px]`} />
        ))}
      </div>
      <div className="divide-y divide-[var(--border)] bg-[var(--bg-panel)]">
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonBrokerRow key={i} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonPanel({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-r-lg border border-[var(--border)] bg-[var(--bg-panel)] p-4', className)}>
      <SkeletonLine width="w-24" className="mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <SkeletonLine width="w-32" />
            <SkeletonLine width="w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonChart({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-r-lg border border-[var(--border)] bg-[var(--bg-panel)] p-4', className)}>
      <div className="mb-4 space-y-2">
        <SkeletonLine width="w-32" />
        <SkeletonBlock height="h-8" width="w-40" />
      </div>
      <div className="flex items-end gap-1 h-48">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className={cn(shimmerClass, 'flex-1 rounded-t', 'h-[30%]')}
            style={{ height: `${20 + Math.random() * 60}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function SkeletonTwoCol() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <SkeletonChart className="h-full" />
      </div>
      <SkeletonPanel />
    </div>
  );
}

export function PageSkeleton({
  title = 'Loading',
  showKpi = true,
  showTable = true,
}: {
  title?: string;
  showKpi?: boolean;
  showTable?: boolean;
}) {
  return (
    <div className="space-y-6 p-6">
      {/* Page header skeleton */}
      <div className="border-b border-[var(--border)] pb-4">
        <SkeletonLine width="w-40" className="mb-2" />
        <SkeletonLine width="w-60" />
      </div>

      {/* KPI cards skeleton */}
      {showKpi && <SkeletonKpiGrid />}

      {/* Content skeleton */}
      {showTable && <SkeletonTable />}

      {!showTable && <SkeletonChart />}
    </div>
  );
}

export function SkeletonTabs({ tabs = 5 }: { tabs?: number }) {
  return (
    <div className="mb-4 flex gap-0 border-b border-[var(--border)]">
      {Array.from({ length: tabs }).map((_, i) => (
        <SkeletonBlock
          key={i}
          height="h-8"
          width="w-24"
          className="border-b-2 border-transparent mb-[-1px]"
        />
      ))}
    </div>
  );
}

export function SkeletonBrokerDetail() {
  return (
    <div className="space-y-4 p-6">
      {/* Back link */}
      <SkeletonLine width="w-20" />

      {/* Header card */}
      <div className="flex items-center gap-4 rounded-r-lg border border-[var(--border)] bg-[var(--bg-panel)] p-4">
        <SkeletonBlock height="h-10" width="w-10" className="rounded" />
        <div className="space-y-2 flex-1">
          <SkeletonLine width="w-48" />
          <SkeletonLine width="w-32" />
        </div>
        <div className="flex gap-2">
          <SkeletonBlock height="h-6" width="w-16" className="rounded-full" />
          <SkeletonBlock height="h-6" width="w-16" className="rounded-full" />
        </div>
      </div>

      {/* Tabs */}
      <SkeletonTabs />

      {/* Tab content */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SkeletonPanel />
        <SkeletonPanel />
      </div>
    </div>
  );
}