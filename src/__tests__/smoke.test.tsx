import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock next/navigation
const mockRedirect = vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});
vi.mock('next/navigation', () => ({
  redirect: (url: string) => mockRedirect(url),
  usePathname: () => '/dashboard',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

// Mock SWR
vi.mock('swr', () => ({
  default: vi.fn(() => ({ data: null, error: null, isLoading: true, mutate: vi.fn() })),
}));

import Home from '@/app/page';

describe('Home Page', () => {
  it('redirects to /dashboard', () => {
    expect(() => render(<Home />)).toThrow('NEXT_REDIRECT:/dashboard');
    expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
  });
});
