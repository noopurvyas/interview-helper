import { Router } from 'express';
import db, { serializeBookmark } from '../db.ts';

export const bookmarksRouter = Router();

const getAll = db.prepare('SELECT * FROM bookmarks');
const upsert = db.prepare(`
  INSERT OR REPLACE INTO bookmarks (id, title, url, resourceType, category, collection, notes, status, createdAt)
  VALUES (@id, @title, @url, @resourceType, @category, @collection, @notes, @status, @createdAt)
`);
const deleteById = db.prepare('DELETE FROM bookmarks WHERE id = ?');

bookmarksRouter.get('/', (_req, res) => {
  const rows = getAll.all();
  res.json(rows);
});

bookmarksRouter.post('/', (req, res) => {
  const { id, title, url, resourceType, createdAt } = req.body ?? {};
  if (!id || !title || !url || !resourceType || createdAt == null) {
    res.status(400).json({ error: 'Missing required fields: id, title, url, resourceType, createdAt' });
    return;
  }
  try {
    upsert.run(serializeBookmark(req.body));
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save bookmark' });
  }
});

bookmarksRouter.put('/:id', (req, res) => {
  try {
    upsert.run(serializeBookmark({ ...req.body, id: req.params.id }));
    res.json({ id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update bookmark' });
  }
});

bookmarksRouter.delete('/:id', (req, res) => {
  deleteById.run(req.params.id);
  res.json({ deleted: true });
});
