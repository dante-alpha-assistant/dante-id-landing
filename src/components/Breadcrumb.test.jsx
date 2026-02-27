import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import { transformPathSegment, generateBreadcrumbPath } from '../utils/breadcrumbUtils';

// Mock the hook
jest.mock('../hooks/useBreadcrumb', () => ({
  useBreadcrumb: jest.fn()
}));

const { useBreadcrumb } = require('../hooks/useBreadcrumb');

const renderBreadcrumb = (pathname = '/', props = {}) => {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <Breadcrumb {...props} />
    </MemoryRouter>
  );
};

describe('Breadcrumb Component', () => {
  beforeEach(() => {
    useBreadcrumb.mockReset();
  });

  test('renders breadcrumb navigation with proper accessibility', () => {
    useBreadcrumb.mockReturnValue([
      { label: 'Home', path: '/' },
      { label: 'Projects', path: '/dashboard' },
      { label: 'Refinery', path: '/refinery/123' }
    ]);

    renderBreadcrumb('/refinery/123');

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Breadcrumb');
  });

  test('renders clickable links for parent items', () => {
    useBreadcrumb.mockReturnValue([
      { label: 'Home', path: '/' },
      { label: 'Projects', path: '/dashboard' },
      { label: 'Refinery', path: '/refinery/123' }
    ]);

    renderBreadcrumb('/refinery/123');

    const homeLink = screen.getByRole('link', { name: /navigate to home/i });
    const projectsLink = screen.getByRole('link', { name: /navigate to projects/i });
    
    expect(homeLink).toHaveAttribute('href', '/');
    expect(projectsLink).toHaveAttribute('href', '/dashboard');
  });

  test('renders current page as non-clickable text', () => {
    useBreadcrumb.mockReturnValue([
      { label: 'Home', path: '/' },
      { label: 'Projects', path: '/dashboard' },
      { label: 'Refinery', path: '/refinery/123' }
    ]);

    renderBreadcrumb('/refinery/123');

    const currentPage = screen.getByText('Refinery');
    expect(currentPage).not.toHaveAttribute('href');
    expect(currentPage.tagName).toBe('SPAN');
  });

  test('does not render when only home page', () => {
    useBreadcrumb.mockReturnValue([
      { label: 'Home', path: '/' }
    ]);

    const { container } = renderBreadcrumb('/');
    expect(container.firstChild).toBeNull();
  });

  test('supports keyboard navigation', () => {
    useBreadcrumb.mockReturnValue([
      { label: 'Home', path: '/' },
      { label: 'Projects', path: '/dashboard' }
    ]);

    renderBreadcrumb('/dashboard');

    const homeLink = screen.getByRole('link', { name: /navigate to home/i });
    
    fireEvent.keyDown(homeLink, { key: 'Enter' });
    expect(homeLink).toHaveAttribute('tabIndex', '0');
  });
});

describe('Breadcrumb Utils', () => {
  test('transforms path segments to readable labels', () => {
    expect(transformPathSegment('my-project')).toBe('My Project');
    expect(transformPathSegment('user_settings')).toBe('User Settings');
    expect(transformPathSegment('camelCase')).toBe('Camel Case');
    expect(transformPathSegment('UPPER')).toBe('Upper');
  });

  test('generates correct breadcrumb paths', () => {
    expect(generateBreadcrumbPath(['dashboard', 'projects'])).toBe('/dashboard/projects');
    expect(generateBreadcrumbPath(['refinery', '123'])).toBe('/refinery/123');
  });
});