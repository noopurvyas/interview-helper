import { useState, useEffect, useCallback } from 'react';
import {
  type Bookmark,
  type ResourceType,
  addBookmark as dbAddBookmark,
  updateBookmark as dbUpdateBookmark,
  deleteBookmark as dbDeleteBookmark,
  getBookmarksByType,
  getAllBookmarks,
  searchBookmarks,
  getBookmarksByCategory,
  getUniqueResourceCategories,
  getUniqueCollections,
} from '../db/indexeddb';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [collections, setCollections] = useState<string[]>([]);

  // Load all bookmarks
  const loadBookmarks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllBookmarks();
      setBookmarks(data);

      const [uniqueCategories, uniqueCollections] = await Promise.all([
        getUniqueResourceCategories(),
        getUniqueCollections(),
      ]);
      setCategories(uniqueCategories);
      setCollections(uniqueCollections);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load bookmarks by type
  const loadByType = useCallback(
    async (resourceType: ResourceType) => {
      setLoading(true);
      setError(null);
      try {
        const data = await getBookmarksByType(resourceType);
        setBookmarks(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load bookmarks');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Load bookmarks by category
  const loadByCategory = useCallback(async (category: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBookmarksByCategory(category);
      setBookmarks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  }, []);

  // Search bookmarks
  const search = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        await loadBookmarks();
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await searchBookmarks(query);
        setBookmarks(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
      } finally {
        setLoading(false);
      }
    },
    [loadBookmarks]
  );

  // Add bookmark
  const addBookmarkData = useCallback(
    async (bookmark: Omit<Bookmark, 'id'>) => {
      try {
        const id = await dbAddBookmark(bookmark);
        await loadBookmarks();
        return id;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add bookmark';
        setError(message);
        throw err;
      }
    },
    [loadBookmarks]
  );

  // Update bookmark
  const updateBookmarkData = useCallback(
    async (bookmark: Bookmark) => {
      try {
        await dbUpdateBookmark(bookmark);
        await loadBookmarks();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update bookmark';
        setError(message);
        throw err;
      }
    },
    [loadBookmarks]
  );

  // Delete bookmark
  const deleteBookmarkData = useCallback(
    async (id: string) => {
      try {
        await dbDeleteBookmark(id);
        await loadBookmarks();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete bookmark';
        setError(message);
        throw err;
      }
    },
    [loadBookmarks]
  );

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  return {
    bookmarks,
    categories,
    collections,
    loading,
    error,
    loadBookmarks,
    loadByType,
    loadByCategory,
    search,
    addBookmark: addBookmarkData,
    updateBookmark: updateBookmarkData,
    deleteBookmark: deleteBookmarkData,
  };
}
