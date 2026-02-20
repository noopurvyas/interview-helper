import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('should render title', () => {
    render(<EmptyState icon="questions" title="No questions yet" description="Add some!" />);
    expect(screen.getByText('No questions yet')).toBeInTheDocument();
  });

  it('should render description', () => {
    render(<EmptyState icon="questions" title="Title" description="Start by adding a question." />);
    expect(screen.getByText('Start by adding a question.')).toBeInTheDocument();
  });

  it('should render with search icon variant', () => {
    render(<EmptyState icon="search" title="No results" description="Try different keywords." />);
    expect(screen.getByText('No results')).toBeInTheDocument();
    expect(screen.getByText('Try different keywords.')).toBeInTheDocument();
  });

  it('should render with bookmarks icon variant', () => {
    render(<EmptyState icon="bookmarks" title="No bookmarks" description="Save resources here." />);
    expect(screen.getByText('No bookmarks')).toBeInTheDocument();
  });
});
