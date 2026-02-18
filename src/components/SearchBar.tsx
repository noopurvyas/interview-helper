import { Search, X } from 'lucide-react';

interface SearchBarProps {
  query: string;
  onSearch: (query: string) => void;
  onClear: () => void;
  placeholder?: string;
}

export function SearchBar({
  query,
  onSearch,
  onClear,
  placeholder = 'Search questions or bookmarks...',
}: SearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        value={query}
        onChange={(e) => onSearch(e.target.value)}
        placeholder={placeholder}
        className="input-field pl-10 pr-10"
      />
      {query && (
        <button
          onClick={onClear}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
        >
          <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
      )}
    </div>
  );
}
