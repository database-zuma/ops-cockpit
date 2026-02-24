import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock next/navigation
let mockPathname = '/dashboard';
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

// Mock next/link to render a plain <a>
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import { Sidebar } from '@/components/layout/Sidebar';

describe('Sidebar', () => {
  it('renders all navigation items', () => {
    render(<Sidebar />);

    expect(screen.getByTestId('nav-item-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-sales')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-stock-ff')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-branch-drill-down')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-map')).toBeInTheDocument();
  });

  it('renders nav items with correct hrefs', () => {
    render(<Sidebar />);

    expect(screen.getByTestId('nav-item-dashboard')).toHaveAttribute('href', '/dashboard');
    expect(screen.getByTestId('nav-item-sales')).toHaveAttribute('href', '/sales');
    expect(screen.getByTestId('nav-item-stock-ff')).toHaveAttribute('href', '/stock');
    expect(screen.getByTestId('nav-item-branch-drill-down')).toHaveAttribute('href', '/branches');
    expect(screen.getByTestId('nav-item-map')).toHaveAttribute('href', '/map');
  });

  it('shows active indicator for current route', () => {
    mockPathname = '/dashboard';
    render(<Sidebar />);

    const dashboardItem = screen.getByTestId('nav-item-dashboard');
    expect(dashboardItem.className).toContain('text-accent-primary');
    expect(screen.getByTestId('active-indicator')).toBeInTheDocument();
  });

  it('does not show active state on non-matching routes', () => {
    mockPathname = '/sales';
    render(<Sidebar />);

    const dashboardItem = screen.getByTestId('nav-item-dashboard');
    expect(dashboardItem.className).not.toContain('text-accent-primary');

    const salesItem = screen.getByTestId('nav-item-sales');
    expect(salesItem.className).toContain('text-accent-primary');
  });

  it('renders ZUMA OPS logo text', () => {
    render(<Sidebar />);
    expect(screen.getByTestId('sidebar-logo')).toBeInTheDocument();
    expect(screen.getByText('ZUMA OPS')).toBeInTheDocument();
  });

  it('collapses when toggle is clicked', () => {
    render(<Sidebar />);

    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar.className).toContain('w-60');

    const toggle = screen.getByTestId('sidebar-toggle');
    fireEvent.click(toggle);

    expect(sidebar.className).toContain('w-16');
    expect(sidebar.className).not.toContain('w-60');
  });

  it('expands when toggle is clicked again', () => {
    render(<Sidebar />);

    const toggle = screen.getByTestId('sidebar-toggle');
    // Collapse
    fireEvent.click(toggle);
    expect(screen.getByTestId('sidebar').className).toContain('w-16');

    // Expand
    fireEvent.click(toggle);
    expect(screen.getByTestId('sidebar').className).toContain('w-60');
  });

  it('hides nav labels when collapsed', () => {
    render(<Sidebar />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('sidebar-toggle'));

    // Labels should be hidden (not rendered)
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('toggle button has accessible label', () => {
    render(<Sidebar />);

    const toggle = screen.getByTestId('sidebar-toggle');
    expect(toggle).toHaveAttribute('aria-label', 'Collapse sidebar');

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-label', 'Expand sidebar');
  });
});
