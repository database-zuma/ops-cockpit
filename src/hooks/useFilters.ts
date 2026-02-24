import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';

export function useFilters() {
  const { data, error, isLoading } = useSWR('/api/filter-options', fetcher, {
    refreshInterval: 900000, // 15 minutes
  });

  return { data, error, isLoading };
}
