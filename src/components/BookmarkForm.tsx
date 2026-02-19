import { useState } from 'react';
import { X } from 'lucide-react';
import { Modal } from './Modal';
import { type Bookmark, type ResourceType, type BookmarkStatus, detectResourceType } from '../db/indexeddb';

interface BookmarkFormProps {
  bookmark?: Bookmark;
  categories: string[];
  collections: string[];
  onSubmit: (bookmark: Omit<Bookmark, 'id'>) => void;
  onCancel: () => void;
}

export function BookmarkForm({
  bookmark,
  categories,
  collections,
  onSubmit,
  onCancel,
}: BookmarkFormProps) {
  const [title, setTitle] = useState(bookmark?.title || '');
  const [url, setUrl] = useState(bookmark?.url || '');
  const [resourceType, setResourceType] = useState<ResourceType>(
    bookmark?.resourceType || 'blog'
  );
  const [category, setCategory] = useState(bookmark?.category || '');
  const [newCategory, setNewCategory] = useState('');
  const [collection, setCollection] = useState(bookmark?.collection || '');
  const [newCollection, setNewCollection] = useState('');
  const [status, setStatus] = useState<BookmarkStatus>(bookmark?.status || 'unread');
  const [notes, setNotes] = useState(bookmark?.notes || '');
  const [autoDetected, setAutoDetected] = useState(false);

  const handleUrlBlur = () => {
    if (!url.trim() || bookmark) return;
    try {
      const detected = detectResourceType(url);
      if (detected !== 'other') {
        setResourceType(detected);
        setAutoDetected(true);
      }
    } catch {
      // invalid URL, ignore
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !url.trim()) {
      alert('Please fill in title and URL');
      return;
    }

    onSubmit({
      title,
      url,
      resourceType,
      category: newCategory || category || undefined,
      collection: newCollection || collection || undefined,
      status,
      notes: notes || undefined,
      createdAt: bookmark?.createdAt || Date.now(),
    });
  };

  return (
    <Modal onClose={onCancel} label={bookmark ? 'Edit Bookmark' : 'Add Bookmark'}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {bookmark ? 'Edit Bookmark' : 'Add Bookmark'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              placeholder="Bookmark title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setAutoDetected(false);
              }}
              onBlur={handleUrlBlur}
              className="input-field"
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Type
                {autoDetected && (
                  <span className="text-xs text-bookmarks-500 ml-1">(auto)</span>
                )}
              </label>
              <select
                value={resourceType}
                onChange={(e) => {
                  setResourceType(e.target.value as ResourceType);
                  setAutoDetected(false);
                }}
                className="input-field"
              >
                <option value="blog">Blog</option>
                <option value="video">Video</option>
                <option value="course">Course</option>
                <option value="podcast">Podcast</option>
                <option value="docs">Docs</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as BookmarkStatus)}
                className="input-field"
              >
                <option value="unread">Unread</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Collection</label>
            <select
              value={collection}
              onChange={(e) => {
                setCollection(e.target.value);
                setNewCollection('');
              }}
              className="input-field"
            >
              <option value="">None</option>
              {collections.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {collection === '' && (
              <input
                type="text"
                placeholder="Or create new collection"
                value={newCollection}
                onChange={(e) => setNewCollection(e.target.value)}
                className="input-field mt-2"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setNewCategory('');
              }}
              className="input-field"
            >
              <option value="">Select or create...</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {category === '' && (
              <input
                type="text"
                placeholder="Or type new category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="input-field mt-2"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field"
              rows={3}
              placeholder="Add notes about this resource..."
            />
          </div>

          <div className="flex space-x-4 border-t border-gray-200 dark:border-gray-700 pt-4 mt-6">
            <button type="button" onClick={onCancel} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-bookmarks flex-1">
              {bookmark ? 'Update' : 'Add'} Bookmark
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
