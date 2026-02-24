import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';

export interface DashboardFilters {
  branch?: string;
  date?: string;
}

export interface DashboardData {
  date: string;
  totalRevenue: number;
  totalPairs: number;
  avgAchievement: number | null;
  avgFF: number | null;
  avgFA: number | null;
  avgFS: number | null;
  branches: Array<{
    branch: string;
    revenue: number;
    pairs: number;
    achievement: number | null;
    ff: number | null;
  }>;
  topStores: Array<{
    store: string;
    branch: string;
    revenue: number;
    achievement: number | null;
  }>;
}

export function useDashboard(filters?: DashboardFilters) {
  const params = new URLSearchParams();
  if (filters?.branch) params.append('branch', filters.branch);
  if (filters?.date) params.append('date', filters.date);

  const queryString = params.toString();
  const url = `/api/dashboard${queryString ? `?${queryString}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<DashboardData>(url, fetcher, {
    refreshInterval: 300000, // 5 minutes
  });

  return { data, error, isLoading, mutate };
}
