import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';

export interface StoresFilters {
  branch?: string;
  category?: string;
}

export function useStores(filters?: StoresFilters) {
  const params = new URLSearchParams();
  if (filters?.branch) params.append('branch', filters.branch);
  if (filters?.category) params.append('category', filters.category);

  const queryString = params.toString();
  const url = `/api/stores${queryString ? `?${queryString}` : ''}`;

  const { data, error, isLoading } = useSWR(url, fetcher, {
    refreshInterval: 600000, // 10 minutes
  });

  return { data, error, isLoading };
}
