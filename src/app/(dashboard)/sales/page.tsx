'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { Panel } from '@/components/ui/Panel';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { Sparkline } from '@/components/dashboard/Sparkline';
import { formatIDR, formatPairs } from '@/lib/format';
import { TrendingUp, Calendar, Building2 } from 'lucide-react';

interface SalesData {
  view: string;
  data: Array<{
    date?: string;
    store?: string;
    branch?: string;
    revenue?: number;
    revenueMtd?: number;
    pairs?: number;
    pairsMtd?: number;
    asp?: number;
    targetMtd?: number;
    achievementPct?: number;
  }>;
}

export default function SalesPage() {
  const [selectedBranch, setSelectedBranch] = useState('');
  const [view, setView] = useState<'daily' | 'mtd' | 'branch'>('daily');
  
  const params = new URLSearchParams();
  if (selectedBranch) params.append('branch', selectedBranch);
  params.append('view', view);
  
  const { data, isLoading, mutate } = useSWR<SalesData>(
    `/api/sales?${params}`,
    fetcher,
    { refreshInterval: 300000 }
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Dashboard"
        subtitle="Analisis penjualan harian dan MTD"
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <FilterBar
          selectedBranch={selectedBranch}
          onBranchChange={setSelectedBranch}
          onRefresh={() => mutate()}
        />
        <div className="flex rounded-md border border-panel-border bg-surface-100 p-1">
          {(['daily', 'mtd', 'branch'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                view === v
                  ? 'bg-accent-primary text-black font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {v === 'daily' && 'Daily'}
              {v === 'mtd' && 'MTD'}
              {v === 'branch' && 'Branch'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : view === 'daily' && data?.data ? (
        /* Daily View */
        <Panel title="Revenue Trend (30 Hari)">
          <div className="space-y-4">
            {/* Sparkline */}
            <div className="rounded-lg bg-surface-100 p-4">
              <Sparkline
                data={data.data.map(d => d.revenue || 0)}
                width={800}
                height={100}
              />
            </div>
            
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-panel-border">
                  <tr className="text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Tanggal</th>
                    <th className="pb-2 font-medium text-right">Revenue</th>
                    <th className="pb-2 font-medium text-right">Pairs</th>
                    <th className="pb-2 font-medium text-right">ASP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-panel-border">
                  {data.data.slice(-10).reverse().map((row) => (
                    <tr key={row.date} className="hover:bg-surface-100">
                      <td className="py-3 font-mono text-xs">{row.date}</td>
                      <td className="py-3 text-right font-mono">{formatIDR(row.revenue)}</td>
                      <td className="py-3 text-right font-mono">{formatPairs(row.pairs || 0)}</td>
                      <td className="py-3 text-right font-mono text-muted-foreground">
                        Rp {(row.asp || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Panel>
      ) : view === 'mtd' && data?.data ? (
        /* MTD View */
        <Panel title="MTD Achievement per Store">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-panel-border">
                <tr className="text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Store</th>
                  <th className="pb-2 font-medium">Branch</th>
                  <th className="pb-2 font-medium text-right">Revenue MTD</th>
                  <th className="pb-2 font-medium text-right">Target</th>
                  <th className="pb-2 font-medium text-right">Achievement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-panel-border">
                {data.data.slice(0, 20).map((row) => (
                  <tr key={row.store} className="hover:bg-surface-100">
                    <td className="py-3 font-medium">{row.store}</td>
                    <td className="py-3 text-muted-foreground">{row.branch}</td>
                    <td className="py-3 text-right font-mono">{formatIDR(row.revenueMtd)}</td>
                    <td className="py-3 text-right font-mono text-muted-foreground">
                      {row.targetMtd ? formatIDR(row.targetMtd) : '-'}
                    </td>
                    <td className="py-3 text-right">
                      {row.achievementPct !== null && row.achievementPct !== undefined ? (
                        <span className={`font-mono font-medium ${
                          row.achievementPct >= 100 ? 'text-rag-normal' :
                          row.achievementPct >= 80 ? 'text-rag-caution' :
                          row.achievementPct >= 60 ? 'text-rag-warning' :
                          'text-rag-critical'
                        }`}>
                          {row.achievementPct.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : view === 'branch' && data?.data ? (
        /* Branch View */
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.data.map((row) => (
            <Panel key={row.branch} title={row.branch || 'Unknown'}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Revenue</span>
                  <span className="font-mono font-medium">{formatIDR(row.revenue, true)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pairs</span>
                  <span className="font-mono">{formatPairs(row.pairs || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Achievement</span>
                  {row.achievementPct !== null && row.achievementPct !== undefined ? (
                    <span className={`font-mono font-medium ${
                      row.achievementPct >= 100 ? 'text-rag-normal' :
                      row.achievementPct >= 80 ? 'text-rag-caution' :
                      row.achievementPct >= 60 ? 'text-rag-warning' :
                      'text-rag-critical'
                    }`}>
                      {row.achievementPct.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </div>
              </div>
            </Panel>
          ))}
        </div>
      ) : null}
    </div>
  );
}
