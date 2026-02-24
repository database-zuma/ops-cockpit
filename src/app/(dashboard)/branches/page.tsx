'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { Panel } from '@/components/ui/Panel';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { StatusDot } from '@/components/ui/StatusDot';
import { formatIDR, formatPairs } from '@/lib/format';
import { Building2, TrendingUp, Package } from 'lucide-react';

interface BranchData {
  branch: string;
  area: string;
  store: string;
  revenueToday: number;
  pairsToday: number;
  revenueMtd: number;
  targetMtd: number | null;
  achievementPct: number | null;
  ffPct: number | null;
  stockPairs: number | null;
}

function getAchievementRag(pct: number | null) {
  if (pct === null) return 'info' as const;
  if (pct >= 100) return 'normal' as const;
  if (pct >= 80) return 'caution' as const;
  if (pct >= 60) return 'warning' as const;
  return 'critical' as const;
}

function getFFRag(ff: number | null) {
  if (ff === null) return 'info' as const;
  if (ff >= 0.9) return 'normal' as const;
  if (ff >= 0.8) return 'caution' as const;
  if (ff >= 0.7) return 'warning' as const;
  return 'critical' as const;
}

export default function BranchesPage() {
  const [selectedBranch, setSelectedBranch] = useState('');
  const [sortBy, setSortBy] = useState<'revenue' | 'achievement' | 'ff'>('revenue');
  
  const params = new URLSearchParams();
  if (selectedBranch) params.append('branch', selectedBranch);
  params.append('view', 'mtd');
  
  const { data, isLoading, mutate } = useSWR<{ view: string; data: BranchData[] }>(
    `/api/sales?${params}`,
    fetcher,
    { refreshInterval: 300000 }
  );

  // Sort data
  const sortedData = data?.data ? [...data.data].sort((a, b) => {
    if (sortBy === 'revenue') return (b.revenueMtd || 0) - (a.revenueMtd || 0);
    if (sortBy === 'achievement') return (b.achievementPct || 0) - (a.achievementPct || 0);
    if (sortBy === 'ff') return (b.ffPct || 0) - (a.ffPct || 0);
    return 0;
  }) : [];

  // Calculate branch summary
  const branchSummary = sortedData.reduce((acc, store) => {
    const key = store.branch;
    if (!acc[key]) {
      acc[key] = {
        branch: key,
        storeCount: 0,
        totalRevenue: 0,
        totalPairs: 0,
        totalTarget: 0,
        avgAchievement: 0,
        avgFF: 0,
        stores: [],
      };
    }
    acc[key].storeCount++;
    acc[key].totalRevenue += store.revenueMtd || 0;
    acc[key].totalPairs += store.pairsToday || 0;
    acc[key].totalTarget += store.targetMtd || 0;
    acc[key].avgAchievement += store.achievementPct || 0;
    acc[key].avgFF += store.ffPct || 0;
    acc[key].stores.push(store);
    return acc;
  }, {} as Record<string, {
    branch: string;
    storeCount: number;
    totalRevenue: number;
    totalPairs: number;
    totalTarget: number;
    avgAchievement: number;
    avgFF: number;
    stores: BranchData[];
  }>);

  // Convert to array and calculate averages
  const summaryArray = Object.values(branchSummary).map(b => ({
    ...b,
    avgAchievement: b.storeCount > 0 ? b.avgAchievement / b.storeCount : 0,
    avgFF: b.storeCount > 0 ? b.avgFF / b.storeCount : 0,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Branch Drill-down"
        subtitle="Detail performa per branch dan store"
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <FilterBar
          selectedBranch={selectedBranch}
          onBranchChange={setSelectedBranch}
          onRefresh={() => mutate()}
        />
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <div className="flex rounded-md border border-panel-border bg-surface-100 p-1">
            {(['revenue', 'achievement', 'ff'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  sortBy === s
                    ? 'bg-accent-primary text-black font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {s === 'revenue' && 'Revenue'}
                {s === 'achievement' && 'Achievement'}
                {s === 'ff' && 'FF%'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Branch Summary Cards */}
      {!selectedBranch && summaryArray.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {summaryArray.map((branch) => (
            <Panel key={branch.branch} title={branch.branch}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Stores</span>
                  <span className="font-mono">{branch.storeCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Revenue MTD</span>
                  <span className="font-mono font-medium">{formatIDR(branch.totalRevenue, true)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pairs</span>
                  <span className="font-mono">{formatPairs(branch.totalPairs)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Achievement</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono ${
                      branch.avgAchievement >= 100 ? 'text-rag-normal' :
                      branch.avgAchievement >= 80 ? 'text-rag-caution' :
                      branch.avgAchievement >= 60 ? 'text-rag-warning' :
                      'text-rag-critical'
                    }`}>
                      {branch.avgAchievement.toFixed(1)}%
                    </span>
                    <StatusDot status={getAchievementRag(branch.avgAchievement)} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg FF%</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono ${
                      branch.avgFF >= 0.9 ? 'text-rag-normal' :
                      branch.avgFF >= 0.8 ? 'text-rag-caution' :
                      branch.avgFF >= 0.7 ? 'text-rag-warning' :
                      'text-rag-critical'
                    }`}>
                      {(branch.avgFF * 100).toFixed(1)}%
                    </span>
                    <StatusDot status={getFFRag(branch.avgFF)} />
                  </div>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}

      {/* Store Detail Table */}
      <Panel title={selectedBranch ? `Stores - ${selectedBranch}` : 'All Stores'}>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : sortedData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-panel-border">
                <tr className="text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Store</th>
                  <th className="pb-2 font-medium">Area</th>
                  <th className="pb-2 font-medium text-right">Revenue MTD</th>
                  <th className="pb-2 font-medium text-right">Target</th>
                  <th className="pb-2 font-medium text-right">Achievement</th>
                  <th className="pb-2 font-medium text-right">FF%</th>
                  <th className="pb-2 font-medium text-right">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-panel-border">
                {sortedData.map((store) => (
                  <tr key={store.store} className="hover:bg-surface-100">
                    <td className="py-3 font-medium">{store.store}</td>
                    <td className="py-3 text-muted-foreground">{store.area}</td>
                    <td className="py-3 text-right font-mono">{formatIDR(store.revenueMtd)}</td>
                    <td className="py-3 text-right font-mono text-muted-foreground">
                      {store.targetMtd ? formatIDR(store.targetMtd) : '-'}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {store.achievementPct !== null && store.achievementPct !== undefined ? (
                          <>
                            <span className={`font-mono font-medium ${
                              store.achievementPct >= 100 ? 'text-rag-normal' :
                              store.achievementPct >= 80 ? 'text-rag-caution' :
                              store.achievementPct >= 60 ? 'text-rag-warning' :
                              'text-rag-critical'
                            }`}>
                              {store.achievementPct.toFixed(1)}%
                            </span>
                            <StatusDot status={getAchievementRag(store.achievementPct)} />
                          </>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {store.ffPct !== null && store.ffPct !== undefined ? (
                          <>
                            <span className={`font-mono ${
                              store.ffPct >= 0.9 ? 'text-rag-normal' :
                              store.ffPct >= 0.8 ? 'text-rag-caution' :
                              store.ffPct >= 0.7 ? 'text-rag-warning' :
                              'text-rag-critical'
                            }`}>
                              {(store.ffPct * 100).toFixed(1)}%
                            </span>
                            <StatusDot status={getFFRag(store.ffPct)} />
                          </>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-right font-mono text-muted-foreground">
                      {store.stockPairs !== null && store.stockPairs !== undefined
                        ? formatPairs(store.stockPairs)
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-8">No data available</p>
        )}
      </Panel>
    </div>
  );
}
