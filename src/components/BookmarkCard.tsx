import { ExternalLink, Edit2, Trash2, Circle, Loader, CheckCircle2 } from 'lucide-react';
import type { Bookmark, BookmarkStatus } from '../db/indexeddb';

interface BookmarkCardProps {
  bookmark: Bookmark;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (id: string) => void;
  onStatusChange: (bookmark: Bookmark, status: BookmarkStatus) => void;
}

const resourceTypeColors: Record<string, string> = {
  blog: 'badge-bookmarks',
  video: 'badge-technical',
  course: 'badge-behavioral',
  podcast: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  docs: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  other: 'badge-bookmarks',
};

const statusConfig: Record<BookmarkStatus, { icon: React.ReactNode; label: string; color: string }> = {
  unread: {
    icon: <Circle className="w-3.5 h-3.5" />,
    label: 'Unread',
    color: 'text-gray-400',
  },
  'in-progress': {
    icon: <Loader className="w-3.5 h-3.5" />,
    label: 'Reading',
    color: 'text-amber-500',
  },
  completed: {
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    label: 'Done',
    color: 'text-green-500',
  },
};

const statusCycle: BookmarkStatus[] = ['unread', 'in-progress', 'completed'];

export function BookmarkCard({ bookmark, onEdit, onDelete, onStatusChange }: BookmarkCardProps) {
  const badgeClass = resourceTypeColors[bookmark.resourceType] || resourceTypeColors.other;
  const status = statusConfig[bookmark.status || 'unread'];

  const cycleStatus = () => {
    const current = bookmark.status || 'unread';
    const idx = statusCycle.indexOf(current);
    const next = statusCycle[(idx + 1) % statusCycle.length];
    onStatusChange(bookmark, next);
  };

  return (
    <div className={`card-bookmarks animate-fade-in ${bookmark.status === 'completed' ? 'opacity-75' : ''}`}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
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
        <button
          onClick={cycleStatus}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${status.color}`}
          title={`Status: ${status.label} (click to change)`}
        >
          {status.icon}
          <span>{status.label}</span>
        </button>
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
        {bookmark.collection && (
          <span className="badge bg-behavioral-100 dark:bg-behavioral-900/30 text-behavioral-700 dark:text-behavioral-300">
            {bookmark.collection}
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
