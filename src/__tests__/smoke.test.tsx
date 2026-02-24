import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

describe('Home Component', () => {
  it('renders the home page', () => {
    render(<Home />);
    
    // Check that the main heading is rendered
    const heading = screen.getByRole('heading', {
      name: /to get started, edit the page.tsx file/i,
    });
    expect(heading).toBeInTheDocument();
  });

  it('renders the Next.js logo', () => {
    render(<Home />);
    
    const logo = screen.getByAltText('Next.js logo');
    expect(logo).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<Home />);
    
    const deployLink = screen.getByRole('link', { name: /deploy now/i });
    const docsLink = screen.getByRole('link', { name: /documentation/i });
    
    expect(deployLink).toBeInTheDocument();
    expect(docsLink).toBeInTheDocument();
  });
});
