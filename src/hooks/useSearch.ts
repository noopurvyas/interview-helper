import { useState, useCallback, useRef, useEffect } from 'react';

export interface SearchOptions {
  debounceMs?: number;
}

export function useSearch<T>(
  onSearch: (query: string) => Promise<T[]>,
  options: SearchOptions = {}
) {
  const { debounceMs = 300 } = options;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const searchResults = await onSearch(searchQuery);
        setResults(searchResults);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
      } finally {
        setLoading(false);
      }
    },
    [onSearch]
  );

  const handleSearch = useCallback(
    (newQuery: string) => {
      setQuery(newQuery);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        performSearch(newQuery);
      }, debounceMs);
    },
    [performSearch, debounceMs]
  );

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    query,
    results,
    loading,
    error,
    handleSearch,
    clearSearch,
  };
}
