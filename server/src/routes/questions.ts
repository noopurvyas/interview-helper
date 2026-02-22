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
  const data = serializeQuestion(req.body);
  upsert.run(data);
  res.status(201).json({ id: req.body.id });
});

questionsRouter.put('/:id', (req, res) => {
  const data = serializeQuestion({ ...req.body, id: req.params.id });
  upsert.run(data);
  res.json({ id: req.params.id });
});

questionsRouter.delete('/:id', (req, res) => {
  deleteById.run(req.params.id);
  res.json({ deleted: true });
});
