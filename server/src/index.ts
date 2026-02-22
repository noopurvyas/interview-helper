import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { questionsRouter } from './routes/questions.ts';
import { bookmarksRouter } from './routes/bookmarks.ts';
import { interviewsRouter } from './routes/interviews.ts';
import { notesRouter } from './routes/notes.ts';
import { syncRouter } from './routes/sync.ts';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/questions', questionsRouter);
app.use('/api/bookmarks', bookmarksRouter);
app.use('/api/interviews', interviewsRouter);
app.use('/api/notes', notesRouter);
app.use('/api/sync', syncRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Global error handler — prevents leaking stack traces
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
