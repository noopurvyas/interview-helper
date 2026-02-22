import { Router } from 'express';
import { statements, serializeInterview, deserializeInterview } from '../db.ts';

export const interviewsRouter = Router();

const { getAll, upsert, deleteById } = statements.interviews;

interviewsRouter.get('/', (_req, res) => {
  const rows = getAll.all() as Record<string, unknown>[];
  res.json(rows.map(deserializeInterview));
});

interviewsRouter.post('/', (req, res) => {
  const { id, company, dateTime, interviewType, createdAt, updatedAt } = req.body ?? {};
  if (!id || !company || dateTime == null || !interviewType || createdAt == null || updatedAt == null) {
    res.status(400).json({ error: 'Missing required fields: id, company, dateTime, interviewType, createdAt, updatedAt' });
    return;
  }
  try {
    upsert.run(serializeInterview(req.body));
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save interview' });
  }
});

interviewsRouter.put('/:id', (req, res) => {
  try {
    upsert.run(serializeInterview({ ...req.body, id: req.params.id }));
    res.json({ id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update interview' });
  }
});

interviewsRouter.delete('/:id', (req, res) => {
  deleteById.run(req.params.id);
  res.json({ deleted: true });
});
