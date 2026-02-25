'use client';

import { TopBar } from './TopBar';
import { useFilters } from '@/hooks/useFilters';

export function TopBarWrapper() {
  const { data } = useFilters();
  
  return <TopBar lastUpdated={data?.latestDate} />;
}
