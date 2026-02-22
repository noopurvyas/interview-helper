import { Router } from 'express';
import db from '../db.ts';

export const notesRouter = Router();

const getByCompany = db.prepare('SELECT * FROM companyNotes WHERE company = ?');
const upsert = db.prepare(`
  INSERT OR REPLACE INTO companyNotes (company, content, updatedAt)
  VALUES (@company, @content, @updatedAt)
`);

notesRouter.get('/:company', (req, res) => {
  const row = getByCompany.get(req.params.company);
  if (row) {
    res.json(row);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

notesRouter.put('/:company', (req, res) => {
  const { content, updatedAt } = req.body ?? {};
  if (content == null || updatedAt == null) {
    res.status(400).json({ error: 'Missing required fields: content, updatedAt' });
    return;
  }
  const data = { company: req.params.company, content, updatedAt };
  try {
    upsert.run(data);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save note' });
  }
});
