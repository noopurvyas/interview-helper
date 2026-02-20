import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSearch } from './useSearch';

describe('useSearch', () => {
  it('should initialize with empty state', () => {
    const searchFn = vi.fn().mockResolvedValue([]);
    const { result } = renderHook(() => useSearch(searchFn));

    expect(result.current.query).toBe('');
    expect(result.current.results).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should update query immediately on handleSearch', () => {
    const searchFn = vi.fn().mockResolvedValue([]);
    const { result } = renderHook(() => useSearch(searchFn));

    act(() => {
      result.current.handleSearch('test query');
    });

    expect(result.current.query).toBe('test query');
  });

  it('should debounce the search call', async () => {
    vi.useFakeTimers();
    const searchFn = vi.fn().mockResolvedValue(['result1']);
    const { result } = renderHook(() => useSearch(searchFn, { debounceMs: 200 }));

    act(() => {
      result.current.handleSearch('hello');
    });

    // Should not have called search yet
    expect(searchFn).not.toHaveBeenCalled();

    // Advance past debounce
    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    expect(searchFn).toHaveBeenCalledWith('hello');
    expect(result.current.results).toEqual(['result1']);

    vi.useRealTimers();
  });

  it('should cancel previous debounce on rapid input', async () => {
    vi.useFakeTimers();
    const searchFn = vi.fn().mockResolvedValue([]);
    const { result } = renderHook(() => useSearch(searchFn, { debounceMs: 300 }));

    act(() => {
      result.current.handleSearch('h');
    });
    act(() => {
      result.current.handleSearch('he');
    });
    act(() => {
      result.current.handleSearch('hel');
    });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    // Should only be called once with final value
    expect(searchFn).toHaveBeenCalledTimes(1);
    expect(searchFn).toHaveBeenCalledWith('hel');

    vi.useRealTimers();
  });

  it('should not call search for empty/whitespace query', async () => {
    vi.useFakeTimers();
    const searchFn = vi.fn().mockResolvedValue([]);
    const { result } = renderHook(() => useSearch(searchFn, { debounceMs: 100 }));

    act(() => {
      result.current.handleSearch('   ');
    });

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(searchFn).not.toHaveBeenCalled();
    expect(result.current.results).toEqual([]);

    vi.useRealTimers();
  });

  it('should clear search state', async () => {
    vi.useFakeTimers();
    const searchFn = vi.fn().mockResolvedValue(['result1']);
    const { result } = renderHook(() => useSearch(searchFn, { debounceMs: 100 }));

    act(() => {
      result.current.handleSearch('test');
    });

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.results).toEqual(['result1']);

    act(() => {
      result.current.clearSearch();
    });

    expect(result.current.query).toBe('');
    expect(result.current.results).toEqual([]);
    expect(result.current.error).toBeNull();

    vi.useRealTimers();
  });

  it('should handle search errors', async () => {
    vi.useFakeTimers();
    const searchFn = vi.fn().mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useSearch(searchFn, { debounceMs: 0 }));

    act(() => {
      result.current.handleSearch('test');
    });

    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.loading).toBe(false);

    vi.useRealTimers();
  });

  it('should handle non-Error rejection', async () => {
    vi.useFakeTimers();
    const searchFn = vi.fn().mockRejectedValue('string error');
    const { result } = renderHook(() => useSearch(searchFn, { debounceMs: 0 }));

    act(() => {
      result.current.handleSearch('test');
    });

    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    expect(result.current.error).toBe('Search failed');

    vi.useRealTimers();
  });
});
