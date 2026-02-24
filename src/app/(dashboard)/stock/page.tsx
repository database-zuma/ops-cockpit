'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { Panel } from '@/components/ui/Panel';
import { PageHeader } from '@/components/ui/PageHeader';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { Sparkline } from '@/components/dashboard/Sparkline';
import { StatusDot } from '@/components/ui/StatusDot';
import { formatIDR, formatPairs, formatPct } from '@/lib/format';
import { Package, Gauge, AlertCircle } from 'lucide-react';

interface StockData {
  view: string;
  data: {
    totalStockPairs?: number;
    totalStockValue?: number;
    avgFF?: number;
    avgFA?: number;
    avgFS?: number;
    storeCount?: number;
    date?: string;
    avgFFtrend?: number;
    avgFAtrend?: number;
    avgFStrend?: number;
    store?: string;
    branch?: string;
    stockPairs?: number;
    stockValue?: number;
    ff?: number | null;
    fa?: number | null;
    fs?: number | null;
    turnover?: number | null;
  }[];
}

function getFFRag(ff: number | null): 'critical' | 'warning' | 'caution' | 'normal' | 'info' {
  if (ff === null) return 'info';
  if (ff >= 0.9) return 'normal';
  if (ff >= 0.8) return 'caution';
  if (ff >= 0.7) return 'warning';
  return 'critical';
}

export default function StockPage() {
  const [selectedBranch, setSelectedBranch] = useState('');
  const [view, setView] = useState<'summary' | 'ff' | 'stores'>('summary');
  
  const params = new URLSearchParams();
  if (selectedBranch) params.append('branch', selectedBranch);
  params.append('view', view);
  
  const { data, isLoading, mutate } = useSWR<StockData>(
    `/api/stock?${params}`,
    fetcher,
    { refreshInterval: 300000 }
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock & Fulfillment"
        subtitle="Monitoring stock health dan FF/FA/FS"
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <FilterBar
          selectedBranch={selectedBranch}
          onBranchChange={setSelectedBranch}
          onRefresh={() => mutate()}
        />
        <div className="flex rounded-md border border-panel-border bg-surface-100 p-1">
          {(['summary', 'ff', 'stores'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                view === v
                  ? 'bg-accent-primary text-black font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {v === 'summary' && 'Summary'}
              {v === 'ff' && 'FF Trend'}
              {v === 'stores' && 'Per Store'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : view === 'summary' && data?.data ? (
        /* Summary View */
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Panel glow={(data.data[0]?.avgFF || 0) < 0.7}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-accent-primary" />
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Total Stock Pairs
                  </span>
                </div>
              </div>
              <p className="mt-3 font-mono text-3xl font-semibold">
                {formatPairs(data.data[0]?.totalStockPairs || 0)}
              </p>
            </Panel>
            
            <Panel>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
003e
                  <Gauge className="h-4 w-4 text-accent-primary" />
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Avg FF%
                  </span>
                </div>
                <StatusDot status={getFFRag(data.data[0]?.avgFF ?? null)} />
              </div>
              <p className={`mt-3 font-mono text-3xl font-semibold ${
                (data.data[0]?.avgFF || 0) >= 0.9 ? 'text-rag-normal' :
                (data.data[0]?.avgFF || 0) >= 0.8 ? 'text-rag-caution' :
                (data.data[0]?.avgFF || 0) >= 0.7 ? 'text-rag-warning' :
                'text-rag-critical'
              }`}>
                {data.data[0]?.avgFF !== null && data.data[0]?.avgFF !== undefined
                  ? formatPct(data.data[0].avgFF)
                  : '-'}
              </p>
            </Panel>
            
            <Panel>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-accent-primary" />
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Avg FA%
                  </span>
                </div>
              </div>
              <p className="mt-3 font-mono text-3xl font-semibold">
                {data.data[0]?.avgFA !== null && data.data[0]?.avgFA !== undefined
                  ? formatPct(data.data[0].avgFA)
                  : '-'}
              </p>
            </Panel>
            
            <Panel>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-accent-primary" />
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Stores
                  </span>
                </div>
              </div>
              <p className="mt-3 font-mono text-3xl font-semibold">
                {data.data[0]?.storeCount || 0}
              </p>
            </Panel>
          </div>
          
          <Panel title="Stock Value">
            <div className="flex items-center gap-4">
              <div className="text-4xl font-mono font-bold text-accent-primary">
                {formatIDR(data.data[0]?.totalStockValue || 0)}
              </div>
              <div className="text-sm text-muted-foreground">
                Total estimated RSP value across all stores
              </div>
            </div>
          </Panel>
        </>
      ) : view === 'ff' && data?.data ? (
        /* FF Trend View */
        <Panel title="FF/FA/FS Trend (30 Hari)">
          <div className="space-y-4">
            <div className="rounded-lg bg-surface-100 p-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">FF% (Full Floor)</p>
              <Sparkline
                data={data.data.map(d => (d.avgFF || 0) * 100)}
                width={800}
                height={80}
                color="#00ffcc"
              />
            </div>
            
            <div className="rounded-lg bg-surface-100 p-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">FA% (Fill Accuracy)</p>
              <Sparkline
                data={data.data.map(d => (d.avgFA || 0) * 100)}
                width={800}
                height={80}
                color="#3366ff"
              />
            </div>
            
            <div className="rounded-lg bg-surface-100 p-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">FS% (Fill Score)</p>
              <Sparkline
                data={data.data.map(d => (d.avgFS || 0) * 100)}
                width={800}
                height={80}
                color="#ffcc00"
              />
            </div>
          </div>
        </Panel>
      ) : view === 'stores' && data?.data ? (
        /* Per Store View */
        <Panel title="Stock & FF per Store">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-panel-border">
                <tr className="text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Store</th>
                  <th className="pb-2 font-medium">Branch</th>
                  <th className="pb-2 font-medium text-right">Stock Pairs</th>
                  <th className="pb-2 font-medium text-right">FF%</th>
                  <th className="pb-2 font-medium text-right">FA%</th>
                  <th className="pb-2 font-medium text-right">Turnover</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-panel-border">
                {data.data.map((row) => (
                  <tr key={row.store} className="hover:bg-surface-100">
                    <td className="py-3 font-medium">{row.store}</td>
                    <td className="py-3 text-muted-foreground">{row.branch}</td>
                    <td className="py-3 text-right font-mono">{formatPairs(row.stockPairs || 0)}</td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {row.ff !== null && row.ff !== undefined ? (
                          <>
                            <span className={`font-mono ${
                              row.ff >= 0.9 ? 'text-rag-normal' :
                              row.ff >= 0.8 ? 'text-rag-caution' :
                              row.ff >= 0.7 ? 'text-rag-warning' :
                              'text-rag-critical'
                            }`}>
                              {formatPct(row.ff)}
                            </span>
                            <StatusDot status={getFFRag(row.ff)} />
                          </>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-right font-mono">
                      {row.fa !== null && row.fa !== undefined ? formatPct(row.fa) : '-'}
                    </td>
                    <td className="py-3 text-right font-mono text-muted-foreground">
                      {row.turnover !== null && row.turnover !== undefined
                        ? row.turnover.toFixed(2)
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
