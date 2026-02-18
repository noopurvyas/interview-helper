import { ExternalLink, Edit2, Trash2 } from 'lucide-react';
import type { Bookmark } from '../db/indexeddb';

interface BookmarkCardProps {
  bookmark: Bookmark;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (id: string) => void;
}

const resourceTypeColors = {
  blog: 'badge-bookmarks',
  video: 'badge-technical',
  course: 'badge-behavioral',
  other: 'badge-bookmarks',
};

export function BookmarkCard({ bookmark, onEdit, onDelete }: BookmarkCardProps) {
  const badgeClass = resourceTypeColors[bookmark.resourceType];

  return (
    <div className="card-bookmarks animate-fade-in">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
            {bookmark.title}
          </h3>
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-behavioral-600 dark:text-behavioral-400 hover:underline flex items-center space-x-1 truncate"
          >
            <span className="truncate">{bookmark.url}</span>
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
          </a>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <span className={`badge ${badgeClass}`}>
          {bookmark.resourceType}
        </span>
        {bookmark.category && (
          <span className="badge bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            {bookmark.category}
          </span>
        )}
      </div>

      {bookmark.notes && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          {bookmark.notes}
        </p>
      )}

      <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-3">
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-bookmarks-600 dark:text-bookmarks-400 hover:text-bookmarks-700 dark:hover:text-bookmarks-300 transition-colors"
        >
          Open Link
        </a>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(bookmark)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={() => onDelete(bookmark.id)}
            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
