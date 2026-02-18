import { useState } from 'react';
import { Plus, Loader, Circle, Loader as LoaderIcon, CheckCircle2 } from 'lucide-react';
import { useBookmarks } from '../hooks/useBookmarks';
import { useSearch } from '../hooks/useSearch';
import { BookmarkCard } from '../components/BookmarkCard';
import { BookmarkForm } from '../components/BookmarkForm';
import { SearchBar } from '../components/SearchBar';
import type { Bookmark, BookmarkStatus } from '../db/indexeddb';

export function BookmarksPage() {
  const { bookmarks, categories, collections, loading, addBookmark, updateBookmark, deleteBookmark } = useBookmarks();
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<BookmarkStatus | ''>('');

  const { query, results, handleSearch, clearSearch } = useSearch(async (q) => {
    return bookmarks.filter(
      (b) =>
        (b.title.toLowerCase().includes(q.toLowerCase()) ||
          b.url.toLowerCase().includes(q.toLowerCase()) ||
          b.notes?.toLowerCase().includes(q.toLowerCase())) &&
        (selectedCollection === '' || b.collection === selectedCollection) &&
        (selectedStatus === '' || (b.status || 'unread') === selectedStatus)
    );
  });

  const displayBookmarks = query ? results : bookmarks.filter(
    (b) =>
      (selectedCollection === '' || b.collection === selectedCollection) &&
      (selectedStatus === '' || (b.status || 'unread') === selectedStatus)
  );

  const handleSubmit = async (data: Omit<Bookmark, 'id'>) => {
    try {
      if (editingBookmark) {
        await updateBookmark({ ...editingBookmark, ...data });
      } else {
        await addBookmark(data);
      }
      setShowForm(false);
      setEditingBookmark(null);
    } catch {
      alert('Error saving bookmark');
    }
  };

  const handleStatusChange = async (bookmark: Bookmark, status: BookmarkStatus) => {
    await updateBookmark({ ...bookmark, status });
  };

  // Stats
  const unreadCount = bookmarks.filter((b) => !b.status || b.status === 'unread').length;
  const inProgressCount = bookmarks.filter((b) => b.status === 'in-progress').length;
  const completedCount = bookmarks.filter((b) => b.status === 'completed').length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 space-y-4">
          {/* Progress overview */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Progress</h3>
            <div className="space-y-2">
              {[
                { key: '' as const, label: 'All', count: bookmarks.length, icon: null, color: '' },
                { key: 'unread' as BookmarkStatus, label: 'Unread', count: unreadCount, icon: <Circle className="w-3.5 h-3.5 text-gray-400" />, color: '' },
                { key: 'in-progress' as BookmarkStatus, label: 'Reading', count: inProgressCount, icon: <LoaderIcon className="w-3.5 h-3.5 text-amber-500" />, color: '' },
                { key: 'completed' as BookmarkStatus, label: 'Done', count: completedCount, icon: <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />, color: '' },
              ].map((item) => (
                <button
                  key={item.key || 'all'}
                  onClick={() => setSelectedStatus(item.key as BookmarkStatus | '')}
                  className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedStatus === item.key
                      ? 'bg-bookmarks-50 dark:bg-bookmarks-900/20 text-bookmarks-700 dark:text-bookmarks-300 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {item.icon}
                    {item.label}
                  </span>
                  <span className="text-xs">{item.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Collections */}
          {collections.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Collections</h3>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCollection('')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedCollection === ''
                      ? 'bg-bookmarks-50 dark:bg-bookmarks-900/20 text-bookmarks-700 dark:text-bookmarks-300 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  All
                </button>
                {collections.map((c) => {
                  const count = bookmarks.filter((b) => b.collection === c).length;
                  return (
                    <button
                      key={c}
                      onClick={() => setSelectedCollection(c)}
                      className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedCollection === c
                          ? 'bg-bookmarks-50 dark:bg-bookmarks-900/20 text-bookmarks-700 dark:text-bookmarks-300 font-medium'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <span className="truncate">{c}</span>
                      <span className="text-xs ml-2">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                query={query}
                onSearch={handleSearch}
                onClear={clearSearch}
                placeholder="Search bookmarks..."
              />
            </div>
            <button
              onClick={() => {
                setEditingBookmark(null);
                setShowForm(true);
              }}
              className="btn-bookmarks flex items-center justify-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add Bookmark</span>
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-6 h-6 animate-spin text-bookmarks-600" />
            </div>
          )}

          {!loading && displayBookmarks.length === 0 && (
            <div className="text-center py-12 text-gray-600 dark:text-gray-400">
              <p className="text-lg">No bookmarks found</p>
              <p className="text-sm mt-2">Save your favorite resources here!</p>
            </div>
          )}

          <div className="grid gap-4">
            {displayBookmarks.map((bookmark) => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                onEdit={(b) => {
                  setEditingBookmark(b);
                  setShowForm(true);
                }}
                onDelete={deleteBookmark}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        </div>
      </div>

      {showForm && (
        <BookmarkForm
          bookmark={editingBookmark ?? undefined}
          categories={categories}
          collections={collections}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingBookmark(null);
          }}
        />
      )}
    </div>
  );
}
