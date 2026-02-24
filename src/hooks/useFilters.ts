import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';

export interface FilterOptions {
  branches: string[];
  areas: string[];
  categories: string[];
  stores: string[];
  latestDate: string;
}

export function useFilters() {
  const { data, error, isLoading } = useSWR<FilterOptions>('/api/filter-options', fetcher, {
    refreshInterval: 900000, // 15 minutes
  });

  return { data, error, isLoading };
}
