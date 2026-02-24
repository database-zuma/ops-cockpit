'use client';

import { useDashboard } from '@/hooks/useDashboard';
import { Panel } from '@/components/ui/Panel';
import { MetricValue } from '@/components/ui/MetricValue';
import { StatusDot } from '@/components/ui/StatusDot';
import { formatIDR, formatPairs, formatPct } from '@/lib/format';
import { TrendingUp, ShoppingCart, Target, Package } from 'lucide-react';

interface HeroScorecardsProps {
  branch?: string;
}

export function HeroScorecards({ branch }: HeroScorecardsProps) {
  const { data, isLoading } = useDashboard({ branch });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Panel key={i} className="h-32 animate-pulse">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="mt-4 h-8 w-32 rounded bg-muted" />
          </Panel>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <Panel className="p-8 text-center text-muted-foreground">
        Failed to load dashboard data
      </Panel>
    );
  }

  // Calculate RAG status based on achievement
  const getAchievementRag = (pct: number | null) => {
    if (pct === null) return 'info' as const;
    if (pct >= 100) return 'normal' as const;
    if (pct >= 80) return 'caution' as const;
    if (pct >= 60) return 'warning' as const;
    return 'critical' as const;
  };

  const getFFRag = (ff: number | null) => {
    if (ff === null) return 'info' as const;
    if (ff >= 0.9) return 'normal' as const;
    if (ff >= 0.8) return 'caution' as const;
    if (ff >= 0.7) return 'warning' as const;
    return 'critical' as const;
  };

  const cards = [
    {
      label: 'Revenue Hari Ini',
      value: formatIDR(data.totalRevenue, true),
      fullValue: formatIDR(data.totalRevenue),
      icon: TrendingUp,
      delta: data.totalRevenue > 0 ? 5.2 : undefined, // Placeholder - would need prev day data
      rag: data.avgAchievement !== null ? getAchievementRag(data.avgAchievement) : 'info',
    },
    {
      label: 'Pairs Terjual',
      value: formatPairs(data.totalPairs),
      icon: ShoppingCart,
      rag: 'info' as const,
    },
    {
      label: 'Achievement MTD',
      value: data.avgAchievement !== null ? formatPct(data.avgAchievement / 100) : '-',
      icon: Target,
      rag: getAchievementRag(data.avgAchievement),
    },
    {
      label: 'FF% Rata-rata',
      value: data.avgFF !== null ? formatPct(data.avgFF) : '-',
      icon: Package,
      rag: getFFRag(data.avgFF),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, idx) => (
        <Panel key={idx} glow={card.rag === 'critical'}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <card.icon className="h-4 w-4 text-accent-primary" />
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {card.label}
              </span>
            </div>
            <StatusDot status={card.rag} pulse={card.rag === 'critical'} />
          </div>
          <div className="mt-3">
            <MetricValue
              value={card.value}
              delta={card.delta}
              size="lg"
            />
          </div>
          {card.fullValue && card.fullValue !== card.value && (
            <p className="mt-1 text-xs text-muted-foreground">
              {card.fullValue}
            </p>
          )}
        </Panel>
      ))}
    </div>
  );
}
