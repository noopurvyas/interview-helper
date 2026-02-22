import { Router } from 'express';
import db, { serializeQuestion, deserializeQuestion } from '../db.ts';

export const questionsRouter = Router();

const getAll = db.prepare('SELECT * FROM questions');
const upsert = db.prepare(`
  INSERT OR REPLACE INTO questions (id, type, company, question, answerVariations, isFavorite, practiceCount, lastPracticed, createdAt, subtype, difficulty, tags, codeSnippet)
  VALUES (@id, @type, @company, @question, @answerVariations, @isFavorite, @practiceCount, @lastPracticed, @createdAt, @subtype, @difficulty, @tags, @codeSnippet)
`);
const deleteById = db.prepare('DELETE FROM questions WHERE id = ?');

questionsRouter.get('/', (_req, res) => {
  const rows = getAll.all() as Record<string, unknown>[];
  res.json(rows.map(deserializeQuestion));
});

questionsRouter.post('/', (req, res) => {
  const { id, type, question, createdAt } = req.body ?? {};
  if (!id || !type || !question || createdAt == null) {
    res.status(400).json({ error: 'Missing required fields: id, type, question, createdAt' });
    return;
  }
  try {
    upsert.run(serializeQuestion(req.body));
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save question' });
  }
});

questionsRouter.put('/:id', (req, res) => {
  try {
    upsert.run(serializeQuestion({ ...req.body, id: req.params.id }));
    res.json({ id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update question' });
  }
});

questionsRouter.delete('/:id', (req, res) => {
  deleteById.run(req.params.id);
  res.json({ deleted: true });
});
