'use client';

import { useState } from 'react';
import { useDashboard } from '@/hooks/useDashboard';
import { Panel } from '@/components/ui/Panel';
import { PageHeader } from '@/components/ui/PageHeader';
import { HeroScorecards } from '@/components/dashboard/HeroScorecards';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { formatIDR } from '@/lib/format';
import { Building2 } from 'lucide-react';

export default function DashboardPage() {
  const [selectedBranch, setSelectedBranch] = useState('');
  const { data, isLoading, mutate } = useDashboard({ branch: selectedBranch || undefined });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Overview performa operasional harian"
      />

      {/* Filter Bar */}
      <FilterBar
        selectedBranch={selectedBranch}
        onBranchChange={setSelectedBranch}
        onRefresh={() => mutate()}
      />

      {/* Hero Scorecards */}
      <HeroScorecards branch={selectedBranch || undefined} />

      {/* Branch Breakdown + Top Stores */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Branch Breakdown */}
        <Panel title="Performa per Branch">
          <div className="space-y-3">
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-muted" />
              ))
            ) : (data?.branches?.length ?? 0) > 0 ? (
              data.branches.map((branch: {
                branch: string;
                revenue: number;
                pairs: number;
                achievement: number | null;
                ff: number | null;
              }) => (
                <div
                  key={branch.branch}
                  className="flex items-center justify-between rounded-lg bg-surface-100 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent-primary/10">
                      <Building2 className="h-4 w-4 text-accent-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{branch.branch}</p>
                      <p className="text-xs text-muted-foreground">
                        {branch.pairs?.toLocaleString()} pairs
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-medium text-foreground">
                      {formatIDR(branch.revenue, true)}
                    </p>
                    {branch.achievement !== null && (
                      <p className={`text-xs ${
                        branch.achievement >= 100 ? 'text-rag-normal' :
                        branch.achievement >= 80 ? 'text-rag-caution' :
                        branch.achievement >= 60 ? 'text-rag-warning' :
                        'text-rag-critical'
                      }`}>
                        {(branch.achievement).toFixed(1)}%
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-muted-foreground">No branch data</p>
            )}
          </div>
        </Panel>

        {/* Top Stores */}
        <Panel title="Top 5 Store (Revenue Hari Ini)">
          <div className="space-y-3">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded bg-muted" />
              ))
            ) : data?.topStores?.length > 0 ? (
              data.topStores.map((store: {
                store: string;
                branch: string;
                revenue: number;
                achievement: number | null;
              }, idx: number) => (
                <div
                  key={store.store}
                  className="flex items-center justify-between rounded-lg bg-surface-100 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold ${
                      idx === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                      idx === 1 ? 'bg-gray-400/20 text-gray-300' :
                      idx === 2 ? 'bg-orange-600/20 text-orange-400' :
                      'bg-surface-200 text-muted-foreground'
                    }`}>
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-medium text-foreground truncate max-w-[150px]">
                        {store.store}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {store.branch}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-medium text-foreground">
                      {formatIDR(store.revenue, true)}
                    </p>
                    {store.achievement !== null && (
                      <p className="text-xs text-muted-foreground">
                        Target: {(store.achievement).toFixed(1)}%
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-muted-foreground">No store data</p>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
