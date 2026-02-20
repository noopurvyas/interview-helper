import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from './SearchBar';

describe('SearchBar', () => {
  it('should render with placeholder text', () => {
    render(<SearchBar query="" onSearch={vi.fn()} onClear={vi.fn()} placeholder="Search..." />);
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('should show / keyboard hint when query is empty', () => {
    render(<SearchBar query="" onSearch={vi.fn()} onClear={vi.fn()} />);
    expect(screen.getByText('/')).toBeInTheDocument();
  });

  it('should show clear button when query has value', () => {
    render(<SearchBar query="test" onSearch={vi.fn()} onClear={vi.fn()} />);
    expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
  });

  it('should not show / hint when query has value', () => {
    render(<SearchBar query="test" onSearch={vi.fn()} onClear={vi.fn()} />);
    expect(screen.queryByText('/')).not.toBeInTheDocument();
  });

  it('should call onSearch when typing', async () => {
    const onSearch = vi.fn();
    // SearchBar is a controlled component — query prop must be updated for
    // the input value to accumulate characters. We test that onSearch is
    // called on each keystroke with the event value.
    render(<SearchBar query="" onSearch={onSearch} onClear={vi.fn()} />);

    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'hello');

    // Called once per character
    expect(onSearch).toHaveBeenCalledTimes(5);
    // Each call receives the character typed (since parent doesn't update query prop)
    expect(onSearch).toHaveBeenNthCalledWith(1, 'h');
    expect(onSearch).toHaveBeenNthCalledWith(2, 'e');
  });

  it('should call onClear when clear button is clicked', async () => {
    const onClear = vi.fn();
    render(<SearchBar query="test" onSearch={vi.fn()} onClear={onClear} />);

    await userEvent.click(screen.getByLabelText('Clear search'));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('should use default placeholder when none provided', () => {
    render(<SearchBar query="" onSearch={vi.fn()} onClear={vi.fn()} />);
    expect(screen.getByPlaceholderText('Search questions or bookmarks...')).toBeInTheDocument();
  });

  it('should support forwarded ref for focusing', () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<SearchBar ref={ref} query="" onSearch={vi.fn()} onClear={vi.fn()} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('should have accessible aria-label on input', () => {
    render(<SearchBar query="" onSearch={vi.fn()} onClear={vi.fn()} placeholder="Search bookmarks..." />);
    expect(screen.getByLabelText('Search bookmarks...')).toBeInTheDocument();
  });
});
