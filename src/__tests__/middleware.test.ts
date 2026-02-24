import { describe, it, expect, beforeEach, vi } from 'vitest';
import { middleware } from '@/middleware';
import { NextRequest, NextResponse } from 'next/server';

// Mock NextResponse.redirect
vi.mock('next/server', async () => {
  const actual = await vi.importActual('next/server');
  return {
    ...actual,
    NextResponse: {
      ...actual.NextResponse,
      redirect: (url: URL) => ({
        type: 'redirect',
        url: url.toString(),
      }),
      next: () => ({
        type: 'next',
      }),
    },
  };
});

describe('middleware', () => {
  beforeEach(() => {
    process.env.AUTH_PASSWORD = 'test-password';
  });

  it('should allow /login path without auth cookie', () => {
    const request = new NextRequest(new URL('http://localhost:3000/login'));
    const response = middleware(request);
    expect(response.type).toBe('next');
  });

  it('should allow /api/auth path without auth cookie', () => {
    const request = new NextRequest(new URL('http://localhost:3000/api/auth'));
    const response = middleware(request);
    expect(response.type).toBe('next');
  });

  it('should redirect to /login when no auth cookie on protected route', () => {
    const request = new NextRequest(new URL('http://localhost:3000/'));
    const response = middleware(request);
    expect(response.type).toBe('redirect');
    expect(response.url).toContain('/login');
  });

  it('should allow request with valid auth cookie', () => {
    const request = new NextRequest(new URL('http://localhost:3000/'));
    request.cookies.set('ops-auth', 'test-password');
    const response = middleware(request);
    expect(response.type).toBe('next');
  });

  it('should redirect to /login on protected route without cookie', () => {
    const request = new NextRequest(new URL('http://localhost:3000/dashboard'));
    const response = middleware(request);
    expect(response.type).toBe('redirect');
    expect(response.url).toContain('/login');
  });
});
