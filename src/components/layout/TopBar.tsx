'use client';

import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

/** Map route path to display title */
const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/sales': 'Sales',
  '/stock': 'Stock & FF',
  '/branches': 'Branch Drill-down',
  '/map': 'Map',
};

function resolveTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  // Check prefix match for nested routes
  for (const [path, title] of Object.entries(pageTitles)) {
    if (pathname.startsWith(path + '/')) return title;
  }
  return 'Zuma Ops';
}

interface TopBarProps {
  className?: string;
  /** ISO string of last data refresh, shown as "Last updated: HH:MM" */
  lastUpdated?: string;
}

export function TopBar({ className, lastUpdated }: TopBarProps) {
  const pathname = usePathname();
  const title = resolveTitle(pathname);

  const formattedTime = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <header
      data-testid="topbar"
      className={cn(
        'flex h-12 items-center justify-between border-b border-panel-border bg-panel-bg px-5',
        className,
      )}
    >
      <h2
        data-testid="topbar-title"
        className="text-sm font-semibold tracking-wide text-foreground"
      >
        {title}
      </h2>

      <span
        data-testid="topbar-freshness"
        className="font-mono text-xs text-text-muted"
      >
        {formattedTime ? `Last updated: ${formattedTime}` : 'Last updated: —'}
      </span>
    </header>
  );
}
