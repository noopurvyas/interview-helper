import { useState } from 'react';
import { Plus, Loader } from 'lucide-react';
import { useBookmarks } from '../hooks/useBookmarks';
import { useSearch } from '../hooks/useSearch';
import { BookmarkCard } from '../components/BookmarkCard';
import { BookmarkForm } from '../components/BookmarkForm';
import { SearchBar } from '../components/SearchBar';
import { FilterSidebar } from '../components/FilterSidebar';

export function BookmarksPage() {
  const { bookmarks, categories, loading, addBookmark, updateBookmark, deleteBookmark } = useBookmarks();
  const [editingBookmark, setEditingBookmark] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');

  const { query, results, handleSearch, clearSearch } = useSearch(async (q) => {
    return bookmarks.filter(
      (b) =>
        (b.title.toLowerCase().includes(q.toLowerCase()) ||
          b.url.toLowerCase().includes(q.toLowerCase()) ||
          b.notes?.toLowerCase().includes(q.toLowerCase())) &&
        (selectedCategory === '' || b.category === selectedCategory)
    );
  });

  const displayBookmarks = query ? results : bookmarks.filter(
    (b) => selectedCategory === '' || b.category === selectedCategory
  );

  const handleSubmit = async (data: any) => {
    try {
      if (editingBookmark) {
        await updateBookmark({ ...editingBookmark, ...data });
      } else {
        await addBookmark(data);
      }
      setShowForm(false);
      setEditingBookmark(null);
    } catch (err) {
      alert('Error saving bookmark');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <FilterSidebar
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

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
              />
            ))}
          </div>
        </div>
      </div>

      {showForm && (
        <BookmarkForm
          bookmark={editingBookmark}
          categories={categories}
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
