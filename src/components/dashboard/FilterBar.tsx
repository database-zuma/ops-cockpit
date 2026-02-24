'use client';

import { useFilters } from '@/hooks/useFilters';
import { Branch } from '@/types/database';

interface FilterBarProps {
  selectedBranch?: string;
  selectedStore?: string;
  onBranchChange?: (branch: string) => void;
  onStoreChange?: (store: string) => void;
  onRefresh?: () => void;
}

export function FilterBar({
  selectedBranch,
  selectedStore,
  onBranchChange,
  onStoreChange,
  onRefresh,
}: FilterBarProps) {
  const { data: filters, isLoading } = useFilters();

  if (isLoading) {
    return (
      <div className="flex gap-3">
        <div className="h-9 w-32 animate-pulse rounded bg-muted" />
        <div className="h-9 w-48 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Branch Filter */}
      <div className="relative">
        <select
          value={selectedBranch || ''}
          onChange={(e) => onBranchChange?.(e.target.value || '')}
          className="h-9 appearance-none rounded-md border border-panel-border bg-surface-100 px-3 pr-8 text-sm text-foreground outline-none ring-accent-primary/20 transition-colors focus:border-accent-primary/50 focus:ring-2"
        >
          <option value="">Semua Branch</option>
          {filters?.branches?.map((branch: string) => (
            <option key={branch} value={branch}>
              {branch}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Store Filter */}
      <div className="relative">
        <select
          value={selectedStore || ''}
          onChange={(e) => onStoreChange?.(e.target.value || '')}
          className="h-9 appearance-none rounded-md border border-panel-border bg-surface-100 px-3 pr-8 text-sm text-foreground outline-none ring-accent-primary/20 transition-colors focus:border-accent-primary/50 focus:ring-2"
        >
          <option value="">Semua Store</option>
          {filters?.stores?.map((store: string) => (
            <option key={store} value={store}>
              {store}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Date Display */}
      {filters?.latestDate && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-accent-primary animate-pulse" />
          Data: {filters.latestDate}
        </div>
      )}

      {/* Refresh Button */}
      <button
        onClick={onRefresh}
        className="ml-auto flex h-9 items-center gap-2 rounded-md border border-panel-border bg-surface-100 px-3 text-sm text-foreground transition-colors hover:border-accent-primary/50 hover:bg-surface-200"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Refresh
      </button>
    </div>
  );
}
