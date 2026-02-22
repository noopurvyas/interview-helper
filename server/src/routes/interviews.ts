import { Router } from 'express';
import db, { serializeInterview, deserializeInterview } from '../db.ts';

export const interviewsRouter = Router();

const getAll = db.prepare('SELECT * FROM interviews');
const upsert = db.prepare(`
  INSERT OR REPLACE INTO interviews (id, company, dateTime, duration, role, interviewType, round, status, notes, linkedQuestionIds, location, contactName, contactEmail, icalUid, createdAt, updatedAt)
  VALUES (@id, @company, @dateTime, @duration, @role, @interviewType, @round, @status, @notes, @linkedQuestionIds, @location, @contactName, @contactEmail, @icalUid, @createdAt, @updatedAt)
`);
const deleteById = db.prepare('DELETE FROM interviews WHERE id = ?');

interviewsRouter.get('/', (_req, res) => {
  const rows = getAll.all() as Record<string, unknown>[];
  res.json(rows.map(deserializeInterview));
});

interviewsRouter.post('/', (req, res) => {
  const data = serializeInterview(req.body);
  upsert.run(data);
  res.status(201).json({ id: req.body.id });
});

interviewsRouter.put('/:id', (req, res) => {
  const data = serializeInterview({ ...req.body, id: req.params.id });
  upsert.run(data);
  res.json({ id: req.params.id });
});

interviewsRouter.delete('/:id', (req, res) => {
  deleteById.run(req.params.id);
  res.json({ deleted: true });
});
