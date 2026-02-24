import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';

export interface DashboardFilters {
  branch?: string;
  date?: string;
}

export function useDashboard(filters?: DashboardFilters) {
  const params = new URLSearchParams();
  if (filters?.branch) params.append('branch', filters.branch);
  if (filters?.date) params.append('date', filters.date);

  const queryString = params.toString();
  const url = `/api/dashboard${queryString ? `?${queryString}` : ''}`;

  const { data, error, isLoading } = useSWR(url, fetcher, {
    refreshInterval: 300000, // 5 minutes
  });

  return { data, error, isLoading };
}
