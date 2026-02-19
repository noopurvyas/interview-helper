import { forwardRef } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  query: string;
  onSearch: (query: string) => void;
  onClear: () => void;
  placeholder?: string;
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  function SearchBar({ query, onSearch, onClear, placeholder = 'Search questions or bookmarks...' }, ref) {
    return (
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          ref={ref}
          type="text"
          value={query}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          className="input-field pl-10 pr-10"
          aria-label={placeholder}
        />
        {query ? (
          <button
            onClick={onClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            aria-label="Clear search"
          >
            <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        ) : (
          <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 hidden sm:inline-block text-xs text-gray-400 border border-gray-300 dark:border-gray-600 rounded px-1.5 py-0.5">
            /
          </kbd>
        )}
      </div>
    );
  }
);
