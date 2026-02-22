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
  upsert.run(serializeBookmark(req.body));
  res.status(201).json({ id: req.body.id });
});

bookmarksRouter.put('/:id', (req, res) => {
  upsert.run(serializeBookmark({ ...req.body, id: req.params.id }));
  res.json({ id: req.params.id });
});

bookmarksRouter.delete('/:id', (req, res) => {
  deleteById.run(req.params.id);
  res.json({ deleted: true });
});
