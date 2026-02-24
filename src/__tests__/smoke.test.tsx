import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock next/navigation — redirect() throws NEXT_REDIRECT
const mockRedirect = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});
vi.mock('next/navigation', () => ({
  redirect: (url: string) => mockRedirect(url),
  usePathname: () => '/dashboard',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

import Home from '@/app/page';
import DashboardPage from '@/app/(dashboard)/dashboard/page';

describe('Home Page', () => {
  it('redirects to /dashboard', () => {
    expect(() => render(<Home />)).toThrow('NEXT_REDIRECT:/dashboard');
    expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
  });
});

describe('Dashboard Page', () => {
  it('renders the dashboard placeholder', () => {
    render(<DashboardPage />);
    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    expect(screen.getByText('Dashboard content coming soon.')).toBeInTheDocument();
  });

  it('renders with Panel component', () => {
    render(<DashboardPage />);
    expect(screen.getByTestId('panel')).toBeInTheDocument();
    expect(screen.getByTestId('panel-title')).toHaveTextContent('Overview');
  });
});
