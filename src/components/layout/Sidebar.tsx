'use client';

import { useState } from 'react';

import {
  Building2,
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,
  Map as MapIcon,
  Package,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Sales', href: '/sales', icon: TrendingUp },
  { label: 'Stock & FF', href: '/stock', icon: Package },
  { label: 'Branch Drill-down', href: '/branches', icon: Building2 },
  { label: 'Map', href: '/map', icon: MapIcon },
] as const;

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      data-testid="sidebar"
      className={cn(
        'flex h-screen flex-col border-r border-panel-border bg-panel-bg transition-all duration-200',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Logo */}
      <div
        className="flex h-12 items-center border-b border-panel-border px-4"
        data-testid="sidebar-logo"
      >
        <span
          className={cn(
            'font-mono text-sm font-bold tracking-[0.25em] text-accent-primary transition-opacity duration-200',
            collapsed && 'sr-only',
          )}
        >
          ZUMA OPS
        </span>
        {collapsed && (
          <span className="font-mono text-sm font-bold text-accent-primary">Z</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-2 py-3" data-testid="sidebar-nav">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              data-testid={`nav-item-${item.label.toLowerCase().replace(/\s+&?\s*/g, '-')}`}
              className={cn(
                'group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent-primary/10 text-accent-primary'
                  : 'text-text-secondary hover:bg-surface-200 hover:text-text-primary',
              )}
            >
              {/* Active indicator bar */}
              {isActive && (
                <span
                  className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-accent-primary"
                  data-testid="active-indicator"
                />
              )}
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        data-testid="sidebar-toggle"
        className="flex h-10 items-center justify-center border-t border-panel-border text-text-muted transition-colors hover:bg-surface-200 hover:text-text-primary"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <ChevronsRight className="h-4 w-4" />
        ) : (
          <ChevronsLeft className="h-4 w-4" />
        )}
      </button>
    </aside>
  );
}
